/**
 * HttpOnly cookie: one premium scan allowance (bypass free daily limit once).
 * Set by /api/premium/mock-grant; consumed by /api/scan on success.
 */
export const PREMIUM_SCAN_ALLOWANCE_COOKIE = "idradar_psa";

export function buildPremiumScanAllowanceCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = 60 * 60 * 24;
  return `${PREMIUM_SCAN_ALLOWANCE_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function buildClearPremiumScanAllowanceCookie(): string {
  return `${PREMIUM_SCAN_ALLOWANCE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
