import { createHash } from "crypto";

const ONE_DAY_SECONDS = 24 * 60 * 60;
const ONE_DAY_MS = ONE_DAY_SECONDS * 1000;
const FALLBACK_PREFIX = "local-fallback";

// Fallback for local development only. This is NOT durable in serverless production.
const fallbackStore = new Map<string, number>();

function getStoreConfig() {
  const baseUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  return {
    baseUrl: baseUrl.trim().replace(/\/$/, ""),
    token: token.trim(),
  };
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
  const { baseUrl, token } = getStoreConfig();
  return Boolean(baseUrl && token);
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

async function redisSetIfNotExists(key: string, nowIso: string) {
  const { baseUrl, token } = getStoreConfig();

  const response = await fetch(`${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(nowIso)}?EX=${ONE_DAY_SECONDS}&NX=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Redis-Rate-Limit konnte nicht gesetzt werden: ${text}`);
  }

  return (await response.json()) as { result?: string | null };
}

async function redisGet(key: string) {
  const { baseUrl, token } = getStoreConfig();

  const response = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Redis-Rate-Limit konnte nicht gelesen werden: ${text}`);
  }

  return (await response.json()) as { result?: string | null };
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
