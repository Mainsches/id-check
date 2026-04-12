"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

const DEFAULT_BODY =
  "Diese Liste ist bewusst kuratiert: Es erscheinen nur Plattformen mit klarem oder plausiblen öffentlichen Treffer. Je besser Name, Benutzername, Profiltext und Kontext zusammenpassen, desto vertrauenswürdiger ist der Hinweis — schwache oder zufällige Treffer blenden wir aus, damit du dich auf das Wesentliche konzentrieren kannst.";

type ProfilePlatformsHelpProps = {
  body?: string;
};

/**
 * Help for “Profile & Plattformen”: hover tooltip on fine pointers, tap toggle on touch.
 */
export default function ProfilePlatformsHelp({ body = DEFAULT_BODY }: ProfilePlatformsHelpProps) {
  const rawId = useId().replace(/:/g, "");
  const panelId = `profile-platforms-help-${rawId}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div
      ref={wrapRef}
      className={`platform-help-wrap${open ? " platform-help-open" : ""}`}
    >
      <button
        type="button"
        className={`platform-help-trigger${open ? " platform-help-trigger--open" : ""}`}
        aria-label="Erklärung zu Profilen und Plattformen"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp size={17} strokeWidth={1.65} aria-hidden />
      </button>

      <div id={panelId} className="platform-help-tooltip" role="tooltip">
        <p className="platform-help-tooltip-title">Profil-Hinweise</p>
        <p className="platform-help-tooltip-body">{body}</p>
      </div>
    </div>
  );
}
