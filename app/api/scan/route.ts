import { NextResponse } from "next/server";
import {
  ScanRequestBody,
  ScanResponse,
  RiskLevel,
  RecommendationItem,
  FindingItem,
  FindingStatus,
} from "@/types/scan";

const SERP_API_KEY = process.env.SERP_API_KEY;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Temporäre In-Memory-IP-Sperre.
// Funktioniert gut als Sofortschutz, ist auf Vercel aber nicht 100% dauerhaft
// über Deployments / alle Instanzen hinweg. Für später: Redis / KV.
const ipDailyScanStore = new Map<string, number>();

type SerpOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerpResponse = {
  search_information?: {
    total_results?: number | string;
  };
  organic_results?: SerpOrganicResult[];
};

type PlatformConfig = {
  key: string;
  label: string;
  domain: string;
  riskWeight: number;
};

type PlatformAssessment = {
  label: string;
  strength: number;
  riskWeight: number;
  value: string;
  detail: string;
  url?: string;
  status: FindingStatus;
};

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

type ScanRequestWithTurnstile = Partial<ScanRequestBody> & {
  turnstileToken?: string;
};

const EMPTY_SERP_RESPONSE: SerpResponse = {
  search_information: { total_results: 0 },
  organic_results: [],
};

const PLATFORM_CONFIG: PlatformConfig[] = [
  { key: "linkedin", label: "LinkedIn", domain: "linkedin.com", riskWeight: 2 },
  { key: "instagram", label: "Instagram", domain: "instagram.com", riskWeight: 2 },
  { key: "facebook", label: "Facebook", domain: "facebook.com", riskWeight: 2 },
  { key: "tiktok", label: "TikTok", domain: "tiktok.com", riskWeight: 2 },
  { key: "x", label: "X / Twitter", domain: "x.com", riskWeight: 1 },
  { key: "github", label: "GitHub", domain: "github.com", riskWeight: 1 },
  { key: "reddit", label: "Reddit", domain: "reddit.com", riskWeight: 1 },
];

const DIRECTORY_DOMAINS = [
  "truepeoplesearch.com",
  "whitepages.com",
  "peekyou.com",
  "spokeo.com",
  "fastpeoplesearch.com",
  "beenverified.com",
  "radaris.com",
  "thatsthem.com",
  "addresses.com",
  "mylife.com",
  "phonebook.com",
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function getPath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return "";
  }
}

function parseTotalResults(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function textOf(result: SerpOrganicResult) {
  return normalize(
    `${result.title || ""} ${result.snippet || ""} ${result.link || ""}`
  );
}

function cleanNameForUrl(name: string) {
  return normalize(name)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function includesExactName(result: SerpOrganicResult, fullName: string) {
  return textOf(result).includes(normalize(fullName));
}

function includesUsername(result: SerpOrganicResult, username: string) {
  if (!username) return false;
  return textOf(result).includes(normalize(username));
}

function includesCity(result: SerpOrganicResult, city: string) {
  if (!city) return false;
  return textOf(result).includes(normalize(city));
}

function isFromDomain(result: SerpOrganicResult, domain: string) {
  const resultDomain = getDomain(result.link || "");
  return resultDomain === domain || resultDomain.endsWith(`.${domain}`);
}

function dedupeResults(groups: SerpOrganicResult[][]): SerpOrganicResult[] {
  const seen = new Set<string>();
  const merged: SerpOrganicResult[] = [];

  for (const group of groups) {
    for (const item of group) {
      const key = `${item.link || ""}|${item.title || ""}`;
      if (!key.trim() || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getRemainingMs(lastScanAt: number) {
  return Math.max(0, ONE_DAY_MS - (Date.now() - lastScanAt));
}

function formatRemainingTime(ms: number) {
  const totalMinutes = Math.ceil(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} Minute${minutes === 1 ? "" : "n"}`;
  }

  if (minutes === 0) {
    return `${hours} Stunde${hours === 1 ? "" : "n"}`;
  }

  return `${hours} Stunde${hours === 1 ? "" : "n"} und ${minutes} Minute${minutes === 1 ? "" : "n"}`;
}

async function fetchSerp(query: string): Promise<SerpResponse> {
  if (!SERP_API_KEY) {
    throw new Error("SERP_API_KEY fehlt");
  }

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
    query
  )}&num=10&api_key=${SERP_API_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SerpAPI-Fehler: ${response.status} ${text}`);
  }

  return (await response.json()) as SerpResponse;
}

async function verifyTurnstileToken(token: string, request: Request) {
  if (!TURNSTILE_SECRET_KEY) {
    throw new Error("TURNSTILE_SECRET_KEY fehlt");
  }

  const remoteIp = getClientIp(request);

  const body = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (remoteIp && remoteIp !== "unknown") {
    body.append("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turnstile-Validierung fehlgeschlagen: ${text}`);
  }

  return (await response.json()) as TurnstileVerifyResponse;
}

function estimateVisibilityScore(totalEstimatedResults: number): number {
  if (totalEstimatedResults <= 0) return 0;
  if (totalEstimatedResults >= 10_000_000) return 10;
  if (totalEstimatedResults >= 1_000_000) return 8;
  if (totalEstimatedResults >= 100_000) return 6;
  if (totalEstimatedResults >= 10_000) return 4;
  if (totalEstimatedResults >= 1_000) return 3;
  if (totalEstimatedResults >= 100) return 2;
  return 1;
}

function countStrongExactMatches(
  results: SerpOrganicResult[],
  fullName: string,
  city: string
) {
  const target = normalize(fullName);
  let count = 0;

  for (const result of results) {
    const title = normalize(result.title || "");
    const snippet = normalize(result.snippet || "");
    const link = normalize(result.link || "");

    const titleHasName = title.includes(target);
    const snippetHasName = snippet.includes(target);
    const linkHasName =
      link.includes(target.replace(/\s+/g, "-")) ||
      link.includes(target.replace(/\s+/g, ""));

    const strongNameMatch =
      (titleHasName && snippetHasName) ||
      (titleHasName && linkHasName) ||
      (snippetHasName && linkHasName);

    const citySupport = city ? includesCity(result, city) : false;

    if (strongNameMatch || (titleHasName && citySupport)) {
      count += 1;
    }
  }

  return count;
}

function countCityMentions(results: SerpOrganicResult[], city: string) {
  if (!city) return 0;
  return results.filter((r) => includesCity(r, city)).length;
}

function countDirectorySignals(
  results: SerpOrganicResult[],
  fullName: string,
  city: string
) {
  const matchedDomains = new Set<string>();

  for (const result of results) {
    const domain = getDomain(result.link || "");
    const isDirectory = DIRECTORY_DOMAINS.some(
      (d) => domain === d || domain.endsWith(`.${d}`)
    );

    if (!isDirectory) continue;
    if (!includesExactName(result, fullName)) continue;
    if (city && !includesCity(result, city)) continue;

    matchedDomains.add(domain);
  }

  return matchedDomains.size;
}

function countUsernameExposure(
  results: SerpOrganicResult[],
  username: string
) {
  if (!username) return 0;

  const matchedDomains = new Set<string>();

  for (const result of results) {
    const domain = getDomain(result.link || "");
    if (!domain) continue;

    const isDirectory = DIRECTORY_DOMAINS.some(
      (d) => domain === d || domain.endsWith(`.${d}`)
    );
    if (isDirectory) continue;

    if (includesUsername(result, username)) {
      matchedDomains.add(domain);
    }
  }

  return matchedDomains.size;
}

function shorten(text: string, maxLength = 72) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function sourceHint(result?: SerpOrganicResult) {
  if (!result) return "";
  return shorten(result.title || result.link || result.snippet || "", 68);
}

function isProfileLikePath(platformKey: string, url: string) {
  const path = getPath(url);

  switch (platformKey) {
    case "linkedin":
      return path.startsWith("/in/") || path.startsWith("/pub/");
    case "instagram":
      return (
        /^\/[a-z0-9._]+\/?$/.test(path) &&
        !path.startsWith("/p/") &&
        !path.startsWith("/reel/")
      );
    case "facebook":
      return (
        path.startsWith("/people/") ||
        path.startsWith("/profile.php") ||
        (/^\/[a-z0-9.\-]+\/?$/.test(path) &&
          !path.startsWith("/watch") &&
          !path.startsWith("/groups") &&
          !path.startsWith("/events") &&
          !path.startsWith("/posts") &&
          !path.startsWith("/photo"))
      );
    case "tiktok":
      return /^\/@[a-z0-9._]+\/?$/.test(path);
    case "x":
      return (
        /^\/[a-z0-9_]+\/?$/.test(path) &&
        !path.startsWith("/home") &&
        !path.startsWith("/search")
      );
    case "github":
      return (
        /^\/[a-z0-9-]+\/?$/.test(path) &&
        !path.startsWith("/topics") &&
        !path.startsWith("/orgs")
      );
    case "reddit":
      return path.startsWith("/user/") || path.startsWith("/u/");
    default:
      return false;
  }
}

function isObviouslyNonProfileContext(
  platformKey: string,
  result: SerpOrganicResult
) {
  const text = textOf(result);
  const path = getPath(result.link || "");

  const genericBadWords = [
    "video",
    "videos",
    "post",
    "posts",
    "comment",
    "comments",
    "episode",
    "podcast",
    "news",
    "article",
    "group",
    "groups",
    "forum",
    "thread",
    "subreddit",
    "watch",
    "playlist",
  ];

  const hasBadWord = genericBadWords.some((word) => text.includes(word));

  switch (platformKey) {
    case "facebook":
      return (
        path.startsWith("/groups") ||
        path.startsWith("/events") ||
        path.startsWith("/watch") ||
        path.includes("/posts/") ||
        hasBadWord
      );
    case "instagram":
      return path.startsWith("/p/") || path.startsWith("/reel/") || hasBadWord;
    case "tiktok":
      return path.includes("/video/") || hasBadWord;
    case "reddit":
      return !path.startsWith("/user/") && !path.startsWith("/u/");
    case "x":
      return path.includes("/status/") || hasBadWord;
    case "github":
      return path.split("/").length > 3;
    default:
      return hasBadWord;
  }
}

function assessPlatformSignal(params: {
  platform: PlatformConfig;
  results: SerpOrganicResult[];
  fullName: string;
  username: string;
  city: string;
}): PlatformAssessment {
  const { platform, results, fullName, username, city } = params;

  const cleanedName = cleanNameForUrl(fullName);
  let weakHits = 0;
  let strongHits = 0;

  let exactNameHit = false;
  let usernameHit = false;
  let cityHit = false;
  let profileLikeUrlHit = false;

  let bestStrong: SerpOrganicResult | undefined;
  let bestWeak: SerpOrganicResult | undefined;

  for (const result of results) {
    if (!isFromDomain(result, platform.domain)) continue;

    const fullText = textOf(result);
    const link = normalize(result.link || "");

    const exactName = fullText.includes(normalize(fullName));
    const userHit = username ? fullText.includes(normalize(username)) : false;
    const cityMatch = city ? fullText.includes(normalize(city)) : false;
    const urlNameHit = cleanedName ? link.includes(cleanedName) : false;

    const profileLikeUrl =
      isProfileLikePath(platform.key, result.link || "") || urlNameHit;

    const nonProfileContext = isObviouslyNonProfileContext(platform.key, result);

    if (exactName) exactNameHit = true;
    if (userHit) usernameHit = true;
    if (cityMatch) cityHit = true;
    if (profileLikeUrl) profileLikeUrlHit = true;

    const strongEvidenceCount =
      Number(exactName) +
      Number(userHit) +
      Number(cityMatch && !!city) +
      Number(profileLikeUrl);

    const isStrong =
      !nonProfileContext &&
      profileLikeUrl &&
      strongEvidenceCount >= 2 &&
      (exactName || userHit);

    const isWeak =
      !nonProfileContext &&
      profileLikeUrl &&
      (exactName || userHit || cityMatch);

    if (isStrong) {
      strongHits += 1;
      if (!bestStrong) bestStrong = result;
      continue;
    }

    if (isWeak) {
      weakHits += 1;
      if (!bestWeak) bestWeak = result;
    }
  }

  let strength = 0;
  if (strongHits >= 1) strength = 2;
  else if (weakHits >= 1) strength = 1;

  let value = "Kein relevanter Treffer gefunden";
  let detail =
    "Es wurden nicht genug öffentliche Hinweise gefunden, um diese Plattform eindeutig mit dir zu verknüpfen.";
  let status: FindingStatus = "neutral";
  let url: string | undefined = undefined;

  if (strength === 2) {
    value = "Sehr wahrscheinlich dein Profil";
    status = "danger";
    url = bestStrong?.link;

    if (exactNameHit && usernameHit) {
      detail = `Es wurde ein starker öffentlicher Treffer anhand deines vollständigen Namens und deines Benutzernamens gefunden.${
        bestStrong ? ` Quelle: ${sourceHint(bestStrong)}` : ""
      }`;
    } else if (exactNameHit && cityHit) {
      detail = `Es wurde ein starker öffentlicher Treffer anhand deines vollständigen Namens und deiner Stadt gefunden.${
        bestStrong ? ` Quelle: ${sourceHint(bestStrong)}` : ""
      }`;
    } else if (exactNameHit && profileLikeUrlHit) {
      detail = `Es wurde ein starker öffentlicher Treffer anhand deines vollständigen Namens und einer profiltypischen URL gefunden.${
        bestStrong ? ` Quelle: ${sourceHint(bestStrong)}` : ""
      }`;
    } else {
      detail = `Mehrere öffentliche Hinweise deuten auf ein wahrscheinliches echtes Profil hin.${
        bestStrong ? ` Quelle: ${sourceHint(bestStrong)}` : ""
      }`;
    }
  } else if (strength === 1) {
    value = "Möglicher Treffer";
    status = "warning";
    url = bestWeak?.link;

    if (exactNameHit && profileLikeUrlHit) {
      detail = `Es gibt Hinweise auf einen möglichen Profil-Treffer anhand deines Namens und einer profiltypischen URL.${
        bestWeak ? ` Quelle: ${sourceHint(bestWeak)}` : ""
      }`;
    } else if (usernameHit) {
      detail = `Es gibt Hinweise auf einen möglichen Profil-Treffer anhand eines benutzernamenähnlichen Ergebnisses.${
        bestWeak ? ` Quelle: ${sourceHint(bestWeak)}` : ""
      }`;
    } else {
      detail = `Es wurde ein schwacher profilähnlicher öffentlicher Treffer gefunden, der aber nicht bestätigt ist.${
        bestWeak ? ` Quelle: ${sourceHint(bestWeak)}` : ""
      }`;
    }
  }

  return {
    label: platform.label,
    strength,
    riskWeight: platform.riskWeight,
    value,
    detail,
    url,
    status,
  };
}

function buildRecommendations(params: {
  directoryListingsCount: number;
  usernameExposureCount: number;
  platformSignalsStrong: number;
  cityMentions: number;
  visibilityScore: number;
}) {
  const {
    directoryListingsCount,
    usernameExposureCount,
    platformSignalsStrong,
    cityMentions,
    visibilityScore,
  } = params;

  const recommendations: RecommendationItem[] = [];

  if (directoryListingsCount > 0) {
    recommendations.push({
      title: "Verzeichnis-Einträge entfernen",
      description:
        "Verzeichnis- und Personensuchseiten gehören zu den stärksten Risikosignalen. Dort solltest du zuerst auf Entfernung oder Opt-out setzen.",
    });
  }

  if (usernameExposureCount > 0) {
    recommendations.push({
      title: "Benutzernamen nicht wiederverwenden",
      description:
        "Verwende auf verschiedenen Plattformen unterschiedliche Benutzernamen, damit deine Identität schwerer verknüpft werden kann.",
    });
  }

  if (platformSignalsStrong > 1) {
    recommendations.push({
      title: "Plattformübergreifende Überschneidungen reduzieren",
      description:
        "Vermeide es, denselben vollständigen Namen, Standort, Profiltexte und Links auf mehreren Plattformen identisch zu verwenden.",
    });
  }

  if (cityMentions > 0) {
    recommendations.push({
      title: "Standortangaben einschränken",
      description:
        "Reduziere nach Möglichkeit die öffentlich auffindbare Kombination aus deinem vollständigen Namen und deiner Stadt oder Region.",
    });
  }

  if (recommendations.length < 3 && visibilityScore > 0) {
    recommendations.push({
      title: "Öffentliche Suchergebnisse prüfen",
      description:
        "Überprüfe sichtbare Suchergebnisse auf alte Profile, vergessene Seiten und unnötige Identitätsmerkmale.",
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      title: "Sichtbarkeit regelmässig kontrollieren",
      description:
        "Wiederhole den Scan regelmässig, besonders nach neuen öffentlichen Profilen oder Änderungen an bestehenden Accounts.",
    });
  }

  return recommendations.slice(0, 3);
}

function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  totalEstimatedResults: number;
  visibilityScore: number;
  platformSignalsStrong: number;
  platformSignalsWeak: number;
  directoryListingsCount: number;
  usernameExposureCount: number;
  exactNameMatches: number;
  cityMentions: number;
}) {
  const {
    totalEstimatedResults,
    visibilityScore,
    platformSignalsStrong,
    platformSignalsWeak,
    directoryListingsCount,
    usernameExposureCount,
    exactNameMatches,
    cityMentions,
  } = params;

  const moodLine =
    params.riskLevel === "High"
      ? "Deine öffentliche Identität lässt sich relativ leicht über mehrere Quellen hinweg verknüpfen."
      : params.riskLevel === "Medium"
      ? "Einige öffentliche Informationen lassen sich weiterhin miteinander verbinden."
      : "Deine öffentliche Identität wirkt aktuell vergleichsweise gut voneinander getrennt.";

  const plainSummary =
    params.riskLevel === "High"
      ? "Das stärkste Risiko entsteht dadurch, wie einfach jemand deine öffentlichen Informationen plattformübergreifend zusammenführen kann."
      : params.riskLevel === "Medium"
      ? "Das Hauptproblem ist nicht nur Sichtbarkeit, sondern wie leicht sich einzelne Informationen miteinander verknüpfen lassen."
      : "Aktuell ist positiv, dass reine Sichtbarkeit noch kein starkes Identitätsrisiko erzeugt.";

  return `${moodLine}

${plainSummary}

Es wurden etwa ${totalEstimatedResults.toLocaleString()} indexierte Ergebnisse gefunden, dazu ${platformSignalsStrong} starke Plattform-Treffer, ${platformSignalsWeak} schwächere Plattform-Treffer, ${directoryListingsCount} Verzeichnis-Signal${
    directoryListingsCount === 1 ? "" : "e"
  }, ${usernameExposureCount} benutzernamenbezogene Signal${
    usernameExposureCount === 1 ? "" : "e"
  }, ${exactNameMatches} starke Identitätstreffer und ${cityMentions} stadtbezogene Signal${
    cityMentions === 1 ? "" : "e"
  }.

Sichtbarkeitsgewichtung: ${visibilityScore}/10.`;
}

function scoreStatus(score: number): FindingStatus {
  if (score >= 70) return "danger";
  if (score >= 40) return "warning";
  return "good";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanRequestWithTurnstile;

    const turnstileToken = body.turnstileToken?.trim() || "";

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Die Sicherheitsprüfung fehlt." },
        { status: 400 }
      );
    }

    const turnstileVerification = await verifyTurnstileToken(
      turnstileToken,
      request
    );

    if (!turnstileVerification.success) {
      return NextResponse.json(
        {
          error:
            "Die Sicherheitsprüfung konnte nicht bestätigt werden. Bitte versuche es erneut.",
        },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(request);
    const lastIpScanAt = ipDailyScanStore.get(clientIp);

    if (lastIpScanAt) {
      const remainingMs = getRemainingMs(lastIpScanAt);

      if (remainingMs > 0) {
        return NextResponse.json(
          {
            error: `Von dieser Verbindung wurde heute bereits ein Scan durchgeführt. Bitte versuche es in ${formatRemainingTime(
              remainingMs
            )} erneut.`,
          },
          { status: 429 }
        );
      }
    }

    const firstName = body.firstName?.trim() || "";
    const lastName = body.lastName?.trim() || "";
    const city = body.city?.trim() || "";
    const username = body.username?.trim() || "";
    const email = body.email?.trim() || "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Vorname und Nachname sind erforderlich." },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const exactNameQuery = `"${fullName}"`;
    const cityQuery = city ? `"${fullName}" "${city}"` : "";
    const usernameQuery = username ? `"${username}"` : "";
    const usernameComboQuery = username ? `"${fullName}" "${username}"` : "";
    const directoryQuery = `"${fullName}" (site:whitepages.com OR site:peekyou.com OR site:spokeo.com OR site:truepeoplesearch.com OR site:mylife.com OR site:beenverified.com)`;

    const platformQueries = PLATFORM_CONFIG.map((platform) => {
      const q = username
        ? `site:${platform.domain} ("${fullName}" OR "${username}")`
        : `site:${platform.domain} "${fullName}"`;
      return fetchSerp(q);
    });

    const [
      exactNameResponse,
      cityResponse,
      usernameResponse,
      usernameComboResponse,
      directoryResponse,
      ...platformResponses
    ] = await Promise.all<SerpResponse>([
      fetchSerp(exactNameQuery),
      cityQuery ? fetchSerp(cityQuery) : Promise.resolve(EMPTY_SERP_RESPONSE),
      usernameQuery
        ? fetchSerp(usernameQuery)
        : Promise.resolve(EMPTY_SERP_RESPONSE),
      usernameComboQuery
        ? fetchSerp(usernameComboQuery)
        : Promise.resolve(EMPTY_SERP_RESPONSE),
      fetchSerp(directoryQuery),
      ...platformQueries,
    ]);

    const totalEstimatedResults = Math.max(
      parseTotalResults(exactNameResponse.search_information?.total_results),
      parseTotalResults(cityResponse.search_information?.total_results),
      0
    );

    const visibilityScore = estimateVisibilityScore(totalEstimatedResults);

    const identityResults = dedupeResults([
      exactNameResponse.organic_results || [],
      cityResponse.organic_results || [],
    ]);

    const usernameResults = dedupeResults([
      usernameResponse.organic_results || [],
      usernameComboResponse.organic_results || [],
    ]);

    const directoryResults = dedupeResults([
      directoryResponse.organic_results || [],
    ]);

    const perPlatformFindings: PlatformAssessment[] = PLATFORM_CONFIG.map(
      (platform, index) => {
        const response = platformResponses[index] || EMPTY_SERP_RESPONSE;
        const results = dedupeResults([
          response.organic_results || [],
          identityResults,
          usernameResults,
        ]);

        return assessPlatformSignal({
          platform,
          results,
          fullName,
          username,
          city,
        });
      }
    );

    const platformSignalsStrong = perPlatformFindings.filter(
      (p) => p.strength >= 2
    ).length;
    const platformSignalsWeak = perPlatformFindings.filter(
      (p) => p.strength === 1
    ).length;

    const weightedPlatformRisk = perPlatformFindings.reduce((sum, platform) => {
      if (platform.strength >= 2) return sum + platform.riskWeight * 2;
      if (platform.strength === 1) return sum + platform.riskWeight * 0.5;
      return sum;
    }, 0);

    const exactNameMatches = Math.min(
      countStrongExactMatches(identityResults, fullName, city),
      4
    );

    const cityMentions = Math.min(countCityMentions(identityResults, city), 4);

    const directoryListingsCount = Math.min(
      countDirectorySignals(directoryResults, fullName, city),
      4
    );

    const usernameExposureCount = Math.min(
      countUsernameExposure(usernameResults, username),
      5
    );

    const emailLeakCount = 0;

    let score = 0;

    score += visibilityScore;
    score += weightedPlatformRisk;
    score += directoryListingsCount * 15;
    score += usernameExposureCount * 10;
    score += exactNameMatches * 2;
    score += cityMentions > 0 ? Math.min(cityMentions * 1.5, 4) : 0;

    if (city) score += 1;
    if (email) score += 2;
    score += emailLeakCount * 20;

    if (
      totalEstimatedResults >= 100_000 &&
      directoryListingsCount === 0 &&
      usernameExposureCount === 0 &&
      platformSignalsStrong <= 1 &&
      !username
    ) {
      score -= 10;
    }

    if (
      totalEstimatedResults >= 1_000 &&
      directoryListingsCount === 0 &&
      usernameExposureCount === 0 &&
      platformSignalsStrong === 0 &&
      platformSignalsWeak <= 3
    ) {
      score -= 6;
    }

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

    const recommendations = buildRecommendations({
      directoryListingsCount,
      usernameExposureCount,
      platformSignalsStrong,
      cityMentions,
      visibilityScore,
    });

    const findings: FindingItem[] = [
      {
        label: "Identity theft risk core",
        value: `${riskScore}/100 Risikowert basierend auf Verknüpfbarkeit und Missbrauchssignalen`,
        status: scoreStatus(riskScore),
      },
      {
        label: "Public visibility",
        value: `${totalEstimatedResults.toLocaleString()} indexierte Ergebnisse geschätzt (${visibilityScore}/10 Sichtbarkeitsgewichtung)`,
        status: "warning",
      },
      {
        label: "Directory / people-search pages",
        value:
          directoryListingsCount > 0
            ? `${directoryListingsCount} Verzeichnis-Signal${
                directoryListingsCount === 1 ? "" : "e"
              } erkannt`
            : "Keine Verzeichnis-Signale erkannt",
        status: directoryListingsCount > 0 ? "danger" : "good",
      },
      {
        label: "Username reuse exposure",
        value:
          usernameExposureCount > 0
            ? `${usernameExposureCount} benutzernamenbezogene${
                usernameExposureCount === 1 ? "s" : ""
              } Ergebnis${usernameExposureCount === 1 ? "" : "se"} gefunden`
            : username
            ? "Keine benutzernamenbezogenen Signale erkannt"
            : "Nicht geprüft (kein Benutzername angegeben)",
        status:
          usernameExposureCount > 0
            ? "danger"
            : username
            ? "good"
            : "neutral",
      },
      {
        label: "Exact identity matches",
        value: `${exactNameMatches} starke Identitätstreffer erkannt`,
        status: exactNameMatches >= 3 ? "warning" : "good",
      },
      ...perPlatformFindings.map((platform) => ({
        label: platform.label,
        value: platform.value,
        detail: platform.detail,
        url: platform.url,
        status: platform.status,
      })),
    ];

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings,
      aiSummary: buildSummary({
        fullName,
        riskLevel,
        totalEstimatedResults,
        visibilityScore,
        platformSignalsStrong,
        platformSignalsWeak,
        directoryListingsCount,
        usernameExposureCount,
        exactNameMatches,
        cityMentions,
      }),
      recommendations,
      rawSignals: {
        publicResultsCount: totalEstimatedResults,
        socialProfilesCount: platformSignalsStrong + platformSignalsWeak,
        emailLeakCount,
        exactNameMatches,
        usernameExposureCount,
        cityProvided: Boolean(city),
        emailProvided: Boolean(email),
      },
    };

    // Erst nach erfolgreichem Scan speichern
    ipDailyScanStore.set(clientIp, Date.now());

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";

    console.error("Scan-Fehler:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}