import { RecommendationItem, RiskLevel, ScanRequestBody, ScanResponse } from "@/types/scan";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function simpleHash(input: string) {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function seededRange(seed: number, min: number, max: number) {
  const span = max - min + 1;
  return min + (seed % span);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
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
      ? `A leaked email signal increases the likelihood of account targeting or credential reuse risk.`
      : `No email leak was flagged in this MVP simulation, which reduces one major risk factor.`;

  return `${fullName}'s digital footprint appears ${tone}. We found ${publicResultsCount} public web results, ${socialProfilesCount} likely social profile signals, and ${usernameExposureCount} username-linked exposure points. ${leakSentence} The strongest next step is to reduce discoverability across public profiles, usernames, and searchable contact details.`;
}

function buildRecommendations(params: {
  emailLeakCount: number;
  socialProfilesCount: number;
  usernameExposureCount: number;
  publicResultsCount: number;
}) {
  const { emailLeakCount, socialProfilesCount, usernameExposureCount, publicResultsCount } = params;

  const recommendations: RecommendationItem[] = [];

  if (emailLeakCount > 0) {
    recommendations.push({
      title: "Change exposed passwords",
      description:
        "If the scanned email is used anywhere important, update passwords immediately and avoid reusing the same password across services.",
    });

    recommendations.push({
      title: "Enable two-factor authentication",
      description:
        "Turn on 2FA for your email, social media, and any sensitive accounts to reduce takeover risk after a breach.",
    });
  }

  if (usernameExposureCount >= 2) {
    recommendations.push({
      title: "Use different usernames",
      description:
        "Avoid using the same username across multiple platforms. Reused handles make correlation and tracking easier.",
    });
  }

  if (socialProfilesCount >= 2) {
    recommendations.push({
      title: "Review public profile visibility",
      description:
        "Hide phone numbers, personal links, and unnecessary bio details from public social profiles where possible.",
    });
  }

  if (publicResultsCount >= 10) {
    recommendations.push({
      title: "Reduce searchable personal data",
      description:
        "Remove public mentions of your full name, city, employer, or contact details from websites and directories where possible.",
    });
  }

  if (recommendations.length < 4) {
    recommendations.push({
      title: "Separate public and private identities",
      description:
        "Use one identity for public-facing profiles and another for private communities, gaming, or secondary services.",
    });

    recommendations.push({
      title: "Audit old accounts",
      description:
        "Search for inactive profiles and remove or anonymize accounts you no longer use.",
    });
  }

  return recommendations.slice(0, 5);
}

export function runMockScan(input: ScanRequestBody): ScanResponse {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const city = input.city?.trim() || "";
  const username = input.username?.trim() || "";
  const email = input.email?.trim() || "";

  const fullName = `${firstName} ${lastName}`.trim();
  const seedSource = `${normalize(firstName)}|${normalize(lastName)}|${normalize(city)}|${normalize(username)}|${normalize(email)}`;
  const seed = simpleHash(seedSource);

  const publicResultsBase = seededRange(seed, 3, 18);
  const exactNameMatches = seededRange(seed >> 1, 1, 6);
  const socialProfilesCount = username
    ? seededRange(seed >> 2, 1, 4)
    : seededRange(seed >> 2, 0, 2);
  const usernameExposureCount = username
    ? seededRange(seed >> 3, 1, 5)
    : 0;

  let emailLeakCount = 0;
  if (email) {
    const suspiciousDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
    const domain = email.split("@")[1]?.toLowerCase() || "";
    const seededLeak = seededRange(seed >> 4, 0, 2);

    emailLeakCount = suspiciousDomains.includes(domain)
      ? seededLeak
      : seededLeak > 0
        ? 1
        : 0;
  }

  let score = 0;

  score += publicResultsBase * 2.2;
  score += exactNameMatches * 2.5;
  score += socialProfilesCount * 7;
  score += usernameExposureCount * 4;
  score += emailLeakCount * 22;

  if (city) {
    score += 6;
  }

  if (email) {
    score += 4;
  }

  const riskScore = Math.round(clamp(score, 8, 100));
  const riskLevel = getRiskLevel(riskScore);

  const findings = [
    {
      label: "Public web results",
      value: `${publicResultsBase} public search results found`,
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
  ];

  const aiSummary = buildSummary({
    fullName,
    riskLevel,
    publicResultsCount: publicResultsBase,
    socialProfilesCount,
    emailLeakCount,
    usernameExposureCount,
  });

  const recommendations = buildRecommendations({
    emailLeakCount,
    socialProfilesCount,
    usernameExposureCount,
    publicResultsCount: publicResultsBase,
  });

  return {
    riskScore,
    riskLevel,
    findings,
    aiSummary,
    recommendations,
    rawSignals: {
      publicResultsCount: publicResultsBase,
      socialProfilesCount,
      emailLeakCount,
      exactNameMatches,
      usernameExposureCount,
      cityProvided: Boolean(city),
      emailProvided: Boolean(email),
    },
  };
}