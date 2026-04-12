/**
 * One-shot UI feedback after mock (later: Stripe) purchase — read on home / after scan.
 * Stripe: set the same flags from checkout.session.completed redirect handler.
 */
const SESSION_UNLOCK_TOAST = "idradar:post_purchase_unlock_toast";
const SESSION_DEEP_SCAN_TOAST_PENDING = "idradar:post_purchase_deep_scan_toast_pending";

export function armUnlockSuccessToast(): void {
  try {
    sessionStorage.setItem(SESSION_UNLOCK_TOAST, "1");
  } catch {
    /* private mode */
  }
}

/** Returns true once if armed; clears the flag. */
export function consumeUnlockSuccessToast(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_UNLOCK_TOAST) !== "1") return false;
    sessionStorage.removeItem(SESSION_UNLOCK_TOAST);
    return true;
  } catch {
    return false;
  }
}

/** Call after Flow B mock purchase succeeds — next successful scan result shows toast. */
export function armDeepScanResultToastPending(): void {
  try {
    sessionStorage.setItem(SESSION_DEEP_SCAN_TOAST_PENDING, "1");
  } catch {
    /* ignore */
  }
}

/** Call when a scan result arrives; returns true if this result should trigger the deep-scan toast. */
export function consumeDeepScanResultToastPending(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_DEEP_SCAN_TOAST_PENDING) !== "1") return false;
    sessionStorage.removeItem(SESSION_DEEP_SCAN_TOAST_PENDING);
    return true;
  } catch {
    return false;
  }
}
