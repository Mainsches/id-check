"use client";

import type { ReactNode } from "react";

type LockedSensitiveBlockProps = {
  locked: boolean;
  onUnlock: () => void;
  children: ReactNode;
  /** Shown on the overlay when locked */
  overlayLabel?: string;
};

export default function LockedSensitiveBlock({
  locked,
  onUnlock,
  children,
  overlayLabel = "Details anzeigen",
}: LockedSensitiveBlockProps) {
  return (
    <div className={`locked-sensitive ${locked ? "locked-sensitive--locked" : ""}`}>
      <div className="locked-sensitive-main" aria-hidden={locked}>
        {children}
      </div>
      {locked ? (
        <button
          type="button"
          className="locked-sensitive-veil"
          onClick={onUnlock}
          aria-label={`${overlayLabel} — Premium freischalten`}
        >
          <span className="locked-sensitive-veil-icon" aria-hidden>
            🔒
          </span>
          <span className="locked-sensitive-veil-text">{overlayLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
