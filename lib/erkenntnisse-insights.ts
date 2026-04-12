import type { FindingItem } from "@/types/scan";

/** Keys map to Lucide icons in `ResultCard` (keeps this module server-safe / tree-shake friendly). */
export type ErkenntnisIconId = "eye" | "link" | "user" | "alert" | "list" | "hash";

export type ErkenntnisInsight = {
  iconId: ErkenntnisIconId;
  title: string;
  explanation: string;
  meaning: string;
};

function firstInteger(value: string): number | null {
  const compact = value.replace(/['’\s]/g, "").replace(/\./g, "");
  const match = compact.match(/(\d+)/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function parseRiskScoreFromCore(value: string): number | null {
  const m = value.match(/(\d+)\s*\/\s*100/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function parseVisibilityWeight(value: string): number | null {
  const m = value.match(/\(\s*(\d+)\s*\/\s*10/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Structured Erkenntnisse: title, plain explanation, and explicit “what this means for you”.
 * Copy avoids internal terms (e.g. Gewichtung, Index, Signale).
 */
export function getErkenntnisInsight(finding: FindingItem): ErkenntnisInsight {
  const { label, value } = finding;

  if (label === "Identity theft risk core") {
    const score = parseRiskScoreFromCore(value);
    if (score === null) {
      return {
        iconId: "link",
        title: "Gesamteinordnung",
        explanation:
          "Aus mehreren öffentlichen Quellen ergibt sich ein Bild davon, wie gut man dich wiedererkennen kann.",
        meaning:
          "Du siehst hier die Summe — nicht ein einzelnes Detail. So lässt sich einschätzen, wie leicht jemand online zu einem klaren Profil von dir kommt.",
      };
    }
    if (score >= 70) {
      return {
        iconId: "alert",
        title: "Hoher Zusammenhang",
        explanation:
          "Viele öffentliche Spuren passen gut zusammen — Suchtreffer, Listen und Profile stützen sich gegenseitig.",
        meaning:
          "Interessierte Personen können dich mit überschaubarem Aufwand finden und zuordnen. Lohnt sich, gezielt nachzusteuern.",
      };
    }
    if (score >= 40) {
      return {
        iconId: "link",
        title: "Mittlerer Zusammenhang",
        explanation:
          "Es gibt mehrere Stellen, an denen Infos auf dich hindeuten — nicht extrem, aber spürbar.",
        meaning:
          "Wer gezielt sucht, findet Anknüpfungspunkte. Mit wenigen Anpassungen lässt sich das meist beruhigen.",
      };
    }
    return {
      iconId: "link",
      title: "Ruhiges Bild",
      explanation: "Öffentlich sichtbare Hinweise wirken insgesamt eher dünn verstreut.",
      meaning:
        "Das ist eine gute Ausgangslage. Halte bewusst wenig identische Daten überall gleich — dann bleibt es ruhig.",
    };
  }

  if (label === "Public visibility") {
    const count = firstInteger(value);
    const weight = parseVisibilityWeight(value);
    const highCount = count !== null && count >= 8_000;
    const midCount = count !== null && count >= 1_200;
    const highWeight = weight !== null && weight >= 7;
    const midWeight = weight !== null && weight >= 4;

    if (highCount || highWeight) {
      return {
        iconId: "eye",
        title: "Leicht auffindbar",
        explanation: "Dein Name erscheint häufig in Suchergebnissen und ähnlichen Treffern.",
        meaning:
          "Andere können dich relativ einfach online finden und Schritt für Schritt Informationen über dich sammeln.",
      };
    }
    if (midCount || midWeight) {
      return {
        iconId: "eye",
        title: "Merkbare Sichtbarkeit",
        explanation: "Du bist online sichtbar — nicht unsichtbar, aber auch nicht überall dominant.",
        meaning:
          "Mit etwas Suche findet man dich. Prüfe, ob alte Seiten oder Einträge noch nötig sind.",
      };
    }
    return {
      iconId: "eye",
      title: "Weniger im Fokus",
      explanation: "In der Suche tauchst du nur vereinzelt oder wenig aussagekräftig auf.",
      meaning:
        "Das erschwert es, schnell ein dichtes Bild von dir zu bauen — ein Plus für deine Ruhe online.",
    };
  }

  if (label === "Directory / people-search pages") {
    if (/^Keine\b/i.test(value.trim())) {
      return {
        iconId: "list",
        title: "Keine Listen-Treffer",
        explanation: "In typischen Adress- und Personensuchen fällt nichts Relevantes auf.",
        meaning:
          "Weniger öffentliche „Steckbriefe“ an den Stellen, wo Menschen oft zuerst suchen — das entlastet.",
      };
    }
    const n = firstInteger(value) ?? 0;
    if (n >= 3) {
      return {
        iconId: "list",
        title: "Mehrfach in Listen",
        explanation: "Du wirst in mehreren Verzeichnissen oder Personensuchen gefunden.",
        meaning:
          "Dort stehen oft gebündelte Angaben. Das macht es anderen leicht, dich schnell zu erfassen.",
      };
    }
    if (n >= 1) {
      return {
        iconId: "list",
        title: "In Listen gefunden",
        explanation: "Mindestens ein Treffer in Verzeichnissen oder Personensuchen.",
        meaning:
          "Solche Treffer sind oft klar lesbar. Lohnt sich, zu prüfen, ob Eintrag oder Daten noch nötig sind.",
      };
    }
    return {
      iconId: "list",
      title: "Listen",
      explanation: "Verzeichnisse spielen für diese Auswertung kaum eine Rolle.",
      meaning: "Ein Punkt weniger, über den dich andere schnell finden.",
    };
  }

  if (label === "Username reuse exposure") {
    if (/Nicht geprüft/i.test(value)) {
      return {
        iconId: "hash",
        title: "Benutzername fehlt",
        explanation: "Ohne Benutzername konnten wir diesen Teil nicht prüfen.",
        meaning:
          "Wenn du später einen Nutzernamen angibst, wird klarer, ob derselbe Name dich über mehrere Seiten verbindet.",
      };
    }
    if (/^Keine\b/i.test(value.trim())) {
      return {
        iconId: "hash",
        title: "Kein Name-Muster",
        explanation: "Derselbe oder sehr ähnliche Benutzername taucht nicht auffällig auf.",
        meaning:
          "Schwerer, dich nur über den Nutzernamen plattformübergreifend zu verknüpfen — das ist beruhigend.",
      };
    }
    const n = firstInteger(value) ?? 0;
    if (n >= 1) {
      return {
        iconId: "hash",
        title: "Wiederkehrender Name",
        explanation: "Derselbe oder ähnliche Benutzername erscheint an mehreren Stellen.",
        meaning:
          "Das kann wie ein roter Faden wirken: Profile lassen sich leichter deiner Person zuordnen.",
      };
    }
    return {
      iconId: "hash",
      title: "Benutzername",
      explanation: "Hier gibt es keinen klaren Zusatz aus dem Nutzernamen.",
      meaning: "Ein Faktor weniger, über den man dich vernetzen kann.",
    };
  }

  if (label === "Exact identity matches") {
    const n = firstInteger(value) ?? 0;
    if (n >= 3) {
      return {
        iconId: "user",
        title: "Sehr klare Treffer",
        explanation: "Mehrere Treffer passen stark zu deinem Namen und Kontext.",
        meaning:
          "Das erhöht die Chance, dass jemand sich sicher ist, dass es wirklich um dich geht — nicht nur um einen Namensvetter.",
      };
    }
    if (n >= 1) {
      return {
        iconId: "user",
        title: "Klare Treffer",
        explanation: "Es gibt einzelne sehr passende Treffer auf deinen Namen.",
        meaning:
          "Je nach Kontext kann das schon reichen, um dich wiederzuerkennen — auch ohne weitere Beweise.",
      };
    }
    return {
      iconId: "user",
      title: "Wenig Doppelungen",
      explanation: "Sehr eindeutige Namensdopplungen sind selten.",
      meaning: "Dein Name wirkt weniger „mehrfach bestätigt“ — das erschwert falsche Zuordnungen.",
    };
  }

  return {
    iconId: "alert",
    title: "Hinweis",
    explanation: "Dieser Punkt konnte nicht automatisch eingeordnet werden.",
    meaning: "Bitte die Detailansicht oder einen erneuten Scan nutzen, wenn du unsicher bist.",
  };
}
