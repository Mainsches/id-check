"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveScanSnapshotForPremium } from "@/lib/premium-client-storage";
import { PREMIUM_INTENT, PREMIUM_INTENT_QUERY } from "@/lib/premium-intent";
import { ScanResponse, FindingItem } from "@/types/scan";
import { getResultViewKey } from "@/lib/result-view-key";
import LockedFadeContent from "@/components/LockedFadeContent";
import LockedSensitiveBlock from "@/components/LockedSensitiveBlock";
import UnlockFullAnalysisCta from "@/components/UnlockFullAnalysisCta";

type ResultCardProps = {
  result: ScanResponse;
  onReset: () => void;
  /** Full detail (post-unlock). When false, sensitive sections show as teaser. */
  detailUnlocked: boolean;
};

function getRiskMeta(riskLevel: ScanResponse["riskLevel"], riskScore: number) {
  if (riskLevel === "High") {
    return {
      title: "Hohes Identitätsrisiko",
      subtitle:
        "Mehrere Signale deuten darauf hin, dass deine Identität öffentlich leichter erkannt und missbraucht werden könnte.",
      mood: "Kritisch",
      summaryBadge: "HOHES RISIKO",
    };
  }

  if (riskLevel === "Medium") {
    return {
      title: "Mittleres Identitätsrisiko",
      subtitle:
        "Einige öffentliche Informationen lassen sich bereits miteinander verbinden und über mehrere Quellen hinweg zuordnen.",
      mood: "Beobachten",
      summaryBadge: "MITTLERES RISIKO",
    };
  }

  return {
    title: "Niedriges Identitätsrisiko",
    subtitle:
      "Es wurden aktuell nur begrenzte öffentliche Hinweise gefunden, die auf ein erhöhtes Risiko hindeuten.",
    mood: riskScore <= 15 ? "Niedrige Auffälligkeit" : "Relativ sicher",
    summaryBadge: "NIEDRIGES RISIKO",
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
    "Identity theft risk core": "Risiko-Kern",
    "Public visibility": "Sichtbarkeit",
    "Directory / people-search pages": "Verzeichnisse",
    "Username reuse exposure": "Benutzername",
    "Exact identity matches": "Namens-Treffer",
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

function translateFindingLabel(label: string) {
  const map: Record<string, string> = {
    "Identity theft risk core": "Kernrisiko",
    "Public visibility": "Öffentliche Sichtbarkeit",
    "Directory / people-search pages": "Verzeichnis- / Personensuchseiten",
    "Username reuse exposure": "Wiederverwendung von Benutzernamen",
    "Exact identity matches": "Exakte Identitätstreffer",
    LinkedIn: "LinkedIn",
    Instagram: "Instagram",
    Facebook: "Facebook",
    TikTok: "TikTok",
    "X / Twitter": "X / Twitter",
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
  if (finding.status === "danger") return "Starker Treffer";
  if (finding.status === "warning") return "Möglicher Treffer";
  return "Kein relevanter Treffer";
}

function platformBadgeTeaser(finding: FindingItem, teaserMode: boolean) {
  if (!teaserMode) return platformBadgeText(finding);
  if (finding.status === "danger" || finding.status === "warning") return "Treffer erkannt";
  return platformBadgeText(finding);
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

export default function ResultCard({ result, onReset, detailUnlocked }: ResultCardProps) {
  const router = useRouter();
  const [showPlatformInfo, setShowPlatformInfo] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(detailUnlocked);
  const [unlockReveal, setUnlockReveal] = useState(false);
  const prevDetailUnlocked = useRef<boolean | null>(null);
  const lastResultKey = useRef<string | null>(null);

  const resultViewKey = useMemo(() => getResultViewKey(result), [result]);

  useEffect(() => {
    setIsPremiumUnlocked(detailUnlocked);
  }, [detailUnlocked, resultViewKey]);

  useEffect(() => {
    if (lastResultKey.current !== resultViewKey) {
      lastResultKey.current = resultViewKey;
      prevDetailUnlocked.current = null;
    }

    if (prevDetailUnlocked.current === null) {
      prevDetailUnlocked.current = detailUnlocked;
      return;
    }
    if (detailUnlocked && !prevDetailUnlocked.current) {
      setUnlockReveal(true);
      const id = window.setTimeout(() => setUnlockReveal(false), 1000);
      prevDetailUnlocked.current = detailUnlocked;
      return () => window.clearTimeout(id);
    }
    prevDetailUnlocked.current = detailUnlocked;
  }, [detailUnlocked, resultViewKey]);

  const goPremium = () => {
    saveScanSnapshotForPremium(result);
    router.push(`/premium?${PREMIUM_INTENT_QUERY}=${PREMIUM_INTENT.UNLOCK_EXISTING_RESULT}`);
  };

  const riskClass =
    result.riskLevel === "High"
      ? "risk-high"
      : result.riskLevel === "Medium"
        ? "risk-medium"
        : "risk-low";

  const riskMeta = getRiskMeta(result.riskLevel, result.riskScore);

  const scoreStyle = {
    ["--score-value" as string]: `${result.riskScore}%`,
  } as CSSProperties;

  const topChips = result.findings.slice(0, 5);
  const coreFindings = result.findings.filter((item) => !isPlatformFinding(item.label));
  const platformFindings = result.findings.filter((item) => isPlatformFinding(item.label));

  const summaryBlocks = useMemo(
    () => renderSummaryBlocks(result.aiSummary),
    [result.aiSummary]
  );

  const teaserMode = !isPremiumUnlocked;

  return (
    <section className={`result-shell result-shell-vnext fade-in ${riskClass}`}>
      <div className="result-orb result-orb-one" />
      <div className="result-orb result-orb-two" />

      <div className="result-header result-header-vnext">
        <div>
          <span className="eyebrow">Scan-Ergebnis</span>
          <h2>Dein Identitätsrisiko im Überblick</h2>
        </div>

        <button className="secondary-button secondary-button-gold" onClick={onReset}>
          Neuer Scan
        </button>
      </div>

      <div className={`score-panel score-panel-vnext score-panel-premium ${riskClass}`}>
        <div className={`score-circle score-circle-premium ${riskClass}`} style={scoreStyle}>
          <div className="score-circle-inner">
            <span className="score-number">{result.riskScore}</span>
            <span className="score-total">/100</span>
          </div>
        </div>

        <div className="score-meta">
          <div className="score-meta-top">
            <p className={`risk-badge risk-badge-premium ${riskClass}`}>
              {result.riskLevel === "High"
                ? "Hohes Risiko"
                : result.riskLevel === "Medium"
                  ? "Mittleres Risiko"
                  : "Niedriges Risiko"}
            </p>

            <span className={`signal-chip signal-chip-main signal-chip-premium ${riskClass}`}>
              {riskMeta.mood}
            </span>
          </div>

          <h3 className="score-headline">{riskMeta.title}</h3>
          <p className="score-copy">{riskMeta.subtitle}</p>

          <div className="signal-chip-row">
            {topChips.map((finding) => (
              <span
                key={finding.label}
                className={`signal-chip signal-chip-soft ${getFindingTone(finding)}`}
              >
                {formatFindingShort(finding.label)}
              </span>
            ))}
          </div>

          <div className="score-bar-wrap">
            <div className="score-bar-track score-bar-track-premium">
              <div
                className={`score-bar-fill score-bar-fill-premium ${riskClass}`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>

            <div className="score-bar-meta">
              <span className="score-bar-label">{result.riskScore}% Identitätsrisiko</span>
              <span className="score-bar-label score-bar-label-soft">
                basierend auf Sichtbarkeit, Verknüpfbarkeit und Missbrauchssignalen
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="result-gated">
        <div
          className={`result-gated-inner ${unlockReveal ? "result-gated-inner--unlock-reveal" : ""}`}
        >
          <div className="dashboard-grid">
            <div className="panel panel-findings panel-compact panel-premium">
              <div className="panel-header-row">
                <h3>Erkenntnisse</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Live-Auswertung</span>
              </div>

              <div className="findings-block">
                {coreFindings.map((finding, index) => {
                  const tone = getFindingTone(finding);
                  const maskDeep = teaserMode && index > 0;

                  return (
                    <div
                      key={finding.label}
                      className={`item-row item-row-card item-row-tight item-row-accent item-row-premium ${tone}`}
                    >
                      <div className="item-row-top">
                        <span>{translateFindingLabel(finding.label)}</span>
                      </div>
                      <strong className={maskDeep ? "locked-core-value" : undefined}>
                        {finding.value}
                      </strong>
                    </div>
                  );
                })}
              </div>

              {platformFindings.length > 0 && (
                <div className="platform-section">
                  <div className="platform-section-head">
                    <div className="platform-heading-wrap">
                      <h4>Plattform-Signale</h4>
                      <button
                        type="button"
                        className="info-trigger info-trigger-gold"
                        onClick={() => setShowPlatformInfo((prev) => !prev)}
                        aria-label="Plattform-Signale erklären"
                        aria-expanded={showPlatformInfo}
                      >
                        ?
                      </button>
                    </div>

                    <span className="panel-mini-tag panel-mini-tag-gold">Pro Plattform</span>
                  </div>

                  {showPlatformInfo && (
                    <div className="info-bubble info-bubble-gold">
                      Plattform-Signale zeigen, wie stark öffentlich auffindbare Profile mit der
                      gesuchten Identität zusammenhängen könnten. Berücksichtigt werden Name, Stadt,
                      Benutzername und typische Profil-URLs.
                    </div>
                  )}

                  <div className="platform-grid">
                    {platformFindings.map((finding) => {
                      const tone = getFindingTone(finding);

                      return (
                        <div
                          key={finding.label}
                          className={`platform-card platform-card-premium item-row-accent ${tone} ${
                            teaserMode ? "platform-card--teaser" : ""
                          }`}
                        >
                          <div className="platform-card-top">
                            <span className="platform-name">
                              {translateFindingLabel(finding.label)}
                            </span>
                            <span className={`platform-badge ${badgeTone(finding)}`}>
                              {platformBadgeTeaser(finding, teaserMode)}
                            </span>
                          </div>

                          <LockedSensitiveBlock locked={teaserMode} onUnlock={goPremium}>
                            {finding.url ? (
                              <a
                                href={finding.url}
                                target="_blank"
                                rel="noreferrer"
                                className="platform-link"
                              >
                                Öffentlichen Treffer öffnen
                              </a>
                            ) : (
                              <span className="platform-link platform-link-muted">
                                Kein öffentlicher Link verfügbar
                              </span>
                            )}

                            {finding.detail ? (
                              <p className="platform-detail">{finding.detail}</p>
                            ) : null}
                          </LockedSensitiveBlock>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="panel panel-summary panel-compact panel-premium">
              <div className="panel-header-row">
                <h3>KI-Risikoeinschätzung</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Interpretation</span>
              </div>

              <div className="summary-v9">
                <div className={`summary-badge summary-badge-premium ${riskClass}`}>
                  {riskMeta.summaryBadge}
                </div>

                {summaryBlocks.headline && (
                  <h4 className="summary-headline">{summaryBlocks.headline}</h4>
                )}

                <div className="summary-body-card summary-body-card-premium">
                  {summaryBlocks.support.length > 0 ? (
                    <>
                      <p className="summary-text summary-text-compact">{summaryBlocks.support[0]}</p>
                      {summaryBlocks.support.length > 1 ? (
                        <LockedFadeContent locked={teaserMode} maxLines={6}>
                          {summaryBlocks.support.slice(1).map((paragraph, index) => (
                            <p key={index + 1} className="summary-text summary-text-compact">
                              {paragraph}
                            </p>
                          ))}
                        </LockedFadeContent>
                      ) : null}
                    </>
                  ) : (
                    <LockedFadeContent locked={teaserMode} maxLines={5}>
                      <p className="summary-text summary-text-compact">{result.aiSummary}</p>
                    </LockedFadeContent>
                  )}
                </div>
              </div>
            </div>

            <div className="panel panel-recommendations panel-compact panel-premium">
              <div className="panel-header-row">
                <h3>Empfehlungen</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Nächste Schritte</span>
              </div>

              <div className="recommendation-grid recommendation-grid-compact">
                {result.recommendations.map((item, index) => (
                  <article
                    key={item.title}
                    className="recommendation-card recommendation-card-compact recommendation-card-premium"
                  >
                    <div className="recommendation-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="recommendation-content">
                      <h4>{item.title}</h4>
                      <LockedFadeContent locked={teaserMode} maxLines={4}>
                        <p>{item.description}</p>
                      </LockedFadeContent>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {teaserMode ? <UnlockFullAnalysisCta onUnlock={goPremium} /> : null}
        </div>
      </div>
    </section>
  );
}
