"use client";

import { useEffect, useState } from "react";
import ScanForm from "@/components/ScanForm";
import ResultCard from "@/components/ResultCard";
import { ScanResponse } from "@/types/scan";

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 0 0 20M12 2a15.3 15.3 0 0 1 0 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGuest() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 20v-1.2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 6h3M19.5 4.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

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
      <main
        className={`landing-page${isScanOpen ? " landing-page--scan-open" : ""}`}
      >
        <section className="landing-hero">
          <div className="landing-hero-noise" />
          <div className="landing-hero-glow landing-hero-glow-one" />
          <div className="landing-hero-glow landing-hero-glow-two" />

          <div className="landing-navbar landing-reveal">
            <div className="landing-brand">
              <span className="landing-brand-dot" />
              <span>ID Radar</span>
            </div>

            <div className="landing-navbar-links">
              <a href="#vertrauen">Vertrauen</a>
              <a href="#wie-es-funktioniert">So funktioniert&apos;s</a>
              <a href="#warum">Warum wichtig</a>
            </div>

            <button
              type="button"
              className="landing-nav-button landing-tap"
              onClick={openScan}
            >
              Jetzt Identität prüfen
            </button>
          </div>

          <div className="landing-hero-inner">
            <div className="landing-hero-copy landing-reveal landing-reveal-delay-1">
              <div className="landing-badge-row">
                <span className="landing-badge">Identitätsrisiko</span>
                <span className="landing-badge landing-badge-soft">
                  Öffentliche Daten
                </span>
                <span className="landing-badge landing-badge-soft">
                  Schweizer Datenschutz
                </span>
              </div>

              <h1>
                Wie exponiert ist deine Identität
                <span> im Netz wirklich?</span>
              </h1>

              <p className="landing-lead">
                In Sekunden: Wir werten öffentlich sichtbare Hinweise aus und
                schätzen, wie leicht sich deine Identität online erkennen und
                verknüpfen lässt – klar erklärt, ohne Registrierung.
              </p>

              <div className="landing-actions">
                <button
                  type="button"
                  className="primary-button landing-cta landing-tap"
                  onClick={openScan}
                >
                  Jetzt Identität prüfen
                </button>

                <a
                  href="#wie-es-funktioniert"
                  className="landing-secondary-link landing-tap"
                >
                  So funktioniert&apos;s
                </a>
              </div>

              <p className="landing-hero-trust-line">
                Keine Speicherung deiner Daten
              </p>

              <div className="landing-hero-footnotes">
                <span>1 kostenloser Scan pro Tag</span>
                <span>Nur öffentliche Quellen</span>
                <span>Kein Konto nötig</span>
              </div>
            </div>

            <div className="landing-hero-preview landing-reveal landing-reveal-delay-2">
              <div className="landing-preview-card landing-float">
                <div className="landing-preview-top">
                  <span className="landing-preview-label">
                    Beispielhafte Auswertung
                  </span>
                  <span className="landing-preview-status">Premium Analysegefühl</span>
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
                      begrenzt plattformübergreifend verknüpfbar.
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

        <section id="vertrauen" className="landing-trust landing-reveal-soft">
          <div className="landing-trust-inner">
            <div className="landing-trust-head">
              <span className="landing-section-kicker">Vertrauen</span>
              <h2 className="landing-trust-title">
                Sicherheit und Privatsphäre – ohne Kompromisse
              </h2>
            </div>

            <ul className="landing-trust-grid">
              <li className="landing-trust-item landing-card-polished landing-tap">
                <span className="landing-trust-icon">
                  <IconGlobe />
                </span>
                <div>
                  <strong>Nur öffentliche Daten</strong>
                  <p>
                    Die Analyse basiert auf öffentlich verfügbaren Hinweisen –
                    keine verdeckten Quellen.
                  </p>
                </div>
              </li>

              <li className="landing-trust-item landing-card-polished landing-tap">
                <span className="landing-trust-icon">
                  <IconGuest />
                </span>
                <div>
                  <strong>Keine Registrierung</strong>
                  <p>
                    Du startest sofort – ohne Konto, ohne Passwort, ohne
                    unnötige Hürden.
                  </p>
                </div>
              </li>

              <li className="landing-trust-item landing-card-polished landing-tap">
                <span className="landing-trust-icon">
                  <IconShield />
                </span>
                <div>
                  <strong>Schweizer Datenschutz</strong>
                  <p>
                    Entwickelt mit Fokus auf Zurückhaltung, Klarheit und
                    vertrauenswürdige Datenverarbeitung.
                  </p>
                </div>
              </li>

              <li className="landing-trust-item landing-card-polished landing-tap">
                <span className="landing-trust-icon">
                  <IconLock />
                </span>
                <div>
                  <strong>Keine Speicherung persönlicher Daten</strong>
                  <p>
                    Deine Eingaben werden für den Scan verarbeitet – nicht als
                    dauerhaftes Profil abgelegt.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section id="wie-es-funktioniert" className="landing-section landing-reveal-soft">
          <div className="landing-section-head">
            <span className="landing-section-kicker">So funktioniert&apos;s</span>
            <h2>Drei Schritte zur Einschätzung deines Identitätsrisikos</h2>
            <p>
              Klarer Ablauf, verständliches Ergebnis – damit du sofort weißt,
              woran du bist.
            </p>
          </div>

          <div className="landing-grid-three">
            <article className="landing-card landing-card-polished landing-tap">
              <div className="landing-card-index">01</div>
              <h3>Name eingeben</h3>
              <p>
                Du gibst die nötigen Angaben für den Scan ein – minimal und
                nachvollziehbar.
              </p>
            </article>

            <article className="landing-card landing-card-polished landing-tap">
              <div className="landing-card-index">02</div>
              <h3>Öffentliche Daten werden analysiert</h3>
              <p>
                Wir werten sichtbare Hinweise und Treffer aus dem öffentlichen
                Web aus.
              </p>
            </article>

            <article className="landing-card landing-card-polished landing-tap">
              <div className="landing-card-index">03</div>
              <h3>Risiko &amp; Empfehlungen erhalten</h3>
              <p>
                Du siehst eine Risikoeinschätzung und konkrete nächste Schritte
                für mehr Kontrolle.
              </p>
            </article>
          </div>
        </section>

        <section id="warum" className="landing-section landing-section-alt landing-reveal-soft">
          <div className="landing-split">
            <div className="landing-split-copy">
              <span className="landing-section-kicker">Warum wichtig</span>
              <h2>
                Schon wenige Angaben können reichen, um dieselbe Person auf
                mehreren Plattformen zu erkennen
              </h2>
              <p>
                Name, Stadt, wiederverwendete Benutzernamen und öffentliche
                Profile ergeben zusammen oft mehr, als man auf den ersten Blick
                erwartet. Genau daraus entsteht digitale Verknüpfbarkeit.
              </p>

              <ul className="landing-list">
                <li>Name und Stadt können bereits starke Zuordnungssignale erzeugen</li>
                <li>Wiederverwendete Benutzernamen machen Profile leichter auffindbar</li>
                <li>Mehrere kleine Hinweise ergeben zusammen ein größeres Risiko</li>
              </ul>
            </div>

            <div className="landing-side-panel">
              <div className="landing-side-panel-card landing-tap">
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

        <section className="landing-final-cta landing-reveal-soft">
          <div className="landing-final-cta-card landing-tap">
            <span className="landing-section-kicker">Jetzt starten</span>
            <h2>In Sekunden: erste Einschätzung deiner Online-Sichtbarkeit</h2>
            <p>
              Erfahre, wie leicht sich deine öffentliche Identität erkennen und
              verknüpfen lässt – verständlich und datensparsam.
            </p>

            <div className="landing-final-actions">
              <button
                type="button"
                className="primary-button landing-cta landing-tap"
                onClick={openScan}
              >
                Jetzt Identität prüfen
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

            <button type="button" className="scan-overlay-close" onClick={closeScan}>
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