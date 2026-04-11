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
          <div className="landing-hero-bg landing-hero-bg-one" />
          <div className="landing-hero-bg landing-hero-bg-two" />

          <div className="landing-hero-inner">
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
              Wie leicht ist deine
              <br />
              Identität online auffindbar?
            </h1>

            <p className="landing-lead">
              ID Radar prüft öffentlich erkennbare Spuren, mögliche Profil-Treffer
              und Verknüpfungen deiner Identität im Internet – damit du Risiken
              früher erkennst.
            </p>

            <div className="landing-actions">
              <button className="primary-button landing-cta" onClick={openScan}>
                Zum Scan
              </button>

              <a href="#wie-es-funktioniert" className="landing-secondary-link">
                Mehr erfahren
              </a>
            </div>

            <div className="landing-trust-row">
              <div className="landing-trust-item">
                <strong>Keine dauerhafte Speicherung</strong>
                <span>Scan-Eingaben werden nur temporär verarbeitet.</span>
              </div>

              <div className="landing-trust-item">
                <strong>Öffentliche Quellen</strong>
                <span>Analyse sichtbarer Hinweise statt versteckter Daten.</span>
              </div>

              <div className="landing-trust-item">
                <strong>1 Scan pro Tag</strong>
                <span>Zum Schutz vor Missbrauch und unnötigen API-Kosten.</span>
              </div>
            </div>
          </div>
        </section>

        <section id="wie-es-funktioniert" className="landing-section">
          <div className="landing-section-head">
            <span className="landing-section-kicker">Wie es funktioniert</span>
            <h2>Ein einfacher Scan mit klarer Risikoeinschätzung</h2>
            <p>
              ID Radar kombiniert Suchergebnisse, Plattform-Hinweise und
              Identitätsmuster zu einer kompakten Einschätzung.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card">
              <div className="landing-card-index">01</div>
              <h3>Öffentliche Spuren erkennen</h3>
              <p>
                Der Scan prüft sichtbare Treffer zu Name, Stadt, Benutzernamen
                und potenziellen Profilsignalen.
              </p>
            </article>

            <article className="landing-card">
              <div className="landing-card-index">02</div>
              <h3>Verknüpfbarkeit bewerten</h3>
              <p>
                Entscheidend ist nicht nur Sichtbarkeit, sondern wie leicht sich
                einzelne Informationen zusammenführen lassen.
              </p>
            </article>

            <article className="landing-card">
              <div className="landing-card-index">03</div>
              <h3>Risiko verständlich darstellen</h3>
              <p>
                Du erhältst eine klare Einstufung, Plattform-Hinweise und konkrete
                Empfehlungen zur Verbesserung deiner Privatsphäre.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section landing-section-alt">
          <div className="landing-split">
            <div className="landing-split-copy">
              <span className="landing-section-kicker">Warum das wichtig ist</span>
              <h2>Schon wenige Angaben reichen oft für unerwünschte Verknüpfungen</h2>
              <p>
                Name, Stadt und wiederverwendete Benutzernamen können genügen, um
                Profile plattformübergreifend zusammenzuführen. Genau dort beginnt
                das Risiko.
              </p>

              <ul className="landing-list">
                <li>Öffentliche Profile können schneller erkannt werden als erwartet</li>
                <li>Wiederverwendete Benutzernamen erhöhen die Verknüpfbarkeit</li>
                <li>Standortangaben machen Identitätszuordnung oft einfacher</li>
              </ul>
            </div>

            <div className="landing-visual-card">
              <div className="landing-visual-score">
                <span className="landing-visual-label">Beispielhafte Auswertung</span>
                <div className="landing-visual-meter">
                  <div className="landing-visual-meter-fill" />
                </div>
                <div className="landing-visual-tags">
                  <span className="landing-visual-tag">Öffentliche Sichtbarkeit</span>
                  <span className="landing-visual-tag">Profil-Signale</span>
                  <span className="landing-visual-tag">Verzeichnis-Treffer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-head">
            <span className="landing-section-kicker">Vertrauen</span>
            <h2>Für Nutzer, die ihre Sichtbarkeit besser verstehen wollen</h2>
            <p>
              ID Radar ist auf eine klare, zurückhaltende und nachvollziehbare
              Analyse ausgelegt – ohne unnötigen Ballast.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-compact">
              <h3>Klare Ergebnisse</h3>
              <p>
                Kein technischer Overload, sondern eine verständliche
                Risikodarstellung mit konkreten Hinweisen.
              </p>
            </article>

            <article className="landing-card landing-card-compact">
              <h3>Schweizer Fokus</h3>
              <p>
                Mit Blick auf Datenschutz, Zurückhaltung und ein vertrauenswürdiges
                Nutzungserlebnis entwickelt.
              </p>
            </article>

            <article className="landing-card landing-card-compact">
              <h3>Schrittweise Erweiterbar</h3>
              <p>
                Die Plattform ist vorbereitet für tiefere Analysen, Monitoring und
                spätere Premium-Funktionen.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-final-cta-card">
            <span className="landing-section-kicker">Jetzt testen</span>
            <h2>Prüfe deine öffentliche Identität in wenigen Sekunden</h2>
            <p>
              Starte mit einem kostenlosen Scan und erhalte eine erste
              Einschätzung deiner Online-Sichtbarkeit.
            </p>

            <button className="primary-button landing-cta" onClick={openScan}>
              Zum Scan
            </button>
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