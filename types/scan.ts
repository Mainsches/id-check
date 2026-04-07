export type ScanRequestBody = {
  firstName: string;
  lastName: string;
  city?: string;
  username?: string;
  email?: string;
};

export type FindingItem = {
  label: string;
  value: string;
};

export type RecommendationItem = {
  title: string;
  description: string;
};

export type RiskLevel = "Low" | "Medium" | "High";

export type ScanResponse = {
  riskScore: number;
  riskLevel: RiskLevel;
  findings: FindingItem[];
  aiSummary: string;
  recommendations: RecommendationItem[];
  rawSignals: {
    publicResultsCount: number;
    socialProfilesCount: number;
    emailLeakCount: number;
    exactNameMatches: number;
    usernameExposureCount: number;
    cityProvided: boolean;
    emailProvided: boolean;
  };
};