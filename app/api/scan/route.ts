import { NextResponse } from "next/server";
import { ScanRequestBody, ScanResponse, RiskLevel } from "@/types/scan";

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

const SOCIAL_DOMAINS = [
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "github.com",
  "reddit.com",
  "youtube.com",
  "pinterest.com",
  "threads.net",
  "medium.com",
  "crunchbase.com",
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

function parseTotalResults(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function domainMatches(domain: string, targetDomains: string[]) {
  return targetDomains.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

function textOf(result: SerpOrganicResult) {
  return normalize(
    `${result.title || ""} ${result.snippet || ""} ${result.link || ""}`
  );
}

function hasExactName(result: SerpOrganicResult, fullName: string) {
  return textOf(result).includes(normalize(fullName));
}

function hasUsername(result: SerpOrganicResult, username: string) {
  if (!username) return false;
  return textOf(result).includes(normalize(username));
}

function hasCity(result: SerpOrganicResult, city: string) {
  if (!city) return false;
  return textOf(result).includes(normalize(city));
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

function uniqueDomains(
  results: SerpOrganicResult[],
  allowedDomains?: string[]
): string[] {
  const set = new Set<string>();

  for (const result of results) {
    const domain = getDomain(result.link || "");
    if (!domain) continue;
    if (allowedDomains && !domainMatches(domain, allowedDomains)) continue;
    set.add(domain);
  }

  return [...set];
}

function countExactNameMatches(results: SerpOrganicResult[], fullName: string) {
  let count = 0;

  for (const result of results) {
    const inTitle = normalize(result.title || "").includes(normalize(fullName));
    const inSnippet = normalize(result.snippet || "").includes(normalize(fullName));

    // nur starke Treffer zählen
    if (inTitle || inSnippet) {
      count += 1;
    }
  }

  return count;
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
  if (totalEstimatedResults >= 10_000_000) return 18;
  if (totalEstimatedResults >= 1_000_000) return 15;
  if (totalEstimatedResults >= 100_000) return 12;
  if (totalEstimatedResults >= 10_000) return 9;
  if (totalEstimatedResults >= 1_000) return 6;
  if (totalEstimatedResults >= 100) return 3;
  return 1;
}

function buildRecommendations(params: {
  socialProfilesCount: number;
  directoryListingsCount: number;
  usernameExposureCount: number;
  cityMentions: number;
}) {
  const {
    socialProfilesCount,
    directoryListingsCount,
    usernameExposureCount,
    cityMentions,
  } = params;

  const recommendations = [];

  if (socialProfilesCount > 0) {
    recommendations.push({
      title: "Reduce public profile visibility",
      description:
        "Review social profiles and hide phone numbers, links, location details, and unnecessary personal information where possible.",
    });
  }

  if (directoryListingsCount > 0) {
    recommendations.push({
      title: "Review people-search listings",
      description:
        "If directory-style or people-search pages appear, request removal or use available opt-out forms where possible.",
    });
  }

  if (usernameExposureCount > 0) {
    recommendations.push({
      title: "Use distinct usernames",
      description:
        "Avoid reusing the same handle across platforms if you want to reduce cross-platform identity correlation.",
    });
  }

  if (cityMentions > 0) {
    recommendations.push({
      title: "Limit searchable location data",
      description:
        "Reduce public references that combine your full name with your city or region to make correlation harder.",
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      title: "Audit old accounts",
      description:
        "Search for inactive or outdated accounts and remove or anonymize profiles you no longer use.",
    });
  }

  return recommendations.slice(0, 3);
}

function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  totalEstimatedResults: number;
  socialProfilesCount: number;
  directoryListingsCount: number;
  usernameExposureCount: number;
  exactNameMatches: number;
  cityMentions: number;
}) {
  const {
    fullName,
    riskLevel,
    totalEstimatedResults,
    socialProfilesCount,
    directoryListingsCount,
    usernameExposureCount,
    exactNameMatches,
    cityMentions,
  } = params;

  const tone =
    riskLevel === "High"
      ? "highly exposed"
      : riskLevel === "Medium"
      ? "moderately exposed"
      : "currently limited in exposure";

  return `${fullName}'s identity appears ${tone}. We detected approximately ${totalEstimatedResults.toLocaleString()} indexed search results, ${socialProfilesCount} social profile signals, ${directoryListingsCount} directory or people-search signals, ${usernameExposureCount} username-linked signals, ${exactNameMatches} strong exact-name matches, and ${cityMentions} city-linked result signals across the most relevant indexed pages.`;
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
    const socialQuery = `"${fullName}" (site:linkedin.com OR site:instagram.com OR site:tiktok.com OR site:facebook.com OR site:x.com OR site:github.com OR site:reddit.com)`;
    const directoryQuery = `"${fullName}" (site:whitepages.com OR site:peekyou.com OR site:spokeo.com OR site:truepeoplesearch.com OR site:mylife.com)`;
    const usernameQuery = username ? `"${username}"` : "";
    const usernameComboQuery = username ? `"${fullName}" "${username}"` : "";

    const [
      exactNameResponse,
      cityResponse,
      socialResponse,
      directoryResponse,
      usernameResponse,
      usernameComboResponse,
    ] = await Promise.all([
      fetchSerp(exactNameQuery),
      cityQuery ? fetchSerp(cityQuery) : Promise.resolve({ organic_results: [] }),
      fetchSerp(socialQuery),
      fetchSerp(directoryQuery),
      usernameQuery ? fetchSerp(usernameQuery) : Promise.resolve({ organic_results: [] }),
      usernameComboQuery
        ? fetchSerp(usernameComboQuery)
        : Promise.resolve({ organic_results: [] }),
    ]);

    // Gesamt-Sichtbarkeit nur aus normalen Personen-Queries
    const totalEstimatedResults = Math.max(
      parseTotalResults(exactNameResponse.search_information?.total_results),
      parseTotalResults(cityResponse.search_information?.total_results),
      0
    );

    const identityResults = dedupeResults([
      exactNameResponse.organic_results || [],
      cityResponse.organic_results || [],
    ]);

    const socialResults = dedupeResults([
      socialResponse.organic_results || [],
      exactNameResponse.organic_results || [],
      cityResponse.organic_results || [],
      usernameComboResponse.organic_results || [],
    ]);

    const usernameResults = dedupeResults([
      usernameResponse.organic_results || [],
      usernameComboResponse.organic_results || [],
      socialResponse.organic_results || [],
    ]);

    const directoryResults = dedupeResults([
      directoryResponse.organic_results || [],
    ]);

    const exactNameMatchesRaw = countExactNameMatches(identityResults, fullName);
    const exactNameMatches = Math.min(exactNameMatchesRaw, 8);

    const cityMentionsRaw = identityResults.filter((r) => hasCity(r, city)).length;
    const cityMentions = Math.min(cityMentionsRaw, 6);

    // Social nur dann zählen, wenn Name oder Username wirklich im Ergebnis sichtbar ist
    const filteredSocialResults = socialResults.filter((r) => {
      const domain = getDomain(r.link || "");
      if (!domainMatches(domain, SOCIAL_DOMAINS)) return false;
      return hasExactName(r, fullName) || hasUsername(r, username);
    });

    const socialProfilesCount = Math.min(
      uniqueDomains(filteredSocialResults, SOCIAL_DOMAINS).length,
      6
    );

    // Username nur auf nicht-directory domains und nur wenn username wirklich vorkommt
    const filteredUsernameResults = usernameResults.filter((r) => {
      const domain = getDomain(r.link || "");
      if (!domain) return false;
      if (domainMatches(domain, DIRECTORY_DOMAINS)) return false;
      return hasUsername(r, username);
    });

    const usernameExposureCount = Math.min(
      uniqueDomains(filteredUsernameResults).length,
      5
    );

    // Directory nur streng zählen:
    // voller Name muss drin sein und bei vorhandener Stadt idealerweise auch Stadt
    const filteredDirectoryResults = directoryResults.filter((r) => {
      const domain = getDomain(r.link || "");
      if (!domainMatches(domain, DIRECTORY_DOMAINS)) return false;
      if (!hasExactName(r, fullName)) return false;
      if (city) {
        return hasCity(r, city);
      }
      return true;
    });

    const directoryListingsCount = Math.min(
      uniqueDomains(filteredDirectoryResults, DIRECTORY_DOMAINS).length,
      4
    );

    const emailLeakCount = 0;

    let score = 0;

    // Web visibility schwächer gewichten als vorher
    score += estimateVisibilityScore(totalEstimatedResults);

    // Präzisere Signale stärker gewichten
    score += socialProfilesCount * 6;
    score += directoryListingsCount * 12;
    score += exactNameMatches * 2;
    score += usernameExposureCount * 7;
    score += cityMentions > 0 ? Math.min(cityMentions * 2, 8) : 0;

    if (city) score += 2;
    if (email) score += 2;
    score += emailLeakCount * 20;

    // Promi-/Bekanntheits-Abfederung:
    // riesige Sichtbarkeit, aber keine harten personenspezifischen Risiken
    if (
      totalEstimatedResults >= 1_000_000 &&
      directoryListingsCount === 0 &&
      usernameExposureCount === 0 &&
      !username
    ) {
      score -= 8;
    }

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

    const recommendations = buildRecommendations({
      socialProfilesCount,
      directoryListingsCount,
      usernameExposureCount,
      cityMentions,
    });

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings: [
        {
          label: "Public web results",
          value: `${totalEstimatedResults.toLocaleString()} indexed search results estimated`,
        },
        {
          label: "Possible social profiles",
          value: `${socialProfilesCount} social profile signal${
            socialProfilesCount === 1 ? "" : "s"
          } detected`,
        },
        {
          label: "Directory / people-search pages",
          value: `${directoryListingsCount} directory signal${
            directoryListingsCount === 1 ? "" : "s"
          } detected`,
        },
        {
          label: "Exact name matches",
          value: `${exactNameMatches} strong exact-name match${
            exactNameMatches === 1 ? "" : "es"
          } identified`,
        },
        {
          label: "Username exposure",
          value:
            usernameExposureCount > 0
              ? `${usernameExposureCount} username-linked result${
                  usernameExposureCount === 1 ? "" : "s"
                } found`
              : "No username-based exposure checked",
        },
      ],
      aiSummary: buildSummary({
        fullName,
        riskLevel,
        totalEstimatedResults,
        socialProfilesCount,
        directoryListingsCount,
        usernameExposureCount,
        exactNameMatches,
        cityMentions,
      }),
      recommendations,
      rawSignals: {
        publicResultsCount: totalEstimatedResults,
        socialProfilesCount,
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