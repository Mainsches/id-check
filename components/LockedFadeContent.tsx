"use client";

import type { CSSProperties, ReactNode } from "react";

type LockedFadeContentProps = {
  locked: boolean;
  children: ReactNode;
  /** Approximate visible lines when locked (mobile-friendly) */
  maxLines?: number;
};

export default function LockedFadeContent({
  locked,
  children,
  maxLines = 5,
}: LockedFadeContentProps) {
  return (
    <div
      className={`locked-fade-wrap ${locked ? "locked-fade-wrap--on" : ""}`}
      style={
        locked
          ? ({
              ["--locked-fade-lines" as string]: String(maxLines),
            } as CSSProperties)
          : undefined
      }
    >
      {children}
      {locked ? <div className="locked-fade-mask" aria-hidden /> : null}
    </div>
  );
}
