"use client";

import type { ScanResponse } from "@/types/scan";

const PLATFORM_LABELS = new Set([
  "LinkedIn",
  "Instagram",
  "Facebook",
  "TikTok",
  "X / Twitter",
  "GitHub",
  "Reddit",
]);

function isPlatformFinding(label: string) {
  return PLATFORM_LABELS.has(label);
}

/** Subtle urgency line: what was found vs. what stays locked. */
export function unlockMissingValueHint(result: ScanResponse): string {
  const platformCount = result.findings.filter((f) => isPlatformFinding(f.label)).length;
  const profileN = result.rawSignals.socialProfilesCount;
  const strongHits = result.rawSignals.exactNameMatches;

  if (profileN >= 1 && platformCount >= 1) {
    return `${profileN} Profil${profileN === 1 ? "" : "e"} und ${platformCount} Verknüpfung${
      platformCount === 1 ? "" : "en"
    } erkannt — Details gesperrt.`;
  }
  if (platformCount >= 1) {
    return `${platformCount} Plattform-Signal${platformCount === 1 ? "" : "e"} erkannt — Details aktuell gesperrt.`;
  }
  if (profileN >= 1) {
    return `${profileN} Profil${profileN === 1 ? "" : "e"} erkannt — Details aktuell gesperrt.`;
  }
  if (strongHits === 1) {
    return "1 starker Treffer erkannt — Details aktuell gesperrt.";
  }
  if (strongHits >= 2) {
    return `${strongHits} starke Treffer erkannt — Details aktuell gesperrt.`;
  }
  return "Mehrere Treffer in dieser Auswertung erkannt — Details aktuell gesperrt.";
}

type UnlockFullAnalysisCtaProps = {
  result: ScanResponse;
  onUnlock: () => void;
};

export default function UnlockFullAnalysisCta({ result, onUnlock }: UnlockFullAnalysisCtaProps) {
  const valueHint = unlockMissingValueHint(result);

  return (
    <section className="result-unlock-cta" aria-labelledby="result-unlock-heading">
      <div className="result-unlock-cta-inner">
        <p className="result-unlock-cta-eyebrow" aria-hidden>
          AI Deep
        </p>
        <h3 id="result-unlock-heading" className="result-unlock-cta-title">
          AI Deep Analyse freischalten
        </h3>
        <p className="result-unlock-cta-copy">
          Alle Details dieser Analyse sichtbar machen — Profile, Verknüpfungen und Risiko-Erklärungen im
          Vollbild.
        </p>
        <p className="result-unlock-cta-hint" role="status">
          {valueHint}
        </p>
        <button type="button" className="result-unlock-cta-button" onClick={onUnlock}>
          Alle Treffer jetzt anzeigen
        </button>
      </div>
    </section>
  );
}
