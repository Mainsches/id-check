"use client";

import type { ComponentType } from "react";
import { Archive, EyeOff, Shield, Unlink } from "lucide-react";

type IconProps = { className?: string; size?: number; strokeWidth?: number; "aria-hidden"?: boolean };

type ProtectionItem = {
  Icon: ComponentType<IconProps>;
  title: string;
  line: string;
};

const ITEMS: ProtectionItem[] = [
  {
    Icon: Shield,
    title: "Accounts absichern",
    line: "Setze für sichtbare Konten starke, einzigartige Passwörter und schalte Zwei-Faktor-Authentifizierung ein, wo immer es angeboten wird.",
  },
  {
    Icon: Unlink,
    title: "Profile weniger verknüpfbar machen",
    line: "Wiederhole nicht überall denselben Nutzernamen, dieselbe Bio und dieselben Links — sonst lässt sich dein öffentliches Profil wie ein Puzzle zusammensetzen.",
  },
  {
    Icon: EyeOff,
    title: "Öffentliche Details zurücknehmen",
    line: "Prüfe, was wirklich sichtbar sein muss: Standort, Bio, Bilder oder alte Angaben — oft reicht schon eine Reduktion für spürbar weniger Treffer.",
  },
  {
    Icon: Archive,
    title: "Alte Spuren bereinigen",
    line: "Schließe oder entschärfe ungenutzte Accounts, die noch in Suchmaschinen auftauchen — vergessene Profile sind ein beliebter Hebel für Fremde.",
  },
];

type AccountProtectionModuleProps = {
  id?: string;
  className?: string;
};

/**
 * Practical “next steps” protection module — structured actions, not a generic tip list.
 */
export default function AccountProtectionModule({
  id = "export-account-hinweise",
  className = "",
}: AccountProtectionModuleProps) {
  return (
    <section
      className={`account-protection ${className}`.trim()}
      id={id}
      aria-labelledby="account-protection-heading"
    >
      <p className="account-protection-kicker">So begrenzt du deine öffentliche Angriffsfläche — konkret</p>
      <h3 id="account-protection-heading" className="account-protection-title">
        Accounts &amp; Zugänge
      </h3>
      <p className="account-protection-lead">
        Vier Schritte, die du direkt nach diesem Scan umsetzen kannst — ohne Security-Kurs, mit spürbar weniger
        Risiko in der Öffentlichkeit.
      </p>

      <div className="account-protection-grid" role="list">
        {ITEMS.map(({ Icon, title, line }) => (
          <div key={title} className="account-protection-item" role="listitem">
            <div className="account-protection-item-icon" aria-hidden>
              <Icon size={18} strokeWidth={1.65} />
            </div>
            <div className="account-protection-item-body">
              <h4 className="account-protection-item-title">{title}</h4>
              <p className="account-protection-item-line">{line}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
