import { NextResponse } from "next/server";
import {
  ScanRequestBody,
  ScanResponse,
  RiskLevel,
  RecommendationItem,
} from "@/types/scan";

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
      return /^\/[a-z0-9._]+\/?$/.test(path) && !path.startsWith("/p/") && !path.startsWith("/reel/");
    case "facebook":
      return (
        path.startsWith("/people/") ||
        path.startsWith("/profile.php") ||
        (/^\/[a-z0-9.\-]+\/?$/.test(path) &&
          !path.startsWith("/watch") &&
          !path.startsWith("/groups") &&
          !path.startsWith("/events") &&
          !path.includes("/posts/") &&
          !path.startsWith("/photo"))
      );
    case "tiktok":
      return /^\/@[a-z0-9._]+\/?$/.test(path);
    case "x":
      return /^\/[a-z0-9_]+\/?$/.test(path) && !path.startsWith("/home") && !path.startsWith("/search");
    case "github":
      return /^\/[a-z0-9-]+\/?$/.test(path) && !path.startsWith("/topics") && !path.startsWith("/orgs");
    case "reddit":
      return path.startsWith("/user/") || path.startsWith("/u/");
    default:
      return false;
  }
}

function isObviouslyNonProfileContext(platformKey: string, result: SerpOrganicResult) {
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

    const title = normalize(result.title || "");
    const snippet = normalize(result.snippet || "");
    const link = normalize(result.link || "");
    const fullText = textOf(result);

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

  let short = "";
  let detail = "";

  if (strength === 2) {
    short = "Likely your real profile";

    if (exactNameHit && usernameHit) {
      detail = `We found a strong match based on your exact name and username.${bestStrong ? ` Source: ${sourceHint(bestStrong)}` : ""}`;
    } else if (exactNameHit && cityHit) {
      detail = `We found a strong match based on your exact name and city.${bestStrong ? ` Source: ${sourceHint(bestStrong)}` : ""}`;
    } else if (exactNameHit && profileLikeUrlHit) {
      detail = `We found a strong match based on your exact name and a profile-like URL.${bestStrong ? ` Source: ${sourceHint(bestStrong)}` : ""}`;
    } else {
      detail = `We found multiple strong identity indicators for this platform.${bestStrong ? ` Source: ${sourceHint(bestStrong)}` : ""}`;
    }
  } else if (strength === 1) {
    short = "Possible match";

    if (exactNameHit && profileLikeUrlHit) {
      detail = `Some signals suggest this could be your profile, but it is not fully confirmed.${bestWeak ? ` Source: ${sourceHint(bestWeak)}` : ""}`;
    } else if (usernameHit) {
      detail = `A username-like signal was found, but the match is still uncertain.${bestWeak ? ` Source: ${sourceHint(bestWeak)}` : ""}`;
    } else {
      detail = `We found a weak profile-like match, but not enough to confirm it belongs to you.${bestWeak ? ` Source: ${sourceHint(bestWeak)}` : ""}`;
    }
  } else {
    short = "No reliable match";
    detail = "We did not find strong evidence that this platform is linked to you.";
  }

  return {
    label: platform.label,
    strength,
    riskWeight: platform.riskWeight,
    value: `${short} || ${detail}`,
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
      title: "Remove directory listings",
      description:
        "Directory and people-search sites are one of the clearest identity-theft risk indicators. Prioritize opt-out and removal there first.",
    });
  }

  if (usernameExposureCount > 0) {
    recommendations.push({
      title: "Stop reusing usernames",
      description:
        "Use different usernames across platforms to reduce cross-platform identity correlation.",
    });
  }

  if (platformSignalsStrong > 1) {
    recommendations.push({
      title: "Reduce cross-platform overlap",
      description:
        "Avoid repeating the same full name, location, profile details, and links across multiple platforms.",
    });
  }

  if (cityMentions > 0) {
    recommendations.push({
      title: "Hide location details",
      description:
        "Reduce searchable combinations of your full name and city or region when possible.",
    });
  }

  if (recommendations.length < 3 && visibilityScore > 0) {
    recommendations.push({
      title: "Audit public search results",
      description:
        "Review visible search results for old profiles, forgotten pages, and unnecessary identity details.",
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      title: "Monitor your exposure",
      description:
        "Repeat the scan regularly after creating new public accounts or changing profile information.",
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
  } = params;

  const tone =
    riskLevel === "High"
      ? "elevated"
      : riskLevel === "Medium"
      ? "moderate"
      : "currently limited";

  const exposureText =
    riskLevel === "High"
      ? "Your public footprint is easy to connect across sources."
      : riskLevel === "Medium"
      ? "Some parts of your identity can be connected across sources."
      : "Your public footprint does not currently show strong identity-theft exposure.";

  return `${fullName}'s identity-theft risk appears ${tone}. ${exposureText} We found ${platformSignalsStrong} strong platform match${platformSignalsStrong === 1 ? "" : "es"} and ${platformSignalsWeak} weaker platform signal${platformSignalsWeak === 1 ? "" : "s"}. Your name appears in about ${totalEstimatedResults.toLocaleString()} indexed results, but visibility alone is not treated as dangerous. The main risk comes from how easily your identity could be linked across platforms or reused.`;
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

    const directoryValue =
      directoryListingsCount > 0
        ? `${directoryListingsCount} directory signal${directoryListingsCount === 1 ? "" : "s"} detected`
        : "no directory signals detected";

    const usernameValue =
      usernameExposureCount > 0
        ? `${usernameExposureCount} username-linked result${usernameExposureCount === 1 ? "" : "s"} found`
        : username
        ? "no username-linked signals detected"
        : "not checked (no username provided)";

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings: [
        {
          label: "Identity theft risk core",
          value: `${riskScore}/100 risk score based mainly on correlation and misuse signals`,
        },
        {
          label: "Public visibility",
          value: `${totalEstimatedResults.toLocaleString()} indexed results estimated (${visibilityScore}/10 visibility weight)`,
        },
        {
          label: "Directory / people-search pages",
          value: directoryValue,
        },
        {
          label: "Username reuse exposure",
          value: usernameValue,
        },
        {
          label: "Exact identity matches",
          value: `${exactNameMatches} strong exact-name match${exactNameMatches === 1 ? "" : "es"} identified`,
        },
        ...perPlatformFindings.map((platform) => ({
          label: platform.label,
          value: platform.value,
        })),
      ],
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
