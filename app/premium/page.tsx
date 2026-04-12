import type { Metadata } from "next";
import { Suspense } from "react";
import PremiumUpgradeClient from "./PremiumUpgradeClient";

export const metadata: Metadata = {
  title: "Premium · ID Radar",
  description:
    "Erweitere deine Analyse: unbegrenzte Scans, tiefere Risiko-Einblicke und mehr Kontrolle über deine digitale Identität.",
};

function PremiumFallback() {
  return (
    <div className="premium-page premium-page--fallback" aria-busy="true">
      <div className="premium-page-glow premium-page-glow--one" aria-hidden />
      <p className="premium-fallback-text">Laden…</p>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<PremiumFallback />}>
      <PremiumUpgradeClient />
    </Suspense>
  );
}
