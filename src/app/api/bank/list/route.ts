/**
 * GET /api/bank/list
 *
 * Returns the list of banks available in Neonomics.
 * Used by the bank picker UI so it always shows real, current bank IDs
 * instead of a hardcoded list that could become stale.
 *
 * The bank IDs returned here are the ones that must be passed to
 * POST /api/bank/connect as { bankId }.
 */

import { createClient } from '@/lib/supabase/server'
import { neonomics } from '@/lib/neonomics/client'
import { NextResponse } from 'next/server'

interface NeonomicsBankEntry {
  id: string
  name?: string
  displayName?: string
  [key: string]: unknown
}

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const raw = await neonomics.getBanks(user.id) as NeonomicsBankEntry[]

    const banks = raw.map((b) => ({
      id: b.id,
      name: (b.name ?? b.displayName ?? b.id) as string,
    }))

    return NextResponse.json({ banks })
  } catch (err) {
    console.error(
      `[BANK_LIST] Failed to fetch banks for user ${user.id}:`,
      err instanceof Error ? err.message : 'Unknown'
    )
    return NextResponse.json(
      { error: 'Unable to load bank list. Please try again.' },
      { status: 502 }
    )
  }
}
