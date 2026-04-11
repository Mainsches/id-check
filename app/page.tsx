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
                Verstehe, wie leicht deine Identität online
                <span> gefunden und verknüpft werden kann.</span>
              </h1>

              <p className="landing-lead">
                ID Radar analysiert öffentlich sichtbare Spuren, mögliche
                Profil-Treffer und wiedererkennbare Identitätsmuster – damit du
                Risiken früher erkennst, bevor sie problematisch werden.
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
                <span>1 Scan pro Tag</span>
                <span>Keine dauerhafte Speicherung</span>
                <span>Öffentliche Quellen</span>
              </div>
            </div>

            <div className="landing-hero-preview">
              <div className="landing-preview-card">
                <div className="landing-preview-top">
                  <span className="landing-preview-label">Beispielhafte Auswertung</span>
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
                      Öffentliche Sichtbarkeit ist vorhanden, aber nur begrenzt
                      plattformübergreifend verknüpfbar.
                    </p>
                  </div>
                </div>

                <div className="landing-preview-list">
                  <div className="landing-preview-item">
                    <span>Öffentliche Sichtbarkeit</span>
                    <strong>Erkannt</strong>
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
              Der Fokus liegt nicht nur auf Sichtbarkeit, sondern darauf, wie
              leicht einzelne Informationen miteinander verknüpft werden können.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">01</div>
              <h3>Öffentliche Treffer prüfen</h3>
              <p>
                Name, Stadt, Benutzername und weitere Signale werden mit
                öffentlich sichtbaren Treffern abgeglichen.
              </p>
            </article>

            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">02</div>
              <h3>Verknüpfbarkeit bewerten</h3>
              <p>
                Entscheidend ist, wie einfach ein Profil, Suchtreffer oder eine
                Identität plattformübergreifend zusammengeführt werden kann.
              </p>
            </article>

            <article className="landing-card landing-card-polished">
              <div className="landing-card-index">03</div>
              <h3>Klare Empfehlungen erhalten</h3>
              <p>
                Du erhältst eine kompakte Bewertung und konkrete Hinweise, wo du
                deine Sichtbarkeit reduzieren kannst.
              </p>
            </article>
          </div>
        </section>

        <section id="warum" className="landing-section landing-section-alt">
          <div className="landing-split">
            <div className="landing-split-copy">
              <span className="landing-section-kicker">Warum wichtig</span>
              <h2>
                Schon wenige Angaben können reichen, um digitale Identitäten
                zusammenzuführen
              </h2>
              <p>
                Wiederverwendete Benutzernamen, Ortsangaben und öffentliche
                Profile machen es oft leichter, dieselbe Person auf mehreren
                Plattformen zu erkennen und zu verknüpfen.
              </p>

              <ul className="landing-list">
                <li>Name und Stadt ergeben oft bereits starke Zuordnungssignale</li>
                <li>Wiederverwendete Benutzernamen erhöhen die Erkennbarkeit</li>
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
                  <strong>Verknüpfbar</strong>
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
            <h2>Zurückhaltend aufgebaut, mit Fokus auf Klarheit und Schutz</h2>
            <p>
              ID Radar soll nachvollziehbar, vorsichtig und vertrauenswürdig
              wirken – gerade weil das Thema Identität sensibel ist.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-compact landing-card-polished">
              <h3>Keine dauerhafte Speicherung</h3>
              <p>
                Scan-Eingaben werden nur für die laufende Anfrage verarbeitet und
                nicht dauerhaft als Profildaten gespeichert.
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
              <h3>Missbrauchsschutz integriert</h3>
              <p>
                Turnstile, Tageslimit und zusätzliche Schutzmechanismen helfen,
                unnötige oder automatisierte Abfragen einzuschränken.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-final-cta-card">
            <span className="landing-section-kicker">Jetzt testen</span>
            <h2>Starte mit einer ersten Einschätzung deiner Online-Sichtbarkeit</h2>
            <p>
              Der Scan dauert nur kurz und zeigt dir, wo potenzielle
              Verknüpfungen und öffentliche Identitätssignale sichtbar werden.
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