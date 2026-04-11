"use client";

import { useEffect, useState } from "react";
import ScanForm from "@/components/ScanForm";
import ResultCard from "@/components/ResultCard";
import { ScanResponse } from "@/types/scan";

export default function HomePage() {
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  useEffect(() => {
    if (isScanOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isScanOpen]);

  function openScan() {
    setIsScanOpen(true);
  }

  function closeScan() {
    setIsScanOpen(false);
    setResult(null);
  }

  function resetScan() {
    setResult(null);
  }

  return (
    <>
      <main className="landing-page">
        <section className="landing-hero">
          <div className="landing-hero-noise" />
          <div className="landing-hero-glow landing-hero-glow-one" />
          <div className="landing-hero-glow landing-hero-glow-two" />

          <div className="landing-navbar">
            <div className="landing-brand">
              <span className="landing-brand-dot" />
              <span>ID Radar</span>
            </div>

            <div className="landing-navbar-links">
              <a href="#wie-es-funktioniert">So funktioniert es</a>
              <a href="#warum">Warum wichtig</a>
              <a href="#vertrauen">Vertrauen</a>
            </div>

            <button className="landing-nav-button" onClick={openScan}>
              Zum Scan
            </button>
          </div>

          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <div className="landing-badge-row">
                <span className="landing-badge">ID Radar</span>
                <span className="landing-badge landing-badge-soft">
                  Datenschutzfokus
                </span>
                <span className="landing-badge landing-badge-soft">
                  🇨🇭 In der Schweiz entwickelt
                </span>
              </div>

              <h1>
                Finde heraus, wie leicht deine Identität online
                <span> gefunden und verknüpft werden kann.</span>
              </h1>

              <p className="landing-lead">
                Schon wenige öffentliche Angaben können reichen, damit Profile,
                Suchtreffer und persönliche Informationen miteinander verbunden
                werden. ID Radar zeigt dir, wie sichtbar und verknüpfbar deine
                Identität im Internet aktuell ist.
              </p>

              <div className="landing-actions">
                <button className="primary-button landing-cta" onClick={openScan}>
                  Kostenlosen Scan starten
                </button>

                <a href="#wie-es-funktioniert" className="landing-secondary-link">
                  Mehr erfahren
                </a>
              </div>

              <div className="landing-hero-footnotes">
                <span>1 kostenloser Scan pro Tag</span>
                <span>Keine dauerhafte Speicherung</span>
                <span>Analyse öffentlicher Hinweise</span>
              </div>
            </div>

            <div className="landing-hero-preview">
              <div className="landing-preview-card">
                <div className="landing-preview-top">
                  <span className="landing-preview-label">
                    Beispielhafte Auswertung
                  </span>
                  <span className="landing-preview-status">Live Analyse</span>
                </div>

                <div className="landing-preview-score">
                  <div className="landing-preview-score-ring">
                    <div className="landing-preview-score-inner">
                      <strong>24</strong>
                      <span>/100</span>
                    </div>
                  </div>

                  <div className="landing-preview-score-copy">
                    <h3>Niedriges bis mittleres Risiko</h3>
                    <p>
                      Öffentliche Hinweise sind sichtbar, aber derzeit nur
                      teilweise plattformübergreifend miteinander verknüpfbar.
                    </p>
                  </div>
                </div>

                <div className="landing-preview-list">
                  <div className="landing-preview-item">
                    <span>Öffentliche Sichtbarkeit</span>
                    <strong>Vorhanden</strong>
                  </div>
                  <div className="landing-preview-item">
                    <span>Plattform-Signale</span>
                    <strong>Teilweise</strong>
                  </div>
                  <div className="landing-preview-item">
                    <span>Verzeichnis-Treffer</span>
                    <strong>Keine</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="wie-es-funktioniert" className="landing-section">
          <div className="landing-section-head">
            <span className="landing-section-kicker">So funktioniert es</span>
            <h2>Ein schneller Scan mit verständlicher Risikoeinschätzung</h2>
            <p>
              ID Radar prüft nicht nur, ob du online sichtbar bist – sondern vor
              allem, wie leicht einzelne Informationen über dich zusammengeführt
              werden können.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">01</div>
              <h3>Öffentliche Treffer prüfen</h3>
              <p>
                Der Scan wertet sichtbare Hinweise zu Name, Stadt,
                Benutzernamen und möglichen Profil-Treffern aus.
              </p>
            </article>

            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">02</div>
              <h3>Verknüpfbarkeit bewerten</h3>
              <p>
                Entscheidend ist, ob dieselbe Identität über mehrere Quellen und
                Plattformen hinweg leichter erkannt werden kann.
              </p>
            </article>

            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">03</div>
              <h3>Klare Empfehlungen erhalten</h3>
              <p>
                Du bekommst eine verständliche Einschätzung und konkrete Hinweise,
                wie du deine öffentliche Sichtbarkeit besser kontrollieren kannst.
              </p>
            </article>
          </div>
        </section>

        <section id="warum" className="landing-section landing-section-alt">
          <div className="landing-split">
            <div className="landing-split-copy">
              <span className="landing-section-kicker">Warum wichtig</span>
              <h2>
                Schon wenige Angaben können reichen, um dieselbe Person auf
                mehreren Plattformen zu erkennen
              </h2>
              <p>
                Name, Stadt, wiederverwendete Benutzernamen und öffentliche
                Profile ergeben zusammen oft mehr, als man im ersten Moment denkt.
                Genau daraus entsteht digitale Verknüpfbarkeit.
              </p>

              <ul className="landing-list">
                <li>Name und Stadt können bereits starke Zuordnungssignale erzeugen</li>
                <li>Wiederverwendete Benutzernamen machen Profile leichter auffindbar</li>
                <li>Mehrere kleine Hinweise ergeben zusammen ein größeres Risiko</li>
              </ul>
            </div>

            <div className="landing-side-panel">
              <div className="landing-side-panel-card">
                <span className="landing-side-panel-kicker">
                  Was analysiert wird
                </span>

                <div className="landing-side-panel-row">
                  <span>Suchtreffer</span>
                  <strong>Öffentlich sichtbar</strong>
                </div>
                <div className="landing-side-panel-row">
                  <span>Profil-Treffer</span>
                  <strong>Plattformbezogen</strong>
                </div>
                <div className="landing-side-panel-row">
                  <span>Namensmuster</span>
                  <strong>Wiedererkennbar</strong>
                </div>
                <div className="landing-side-panel-row">
                  <span>Standortbezug</span>
                  <strong>Optional</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="vertrauen" className="landing-section">
          <div className="landing-section-head">
            <span className="landing-section-kicker">Vertrauen</span>
            <h2>Zurückhaltend entwickelt, weil Identität ein sensibles Thema ist</h2>
            <p>
              ID Radar soll verständlich, vertrauenswürdig und datensparsam wirken
              – mit Fokus auf Klarheit statt unnötiger Komplexität.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-compact landing-card-polished">
              <h3>Keine dauerhafte Speicherung</h3>
              <p>
                Deine Scan-Eingaben werden nur für die laufende Anfrage verarbeitet
                und nicht dauerhaft als persönliches Profil gespeichert.
              </p>
            </article>

            <article className="landing-card landing-card-compact landing-card-polished">
              <h3>Schweizer Fokus</h3>
              <p>
                Das Produkt ist mit Blick auf Datenschutz, Zurückhaltung und ein
                vertrauenswürdiges Nutzungserlebnis konzipiert.
              </p>
            </article>

            <article className="landing-card landing-card-compact landing-card-polished">
              <h3>Missbrauchsschutz aktiv</h3>
              <p>
                Turnstile, Tageslimit und zusätzliche Schutzmechanismen helfen,
                automatisierte oder unnötige Anfragen einzuschränken.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-final-cta-card">
            <span className="landing-section-kicker">Jetzt testen</span>
            <h2>Starte mit einer ersten Einschätzung deiner Online-Sichtbarkeit</h2>
            <p>
              In wenigen Sekunden erhältst du eine erste Einschätzung dazu, wie
              leicht deine öffentliche Identität erkannt und verknüpft werden kann.
            </p>

            <div className="landing-final-actions">
              <button className="primary-button landing-cta" onClick={openScan}>
                Zum Scan
              </button>

              <span className="landing-final-note">
                Kostenlos · 1 Scan pro Tag
              </span>
            </div>
          </div>
        </section>
      </main>

      <div
        className={`scan-overlay ${isScanOpen ? "scan-overlay-open" : ""}`}
        aria-hidden={!isScanOpen}
      >
        <div className="scan-overlay-backdrop" onClick={closeScan} />

        <div className={`scan-overlay-panel ${isScanOpen ? "open" : ""}`}>
          <div className="scan-overlay-header">
            <div>
              <span className="eyebrow">ID Radar</span>
              <h2>{result ? "Scan-Ergebnis" : "Identitäts-Scan"}</h2>
            </div>

            <button className="scan-overlay-close" onClick={closeScan}>
              Schließen
            </button>
          </div>

          <div className="scan-overlay-content">
            {result ? (
              <ResultCard result={result} onReset={resetScan} />
            ) : (
              <ScanForm onResult={setResult} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}