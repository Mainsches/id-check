import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium · ID Radar",
  description:
    "Erweitere deine Analyse: unbegrenzte Scans, tiefere Risiko-Einblicke und mehr Kontrolle über deine digitale Identität.",
};

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
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const, "aria-hidden": true as const };
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

export default function PremiumPage() {
  return (
    <div className="premium-page">
      <div className="premium-page-glow premium-page-glow--one" aria-hidden />
      <div className="premium-page-glow premium-page-glow--two" aria-hidden />

      <main className="premium-page-main">
        <header className="premium-hero">
          <span className="premium-hero-kicker">ID Radar Premium</span>
          <h1 className="premium-hero-title">Erhalte volle Kontrolle über deine digitale Identität</h1>
          <p className="premium-hero-sub">
            Gehe über den kostenlosen Scan hinaus und analysiere deine Online-Präsenz in Tiefe.
          </p>
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
              Premium
            </h2>
            <p className="premium-pricing-amount">
              <span className="premium-pricing-currency">CHF</span> 4.99
              <span className="premium-pricing-period"> / Monat</span>
            </p>
            <p className="premium-pricing-note">Jederzeit kündbar · Preis kann sich vor Start ändern</p>
            <button type="button" className="premium-pricing-cta" disabled aria-describedby="premium-status-msg">
              Premium freischalten
            </button>
            <p id="premium-status-msg" className="premium-pricing-status">
              Bezahlfunktion folgt in Kürze
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
