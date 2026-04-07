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

  const data = await response.json();

  // Anzahl organischer Ergebnisse (Top Results)
  const resultsCount = data?.organic_results?.length || 0;

  return resultsCount;
}

function buildSummary(params: {
  fullName: string;
  riskLevel: RiskLevel;
  publicResultsCount: number;
  socialProfilesCount: number;
  emailLeakCount: number;
  usernameExposureCount: number;
}) {
  const {
    fullName,
    riskLevel,
    publicResultsCount,
    socialProfilesCount,
    emailLeakCount,
    usernameExposureCount,
  } = params;

  const tone =
    riskLevel === "High"
      ? "highly exposed"
      : riskLevel === "Medium"
      ? "moderately exposed"
      : "low exposed";

  return `${fullName}'s identity appears ${tone}. We detected ${publicResultsCount} indexed search results, ${socialProfilesCount} possible social profiles, and ${usernameExposureCount} username-linked signals.`;
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

    // 🔍 SerpAPI Suche
    const publicResultsCount = await fetchSearchResults(query);

    // einfache Logik (MVP)
    const socialProfilesCount = username ? 2 : 1;
    const usernameExposureCount = username ? 2 : 0;
    const emailLeakCount = 0;
    const exactNameMatches = publicResultsCount > 0 ? 1 : 0;

    // 🧠 Risk Score
    let score = 0;
    score += publicResultsCount * 5;
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
          value: `${publicResultsCount} search results detected`,
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
        emailLeakCount,
        usernameExposureCount,
      }),
      recommendations: [
        {
          title: "Reduce public visibility",
          description:
            "Limit personal data exposure across profiles and search results.",
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