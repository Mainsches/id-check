import type { FindingItem, ScanResponse } from "@/types/scan";

const PLATFORM_LABELS = new Set([
  "LinkedIn",
  "Instagram",
  "Facebook",
  "TikTok",
  "X / Twitter",
  "GitHub",
  "Reddit",
]);

export function isPlatformFindingLabel(label: string): boolean {
  return PLATFORM_LABELS.has(label);
}

/** Shown in the report: clear or likely public platform signal (API: strength ≥ 1). */
export function isMeaningfulPlatformFinding(finding: FindingItem): boolean {
  return finding.status === "danger" || finding.status === "warning";
}

export function getAllPlatformFindings(result: ScanResponse): FindingItem[] {
  return result.findings.filter((f) => isPlatformFindingLabel(f.label));
}

export function getMeaningfulPlatformFindings(result: ScanResponse): FindingItem[] {
  return getAllPlatformFindings(result).filter(isMeaningfulPlatformFinding);
}

/** How many platform rows exist in the payload but are not shown (neutral / no clear hit). */
export function getHiddenPlatformRowCount(result: ScanResponse): number {
  const rows = getAllPlatformFindings(result);
  const shown = rows.filter(isMeaningfulPlatformFinding).length;
  return Math.max(0, rows.length - shown);
}
