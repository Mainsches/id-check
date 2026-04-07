"use client";

import { ScanResponse } from "@/types/scan";

type ResultCardProps = {
  result: ScanResponse;
  onReset: () => void;
};

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const riskClass =
    result.riskLevel === "High"
      ? "risk-high"
      : result.riskLevel === "Medium"
      ? "risk-medium"
      : "risk-low";

  const scoreStyle = {
    ["--score-value" as string]: `${result.riskScore}%`,
  } as React.CSSProperties;

  return (
    <section className="result-shell fade-in">
      <div className="result-header">
        <div>
          <span className="eyebrow">Scan result</span>
          <h2>Your identity exposure overview</h2>
        </div>

        <button className="secondary-button" onClick={onReset}>
          New scan
        </button>
      </div>

      <div className={`score-panel ${riskClass}`}>
        <div className={`score-circle ${riskClass}`} style={scoreStyle}>
          <div className="score-circle-inner">
            <span className="score-number">{result.riskScore}</span>
            <span className="score-total">/100</span>
          </div>
        </div>

        <div className="score-meta">
          <p className={`risk-badge ${riskClass}`}>{result.riskLevel} Risk</p>
          <p className="score-copy">
            This score combines indexed search visibility, social profile
            signals, exact-name matches, username correlation, and directory-style
            exposure indicators.
          </p>

          <div className="score-bar-wrap">
            <div className="score-bar-track">
              <div
                className={`score-bar-fill ${riskClass}`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
            <span className="score-bar-label">{result.riskScore}% exposure score</span>
          </div>
        </div>
      </div>

      <div className="results-grid">
        <div className="panel">
          <h3>Findings</h3>
          <ul className="item-list">
            {result.findings.map((finding) => (
              <li key={finding.label} className="item-row">
                <span>{finding.label}</span>
                <strong>{finding.value}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>AI Summary</h3>
          <p className="summary-text">{result.aiSummary}</p>
        </div>
      </div>

      <div className="panel panel-full">
        <h3>Recommendations</h3>
        <div className="recommendation-grid">
          {result.recommendations.map((item) => (
            <article key={item.title} className="recommendation-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}