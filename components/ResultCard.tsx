"use client";

import type { ComponentType, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Eye, Hash, Link2, List, User } from "lucide-react";
import { saveScanSnapshotForPremium } from "@/lib/premium-client-storage";
import { PREMIUM_INTENT, PREMIUM_INTENT_QUERY } from "@/lib/premium-intent";
import { ScanResponse, FindingItem } from "@/types/scan";
import { getResultViewKey } from "@/lib/result-view-key";
import type { ErkenntnisIconId } from "@/lib/erkenntnisse-insights";
import { getErkenntnisInsight } from "@/lib/erkenntnisse-insights";
import LockedFadeContent from "@/components/LockedFadeContent";
import LockedSensitiveBlock from "@/components/LockedSensitiveBlock";
import UnlockFullAnalysisCta from "@/components/UnlockFullAnalysisCta";

type InsightIconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
};

const ERKENNTNIS_ICONS: Record<ErkenntnisIconId, ComponentType<InsightIconProps>> = {
  alert: AlertTriangle,
  eye: Eye,
  hash: Hash,
  link: Link2,
  list: List,
  user: User,
};

type ResultCardProps = {
  result: ScanResponse;
  onReset: () => void;
  /** Full detail (post-unlock). When false, sensitive sections show as teaser. */
  detailUnlocked: boolean;
};

function getRiskMeta(riskLevel: ScanResponse["riskLevel"], riskScore: number) {
  if (riskLevel === "High") {
    return {
      title: "Dein öffentlicher Auftritt wirkt vernetzbar",
      subtitle:
        "Mehrere Hinweise aus Suche, Profilen und Listen lassen sich gut miteinander in Beziehung setzen — das erhöht die Chance, dass Dritte dich zügig einordnen können.",
      mood: "Erhöhte Auffälligkeit",
      summaryBadge: "Handlung sinnvoll",
    };
  }

  if (riskLevel === "Medium") {
    return {
      title: "Es gibt spürbare Verknüpfungspunkte",
      subtitle:
        "Öffentliche Informationen reichen aus, dass eine gezielte Suche dich nicht im Leeren stehen lässt — ohne dass automatisch „alles offen“ ist.",
      mood: "Im Blick behalten",
      summaryBadge: "Mit Bedacht prüfen",
    };
  }

  return {
    title: "Deine Spuren wirken eher zurückhaltend",
    subtitle:
      "Die geprüften öffentlichen Hinweise ergeben zusammen kein besonders dichtes Bild — das ist eine gute Ausgangslage, die du mit wenigen klaren Gewohnheiten stabil halten kannst.",
    mood: riskScore <= 15 ? "Ruhiges Profil" : "Solide Basis",
    summaryBadge: "Gute Ausgangslage",
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
    "Identity theft risk core": "Gesamtbild",
    "Public visibility": "Such-Sichtbarkeit",
    "Directory / people-search pages": "Verzeichnisse",
    "Username reuse exposure": "Benutzernamen",
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
    "Identity theft risk core": "Gesamteinordnung",
    "Public visibility": "Such-Sichtbarkeit",
    "Directory / people-search pages": "Verzeichnisse & Personensuche",
    "Username reuse exposure": "Benutzernamen",
    "Exact identity matches": "Namens-Treffer",
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
  if (finding.status === "danger") return "Eindeutig möglich";
  if (finding.status === "warning") return "Vermutlich relevant";
  return "Kein klarer Treffer";
}

function platformBadgeTeaser(finding: FindingItem, teaserMode: boolean) {
  if (!teaserMode) return platformBadgeText(finding);
  if (finding.status === "danger" || finding.status === "warning") return "Profil prüfen";
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
      <div className="result-header result-header-vnext">
        <div>
          <span className="eyebrow">Auswertung</span>
          <h2>Dein digitales Identitätsprofil</h2>
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
                ? "Höhere Sensitivität"
                : result.riskLevel === "Medium"
                  ? "Moderate Sensitivität"
                  : "Geringere Sensitivität"}
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
              <span className="score-bar-label score-bar-label-strong">
                {result.riskScore}% Gesamtbewertung
              </span>
              <span className="score-bar-label score-bar-label-soft">
                Einordnung aus Sichtbarkeit, verknüpfbaren Profilen und typischen Missbrauchspfaden
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
            <section
              className="panel panel-findings panel-compact panel-premium idradar-export-section idradar-erkenntnisse"
              id="export-erkenntnisse"
              aria-labelledby="erkenntnisse-heading"
            >
              <div className="panel-header-row">
                <h3 id="erkenntnisse-heading">Erkenntnisse</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Verständlich erklärt</span>
              </div>

              <div className="findings-block idradar-erkenntnisse-list" role="list">
                {coreFindings.map((finding, index) => {
                  const tone = getFindingTone(finding);
                  const maskDeep = teaserMode && index > 0;
                  const insight = getErkenntnisInsight(finding);
                  const Icon = ERKENNTNIS_ICONS[insight.iconId];

                  return (
                    <article
                      key={finding.label}
                      role="listitem"
                      className={`insight-card item-row-card item-row-tight item-row-accent item-row-premium finding-row ${tone}`}
                    >
                      <div className="insight-card-icon" aria-hidden>
                        <Icon size={19} strokeWidth={1.65} />
                      </div>
                      <div className={`insight-card-main ${maskDeep ? "locked-core-value" : ""}`}>
                        <h4 className="insight-card-title">{insight.title}</h4>
                        <p className="insight-card-explanation">{insight.explanation}</p>
                        <div className="insight-card-meaning">
                          <span className="insight-card-meaning-kicker">Das bedeutet für dich</span>
                          <p className="insight-card-meaning-text">{insight.meaning}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {platformFindings.length > 0 && (
                <div className="platform-section">
                  <div className="platform-section-head">
                    <div className="platform-heading-wrap">
                      <h4>Profile & Plattformen</h4>
                      <button
                        type="button"
                        className="info-trigger info-trigger-gold"
                        onClick={() => setShowPlatformInfo((prev) => !prev)}
                        aria-label="Hilfe zu Profilen und Plattformen"
                        aria-expanded={showPlatformInfo}
                      >
                        ?
                      </button>
                    </div>

                    <span className="panel-mini-tag panel-mini-tag-gold">Pro Plattform</span>
                  </div>

                  {showPlatformInfo && (
                    <div className="info-bubble info-bubble-gold">
                      Hier siehst du, wie gut öffentliche Profile zu deinem Namen, möglichen
                      Benutzernamen und typischen Profil-URLs passen könnten — nicht jeder Treffer
                      ist automatisch „du“, aber starke Übereinstimmungen sind ein wichtiger Hebel.
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

                          <LockedSensitiveBlock
                            locked={teaserMode}
                            onUnlock={goPremium}
                            overlayLabel="Details anzeigen"
                          >
                            {finding.url ? (
                              <a
                                href={finding.url}
                                target="_blank"
                                rel="noreferrer"
                                className="platform-link"
                              >
                                Profil ansehen
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
            </section>

            <div className="panel panel-summary panel-compact panel-premium">
              <div className="panel-header-row">
                <h3>KI-Einordnung</h3>
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
                        <LockedFadeContent locked={teaserMode} maxLines={7}>
                          {summaryBlocks.support.slice(1).map((paragraph, index) => (
                            <p key={index + 1} className="summary-text summary-text-compact">
                              {paragraph}
                            </p>
                          ))}
                        </LockedFadeContent>
                      ) : null}
                    </>
                  ) : (
                    <LockedFadeContent locked={teaserMode} maxLines={6}>
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
                      <LockedFadeContent locked={teaserMode} maxLines={5}>
                        <p>{item.description}</p>
                      </LockedFadeContent>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {teaserMode ? <UnlockFullAnalysisCta result={result} onUnlock={goPremium} /> : null}
        </div>
      </div>
    </section>
  );
}
