"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  const [ackTap, setAckTap] = useState(false);
  const ackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (ackTimerRef.current != null) window.clearTimeout(ackTimerRef.current);
    };
  }, []);

  const handleVeilClick = () => {
    if (ackTimerRef.current != null) window.clearTimeout(ackTimerRef.current);
    setAckTap(true);
    ackTimerRef.current = window.setTimeout(() => {
      setAckTap(false);
      ackTimerRef.current = null;
    }, 280);
    onUnlock();
  };

  return (
    <div className={`locked-sensitive ${locked ? "locked-sensitive--locked" : ""}`}>
      <div className="locked-sensitive-main" aria-hidden={locked}>
        {children}
      </div>
      {locked ? (
        <button
          type="button"
          className={`locked-sensitive-veil${ackTap ? " locked-sensitive-veil--ack" : ""}`}
          onClick={handleVeilClick}
          aria-label={overlayLabel}
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
