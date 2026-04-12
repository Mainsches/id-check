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

/** After daily limit: one new full premium scan (not unlock of existing result). */
const FEATURES_BUY_SCAN = [
  {
    title: "Alle relevanten Treffer sichtbar",
    body: "Profile, Verknüpfungen und Signale in voller Ansicht.",
    icon: "grid",
  },
  {
    title: "Detaillierte Risiko-Einschätzung",
    body: "Klar erklärt, warum deine Identität auffindbar wirkt.",
    icon: "chart",
  },
  {
    title: "Konkrete nächste Schritte",
    body: "Verständliche Hinweise, was du direkt verbessern kannst.",
    icon: "scan",
  },
] as const;

/** Unlock existing partial result (different product promise). */
const FEATURES_UNLOCK = [
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

type FeatureIconName = (typeof FEATURES_BUY_SCAN)[number]["icon"];

function FeatureIcon({ name }: { name: FeatureIconName }) {
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

export default function PremiumUpgradeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const intent = useMemo(() => {
    const raw = searchParams.get(PREMIUM_INTENT_QUERY);
    return parsePremiumIntent(raw) ?? DEFAULT_PREMIUM_INTENT;
  }, [searchParams]);

  const isBuyScan = intent === PREMIUM_INTENT.BUY_PREMIUM_SCAN;

  const hero = isBuyScan
    ? {
        kicker: "ID Radar",
        title: "1 vollständigen Premium-Scan freischalten",
        sub: "Starte jetzt eine neue vollständige Analyse und sieh alle relevanten Treffer, Verknüpfungen und Risiko-Hinweise im Detail.",
      }
    : {
        kicker: "ID Radar",
        title: "Vollständige Analyse freischalten",
        sub: "Dein Scan ist bereits bereit — sieh jetzt, welche Profile und Verknüpfungen gefunden wurden.",
      };

  const features = isBuyScan ? FEATURES_BUY_SCAN : FEATURES_UNLOCK;

  const pricing = isBuyScan
    ? {
        amount: "4.90",
        subline: "Einmal bezahlen – einen vollständigen Premium-Scan erhalten",
        micro: "Kein Abo. Kein Login erforderlich.",
        trigger: "Nach dem Kauf kannst du sofort einen vollständigen Scan starten.",
        cta: "Jetzt Premium-Scan starten",
        status: "Bezahlfunktion folgt in Kürze",
      }
    : {
        amount: "4.90",
        subline: "Einmal freischalten – alle Details dieses Ergebnisses sehen",
        micro: "Kein Abo. Kein Login erforderlich.",
        trigger: "Nach der Zahlung sind alle Inhalte dieses Scans sichtbar.",
        cta: "Jetzt vollständigen Scan anzeigen",
        status: "Bezahlfunktion folgt in Kürze",
      };

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
          <span className="premium-hero-kicker">{hero.kicker}</span>
          <h1 className="premium-hero-title">{hero.title}</h1>
          <p className="premium-hero-sub">{hero.sub}</p>
        </header>

        <section className="premium-features" aria-labelledby="premium-features-heading">
          <h2 id="premium-features-heading" className="visually-hidden">
            {isBuyScan ? "Enthalten in diesem Premium-Scan" : "Was du siehst"}
          </h2>
          <ul className="premium-feature-grid">
            {features.map((f) => (
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
              <span className="premium-pricing-currency">CHF</span> {pricing.amount}
              <span className="premium-pricing-onetime"> einmalig</span>
            </p>
            <p className="premium-pricing-note">{pricing.subline}</p>
            <p className="premium-pricing-micro">{pricing.micro}</p>
            <p className="premium-pricing-trigger">{pricing.trigger}</p>
            {!isBuyScan ? (
              <p className="premium-pricing-urgency">Nur noch gesperrt – mit einem Klick sichtbar</p>
            ) : null}
            <button
              type="button"
              className="premium-pricing-cta premium-pricing-cta--active"
              onClick={simulatePayment}
              disabled={busy}
              aria-busy={busy}
              aria-describedby="premium-status-msg"
            >
              {busy ? "Einen Moment…" : pricing.cta}
            </button>
            {error ? <p className="premium-pricing-error">{error}</p> : null}
            <p className="premium-pricing-status" id="premium-status-msg">
              {pricing.status}
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
