/**
 * GET /api/bank/callback
 *
 * Handles the redirect from Neonomics/BankID after the user has authenticated.
 * This is a browser GET request — the user's session cookies are present.
 *
 * Neonomics redirects here with query parameters including the session ID.
 * We accept several possible param names since different banks/flows vary.
 *
 * After processing:
 *   - On success: redirects to /settings?bank_connected=true
 *   - On error:   redirects to /settings?bank_error=<reason>
 *
 * NOTE: If the session ID is not in the query params (some sandbox configs),
 * we fall back to finding the most recent pending connection for this user.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const settingsUrl = new URL('/settings', appUrl)

  // 1. AUTHENTICATE — user's browser carries the session cookie
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    // User is not logged in — redirect to login
    return NextResponse.redirect(new URL('/login', appUrl))
  }

  // 2. EXTRACT SESSION ID from query params
  //    Neonomics may use different param names depending on the bank and flow.
  //    We also accept the 'state' param since we set it to sessionId in connect.
  const params = request.nextUrl.searchParams
  const sessionId =
    params.get('sessionId') ??
    params.get('session_id') ??
    params.get('state') ??
    null

  try {
    let connectionQuery

    if (sessionId) {
      // Find the bank_connection matching this session ID
      connectionQuery = supabase
        .from('bank_connections')
        .select('id, bank_name, status')
        .eq('user_id', user.id)
        .eq('neonomics_session_id', sessionId)
        .single()
    } else {
      // Fallback: find the most recent pending connection for this user
      // This handles cases where Neonomics doesn't pass the session ID back
      connectionQuery = supabase
        .from('bank_connections')
        .select('id, bank_name, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    }

    const { data: connection, error: findError } = await connectionQuery

    if (findError || !connection) {
      console.error(`[BANK_CALLBACK] No pending connection found for user ${user.id}`)
      settingsUrl.searchParams.set('bank_error', 'connection_not_found')
      return NextResponse.redirect(settingsUrl)
    }

    // 3. ACTIVATE THE CONNECTION
    //    Set status = 'active' and store the consent expiry (180 days from now).
    const consentExpiresAt = new Date()
    consentExpiresAt.setDate(consentExpiresAt.getDate() + 180)

    const { error: updateError } = await supabase
      .from('bank_connections')
      .update({
        status: 'active',
        consent_expires_at: consentExpiresAt.toISOString(),
      })
      .eq('id', connection.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error(`[BANK_CALLBACK] Update failed for user ${user.id}:`, updateError.message)
      settingsUrl.searchParams.set('bank_error', 'activation_failed')
      return NextResponse.redirect(settingsUrl)
    }

    // 4. SUCCESS — redirect to settings with a flag to trigger the initial sync
    settingsUrl.searchParams.set('bank_connected', 'true')
    settingsUrl.searchParams.set('connection_id', connection.id)
    return NextResponse.redirect(settingsUrl)
  } catch (error) {
    console.error(`[BANK_CALLBACK] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    settingsUrl.searchParams.set('bank_error', 'unexpected')
    return NextResponse.redirect(settingsUrl)
  }
}
