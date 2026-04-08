"use client";

import { ScanResponse } from "@/types/scan";

type ResultCardProps = {
  result: ScanResponse;
  onReset: () => void;
};

function getRiskMeta(riskLevel: ScanResponse["riskLevel"], riskScore: number) {
  if (riskLevel === "High") {
    return {
      title: "High identity risk",
      subtitle:
        "Multiple signals suggest that your identity can be correlated or misused more easily.",
      accent: "risk-high",
      mood: "Critical",
    };
  }

  if (riskLevel === "Medium") {
    return {
      title: "Moderate identity risk",
      subtitle:
        "Some public signals can be connected, but the exposure is not extreme yet.",
      accent: "risk-medium",
      mood: "Watch closely",
    };
  }

  return {
    title: "Low identity risk",
    subtitle:
      "Only limited identity-theft signals were found from the currently visible data.",
    accent: "risk-low",
    mood: riskScore <= 15 ? "Low concern" : "Relatively safe",
  };
}

function getFindingTone(label: string, value: string) {
  const text = `${label} ${value}`.toLowerCase();

  if (
    text.includes("directory") ||
    text.includes("people-search") ||
    text.includes("username-linked") ||
    text.includes("username reuse")
  ) {
    return "finding-hot";
  }

  if (
    text.includes("social") ||
    text.includes("exact") ||
    text.includes("identity")
  ) {
    return "finding-warm";
  }

  return "finding-cool";
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const riskClass =
    result.riskLevel === "High"
      ? "risk-high"
      : result.riskLevel === "Medium"
      ? "risk-medium"
      : "risk-low";

  const riskMeta = getRiskMeta(result.riskLevel, result.riskScore);

  const scoreStyle = {
    ["--score-value" as string]: `${result.riskScore}%`,
  } as React.CSSProperties;

  const topFindings = result.findings.slice(0, 3);

  return (
    <section className={`result-shell fade-in ${riskClass}`}>
      <div className="result-orb result-orb-one" />
      <div className="result-orb result-orb-two" />

      <div className="result-header">
        <div>
          <span className="eyebrow">Scan result</span>
          <h2>Your identity risk overview</h2>
        </div>

        <button className="secondary-button" onClick={onReset}>
          New scan
        </button>
      </div>

      <div className={`score-panel score-panel-v2 ${riskClass}`}>
        <div className={`score-circle ${riskClass}`} style={scoreStyle}>
          <div className="score-circle-inner">
            <span className="score-number">{result.riskScore}</span>
            <span className="score-total">/100</span>
          </div>
        </div>

        <div className="score-meta">
          <div className="score-meta-top">
            <p className={`risk-badge ${riskClass}`}>{result.riskLevel} Risk</p>
            <span className={`signal-chip signal-chip-main ${riskClass}`}>
              {riskMeta.mood}
            </span>
          </div>

          <h3 className="score-headline">{riskMeta.title}</h3>
          <p className="score-copy">{riskMeta.subtitle}</p>

          <div className="signal-chip-row">
            {topFindings.map((finding) => (
              <span
                key={finding.label}
                className={`signal-chip ${getFindingTone(
                  finding.label,
                  finding.value
                )}`}
              >
                {finding.label}
              </span>
            ))}
          </div>

          <div className="score-bar-wrap">
            <div className="score-bar-track">
              <div
                className={`score-bar-fill ${riskClass}`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>

            <div className="score-bar-meta">
              <span className="score-bar-label">
                {result.riskScore}% identity risk
              </span>
              <span className="score-bar-label score-bar-label-soft">
                based on visibility, correlation, and misuse signals
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="results-grid">
        <div className="panel panel-findings">
          <div className="panel-header-row">
            <h3>Findings</h3>
            <span className="panel-mini-tag">Live breakdown</span>
          </div>

          <ul className="item-list">
            {result.findings.map((finding) => (
              <li key={finding.label} className="item-row item-row-card">
                <div className="item-row-top">
                  <span>{finding.label}</span>
                  <span
                    className={`finding-dot ${getFindingTone(
                      finding.label,
                      finding.value
                    )}`}
                  />
                </div>
                <strong>{finding.value}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel panel-summary">
          <div className="panel-header-row">
            <h3>AI Risk Summary</h3>
            <span className="panel-mini-tag">Interpretation</span>
          </div>

          <p className="summary-text">{result.aiSummary}</p>
        </div>
      </div>

      <div className="panel panel-full panel-recommendations">
        <div className="panel-header-row">
          <h3>Recommendations</h3>
          <span className="panel-mini-tag">Actionable next steps</span>
        </div>

        <div className="recommendation-grid">
          {result.recommendations.map((item, index) => (
            <article key={item.title} className="recommendation-card">
              <div className="recommendation-index">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="recommendation-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}