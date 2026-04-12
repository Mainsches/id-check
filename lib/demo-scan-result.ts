import type { ScanResponse } from "@/types/scan";

/**
 * Static demo payload for UX / conversion testing without calling the scan API.
 *
 * Enable entry points only when `isDemoScanEntryAllowed()` is true:
 * - development builds (`NODE_ENV === 'development'`), or
 * - `NEXT_PUBLIC_ID_RADAR_RESULT_DEMO=true` in env (e.g. staging).
 */
export function isDemoScanEntryAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ID_RADAR_RESULT_DEMO === "true"
  );
}

/** Query param: `/?demo=1` opens the overlay with this result (when allowed). */
export const DEMO_RESULT_QUERY = "demo";
export const DEMO_RESULT_QUERY_VALUE = "1";

/**
 * Realistic `ScanResponse` matching API shape: core findings, two platform rows,
 * directory + username signals, multi-line summary (teaser + body for ResultCard).
 */
export const DEMO_SCAN_RESULT: ScanResponse = {
  riskScore: 72,
  riskLevel: "High",
  findings: [
    {
      label: "Identity theft risk core",
      value:
        "72/100 Risikowert basierend auf Verknüpfbarkeit und Missbrauchssignalen",
      status: "danger",
    },
    {
      label: "Public visibility",
      value:
        "12'400 indexierte Ergebnisse geschätzt (7/10 Sichtbarkeitsgewichtung)",
      status: "warning",
    },
    {
      label: "Directory / people-search pages",
      value: "1 Verzeichnis-Signal erkannt",
      status: "danger",
    },
    {
      label: "Username reuse exposure",
      value: "2 benutzernamenbezogene Ergebnisse gefunden",
      status: "danger",
    },
    {
      label: "Exact identity matches",
      value: "3 starke Identitätstreffer erkannt",
      status: "warning",
    },
    {
      label: "LinkedIn",
      value: "Starker Treffer",
      status: "danger",
      url: "https://www.linkedin.com/in/sandra-meier-zuerich",
      detail:
        "Es wurde ein starker öffentlicher Treffer anhand deines vollständigen Namens und einer profiltypischen URL gefunden. Quelle: LinkedIn-Profil mit übereinstimmendem Namen und Ortsangabe im Headline-Bereich.",
    },
    {
      label: "Instagram",
      value: "Möglicher Treffer",
      status: "warning",
      url: "https://www.instagram.com/s.meier.zh/",
      detail:
        "Es gibt Hinweise auf einen möglichen Profil-Treffer anhand eines benutzernamenähnlichen Ergebnisses. Quelle: öffentliches Profil mit ähnlichem Handle und wiederkehrendem Initialmuster.",
    },
  ],
  aiSummary: `Deine öffentliche Identität lässt sich relativ leicht über mehrere Quellen hinweg verknüpfen.

Das stärkste Risiko entsteht dadurch, wie einfach jemand deine öffentlichen Informationen plattformübergreifend zusammenführen kann.

Es wurden etwa 12'400 indexierte Ergebnisse gefunden, dazu 1 starke Plattform-Treffer, 1 schwächere Plattform-Treffer, 1 Verzeichnis-Signal, 2 benutzernamenbezogene Signale, 3 starke Identitätstreffer und 2 stadtbezogene Signale.

Sichtbarkeitsgewichtung: 7/10.

Zusätzlich deuten Verzeichnis- und Personensuchtreffer darauf hin, dass Name und Region in aggregierten Listen auffindbar sind — ein typisches Muster bei höherer digitaler Verknüpfbarkeit.`,
  recommendations: [
    {
      title: "Verzeichnis-Einträge entfernen",
      description:
        "Verzeichnis- und Personensuchseiten gehören zu den stärksten Risikosignalen. Dort solltest du zuerst auf Entfernung oder Opt-out setzen.",
    },
    {
      title: "Benutzernamen nicht wiederverwenden",
      description:
        "Verwende auf verschiedenen Plattformen unterschiedliche Benutzernamen, damit deine Identität schwerer verknüpft werden kann.",
    },
    {
      title: "Plattformübergreifende Überschneidungen reduzieren",
      description:
        "Vermeide es, denselben vollständigen Namen, Standort, Profiltexte und Links auf mehreren Plattformen identisch zu verwenden.",
    },
  ],
  rawSignals: {
    publicResultsCount: 12400,
    socialProfilesCount: 2,
    emailLeakCount: 0,
    exactNameMatches: 3,
    usernameExposureCount: 2,
    cityProvided: true,
    emailProvided: false,
  },
};
