import { NextResponse } from "next/server";
import {
  DEFAULT_PREMIUM_INTENT,
  isPremiumIntent,
  PREMIUM_INTENT,
  type PremiumIntentValue,
} from "@/lib/premium-intent";
import { buildPremiumScanAllowanceCookie } from "@/lib/premium-scan-cookie";

export const runtime = "nodejs";

type Body = {
  intent?: string;
};

/**
 * Mock payment success — production path will swap for Stripe webhook / session confirm.
 * - buy_premium_scan: sets HttpOnly cookie so /api/scan can bypass daily limit once.
 * - unlock_existing_result: no server state; client marks unlock in sessionStorage.
 */
export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request." }, { status: 400 });
  }

  const rawIntent = body.intent?.trim();
  const intent: PremiumIntentValue = isPremiumIntent(rawIntent)
    ? rawIntent
    : DEFAULT_PREMIUM_INTENT;

  if (intent === PREMIUM_INTENT.UNLOCK_EXISTING_RESULT) {
    return NextResponse.json({
      ok: true,
      intent,
      clientAction: "unlock_result_session",
    });
  }

  const headers = new Headers();
  headers.append("Set-Cookie", buildPremiumScanAllowanceCookie());

  return NextResponse.json(
    {
      ok: true,
      intent,
      clientAction: "premium_scan_allowance_cookie",
    },
    { headers }
  );
}
