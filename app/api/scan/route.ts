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

function countMatchingDomains(
  results: SerpOrganicResult[],
  domains: string[]
): number {
  let count = 0;

  for (const result of results) {
    const domain = getDomain(result.link || "");
    if (domains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
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

  const data = (await response.json()) as SerpResponse;
  return data;
}

function parseTotalResults(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  totalEstimatedResults: number;
  socialProfilesCount: number;
  directoryListingsCount: number;
  usernameExposureCount: number;
  exactNameMatches: number;
}) {
  const {
    fullName,
    riskLevel,
    totalEstimatedResults,
    socialProfilesCount,
    directoryListingsCount,
    usernameExposureCount,
    exactNameMatches,
  } = params;

  const tone =
    riskLevel === "High"
      ? "highly exposed"
      : riskLevel === "Medium"
      ? "moderately exposed"
      : "currently limited in exposure";

  return `${fullName}'s identity appears ${tone}. We detected approximately ${totalEstimatedResults.toLocaleString()} indexed search results, ${socialProfilesCount} social profile signals, ${directoryListingsCount} directory or people-search signals, ${usernameExposureCount} username-linked signals, and ${exactNameMatches} strong exact-name matches across the top indexed pages.`;
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
    ];

    if (username) {
      queries.push(`"${username}"`);
      queries.push(`"${fullName}" "${username}"`);
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

    const directoryListingsCount = countMatchingDomains(
      mergedResults,
      DIRECTORY_DOMAINS
    );

    const exactNameMatches = countExactNameMentions(mergedResults, fullName);
    const usernameExposureCount = countUsernameMentions(mergedResults, username);

    const emailLeakCount = 0;

    let score = 0;

    if (totalEstimatedResults >= 1_000_000) score += 28;
    else if (totalEstimatedResults >= 100_000) score += 22;
    else if (totalEstimatedResults >= 10_000) score += 16;
    else if (totalEstimatedResults >= 1_000) score += 10;
    else if (totalEstimatedResults >= 100) score += 5;
    else if (totalEstimatedResults > 0) score += 2;

    score += Math.min(socialProfilesCount * 8, 24);
    score += Math.min(directoryListingsCount * 14, 28);
    score += Math.min(exactNameMatches * 4, 16);
    score += Math.min(usernameExposureCount * 6, 18);
    score += city ? 4 : 0;
    score += email ? 4 : 0;
    score += emailLeakCount * 20;

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

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
      }),
      recommendations: [
        {
          title: "Reduce public profile visibility",
          description:
            "Limit the amount of personal data visible on social platforms and public profile pages.",
        },
        {
          title: "Review people-search listings",
          description:
            "If directory-style sites appear, request removal or opt-out where possible.",
        },
        {
          title: "Use distinct usernames",
          description:
            "Avoid reusing the same handle across platforms if you want to reduce correlation.",
        },
      ],
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