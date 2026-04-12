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
import { getKiGuidedSections } from "@/lib/ki-guided-sections";
import type { ResultEmailHandler, ResultPdfExportHandler } from "@/lib/result-retention";
import {
  getAllPlatformFindings,
  getHiddenPlatformRowCount,
  getMeaningfulPlatformFindings,
  isPlatformFindingLabel,
} from "@/lib/platform-findings";
import AccountProtectionModule from "@/components/AccountProtectionModule";
import ProfilePlatformsHelp from "@/components/ProfilePlatformsHelp";
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
  /** Optional: wire when PDF export is implemented (e.g. download blob). */
  onDownloadPdf?: ResultPdfExportHandler;
  /** Optional: wire when e-mail delivery is implemented. */
  onEmailResult?: ResultEmailHandler;
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

export default function ResultCard({
  result,
  onReset,
  detailUnlocked,
  onDownloadPdf,
  onEmailResult,
}: ResultCardProps) {
  const router = useRouter();
  const [retentionFeedback, setRetentionFeedback] = useState<
    null | { phase: "preparing" | "followup"; channel: "pdf" | "email" }
  >(null);
  const retentionTimersRef = useRef<number[]>([]);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(detailUnlocked);
  const [unlockReveal, setUnlockReveal] = useState(false);
  const prevDetailUnlocked = useRef<boolean | null>(null);
  const lastResultKey = useRef<string | null>(null);

  const resultViewKey = useMemo(() => getResultViewKey(result), [result]);

  useEffect(() => {
    setIsPremiumUnlocked(detailUnlocked);
  }, [detailUnlocked, resultViewKey]);

  useEffect(() => {
    return () => {
      retentionTimersRef.current.forEach((id) => window.clearTimeout(id));
      retentionTimersRef.current = [];
    };
  }, []);

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
  const coreFindings = result.findings.filter((item) => !isPlatformFindingLabel(item.label));
  const platformFindingsAll = useMemo(() => getAllPlatformFindings(result), [result]);
  const platformFindingsVisible = useMemo(
    () => getMeaningfulPlatformFindings(result),
    [result]
  );
  const hiddenPlatformRows = useMemo(() => getHiddenPlatformRowCount(result), [result]);

  const summaryBlocks = useMemo(
    () => renderSummaryBlocks(result.aiSummary),
    [result.aiSummary]
  );

  const kiGuided = useMemo(() => getKiGuidedSections(result), [result]);

  const teaserMode = !isPremiumUnlocked;

  const scheduleRetentionStub = (channel: "pdf" | "email") => {
    retentionTimersRef.current.forEach((id) => window.clearTimeout(id));
    retentionTimersRef.current = [];
    setRetentionFeedback({ phase: "preparing", channel });
    retentionTimersRef.current.push(
      window.setTimeout(() => setRetentionFeedback({ phase: "followup", channel }), 720)
    );
    retentionTimersRef.current.push(
      window.setTimeout(() => setRetentionFeedback(null), 720 + 4000)
    );
  };

  const retentionStatusText =
    retentionFeedback == null
      ? null
      : retentionFeedback.channel === "pdf"
        ? retentionFeedback.phase === "preparing"
          ? "PDF wird vorbereitet…"
          : "Bericht-Export folgt in Kürze — Funktion noch in Arbeit."
        : retentionFeedback.phase === "preparing"
          ? "E-Mail-Versand wird vorbereitet…"
          : "Versand folgt in Kürze — Funktion noch in Arbeit.";

  const pdfRetentionBusy =
    retentionFeedback?.channel === "pdf" && retentionFeedback.phase === "preparing";
  const emailRetentionBusy =
    retentionFeedback?.channel === "email" && retentionFeedback.phase === "preparing";

  const handlePdfClick = () => {
    if (onDownloadPdf) {
      void Promise.resolve(onDownloadPdf(result));
      return;
    }
    scheduleRetentionStub("pdf");
  };

  const handleEmailClick = () => {
    if (onEmailResult) {
      void Promise.resolve(onEmailResult(result));
      return;
    }
    scheduleRetentionStub("email");
  };

  return (
    <section className={`result-shell result-shell-vnext fade-in ${riskClass}`}>
      <div className="result-header result-header-vnext">
        <div className="result-header-main">
          <span className="eyebrow">Identitäts-Scan</span>
          <h2>Dein digitales Identitätsprofil</h2>
        </div>

        <div className="result-header-aside">
          <div className="result-retention-row" aria-label="Bericht behalten">
            <button
              type="button"
              className={`result-retention-btn${pdfRetentionBusy ? " result-retention-btn--busy" : ""}`}
              onClick={handlePdfClick}
              aria-busy={pdfRetentionBusy}
            >
              Als PDF herunterladen
            </button>
            <button
              type="button"
              className={`result-retention-btn${emailRetentionBusy ? " result-retention-btn--busy" : ""}`}
              onClick={handleEmailClick}
              aria-busy={emailRetentionBusy}
            >
              Per E-Mail senden
            </button>
          </div>
          {retentionStatusText ? (
            <p className="result-retention-hint" role="status" aria-live="polite">
              {retentionStatusText}
            </p>
          ) : null}
          <button type="button" className="secondary-button secondary-button-gold" onClick={onReset}>
            Neuer Scan
          </button>
        </div>
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
                Modell-Einordnung aus Sichtbarkeit, verknüpfbaren Profilen und typischen
                Missbrauchspfaden
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
              className="panel panel-findings panel-compact panel-premium idradar-export-section idradar-ki-scan"
              id="export-ki-scan"
              aria-labelledby="ki-scan-heading"
            >
              <div className="panel-header-row">
                <h3 id="ki-scan-heading">KI-SCAN</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Aus öffentlichen Signalen</span>
              </div>
              <p className="panel-deck">
                Wiederkehrende Muster aus sichtbaren Hinweisen — zusammengeführt und in Klartext
                übersetzt, nicht nur als Rohliste.
              </p>

              <div className="findings-block idradar-ki-scan-list" role="list">
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
                          <span className="insight-card-meaning-kicker">Praktisch eingeordnet</span>
                          <p className="insight-card-meaning-text">{insight.meaning}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {platformFindingsAll.length > 0 && (
                <div className="platform-section" id="export-plattformen">
                  <div className="platform-section-head">
                    <div className="platform-heading-wrap">
                      <h4>Stärkste öffentliche Profil-Hinweise</h4>
                      <ProfilePlatformsHelp />
                    </div>

                    <span className="panel-mini-tag panel-mini-tag-gold">Belastbar kuratiert</span>
                  </div>

                  <p className="platform-section-lead">
                    Nur dort, wo öffentliche Treffer klar oder plausibel zu dir passen — schwache oder
                    zufällige Treffer bleiben bewusst verborgen, damit du dich auf interpretierbare
                    Hinweise konzentrierst.
                  </p>

                  {platformFindingsVisible.length > 0 ? (
                    <div className="platform-grid">
                      {platformFindingsVisible.map((finding) => {
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
                  ) : (
                    <p className="platform-section-empty">
                      Unter den gängigen Plattformen ergab sich kein belastbarer öffentlicher Treffer,
                      der hier angezeigt werden sollte.
                    </p>
                  )}

                  {hiddenPlatformRows > 0 ? (
                    <p className="platform-section-footnote" role="note">
                      Weitere gängige Plattformen wurden geprüft — ohne klaren Treffer erscheinen sie
                      absichtlich nicht in dieser Liste.
                    </p>
                  ) : null}
                </div>
              )}
            </section>

            <section
              className="panel panel-summary panel-compact panel-premium idradar-export-section"
              id="export-ki-einordnung"
              aria-labelledby="ki-einordnung-heading"
            >
              <div className="panel-header-row">
                <h3 id="ki-einordnung-heading">KI-Einordnung</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Strukturierte Deutung</span>
              </div>
              <p className="panel-deck">
                Zusammenfassung in verständlicher Prosa — geführt und eingeordnet, keine bloße
                Stichpunktliste.
              </p>

              <div className="summary-v9">
                <div className={`summary-badge summary-badge-premium ${riskClass}`}>
                  {riskMeta.summaryBadge}
                </div>

                {summaryBlocks.headline ? (
                  <p className="summary-lead">{summaryBlocks.headline}</p>
                ) : null}

                <div className="summary-body-card summary-body-card-premium ki-guided-card">
                  <LockedFadeContent locked={teaserMode} maxLines={14}>
                    <div className="ki-guided">
                      <section className="ki-guided-block" aria-labelledby="ki-guided-was">
                        <h4 id="ki-guided-was" className="ki-guided-heading">
                          Was auffällt
                        </h4>
                        <ul className="ki-guided-list">
                          {kiGuided.wasAuffaellt.map((line, i) => (
                            <li key={`was-${i}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="ki-guided-block" aria-labelledby="ki-guided-warum">
                        <h4 id="ki-guided-warum" className="ki-guided-heading">
                          Warum das relevant ist
                        </h4>
                        <ul className="ki-guided-list">
                          {kiGuided.warumRelevant.map((line, i) => (
                            <li key={`warum-${i}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="ki-guided-block" aria-labelledby="ki-guided-tun">
                        <h4 id="ki-guided-tun" className="ki-guided-heading">
                          Was du tun kannst
                        </h4>
                        <ul className="ki-guided-list">
                          {kiGuided.wasDuTunKannst.map((line, i) => (
                            <li key={`tun-${i}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </LockedFadeContent>
                </div>
              </div>
            </section>

            <div className="panel panel-recommendations panel-compact panel-premium">
              <div className="panel-header-row">
                <h3>Empfehlungen</h3>
                <span className="panel-mini-tag panel-mini-tag-gold">Priorisiert für dich</span>
              </div>

              <div className="recommendation-grid recommendation-grid-compact">
                {result.recommendations.map((item, index) => (
                  <article
                    key={item.title}
                    className="recommendation-card recommendation-card-editorial recommendation-card-compact recommendation-card-premium"
                  >
                    <header className="recommendation-card-head">
                      <span className="recommendation-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h4 className="recommendation-title">{item.title}</h4>
                    </header>
                    <div className="recommendation-body">
                      <LockedFadeContent locked={teaserMode} maxLines={5}>
                        <p className="recommendation-text">{item.description}</p>
                      </LockedFadeContent>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <AccountProtectionModule className="result-safety-strip idradar-export-section" />
          </div>

          {teaserMode ? <UnlockFullAnalysisCta result={result} onUnlock={goPremium} /> : null}
        </div>
      </div>
    </section>
  );
}
