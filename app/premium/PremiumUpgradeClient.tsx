"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEFAULT_PREMIUM_INTENT,
  parsePremiumIntent,
  PREMIUM_INTENT,
  PREMIUM_INTENT_QUERY,
} from "@/lib/premium-intent";
import { loadScanSnapshotForPremium, setResultDetailUnlockedForKey } from "@/lib/premium-client-storage";
import { getResultViewKey } from "@/lib/result-view-key";

const FEATURES = [
  {
    title: "Alle Treffer sichtbar",
    body: "Profile, Hinweise und Verknüpfungen — auf einen Blick.",
    icon: "grid",
  },
  {
    title: "Risiko verständlich erklärt",
    body: "Klare Einordnung — ohne Fachjargon.",
    icon: "chart",
  },
  {
    title: "Nächste Schritte",
    body: "Konkret — was du jetzt tun kannst.",
    icon: "scan",
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
    default:
      return null;
  }
}

/** Conversion-focused copy: one-time unlock, results-first (same hero for both intents). */
const HERO = {
  kicker: "ID Radar",
  title: "Vollständige Analyse freischalten",
  sub: "Dein Scan ist bereits bereit — sieh jetzt, welche Profile und Verknüpfungen gefunden wurden.",
} as const;

const PRICING = {
  amount: "4.90",
  subline: "Einmal freischalten – sofort alle Treffer und Details sehen",
  micro: "Kein Abo. Kein Login erforderlich.",
  trigger: "Dein Ergebnis ist bereits analysiert",
  urgency: "Nur noch gesperrt – mit einem Klick sichtbar",
  cta: "Jetzt vollständigen Scan anzeigen",
  status: "Bezahlfunktion folgt in Kürze",
} as const;

export default function PremiumUpgradeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const intent = useMemo(() => {
    const raw = searchParams.get(PREMIUM_INTENT_QUERY);
    return parsePremiumIntent(raw) ?? DEFAULT_PREMIUM_INTENT;
  }, [searchParams]);

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
          <span className="premium-hero-kicker">{HERO.kicker}</span>
          <h1 className="premium-hero-title">{HERO.title}</h1>
          <p className="premium-hero-sub">{HERO.sub}</p>
        </header>

        <section className="premium-features" aria-labelledby="premium-features-heading">
          <h2 id="premium-features-heading" className="visually-hidden">
            Was du siehst
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
            <h2 id="premium-pricing-heading" className="visually-hidden">
              Preis
            </h2>
            <p className="premium-pricing-amount premium-pricing-amount--onetime">
              <span className="premium-pricing-currency">CHF</span> {PRICING.amount}
              <span className="premium-pricing-onetime"> einmalig</span>
            </p>
            <p className="premium-pricing-note">{PRICING.subline}</p>
            <p className="premium-pricing-micro">{PRICING.micro}</p>
            <p className="premium-pricing-trigger">{PRICING.trigger}</p>
            <p className="premium-pricing-urgency">{PRICING.urgency}</p>
            <button
              type="button"
              className="premium-pricing-cta premium-pricing-cta--active"
              onClick={simulatePayment}
              disabled={busy}
              aria-busy={busy}
              aria-describedby="premium-status-msg"
            >
              {busy ? "Einen Moment…" : PRICING.cta}
            </button>
            {error ? <p className="premium-pricing-error">{error}</p> : null}
            <p className="premium-pricing-status" id="premium-status-msg">
              {PRICING.status}
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
