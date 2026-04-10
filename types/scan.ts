export type RiskLevel = "Low" | "Medium" | "High";

export type FindingStatus = "good" | "warning" | "danger" | "neutral";

export type RecommendationItem = {
  title: string;
  description: string;
};

export type FindingItem = {
  label: string;
  value: string;
  detail?: string;
  url?: string;
  status?: FindingStatus;
};

export type ScanRequestBody = {
  firstName: string;
  lastName: string;
  city?: string;
  username?: string;
  email?: string;
};

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