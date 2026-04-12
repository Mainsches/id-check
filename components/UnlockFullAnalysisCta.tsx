"use client";

import { useState } from "react";
import type { ScanResponse } from "@/types/scan";
import { getMeaningfulPlatformFindings } from "@/lib/platform-findings";

/** Subtle urgency line: what was found vs. what stays locked. */
export function unlockMissingValueHint(result: ScanResponse): string {
  const meaningfulPlatforms = getMeaningfulPlatformFindings(result).length;
  const profileN = result.rawSignals.socialProfilesCount;
  const strongHits = result.rawSignals.exactNameMatches;

  if (profileN >= 1 && meaningfulPlatforms >= 1) {
    return `Die Auswertung schlägt ${profileN} Profil-Hinweis${profileN === 1 ? "" : "e"} und ${meaningfulPlatforms} Plattform${
      meaningfulPlatforms === 1 ? "" : "en"
    } mit klarem Hinweis vor — die Einzelheiten sind noch eingeklappt.`;
  }
  if (meaningfulPlatforms >= 1) {
    return `${meaningfulPlatforms} Plattform${meaningfulPlatforms === 1 ? "" : "en"} mit klarem oder plausiblen Treffer — Profiltexte und Links sind noch eingeklappt.`;
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
  const [opening, setOpening] = useState(false);

  const handleUnlock = () => {
    if (opening) return;
    setOpening(true);
    onUnlock();
  };

  return (
    <section className="result-unlock-cta" aria-labelledby="result-unlock-heading">
      <div className="result-unlock-cta-inner">
        <p className="result-unlock-cta-eyebrow" aria-hidden>
          Tiefen-Scan
        </p>
        <h3 id="result-unlock-heading" className="result-unlock-cta-title">
          Gesamten Bericht freischalten
        </h3>
        <p className="result-unlock-cta-copy">
          Alle Details dieser Analyse sichtbar machen — Profile, Verknüpfungen und Risiko-Erklärungen im
          Vollbild.
        </p>
        <p className="result-unlock-cta-hint" role="status">
          {valueHint}
        </p>
        <button
          type="button"
          className={`result-unlock-cta-button${opening ? " result-unlock-cta-button--busy" : ""}`}
          onClick={handleUnlock}
          aria-busy={opening}
        >
          {opening ? "Premium wird geöffnet…" : "Alle Treffer jetzt anzeigen"}
        </button>
      </div>
    </section>
  );
}
