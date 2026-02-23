/**
 * GET /api/bank/debug
 *
 * Development-only endpoint to diagnose Neonomics connection issues.
 * Tests each step of the auth flow and returns what's working/failing.
 *
 * DELETE THIS FILE before going to production.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results: Record<string, unknown> = {
    env: {
      NEONOMICS_BASE_URL: process.env.NEONOMICS_BASE_URL ?? 'MISSING',
      NEONOMICS_AUTH_URL: process.env.NEONOMICS_AUTH_URL ?? 'MISSING',
      NEONOMICS_CLIENT_ID: process.env.NEONOMICS_CLIENT_ID ? '*** set ***' : 'MISSING',
      NEONOMICS_CLIENT_SECRET: process.env.NEONOMICS_CLIENT_SECRET ? '*** set ***' : 'MISSING',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'MISSING',
    },
  }

  // Step 1: test auth token
  try {
    const authRes = await fetch(process.env.NEONOMICS_AUTH_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.NEONOMICS_CLIENT_ID!,
        client_secret: process.env.NEONOMICS_CLIENT_SECRET!,
      }),
    })
    const authBody = await authRes.text()
    results.auth = {
      status: authRes.status,
      ok: authRes.ok,
      // Show token type but not the actual token
      body: authRes.ok ? '{ access_token: ***hidden***, ... }' : authBody,
    }

    if (!authRes.ok) {
      return NextResponse.json(results)
    }

    const { access_token } = JSON.parse(authBody)

    // Step 2: list available banks
    const banksRes = await fetch(
      `${process.env.NEONOMICS_BASE_URL}/ics/v3/banks`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
          'x-device-id': user.id,
        },
      }
    )
    const banksBody = await banksRes.text()
    results.banks = {
      status: banksRes.status,
      ok: banksRes.ok,
      // Show first few banks so we know the real IDs
      body: banksRes.ok ? JSON.parse(banksBody).slice(0, 5) : banksBody,
    }

    // Step 3: try creating a session with the first available bank
    if (banksRes.ok) {
      const banks = JSON.parse(banksBody)
      const firstBank = banks[0]
      if (firstBank) {
        const sessionRes = await fetch(
          `${process.env.NEONOMICS_BASE_URL}/ics/v3/sessions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${access_token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'x-device-id': user.id,
            },
            body: JSON.stringify({ bankId: firstBank.id }),
          }
        )
        const sessionBody = await sessionRes.text()
        results.session = {
          status: sessionRes.status,
          ok: sessionRes.ok,
          triedBankId: firstBank.id,
          body: sessionRes.ok ? JSON.parse(sessionBody) : sessionBody,
        }
      }
    }
  } catch (err) {
    results.error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(results, { status: 200 })
}
