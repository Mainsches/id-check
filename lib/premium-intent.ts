/**
 * Purchase intents (UI: AI Deep Scan vs. AI Deep Analyse) — keep in sync with query params and copy.
 */
export const PREMIUM_INTENT_QUERY = "intent";

export const PREMIUM_INTENT = {
  /** User has a scan result open; payment unlocks full detail for this result only. */
  UNLOCK_EXISTING_RESULT: "unlock_existing_result",
  /** User hit daily limit; payment grants one server-recognized scan that bypasses the free limit. */
  BUY_PREMIUM_SCAN: "buy_premium_scan",
} as const;

export type PremiumIntentValue = (typeof PREMIUM_INTENT)[keyof typeof PREMIUM_INTENT];

export function isPremiumIntent(value: string | null | undefined): value is PremiumIntentValue {
  return (
    value === PREMIUM_INTENT.UNLOCK_EXISTING_RESULT ||
    value === PREMIUM_INTENT.BUY_PREMIUM_SCAN
  );
}

export function parsePremiumIntent(
  value: string | null | undefined
): PremiumIntentValue | null {
  if (!value) return null;
  return isPremiumIntent(value) ? value : null;
}

/** Default when landing on /premium without a valid intent (bookmark, shared link). */
export const DEFAULT_PREMIUM_INTENT = PREMIUM_INTENT.BUY_PREMIUM_SCAN;
