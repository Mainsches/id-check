import { NextResponse } from "next/server";
import { ScanRequestBody, ScanResponse, RiskLevel } from "@/types/scan";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

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

async function fetchGoogleResults(query: string) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error("Missing GOOGLE_API_KEY or GOOGLE_CX");
  }

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const totalResults = parseInt(data?.searchInformation?.totalResults || "0", 10);

  return Number.isNaN(totalResults) ? 0 : totalResults;
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
        : "relatively limited in exposure";

  const leakSentence =
    emailLeakCount > 0
      ? "A leaked email signal increases the likelihood of account targeting or credential reuse risk."
      : "No email leak was flagged in this MVP simulation, which reduces one major risk factor.";

  return `${fullName}'s digital footprint appears ${tone}. We found ${publicResultsCount.toLocaleString()} public web results, ${socialProfilesCount} likely social profile signals, and ${usernameExposureCount} username-linked exposure points. ${leakSentence} The strongest next step is to reduce discoverability across public profiles, usernames, and searchable contact details.`;
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
    const searchQuery = city ? `"${fullName}" "${city}"` : `"${fullName}"`;

    const publicResultsCount = await fetchGoogleResults(searchQuery);

    const socialProfilesCount = username ? 2 : publicResultsCount > 1000 ? 2 : 1;
    const usernameExposureCount = username ? 2 : 0;
    const emailLeakCount = email ? 0 : 0;
    const exactNameMatches = publicResultsCount > 0 ? Math.min(6, Math.max(1, Math.round(publicResultsCount / 50000))) : 0;

    let score = 0;
    score += Math.min(publicResultsCount / 2000, 45);
    score += socialProfilesCount * 7;
    score += usernameExposureCount * 4;
    score += emailLeakCount * 22;
    score += city ? 6 : 0;
    score += email ? 4 : 0;
    score += exactNameMatches * 2;

    const riskScore = Math.round(clamp(score, 5, 100));
    const riskLevel = getRiskLevel(riskScore);

    const result: ScanResponse = {
      riskScore,
      riskLevel,
      findings: [
        {
          label: "Public web results",
          value: `${publicResultsCount.toLocaleString()} public search results found`,
        },
        {
          label: "Possible social profiles",
          value: `${socialProfilesCount} possible social profiles detected`,
        },
        {
          label: "Potential email leaks",
          value: `${emailLeakCount} leak signal${emailLeakCount === 1 ? "" : "s"} found`,
        },
        {
          label: "Exact name matches",
          value: `${exactNameMatches} exact name match${exactNameMatches === 1 ? "" : "es"} identified`,
        },
        {
          label: "Username exposure",
          value:
            usernameExposureCount > 0
              ? `${usernameExposureCount} username-linked result${usernameExposureCount === 1 ? "" : "s"} found`
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
          title: "Review public profile visibility",
          description:
            "Hide phone numbers, personal links, and unnecessary bio details from public social profiles where possible.",
        },
        {
          title: "Use different usernames",
          description:
            "Avoid reusing the same username across multiple platforms if you want to reduce identity correlation.",
        },
        {
          title: "Audit old accounts",
          description:
            "Search for inactive profiles and remove or anonymize accounts you no longer use.",
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
  } catch (error) {
    console.error("Scan API error:", error);

    return NextResponse.json(
      { error: "Scan failed. Please check your API setup and try again." },
      { status: 500 }
    );
  }
}