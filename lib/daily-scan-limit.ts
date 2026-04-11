import { createHash } from "crypto";
import net from "net";
import tls from "tls";

const ONE_DAY_SECONDS = 24 * 60 * 60;
const ONE_DAY_MS = ONE_DAY_SECONDS * 1000;
const FALLBACK_PREFIX = "local-fallback";

// Fallback for local development only. This is NOT durable in serverless production.
const fallbackStore = new Map<string, number>();

type StoreConfig =
  | {
      mode: "rest";
      baseUrl: string;
      token: string;
    }
  | {
      mode: "redis-url";
      redisUrl: string;
    }
  | {
      mode: "none";
    };

function getStoreConfig(): StoreConfig {
  const baseUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (baseUrl.trim() && token.trim()) {
    return {
      mode: "rest",
      baseUrl: baseUrl.trim().replace(/\/$/, ""),
      token: token.trim(),
    };
  }

  const redisUrl = process.env.KV_REDIS_URL || process.env.REDIS_URL || "";

  if (redisUrl.trim()) {
    return {
      mode: "redis-url",
      redisUrl: redisUrl.trim(),
    };
  }

  return { mode: "none" };
}

function getDayKeyPart(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}

function buildKey(ip: string, now = new Date()) {
  return `idradar:daily-scan:${getDayKeyPart(now)}:${hashIp(ip)}`;
}

export function hasRedisRateLimitConfig() {
  return getStoreConfig().mode !== "none";
}

export function getRetryAfterSeconds(lastUsedAt: number) {
  return Math.max(1, Math.ceil((ONE_DAY_MS - (Date.now() - lastUsedAt)) / 1000));
}

export function formatRemainingTime(ms: number) {
  const totalMinutes = Math.ceil(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${Math.max(1, minutes)} Minute${minutes === 1 ? "" : "n"}`;
  }

  if (minutes === 0) {
    return `${hours} Stunde${hours === 1 ? "" : "n"}`;
  }

  return `${hours} Stunde${hours === 1 ? "" : "n"} und ${minutes} Minute${minutes === 1 ? "" : "n"}`;
}

function encodeRedisCommand(parts: string[]) {
  let out = `*${parts.length}\r\n`;
  for (const part of parts) {
    out += `$${Buffer.byteLength(part)}\r\n${part}\r\n`;
  }
  return out;
}

type ParsedResp =
  | { kind: "simple"; value: string; next: number }
  | { kind: "bulk"; value: string | null; next: number }
  | { kind: "integer"; value: number; next: number }
  | { kind: "error"; value: string; next: number };

function parseLine(buffer: Buffer, start: number) {
  const end = buffer.indexOf("\r\n", start, "utf8");
  if (end === -1) return null;
  return {
    line: buffer.subarray(start, end).toString("utf8"),
    next: end + 2,
  };
}

function parseResp(buffer: Buffer, start = 0): ParsedResp | null {
  if (buffer.length <= start) return null;
  const prefix = String.fromCharCode(buffer[start]);

  if (prefix === "+" || prefix === "-" || prefix === ":") {
    const parsed = parseLine(buffer, start + 1);
    if (!parsed) return null;

    if (prefix === "+") {
      return { kind: "simple", value: parsed.line, next: parsed.next };
    }

    if (prefix === "-") {
      return { kind: "error", value: parsed.line, next: parsed.next };
    }

    return {
      kind: "integer",
      value: Number(parsed.line),
      next: parsed.next,
    };
  }

  if (prefix === "$") {
    const header = parseLine(buffer, start + 1);
    if (!header) return null;

    const length = Number(header.line);
    if (Number.isNaN(length)) {
      throw new Error(`Ungültige Redis-Antwort: ${header.line}`);
    }

    if (length === -1) {
      return { kind: "bulk", value: null, next: header.next };
    }

    const end = header.next + length;
    if (buffer.length < end + 2) return null;

    const value = buffer.subarray(header.next, end).toString("utf8");
    return { kind: "bulk", value, next: end + 2 };
  }

  throw new Error(`Nicht unterstützte Redis-Antwort: ${prefix}`);
}

async function execRedisViaUrl(command: string[]) {
  const config = getStoreConfig();
  if (config.mode !== "redis-url") {
    throw new Error("KV_REDIS_URL ist nicht konfiguriert.");
  }

  const parsed = new URL(config.redisUrl);
  const isTls = parsed.protocol === "rediss:";
  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : isTls ? 6380 : 6379;
  const username = decodeURIComponent(parsed.username || "default");
  const password = decodeURIComponent(parsed.password || "");

  if (!host) {
    throw new Error("KV_REDIS_URL ist ungültig: Host fehlt.");
  }

  const payload =
    (password ? encodeRedisCommand(["AUTH", username, password]) : "") +
    encodeRedisCommand(command) +
    encodeRedisCommand(["QUIT"]);

  const socket = isTls
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port });

  return await new Promise<string | null | number>((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    let settled = false;
    const responses: ParsedResp[] = [];

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn();
    };

    socket.setTimeout(8000);

    socket.on("connect", () => {
      socket.write(payload);
    });

    socket.on("data", (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);

      try {
        let offset = 0;
        while (offset < buffer.length) {
          const parsedResp = parseResp(buffer, offset);
          if (!parsedResp) break;
          responses.push(parsedResp);
          offset = parsedResp.next;
        }

        if (offset > 0) {
          buffer = buffer.subarray(offset);
        }
      } catch (error) {
        finish(() => reject(error));
        return;
      }
    });

    socket.on("timeout", () => {
      finish(() => reject(new Error("Redis-Verbindung Zeitüberschreitung.")));
    });

    socket.on("error", (error) => {
      finish(() => reject(error));
    });

    socket.on("close", () => {
      finish(() => {
        const authOffset = password ? 1 : 0;
        const commandResponse = responses[authOffset];

        if (!commandResponse) {
          reject(new Error("Keine Redis-Antwort für Rate-Limit erhalten."));
          return;
        }

        if (password) {
          const authResponse = responses[0];
          if (authResponse?.kind === "error") {
            reject(new Error(`Redis-AUTH fehlgeschlagen: ${authResponse.value}`));
            return;
          }
        }

        if (commandResponse.kind === "error") {
          reject(new Error(`Redis-Befehl fehlgeschlagen: ${commandResponse.value}`));
          return;
        }

        if (commandResponse.kind === "simple") {
          resolve(commandResponse.value);
          return;
        }

        if (commandResponse.kind === "bulk") {
          resolve(commandResponse.value);
          return;
        }

        resolve(commandResponse.value);
      });
    });
  });
}

async function redisSetIfNotExists(key: string, nowIso: string) {
  const config = getStoreConfig();

  if (config.mode === "rest") {
    const response = await fetch(
      `${config.baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(nowIso)}?EX=${ONE_DAY_SECONDS}&NX=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Redis-Rate-Limit konnte nicht gesetzt werden: ${text}`);
    }

    return (await response.json()) as { result?: string | null };
  }

  if (config.mode === "redis-url") {
    const result = await execRedisViaUrl(["SET", key, nowIso, "EX", String(ONE_DAY_SECONDS), "NX"]);
    return { result: result == null ? null : String(result) };
  }

  throw new Error("Kein Redis/KV für Rate-Limit konfiguriert.");
}

async function redisGet(key: string) {
  const config = getStoreConfig();

  if (config.mode === "rest") {
    const response = await fetch(`${config.baseUrl}/get/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Redis-Rate-Limit konnte nicht gelesen werden: ${text}`);
    }

    return (await response.json()) as { result?: string | null };
  }

  if (config.mode === "redis-url") {
    const result = await execRedisViaUrl(["GET", key]);
    return { result: typeof result === "string" ? result : null };
  }

  throw new Error("Kein Redis/KV für Rate-Limit konfiguriert.");
}

export type DailyScanLimitResult =
  | { allowed: true; storage: "redis" | "memory" }
  | {
      allowed: false;
      storage: "redis" | "memory";
      retryAfterSeconds: number;
      remainingMs: number;
    };

export async function reserveDailyScan(ip: string): Promise<DailyScanLimitResult> {
  const safeIp = ip.trim() || "unknown";
  const key = buildKey(safeIp);
  const now = new Date();
  const nowIso = now.toISOString();

  if (hasRedisRateLimitConfig()) {
    const setResult = await redisSetIfNotExists(key, nowIso);

    if (setResult.result === "OK") {
      return { allowed: true, storage: "redis" };
    }

    const existing = await redisGet(key);
    const lastUsedAt = existing.result ? Date.parse(existing.result) : Date.now();
    const remainingMs = Math.max(0, ONE_DAY_MS - (Date.now() - lastUsedAt));

    return {
      allowed: false,
      storage: "redis",
      retryAfterSeconds: getRetryAfterSeconds(lastUsedAt),
      remainingMs,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Kein serverseitiger Redis/KV-Zugriff für das Tageslimit konfiguriert. Erwartet wird KV_REST_API_URL + KV_REST_API_TOKEN oder KV_REDIS_URL."
    );
  }

  const fallbackKey = `${FALLBACK_PREFIX}:${key}`;
  const lastUsedAt = fallbackStore.get(fallbackKey);

  if (typeof lastUsedAt === "number") {
    const remainingMs = Math.max(0, ONE_DAY_MS - (Date.now() - lastUsedAt));

    if (remainingMs > 0) {
      return {
        allowed: false,
        storage: "memory",
        retryAfterSeconds: getRetryAfterSeconds(lastUsedAt),
        remainingMs,
      };
    }
  }

  fallbackStore.set(fallbackKey, Date.now());
  return { allowed: true, storage: "memory" };
}
