"use client";

import type { ScanResponse } from "@/types/scan";
import { getResultViewKey } from "@/lib/result-view-key";

const SNAPSHOT_KEY = "idradar:last_scan_snapshot";

export function saveScanSnapshotForPremium(result: ScanResponse): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(result));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadScanSnapshotForPremium(): ScanResponse | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScanResponse;
  } catch {
    return null;
  }
}

export function clearScanSnapshotForPremium(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

export function setResultDetailUnlockedForKey(viewKey: string): void {
  try {
    sessionStorage.setItem(`idradar:unlocked:${viewKey}`, "1");
  } catch {
    /* ignore */
  }
}

export function isResultDetailUnlocked(result: ScanResponse): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = getResultViewKey(result);
    return sessionStorage.getItem(`idradar:unlocked:${key}`) === "1";
  } catch {
    return false;
  }
}
