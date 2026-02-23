/**
 * POST /api/bank/connect
 *
 * Initiates a Neonomics bank connection for the authenticated user.
 * Returns a redirect URL that sends the user to their bank's BankID page.
 *
 * Flow:
 *   1. User sends { bankId } — the Neonomics bank identifier (e.g. "dnb-no")
 *   2. We create a Neonomics session for that bank
 *   3. We fetch the consent/SCA redirect URL from Neonomics
 *   4. We save a pending bank_connection record in our database
 *   5. We return { redirectUrl } — client redirects the user there
 *
 * After BankID authentication, Neonomics redirects to /api/bank/callback.
 */

import { createClient } from '@/lib/supabase/server'
import { neonomics } from '@/lib/neonomics/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// ── Input validation ─────────────────────────────────────────────────────────
// Bank IDs from Neonomics are base64-encoded strings (e.g. "RG5iLm5vLnYxRE5CQU5PS0s=").
// We no longer validate against a hardcoded list — Neonomics will reject unknown IDs
// directly, and the hardcoded list would require constant maintenance as banks change.

const ConnectSchema = z.object({
  bankId: z.string().min(1).max(200),
  /** Human-readable bank name from the /api/bank/list response */
  bankName: z.string().min(1).max(100).optional(),
})

// ── POST /api/bank/connect ───────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. VALIDATE INPUT
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ConnectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const { bankId, bankName: clientBankName } = parsed.data

  // 3. Use the name sent by the client (from /api/bank/list), fall back to bankId
  const bankName = clientBankName ?? bankId

  try {
    // 4. We use the user's UUID as the device ID — stable and unique per user
    const deviceId = user.id

    // 5. Build the callback URL from NEXT_PUBLIC_APP_URL.
    //    This automatically resolves to the right URL in every environment:
    //    - Dev:        http://localhost:3000/api/bank/callback
    //    - Production: https://your-domain.com/api/bank/callback  (set NEXT_PUBLIC_APP_URL in Vercel)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/bank/callback`

    // 6. Create a Neonomics session for this bank.
    let session
    try {
      session = await neonomics.createSession(bankId, deviceId)
    } catch (err) {
      console.error(`[BANK_CONNECT] Session creation failed for user ${user.id}:`, err instanceof Error ? err.message : 'Unknown')
      return NextResponse.json(
        { error: 'Could not connect to the bank service. Please try again.' },
        { status: 502 }
      )
    }

    const sessionId = session.sessionId

    // 7. Get the consent (SCA redirect) URL, passing our callback URL so
    //    Neonomics knows where to send the user after BankID authentication.
    let consent
    try {
      consent = await neonomics.getConsent(sessionId, deviceId, redirectUri)
    } catch (err) {
      console.error(`[BANK_CONNECT] Consent fetch failed for user ${user.id}:`, err instanceof Error ? err.message : 'Unknown')
      return NextResponse.json(
        { error: 'Could not initiate bank authentication. Please try again.' },
        { status: 502 }
      )
    }

    const scaRedirectUrl = consent.links?.scaRedirect
    if (!scaRedirectUrl) {
      console.error(`[BANK_CONNECT] No scaRedirect URL returned for user ${user.id}`)
      return NextResponse.json(
        { error: 'Bank authentication URL not available. Please try again.' },
        { status: 502 }
      )
    }

    // 8. Save a pending bank_connection in our database.
    //    Status = 'pending' until the callback confirms authentication.
    //    If the same session already exists, upsert to avoid duplicates.
    const { error: dbError } = await supabase.from('bank_connections').insert({
      user_id: user.id,
      neonomics_session_id: sessionId,
      bank_name: bankName,
      bank_id: bankId,
      status: 'pending',
    })

    if (dbError) {
      console.error(`[BANK_CONNECT] DB error for user ${user.id}:`, dbError.message)
      return NextResponse.json(
        { error: 'Failed to save bank connection. Please try again.' },
        { status: 500 }
      )
    }

    // 9. Return the redirect URL to the client unchanged.
    //    Do NOT modify the scaRedirect URL — it may be signed and adding
    //    query params would break it.
    //    The callback identifies the session via the sessionId Neonomics
    //    includes in its redirect back, or falls back to the most recent
    //    pending connection for this user.
    return NextResponse.json({
      redirectUrl: scaRedirectUrl,
      sessionId,
    })
  } catch (error) {
    console.error(`[BANK_CONNECT] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
