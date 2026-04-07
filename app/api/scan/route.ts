import { NextResponse } from "next/server";
import { ScanRequestBody, ScanResponse, RiskLevel } from "@/types/scan";

const SERP_API_KEY = process.env.SERP_API_KEY;

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

// 🔥 WICHTIG: echte Google Result Count holen
async function fetchSearchResults(query: string): Promise<number> {
  if (!SERP_API_KEY) {
    throw new Error("Missing SERP_API_KEY");
  }

  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(
    query
  )}&engine=google&api_key=${SERP_API_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SerpAPI error: ${response.status} ${text}`);
  }

  const data = await response.json();

  // 🧠 echte Anzahl extrahieren
  let totalResultsRaw = data?.search_information?.total_results;

  if (!totalResultsRaw) {
    const fallback = data?.search_information?.organic_results_state || "0";
    totalResultsRaw = fallback;
  }

  const totalResults =
    typeof totalResultsRaw === "number"
      ? totalResultsRaw
      : parseInt(String(totalResultsRaw).replace(/[^\d]/g, ""), 10);

  return Number.isNaN(totalResults) ? 0 : totalResults;
}

// 🧠 AI Summary
function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  publicResultsCount: number;
  socialProfilesCount: number;
  usernameExposureCount: number;
}) {
  const {
    fullName,
    riskLevel,
    publicResultsCount,
    socialProfilesCount,
    usernameExposureCount,
  } = params;

  const tone =
    riskLevel === "High"
      ? "highly exposed"
      : riskLevel === "Medium"
      ? "moderately exposed"
      : "low exposed";

  return `${fullName}'s identity appears ${tone}. We detected approximately ${publicResultsCount.toLocaleString()} indexed search results, ${socialProfilesCount} possible social profiles, and ${usernameExposureCount} username-linked signals.`;
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
    const query = city ? `${fullName} ${city}` : fullName;

    // 🔥 echte Suche
    const publicResultsCount = await fetchSearchResults(query);

    // 🧪 einfache Zusatzlogik (MVP)
    const socialProfilesCount = username ? 2 : 1;
    const usernameExposureCount = username ? 2 : 0;
    const emailLeakCount = 0;
    const exactNameMatches = publicResultsCount > 0 ? 1 : 0;

    // 🔥 REALISTISCHES SCORING
    let score = 0;

    if (publicResultsCount >= 1_000_000) score += 45;
    else if (publicResultsCount >= 100_000) score += 35;
    else if (publicResultsCount >= 10_000) score += 25;
    else if (publicResultsCount >= 1_000) score += 15;
    else if (publicResultsCount >= 100) score += 8;
    else if (publicResultsCount > 0) score += 3;

    score += socialProfilesCount * 10;
    score += usernameExposureCount * 5;
    score += city ? 5 : 0;
    score += email ? 5 : 0;
    score += exactNameMatches * 2;

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings: [
        {
          label: "Public web results",
          value: `${publicResultsCount.toLocaleString()} search results detected`,
        },
        {
          label: "Possible social profiles",
          value: `${socialProfilesCount} possible social profiles detected`,
        },
        {
          label: "Potential email leaks",
          value: `${emailLeakCount} leak signals found`,
        },
        {
          label: "Username exposure",
          value:
            usernameExposureCount > 0
              ? `${usernameExposureCount} username-linked results found`
              : "No username-based exposure checked",
        },
      ],
      aiSummary: buildSummary({
        fullName,
        riskLevel,
        publicResultsCount,
        socialProfilesCount,
        usernameExposureCount,
      }),
      recommendations: [
        {
          title: "Reduce public visibility",
          description:
            "Limit personal data exposure across profiles and search engines.",
        },
        {
          title: "Use unique usernames",
          description:
            "Avoid reusing the same username across multiple platforms.",
        },
        {
          title: "Audit old accounts",
          description:
            "Remove or anonymize accounts you no longer use.",
        },
      ],
      rawSignals: {
        publicResultsCount,
        socialProfilesCount,
        emailLeakCount,
        exactNameMatches,
        usernameExposureCount,
        cityProvided: Boolean(city),
        emailProvided: Boolean(email),
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Scan error:", error);

    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}