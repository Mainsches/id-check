"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ScanForm from "@/components/ScanForm";
import ResultCard from "@/components/ResultCard";
import HeroRadarVisual from "@/components/HeroRadarVisual";
import {
  clearScanSnapshotForPremium,
  isResultDetailUnlocked,
  loadScanSnapshotForPremium,
  saveScanSnapshotForPremium,
} from "@/lib/premium-client-storage";
import {
  DEMO_RESULT_QUERY,
  DEMO_RESULT_QUERY_VALUE,
  DEMO_SCAN_RESULT,
  isDemoScanEntryAllowed,
} from "@/lib/demo-scan-result";
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

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  const demoEntryAllowed = isDemoScanEntryAllowed();

  const detailUnlocked = useMemo(
    () => (result ? isResultDetailUnlocked(result) : false),
    [result]
  );

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

  useEffect(() => {
    if (result) {
      saveScanSnapshotForPremium(result);
    }
  }, [result]);

  useEffect(() => {
    const open = searchParams.get("openScan");
    if (open !== "1") {
      return;
    }

    const showResult = searchParams.get("showResult");

    if (showResult === "1") {
      const snap = loadScanSnapshotForPremium();
      if (snap) {
        setResult(snap);
        setIsScanOpen(true);
        clearScanSnapshotForPremium();
      }
    } else {
      setResult(null);
      setIsScanOpen(true);
    }

    router.replace("/", { scroll: false });
  }, [searchParams, router]);

  /** Dev / staging: `/?demo=1` opens the real ResultCard with static data (no API). */
  useEffect(() => {
    if (!demoEntryAllowed) return;
    if (searchParams.get(DEMO_RESULT_QUERY) !== DEMO_RESULT_QUERY_VALUE) return;
    if (searchParams.get("openScan") === "1") return;

    setResult(DEMO_SCAN_RESULT);
    setIsScanOpen(true);
    router.replace("/", { scroll: false });
  }, [demoEntryAllowed, searchParams, router]);

  function openScan() {
    setIsScanOpen(true);
  }

  function openDemoResult() {
    setResult(DEMO_SCAN_RESULT);
    setIsScanOpen(true);
  }

  function closeScan() {
    setIsScanOpen(false);
    setResult(null);
    clearScanSnapshotForPremium();
  }

  function resetScan() {
    setResult(null);
    clearScanSnapshotForPremium();
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

          <div className="landing-hero-inner">
            <div className="landing-hero-copy landing-reveal landing-reveal-delay-1">
              <h1 className="landing-hero-title">
                Prüfe, wie sichtbar deine{" "}
                <span className="landing-hero-em">Identität</span> online ist.
              </h1>

              <p className="landing-lead landing-lead--hero">
                ID Radar analysiert öffentlich sichtbare Online-Signale und zeigt
                in Sekunden, wie exponiert deine Identität wirkt.
              </p>

              <div className="landing-actions landing-actions--hero">
                <button
                  type="button"
                  className="primary-button landing-cta landing-cta--hero landing-tap"
                  onClick={openScan}
                >
                  Jetzt Identität prüfen
                </button>

                <a
                  href="#wie-es-funktioniert"
                  className="landing-secondary-link landing-secondary-link--hero landing-tap"
                >
                  Ablauf ansehen
                </a>

                {demoEntryAllowed ? (
                  <button
                    type="button"
                    className="landing-demo-trigger landing-tap"
                    onClick={openDemoResult}
                  >
                    Demo-Ergebnis anzeigen
                    <span className="landing-demo-trigger-note">ohne API-Scan</span>
                  </button>
                ) : null}
              </div>

              <p className="landing-hero-trust-micro">
                <span>Keine dauerhafte Speicherung</span>
                <span className="landing-hero-trust-sep" aria-hidden="true">
                  ·
                </span>
                <span>Nur öffentlich sichtbare Informationen</span>
              </p>
            </div>

            <div className="landing-hero-visual landing-reveal landing-reveal-delay-2">
              <HeroRadarVisual />
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

              {demoEntryAllowed ? (
                <button
                  type="button"
                  className="landing-demo-trigger landing-demo-trigger--footer landing-tap"
                  onClick={openDemoResult}
                >
                  Demo-Ergebnis anzeigen
                  <span className="landing-demo-trigger-note">ohne API-Scan</span>
                </button>
              ) : null}
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
              <ResultCard
                result={result}
                onReset={resetScan}
                detailUnlocked={detailUnlocked}
              />
            ) : (
              <>
                {demoEntryAllowed ? (
                  <div className="scan-demo-entry">
                    <button
                      type="button"
                      className="scan-demo-entry-button landing-tap"
                      onClick={openDemoResult}
                    >
                      Demo-Ergebnis anzeigen
                    </button>
                    <span className="scan-demo-entry-hint">
                      Vorschau mit Beispieldaten — kein API-Verbrauch
                    </span>
                  </div>
                ) : null}
                <ScanForm onResult={setResult} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
