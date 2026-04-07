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

const PROFESSIONAL_DOMAINS = [
  "linkedin.com",
  "github.com",
  "crunchbase.com",
  "medium.com",
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

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalize(text: string) {
  return text.toLowerCase().trim();
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

function countMatchingDomains(
  results: SerpOrganicResult[],
  domains: string[]
): number {
  let count = 0;

  for (const result of results) {
    const domain = getDomain(result.link || "");
    if (domainMatches(domain, domains)) {
      count += 1;
    }
  }

  return count;
}

function countExactNameMentions(
  results: SerpOrganicResult[],
  fullName: string
): number {
  const target = normalize(fullName);
  let count = 0;

  for (const result of results) {
    const haystack = normalize(
      `${result.title || ""} ${result.snippet || ""} ${result.link || ""}`
    );
    if (haystack.includes(target)) {
      count += 1;
    }
  }

  return count;
}

function countUsernameMentions(
  results: SerpOrganicResult[],
  username: string
): number {
  if (!username) return 0;

  const target = normalize(username);
  let count = 0;

  for (const result of results) {
    const haystack = normalize(
      `${result.title || ""} ${result.snippet || ""} ${result.link || ""}`
    );
    if (haystack.includes(target)) {
      count += 1;
    }
  }

  return count;
}

function countCityMentions(
  results: SerpOrganicResult[],
  city: string
): number {
  if (!city) return 0;

  const target = normalize(city);
  let count = 0;

  for (const result of results) {
    const haystack = normalize(
      `${result.title || ""} ${result.snippet || ""}`
    );
    if (haystack.includes(target)) {
      count += 1;
    }
  }

  return count;
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

  // Logarithmische Gewichtung statt linearer Explosion
  const log10 = Math.log10(totalEstimatedResults + 1);

  if (log10 >= 7) return 24; // 10M+
  if (log10 >= 6) return 21; // 1M+
  if (log10 >= 5) return 17; // 100k+
  if (log10 >= 4) return 12; // 10k+
  if (log10 >= 3) return 8;  // 1k+
  if (log10 >= 2) return 4;  // 100+
  return 2;
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

  return `${fullName}'s identity appears ${tone}. We detected approximately ${totalEstimatedResults.toLocaleString()} indexed search results, ${socialProfilesCount} social profile signals, ${directoryListingsCount} directory or people-search signals, ${usernameExposureCount} username-linked signals, ${exactNameMatches} strong exact-name matches, and ${cityMentions} city-linked result signals across the top indexed pages.`;
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

    const queries: string[] = [
      `"${fullName}"`,
      `"${fullName}" ${city}`.trim(),
      `"${fullName}" (site:linkedin.com OR site:instagram.com OR site:tiktok.com OR site:facebook.com OR site:x.com OR site:github.com OR site:reddit.com)`,
      `"${fullName}" (site:whitepages.com OR site:peekyou.com OR site:spokeo.com OR site:truepeoplesearch.com OR site:mylife.com)`,
    ];

    if (username) {
      queries.push(`"${username}"`);
      queries.push(`"${fullName}" "${username}"`);
      queries.push(`"${username}" (site:instagram.com OR site:tiktok.com OR site:github.com OR site:reddit.com OR site:x.com)`);
    }

    if (city) {
      queries.push(`"${fullName}" "${city}"`);
    }

    const uniqueQueries = [...new Set(queries.filter(Boolean))];

    const responses = await Promise.all(uniqueQueries.map((q) => fetchSerp(q)));

    const totals = responses.map((r) =>
      parseTotalResults(r.search_information?.total_results)
    );

    const totalEstimatedResults = Math.max(...totals, 0);

    const organicGroups = responses.map((r) => r.organic_results || []);
    const mergedResults = dedupeResults(organicGroups);

    const socialProfilesCount = countMatchingDomains(
      mergedResults,
      SOCIAL_DOMAINS
    );

    const professionalProfilesCount = countMatchingDomains(
      mergedResults,
      PROFESSIONAL_DOMAINS
    );

    const directoryListingsCount = countMatchingDomains(
      mergedResults,
      DIRECTORY_DOMAINS
    );

    const exactNameMatches = countExactNameMentions(mergedResults, fullName);
    const usernameExposureCount = countUsernameMentions(mergedResults, username);
    const cityMentions = countCityMentions(mergedResults, city);

    const emailLeakCount = 0;

    let score = 0;

    // Sichtbarkeit
    score += estimateVisibilityScore(totalEstimatedResults);

    // Soziale / professionelle Präsenz
    score += Math.min(socialProfilesCount * 5, 20);
    score += Math.min(professionalProfilesCount * 3, 9);

    // Directory/People-search ist riskanter
    score += Math.min(directoryListingsCount * 14, 30);

    // Präzisionssignale
    score += Math.min(exactNameMatches * 2.5, 15);
    score += Math.min(usernameExposureCount * 7, 21);
    score += Math.min(cityMentions * 3, 9);

    if (city) score += 3;
    if (email) score += 3;
    score += emailLeakCount * 20;

    // Promi-/Celebrity-Abfederung:
    // Sehr viele Suchergebnisse, aber keine Directory- oder Username-Signale
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