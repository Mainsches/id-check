import type { ScanResponse } from "@/types/scan";

export type KiGuidedSections = {
  wasAuffaellt: string[];
  warumRelevant: string[];
  wasDuTunKannst: string[];
};

function clampBullets(items: string[], max: number): string[] {
  const out = items.filter(Boolean);
  return out.slice(0, max);
}

/**
 * Builds three short bullet lists for KI-Einordnung from the real scan payload
 * (risk, rawSignals, findings, recommendations) — not generic filler.
 */
export function getKiGuidedSections(result: ScanResponse): KiGuidedSections {
  const { riskScore, riskLevel, findings, recommendations } = result;
  const rs = result.rawSignals;

  const was: string[] = [];
  const warum: string[] = [];
  const tun: string[] = [];

  if (riskLevel === "High") {
    was.push(`Die Gesamtbewertung liegt bei ${riskScore} von 100 — das liegt im oberen Bereich.`);
  } else if (riskLevel === "Medium") {
    was.push(`Die Gesamtbewertung liegt bei ${riskScore} von 100 — im mittleren Bereich.`);
  } else {
    was.push(`Die Gesamtbewertung liegt bei ${riskScore} von 100 — eher zurückhaltend.`);
  }

  if (rs.publicResultsCount >= 8_000) {
    was.push("In Suchergebnissen tauchst du sehr oft auf — das fällt schnell auf.");
  } else if (rs.publicResultsCount >= 1_200) {
    was.push("In Suchergebnissen bist du merklich präsent.");
  } else if (rs.publicResultsCount > 0) {
    was.push("In der Suche gibt es einige Treffer, die zu dir passen könnten.");
  }

  if (rs.socialProfilesCount > 0) {
    was.push(
      rs.socialProfilesCount === 1
        ? "Es gibt mindestens einen öffentlichen Profil-Hinweis, der zu dir passen könnte."
        : `Es gibt ${rs.socialProfilesCount} Profil-Hinweise auf verschiedenen Plattformen.`
    );
  }

  const dirFinding = findings.find((f) => f.label === "Directory / people-search pages");
  if (dirFinding && (dirFinding.status === "danger" || dirFinding.status === "warning")) {
    was.push("In Verzeichnissen oder Personensuchen gibt es Treffer auf dich.");
  }

  if (rs.usernameExposureCount > 0) {
    was.push("Derselbe oder ein ähnlicher Benutzername taucht mehrfach auf.");
  }

  if (rs.exactNameMatches >= 3) {
    was.push("Mehrere Treffer passen sehr klar zu deinem Namen.");
  } else if (rs.exactNameMatches >= 1) {
    was.push("Es gibt klare Namens-Treffer, die dich gut erkennbar machen.");
  }

  if (was.length === 1 && riskLevel === "Low") {
    was.push("Öffentliche Hinweise wirken insgesamt eher dünn — das ist beruhigend.");
  }

  if (riskLevel === "High") {
    warum.push(
      "Wenn viele öffentliche Spuren zusammenpassen, kann jemand dich schneller eindeutig zuordnen — auch ohne Zugang zu privaten Daten."
    );
    warum.push("Das betrifft vor allem Nachvollziehbarkeit: was online steht, lässt sich oft kombinieren.");
  } else if (riskLevel === "Medium") {
    warum.push(
      "Mitte bedeutet: Es gibt genug Anknüpfungspunkte, dass gezielte Suche nicht ins Leere läuft."
    );
    warum.push("Das ist kein Urteil über dich — sondern über die Spur, die öffentlich sichtbar ist.");
  } else {
    warum.push("Weniger dichte öffentliche Spuren erschweren typischerweise ein schnelles Gesamtbild.");
    warum.push("Das senkt das Risiko, dass Fremde dich leicht „zusammensetzen“.");
  }

  if (rs.socialProfilesCount > 0) {
    warum.push("Profile sind besonders wertvoll für Zuordnung, weil dort oft Name, Ort oder Texte stehen.");
  }

  if (rs.publicResultsCount >= 1_200) {
    warum.push("Viele Suchtreffer erhöhen die Chance, dass Dritte dich finden, ohne tief graben zu müssen.");
  }

  for (const rec of recommendations.slice(0, 4)) {
    const d = rec.description.replace(/\s+/g, " ").trim();
    const short = d.length > 72 ? `${d.slice(0, 69).trim()}…` : d;
    tun.push(`${rec.title}: ${short}`);
  }

  if (tun.length === 0) {
    tun.push("Weniger identische Daten an mehreren Stellen gleich veröffentlichen.");
    tun.push("Nach Profil- oder Namensänderungen den Check einmal wiederholen.");
  }

  if (riskLevel !== "Low" && tun.length < 3) {
    tun.push("Die Karten unten bei „Empfehlungen“ vertiefen jeden Schritt.");
  }

  return {
    wasAuffaellt: clampBullets(was, 4),
    warumRelevant: clampBullets(warum, 4),
    wasDuTunKannst: clampBullets(tun, 4),
  };
}
