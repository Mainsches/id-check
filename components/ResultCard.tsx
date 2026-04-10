"use client";

import { useMemo, useState } from "react";
import { ScanResponse, FindingItem } from "@/types/scan";

type ResultCardProps = {
  result: ScanResponse;
  onReset: () => void;
};

function getRiskMeta(riskLevel: ScanResponse["riskLevel"], riskScore: number) {
  if (riskLevel === "High") {
    return {
      title: "High identity risk",
      subtitle:
        "Multiple signals suggest that your identity can be connected or misused more easily.",
      mood: "Critical",
      summaryBadge: "HIGH RISK",
    };
  }

  if (riskLevel === "Medium") {
    return {
      title: "Moderate identity risk",
      subtitle:
        "Some public details can still be linked together across multiple sources.",
      mood: "Needs attention",
      summaryBadge: "MEDIUM RISK",
    };
  }

  return {
    title: "Low identity risk",
    subtitle:
      "Only limited identity-theft signals were found from the currently visible data.",
    mood: riskScore <= 15 ? "Low concern" : "Relatively safe",
    summaryBadge: "LOW RISK",
  };
}

function getFindingTone(finding: FindingItem) {
  if (finding.status === "danger") return "finding-danger";
  if (finding.status === "warning") return "finding-warning";
  if (finding.status === "good") return "finding-good";
  return "finding-neutral";
}

function formatFindingShort(label: string) {
  const map: Record<string, string> = {
    "Identity theft risk core": "Risk core",
    "Public visibility": "Visibility",
    "Directory / people-search pages": "Directory",
    "Username reuse exposure": "Username",
    "Exact identity matches": "Identity match",
    LinkedIn: "LinkedIn",
    Instagram: "Instagram",
    Facebook: "Facebook",
    TikTok: "TikTok",
    "X / Twitter": "X",
    GitHub: "GitHub",
    Reddit: "Reddit",
  };

  return map[label] || label;
}

function isPlatformFinding(label: string) {
  return [
    "LinkedIn",
    "Instagram",
    "Facebook",
    "TikTok",
    "X / Twitter",
    "GitHub",
    "Reddit",
  ].includes(label);
}

function platformBadgeText(finding: FindingItem) {
  if (finding.status === "danger") return "Very likely your profile";
  if (finding.status === "warning") return "Possible match";
  return "No relevant profile";
}

function badgeTone(finding: FindingItem) {
  if (finding.status === "danger") return "platform-badge-danger";
  if (finding.status === "warning") return "platform-badge-warning";
  return "platform-badge-neutral";
}

function renderSummaryBlocks(aiSummary: string) {
  const parts = aiSummary
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const headline = parts[0] || "";
  const support = parts.slice(1);

  return { headline, support };
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [showPlatformInfo, setShowPlatformInfo] = useState(false);

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

  const topChips = result.findings.slice(0, 5);

  const coreFindings = result.findings.filter((item) => !isPlatformFinding(item.label));
  const platformFindings = result.findings.filter((item) => isPlatformFinding(item.label));

  const summaryBlocks = useMemo(
    () => renderSummaryBlocks(result.aiSummary),
    [result.aiSummary]
  );

  return (
    <section className={`result-shell result-shell-vnext fade-in ${riskClass}`}>
      <div className="result-orb result-orb-one" />
      <div className="result-orb result-orb-two" />

      <div className="result-header result-header-vnext">
        <div>
          <span className="eyebrow">Scan result</span>
          <h2>Your identity risk overview</h2>
        </div>

        <button className="secondary-button" onClick={onReset}>
          New scan
        </button>
      </div>

      <div className={`score-panel score-panel-vnext ${riskClass}`}>
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
            {topChips.map((finding) => (
              <span
                key={finding.label}
                className={`signal-chip ${getFindingTone(finding)}`}
              >
                {formatFindingShort(finding.label)}
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

      <div className="dashboard-grid">
        <div className="panel panel-findings panel-compact">
          <div className="panel-header-row">
            <h3>Findings</h3>
            <span className="panel-mini-tag">Live breakdown</span>
          </div>

          <div className="findings-block">
            {coreFindings.map((finding) => {
              const tone = getFindingTone(finding);
              return (
                <div
                  key={finding.label}
                  className={`item-row item-row-card item-row-tight item-row-accent ${tone}`}
                >
                  <div className="item-row-top">
                    <span>{finding.label}</span>
                  </div>
                  <strong>{finding.value}</strong>
                </div>
              );
            })}
          </div>

          {platformFindings.length > 0 && (
            <div className="platform-section">
              <div className="platform-section-head">
                <div className="platform-heading-wrap">
                  <h4>Platform signals</h4>
                  <button
                    type="button"
                    className="info-trigger"
                    onClick={() => setShowPlatformInfo((prev) => !prev)}
                    aria-label="Explain platform signals"
                    aria-expanded={showPlatformInfo}
                  >
                    ?
                  </button>
                </div>

                <span className="panel-mini-tag">Per platform</span>
              </div>

              {showPlatformInfo && (
                <div className="info-bubble">
                  Platform signals estimate whether a public profile on a platform
                  is likely linked to the searched identity. We look for name,
                  city, username, and profile-style URL patterns.
                </div>
              )}

              <div className="platform-grid">
                {platformFindings.map((finding) => {
                  const tone = getFindingTone(finding);

                  return (
                    <div
                      key={finding.label}
                      className={`platform-card item-row-accent ${tone}`}
                    >
                      <div className="platform-card-top">
                        <span className="platform-name">{finding.label}</span>
                        <span className={`platform-badge ${badgeTone(finding)}`}>
                          {platformBadgeText(finding)}
                        </span>
                      </div>

                      {finding.url ? (
                        <a
                          href={finding.url}
                          target="_blank"
                          rel="noreferrer"
                          className="platform-link"
                        >
                          Open matched result
                        </a>
                      ) : (
                        <span className="platform-link platform-link-muted">
                          No public result link
                        </span>
                      )}

                      {finding.detail && (
                        <p className="platform-detail">{finding.detail}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="panel panel-summary panel-compact">
          <div className="panel-header-row">
            <h3>AI Risk Summary</h3>
            <span className="panel-mini-tag">Interpretation</span>
          </div>

          <div className="summary-v9">
            <div className={`summary-badge ${riskClass}`}>
              {riskMeta.summaryBadge}
            </div>

            {summaryBlocks.headline && (
              <h4 className="summary-headline">{summaryBlocks.headline}</h4>
            )}

            <div className="summary-body-card">
              {summaryBlocks.support.length > 0 ? (
                summaryBlocks.support.map((paragraph, index) => (
                  <p key={index} className="summary-text summary-text-compact">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="summary-text summary-text-compact">{result.aiSummary}</p>
              )}
            </div>
          </div>
        </div>

        <div className="panel panel-recommendations panel-compact">
          <div className="panel-header-row">
            <h3>Recommendations</h3>
            <span className="panel-mini-tag">Actionable next steps</span>
          </div>

          <div className="recommendation-grid recommendation-grid-compact">
            {result.recommendations.map((item, index) => (
              <article
                key={item.title}
                className="recommendation-card recommendation-card-compact"
              >
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
      </div>
    </section>
  );
}