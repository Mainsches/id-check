"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEFAULT_PREMIUM_INTENT,
  parsePremiumIntent,
  PREMIUM_INTENT,
  PREMIUM_INTENT_QUERY,
  type PremiumIntentValue,
} from "@/lib/premium-intent";
import { loadScanSnapshotForPremium, setResultDetailUnlockedForKey } from "@/lib/premium-client-storage";
import { getResultViewKey } from "@/lib/result-view-key";

const FEATURES = [
  {
    title: "Unbegrenzte Scans",
    body: "Analysiere so oft du willst — ohne Tageslimit.",
    icon: "scan",
  },
  {
    title: "Erweiterte Risikoanalyse",
    body: "Schärfere Einschätzung deiner Online-Sichtbarkeit und Verknüpfungen.",
    icon: "chart",
  },
  {
    title: "Detaillierte Plattform-Erkennung",
    body: "Klarere Zuordnung von Signalen über Netzwerke und Profile hinweg.",
    icon: "grid",
  },
  {
    title: "Frühwarnsystem für neue Signale",
    body: "Erkenne neue öffentliche Spuren früher — wenn du es aktivierst.",
    icon: "bell",
  },
] as const;

function FeatureIcon({ name }: { name: (typeof FEATURES)[number]["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "scan":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity={0.35} />
          <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity={0.5} />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 15v-4M12 15V9M16 15v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"
            fill="currentColor"
            opacity={0.35}
          />
          <path
            d="M6 16h12l-1-1.2V10a6 6 0 1 0-12 0v4.8L6 16Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function copyForIntent(intent: PremiumIntentValue) {
  if (intent === PREMIUM_INTENT.UNLOCK_EXISTING_RESULT) {
    return {
      kicker: "ID Radar Premium",
      title: "Vollständige Analyse freischalten",
      sub: "Dieser Scan ist bereits bereit — schalte alle Treffer, Plattformen und Erklärungen für dieses Ergebnis frei.",
      pricingLabel: "Einmalig für dieses Ergebnis",
      cta: "Vollständige Analyse freischalten",
      footnote: "Nach Zahlung siehst du sofort alle Details — ohne neuen Scan.",
    };
  }
  return {
    kicker: "ID Radar Premium",
    title: "Premium-Scan freischalten",
    sub: "Starte jetzt eine vollständige Analyse — mit einem neuen Scan ohne Tageslimit.",
    pricingLabel: "Premium",
    cta: "Jetzt vollständigen Scan starten",
    footnote: "Nach Zahlung kannst du sofort einen Premium-Scan ausführen.",
  };
}

export default function PremiumUpgradeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const intent = useMemo(() => {
    const raw = searchParams.get(PREMIUM_INTENT_QUERY);
    return parsePremiumIntent(raw) ?? DEFAULT_PREMIUM_INTENT;
  }, [searchParams]);

  const copy = copyForIntent(intent);

  async function simulatePayment() {
    setError("");
    setBusy(true);
    try {
      if (intent === PREMIUM_INTENT.UNLOCK_EXISTING_RESULT) {
        const snap = loadScanSnapshotForPremium();
        if (!snap) {
          setError(
            "Kein gespeichertes Ergebnis. Bitte starte zuerst einen Scan und öffne das Ergebnis."
          );
          return;
        }

        const res = await fetch("/api/premium/mock-grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

        if (!res.ok || !data.ok) {
          setError(typeof data.error === "string" ? data.error : "Aktion fehlgeschlagen.");
          return;
        }

        setResultDetailUnlockedForKey(getResultViewKey(snap));
        router.push("/?openScan=1&showResult=1");
        return;
      }

      const res = await fetch("/api/premium/mock-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: PREMIUM_INTENT.BUY_PREMIUM_SCAN }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "Aktion fehlgeschlagen.");
        return;
      }

      router.push("/?openScan=1");
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="premium-page">
      <div className="premium-page-glow premium-page-glow--one" aria-hidden />
      <div className="premium-page-glow premium-page-glow--two" aria-hidden />

      <main className="premium-page-main">
        <header className="premium-hero">
          <span className="premium-hero-kicker">{copy.kicker}</span>
          <h1 className="premium-hero-title">{copy.title}</h1>
          <p className="premium-hero-sub">{copy.sub}</p>
        </header>

        <section className="premium-features" aria-labelledby="premium-features-heading">
          <h2 id="premium-features-heading" className="visually-hidden">
            Premium-Funktionen
          </h2>
          <ul className="premium-feature-grid">
            {FEATURES.map((f) => (
              <li key={f.title} className="premium-feature-card">
                <div className="premium-feature-icon" aria-hidden>
                  <FeatureIcon name={f.icon} />
                </div>
                <div className="premium-feature-text">
                  <h3 className="premium-feature-title">{f.title}</h3>
                  <p className="premium-feature-body">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="premium-pricing" aria-labelledby="premium-pricing-heading">
          <div className="premium-pricing-card">
            <h2 id="premium-pricing-heading" className="premium-pricing-label">
              {copy.pricingLabel}
            </h2>
            <p className="premium-pricing-amount">
              <span className="premium-pricing-currency">CHF</span> 4.99
              <span className="premium-pricing-period"> / Monat</span>
            </p>
            <p className="premium-pricing-note">Jederzeit kündbar · Preis kann sich vor Start ändern</p>
            <button
              type="button"
              className="premium-pricing-cta premium-pricing-cta--active"
              onClick={simulatePayment}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Wird vorbereitet…" : copy.cta}
            </button>
            {error ? <p className="premium-pricing-error">{error}</p> : null}
            <p className="premium-pricing-status" id="premium-status-msg">
              Bezahlfunktion folgt in Kürze · {copy.footnote}
            </p>
          </div>
        </section>

        <p className="premium-back-wrap">
          <Link href="/" className="premium-back-link">
            Zurück
          </Link>
        </p>
      </main>
    </div>
  );
}
