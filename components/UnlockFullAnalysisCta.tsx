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
    return `Die Auswertung schlägt ${profileN} Profil-Hinweis${profileN === 1 ? "" : "e"} und ${platformCount} Plattform${
      platformCount === 1 ? "" : "en"
    } vor — die Einzelheiten sind noch eingeklappt.`;
  }
  if (platformCount >= 1) {
    return `${platformCount} Plattform${platformCount === 1 ? "" : "en"} sind in der Auswertung relevant — Profiltexte und Links sind noch eingeklappt.`;
  }
  if (profileN >= 1) {
    return `${profileN} Profil-Hinweis${profileN === 1 ? "" : "e"} fällt auf — die genaue Einordnung ist noch eingeklappt.`;
  }
  if (strongHits === 1) {
    return "Ein Treffer wirkt besonders eindeutig — die Details dazu sind noch eingeklappt.";
  }
  if (strongHits >= 2) {
    return `${strongHits} Treffer wirken besonders eindeutig — die Details dazu sind noch eingeklappt.`;
  }
  return "Es gibt noch weiterführende Einzelheiten in dieser Auswertung — die sind aktuell eingeklappt.";
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
