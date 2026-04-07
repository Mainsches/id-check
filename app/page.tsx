"use client";

import { useState } from "react";
import ScanForm from "@/components/ScanForm";
import ResultCard from "@/components/ResultCard";
import { ScanResponse } from "@/types/scan";

export default function HomePage() {
  const [result, setResult] = useState<ScanResponse | null>(null);

  return (
    <main className="page-shell">
      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />

      <section className="hero-wrap">
        {!result ? (
          <ScanForm onResult={setResult} />
        ) : (
          <ResultCard result={result} onReset={() => setResult(null)} />
        )}
      </section>
    </main>
  );
}