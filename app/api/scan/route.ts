import { NextResponse } from "next/server";
import { ScanRequestBody, ScanResponse, RiskLevel, RecommendationItem } from "@/types/scan";

const SERP_API_KEY = process.env.SERP_API_KEY;

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

const EMPTY_SERP_RESPONSE: SerpResponse = {
  search_information: { total_results: 0 },
  organic_results: [],
};

const PLATFORM_CONFIG = [
  { key: "linkedin", label: "LinkedIn", domain: "linkedin.com" },
  { key: "instagram", label: "Instagram", domain: "instagram.com" },
  { key: "facebook", label: "Facebook", domain: "facebook.com" },
  { key: "tiktok", label: "TikTok", domain: "tiktok.com" },
  { key: "x", label: "X / Twitter", domain: "x.com" },
  { key: "github", label: "GitHub", domain: "github.com" },
  { key: "reddit", label: "Reddit", domain: "reddit.com" },
] as const;

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

async function fetchSerp(query: string): Promise<SerpResponse> {
  if (!SERP_API_KEY) {
    throw new Error("Missing SERP_API_KEY");
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
    throw new Error(`SerpAPI error: ${response.status} ${text}`);
  }

  return (await response.json()) as SerpResponse;
}

function estimateVisibilityScore(totalEstimatedResults: number): number {
  if (totalEstimatedResults <= 0) return 0;
  if (totalEstimatedResults >= 10_000_000) return 12;
  if (totalEstimatedResults >= 1_000_000) return 10;
  if (totalEstimatedResults >= 100_000) return 8;
  if (totalEstimatedResults >= 10_000) return 6;
  if (totalEstimatedResults >= 1_000) return 4;
  if (totalEstimatedResults >= 100) return 2;
  return 1;
}

function platformSignalLabel(strength: number) {
  if (strength >= 2) return "strong profile signal detected";
  if (strength >= 1) return "possible profile signal detected";
  return "no strong signal detected";
}

function countStrongExactMatches(results: SerpOrganicResult[], fullName: string) {
  let count = 0;

  for (const result of results) {
    const title = normalize(result.title || "");
    const snippet = normalize(result.snippet || "");
    const target = normalize(fullName);

    if (title.includes(target) || snippet.includes(target)) {
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

function getPlatformSignalStrength(params: {
  platformDomain: string;
  results: SerpOrganicResult[];
  fullName: string;
  username: string;
}) {
  const { platformDomain, results, fullName, username } = params;

  let strength = 0;

  for (const result of results) {
    if (!isFromDomain(result, platformDomain)) continue;

    const exactName = includesExactName(result, fullName);
    const userHit = includesUsername(result, username);

    if (exactName && userHit) {
      strength = Math.max(strength, 2);
    } else if (exactName || userHit) {
      strength = Math.max(strength, 1);
    }
  }

  return strength;
}

function buildRecommendations(params: {
  directoryListingsCount: number;
  usernameExposureCount: number;
  platformSignalsStrong: number;
  cityMentions: number;
}) {
  const {
    directoryListingsCount,
    usernameExposureCount,
    platformSignalsStrong,
    cityMentions,
  } = params;

  const recommendations: RecommendationItem[] = [];

  if (directoryListingsCount > 0) {
    recommendations.push({
      title: "Review people-search listings",
      description:
        "If directory-style or people-search pages appear, request removal or use opt-out forms where available.",
    });
  }

  if (usernameExposureCount > 0) {
    recommendations.push({
      title: "Use distinct usernames",
      description:
        "Avoid reusing the same handle across multiple platforms if you want to reduce cross-platform identity correlation.",
    });
  }

  if (platformSignalsStrong > 0) {
    recommendations.push({
      title: "Reduce public profile visibility",
      description:
        "Review public social profiles and remove unnecessary bio details, links, and identifying information.",
    });
  }

  if (cityMentions > 0) {
    recommendations.push({
      title: "Limit searchable location data",
      description:
        "Reduce public references that combine your full name with your city or region.",
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      title: "Audit old accounts",
      description:
        "Search for inactive or outdated profiles and remove or anonymize accounts you no longer use.",
    });
  }

  return recommendations.slice(0, 3);
}

function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  totalEstimatedResults: number;
  platformSignalsStrong: number;
  platformSignalsWeak: number;
  directoryListingsCount: number;
  usernameExposureCount: number;
  exactNameMatches: number;
  cityMentions: number;
}) {
  const {
    fullName,
    riskLevel,
    totalEstimatedResults,
    platformSignalsStrong,
    platformSignalsWeak,
    directoryListingsCount,
    usernameExposureCount,
    exactNameMatches,
    cityMentions,
  } = params;

  const tone =
    riskLevel === "High"
      ? "highly exposed to misuse"
      : riskLevel === "Medium"
      ? "moderately exposed to misuse"
      : "currently at lower risk of misuse";

  return `${fullName}'s identity appears ${tone}. We detected approximately ${totalEstimatedResults.toLocaleString()} indexed results, ${platformSignalsStrong} strong platform signal${platformSignalsStrong === 1 ? "" : "s"}, ${platformSignalsWeak} weak platform signal${platformSignalsWeak === 1 ? "" : "s"}, ${directoryListingsCount} directory signal${directoryListingsCount === 1 ? "" : "s"}, ${usernameExposureCount} username-linked signal${usernameExposureCount === 1 ? "" : "s"}, ${exactNameMatches} strong exact-name match${exactNameMatches === 1 ? "" : "es"}, and ${cityMentions} city-linked result signal${cityMentions === 1 ? "" : "s"}.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ScanRequestBody>;

    const firstName = body.firstName?.trim() || "";
    const lastName = body.lastName?.trim() || "";
    const city = body.city?.trim() || "";
    const username = body.username?.trim() || "";
    const email = body.email?.trim() || "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
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
      usernameQuery ? fetchSerp(usernameQuery) : Promise.resolve(EMPTY_SERP_RESPONSE),
      usernameComboQuery
        ? fetchSerp(usernameComboQuery)
        : Promise.resolve(EMPTY_SERP_RESPONSE),
      fetchSerp(directoryQuery),
      ...platformQueries,
    ]);

    // Sichtbarkeit nur aus normalen Personensuchen
    const totalEstimatedResults = Math.max(
      parseTotalResults(exactNameResponse.search_information?.total_results),
      parseTotalResults(cityResponse.search_information?.total_results),
      0
    );

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

    const perPlatformFindings = PLATFORM_CONFIG.map((platform, index) => {
      const response = platformResponses[index] || EMPTY_SERP_RESPONSE;
      const results = dedupeResults([
        response.organic_results || [],
        identityResults,
        usernameResults,
      ]);

      const strength = getPlatformSignalStrength({
        platformDomain: platform.domain,
        results,
        fullName,
        username,
      });

      return {
        label: platform.label,
        strength,
      };
    });

    const platformSignalsStrong = perPlatformFindings.filter(
      (p) => p.strength >= 2
    ).length;
    const platformSignalsWeak = perPlatformFindings.filter(
      (p) => p.strength === 1
    ).length;

    const exactNameMatches = Math.min(
      countStrongExactMatches(identityResults, fullName),
      6
    );

    const cityMentions = Math.min(
      countCityMentions(identityResults, city),
      5
    );

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

    // Sichtbarkeit zählt, aber deutlich weniger als echte Missbrauchssignale
    score += estimateVisibilityScore(totalEstimatedResults);

    // Plattformsignale
    score += platformSignalsStrong * 8;
    score += platformSignalsWeak * 3;

    // Harte Risikoindikatoren
    score += directoryListingsCount * 15;
    score += usernameExposureCount * 9;

    // Unterstützende Signale
    score += exactNameMatches * 2;
    score += cityMentions > 0 ? Math.min(cityMentions * 2, 6) : 0;

    if (city) score += 2;
    if (email) score += 2;
    score += emailLeakCount * 20;

    // Bekanntheit dämpfen: sehr viele Treffer, aber kaum personenspezifische Risiken
    if (
      totalEstimatedResults >= 1_000_000 &&
      directoryListingsCount === 0 &&
      usernameExposureCount === 0 &&
      platformSignalsStrong <= 2 &&
      !username
    ) {
      score -= 10;
    }

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

    const recommendations = buildRecommendations({
      directoryListingsCount,
      usernameExposureCount,
      platformSignalsStrong,
      cityMentions,
    });

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings: [
        {
          label: "Public web visibility",
          value: `${totalEstimatedResults.toLocaleString()} indexed search results estimated`,
        },
        {
          label: "Directory / people-search pages",
          value: `${directoryListingsCount} directory signal${directoryListingsCount === 1 ? "" : "s"} detected`,
        },
        {
          label: "Username reuse exposure",
          value:
            usernameExposureCount > 0
              ? `${usernameExposureCount} username-linked result${usernameExposureCount === 1 ? "" : "s"} found`
              : "No username-based exposure checked",
        },
        {
          label: "Exact identity matches",
          value: `${exactNameMatches} strong exact-name match${exactNameMatches === 1 ? "" : "es"} identified`,
        },
        ...perPlatformFindings.map((platform) => ({
          label: platform.label,
          value: platformSignalLabel(platform.strength),
        })),
      ],
      aiSummary: buildSummary({
        fullName,
        riskLevel,
        totalEstimatedResults,
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

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Scan error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}