"use client";

import { useState } from "react";
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
        "Some public signals can be connected, but the current exposure is not extreme.",
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

  if (text.includes("not checked")) return "finding-muted";
  if (text.includes("no directory signals")) return "finding-cool";
  if (text.includes("no username-linked signals")) return "finding-cool";
  if (label === "Identity theft risk core") {
    const match = text.match(/^(\d+)/);
    const score = match ? Number(match[1]) : 0;
    if (score >= 70) return "finding-hot";
    if (score >= 40) return "finding-warm";
    return "finding-cool";
  }

  if (
    text.includes("directory") ||
    text.includes("people-search") ||
    text.includes("username")
  ) {
    return text.includes("0 ") || text.includes("no ")
      ? "finding-cool"
      : "finding-hot";
  }

  if (
    text.includes("exact") ||
    text.includes("identity") ||
    text.includes("visibility")
  ) {
    return "finding-warm";
  }

  if (text.includes("likely your real profile")) return "finding-hot";
  if (text.includes("possible match")) return "finding-warm";
  if (text.includes("no reliable match")) return "finding-muted";
  if (text.includes("not enough evidence")) return "finding-muted";

  return "finding-cool";
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

function splitPlatformText(value: string) {
  const parts = value.split("||").map((part) => part.trim());
  return {
    short: parts[0] || value,
    detail: parts[1] || "",
  };
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

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
                className={`signal-chip ${getFindingTone(
                  finding.label,
                  finding.value
                )}`}
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
              const tone = getFindingTone(finding.label, finding.value);
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
                <div className="platform-title-wrap">
                  <h4>Platform signals</h4>
                  <button
                    type="button"
                    className="info-icon"
                    onClick={() => setTooltipOpen((value) => !value)}
                    aria-label="Explain platform signals"
                  >
                    ?
                  </button>
                  {tooltipOpen && (
                    <div className="tooltip-panel">
                      Platform signals show how strongly your identity appears to be connected to public profiles on each platform.
                    </div>
                  )}
                </div>
                <span className="panel-mini-tag">Per platform</span>
              </div>

              <div className="platform-grid">
                {platformFindings.map((finding) => {
                  const tone = getFindingTone(finding.label, finding.value);
                  const { short, detail } = splitPlatformText(finding.value);

                  return (
                    <div
                      key={finding.label}
                      className={`platform-card item-row-accent ${tone}`}
                    >
                      <div className="platform-card-top">
                        <span className="platform-name">{finding.label}</span>
                        <span className={`platform-status ${tone}`}>{short}</span>
                      </div>
                      {detail ? (
                        <p className="platform-detail">{detail}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="panel panel-summary panel-compact panel-summary-v8">
          <div className="panel-header-row">
            <h3>AI Risk Summary</h3>
            <span className="panel-mini-tag">Interpretation</span>
          </div>

          <div className="summary-hero">
            <div className={`summary-pill ${riskClass}`}>{result.riskLevel} risk</div>
            <p className="summary-lead">
              {result.riskLevel === "High"
                ? "Your public identity appears easy to connect across multiple sources."
                : result.riskLevel === "Medium"
                ? "Some parts of your public identity can still be connected."
                : "Your public identity currently looks relatively well separated."}
            </p>
          </div>

          <div className="summary-body-card">
            <p className="summary-text summary-text-compact">{result.aiSummary}</p>
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
