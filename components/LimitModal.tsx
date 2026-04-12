"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export type LimitModalProps = {
  open: boolean;
  onClose: () => void;
  /** e.g. Stripe or landing section; defaults to NEXT_PUBLIC_PREMIUM_UPGRADE_URL or /#warum */
  premiumHref?: string;
};

function LimitRadarLockIcon({ gradientId, glowId }: { gradientId: string; glowId: string }) {
  return (
    <svg
      className="limit-modal-icon-svg"
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="8" x2="76" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#faf6e8" />
          <stop offset="0.45" stopColor="#e8d48b" />
          <stop offset="1" stopColor="#b8922a" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowId})`}>
        <circle cx="44" cy="44" r="38" stroke={`url(#${gradientId})`} strokeWidth="1.15" opacity={0.28} />
        <circle cx="44" cy="44" r="29" stroke={`url(#${gradientId})`} strokeWidth="1" opacity={0.42} />
        <circle cx="44" cy="44" r="20" stroke={`url(#${gradientId})`} strokeWidth="0.85" opacity={0.55} />
        <path
          d="M44 44 L44 14"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity={0.45}
        />
        <path
          d="M44 44 L68 58"
          stroke={`url(#${gradientId})`}
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity={0.28}
        />
      </g>
      <g>
        <path
          d="M36 40v-5a8 8 0 0 1 16 0v5"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.95}
        />
        <rect
          x="32"
          y="40"
          width="24"
          height="18"
          rx="3.5"
          fill="rgba(5,5,8,0.42)"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
        />
        <circle cx="44" cy="49" r="2.2" fill={`url(#${gradientId})`} />
      </g>
    </svg>
  );
}

const defaultPremiumHref =
  typeof process.env.NEXT_PUBLIC_PREMIUM_UPGRADE_URL === "string" &&
  process.env.NEXT_PUBLIC_PREMIUM_UPGRADE_URL.length > 0
    ? process.env.NEXT_PUBLIC_PREMIUM_UPGRADE_URL
    : "/#warum";

export default function LimitModal({ open, onClose, premiumHref = defaultPremiumHref }: LimitModalProps) {
  const [mounted, setMounted] = useState(false);
  const rawId = useId().replace(/:/g, "");
  const gradientId = `limit-grad-${rawId}`;
  const glowId = `limit-glow-${rawId}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="limit-modal-root" role="presentation">
      <button
        type="button"
        className="limit-modal-backdrop"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        className="limit-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="limit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="limit-modal-icon-wrap" aria-hidden>
          <LimitRadarLockIcon gradientId={gradientId} glowId={glowId} />
        </div>

        <h2 id="limit-modal-title" className="limit-modal-title">
          Limit erreicht
        </h2>
        <p className="limit-modal-lead">
          Du hast deinen kostenlosen Scan für heute bereits verwendet.
        </p>
        <p className="limit-modal-sub">Versuche es morgen erneut oder erhalte unbegrenzte Scans.</p>

        <div className="limit-modal-actions">
          <a className="limit-modal-cta-primary" href={premiumHref} onClick={onClose}>
            Premium freischalten
          </a>
          <button type="button" className="limit-modal-cta-secondary" onClick={onClose}>
            Morgen erneut versuchen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
