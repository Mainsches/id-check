"use client";

type UnlockFullAnalysisCtaProps = {
  onUnlock: () => void;
};

export default function UnlockFullAnalysisCta({ onUnlock }: UnlockFullAnalysisCtaProps) {
  return (
    <section className="result-unlock-cta" aria-labelledby="result-unlock-heading">
      <div className="result-unlock-cta-inner">
        <p className="result-unlock-cta-eyebrow" aria-hidden>
          Premium
        </p>
        <h3 id="result-unlock-heading" className="result-unlock-cta-title">
          Vollständige Analyse freischalten
        </h3>
        <p className="result-unlock-cta-copy">
          Sieh alle gefundenen Profile, Verknüpfungen und Risiko-Erklärungen im Detail.
        </p>
        <button type="button" className="result-unlock-cta-button" onClick={onUnlock}>
          Jetzt vollständigen Scan freischalten (CHF 4.90)
        </button>
      </div>
    </section>
  );
}
