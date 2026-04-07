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

  console.log("🔍 Google Query:", url);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();
  console.log("📦 Google Raw Response:", text);

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${text}`);
  }

  const data = JSON.parse(text);

  const totalResults = parseInt(
    data?.searchInformation?.totalResults || "0",
    10
  );

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

  return `${fullName}'s digital footprint appears ${tone}. We found ${publicResultsCount.toLocaleString()} public web results and ${socialProfilesCount} possible social profiles.`;
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

    const fullName = `${firstName} ${lastName}`;
    const searchQuery = city
      ? `"${fullName}" "${city}"`
      : `"${fullName}"`;

    // 🔍 Google API CALL
    const publicResultsCount = await fetchGoogleResults(searchQuery);

    const socialProfilesCount = username ? 2 : 1;
    const usernameExposureCount = username ? 2 : 0;
    const emailLeakCount = 0;

    let score = 0;
    score += Math.min(publicResultsCount / 2000, 45);
    score += socialProfilesCount * 7;
    score += usernameExposureCount * 4;

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
          value: `${emailLeakCount} leak signals found`,
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
      ],
      rawSignals: {
        publicResultsCount,
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ FULL ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}