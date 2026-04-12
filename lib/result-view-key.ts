import type { ScanResponse } from "@/types/scan";

/**
 * Stable client-side key for “this exact result view” — used to tie unlock state to one scan payload.
 */
export function getResultViewKey(result: ScanResponse): string {
  const findingSig = result.findings
    .map((f) => `${f.label}:${f.value}`)
    .join("|")
    .slice(0, 800);
  return [
    result.riskScore,
    result.riskLevel,
    result.findings.length,
    result.aiSummary.length,
    result.rawSignals.publicResultsCount,
    findingSig,
  ].join("::");
}
