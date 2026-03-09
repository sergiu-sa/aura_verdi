/**
 * POST /api/bills — Create a bill
 * PATCH /api/bills — Mark a bill as paid/unpaid
 *
 * POST accepts: { name, amount, dueDate, category?, recurrence?, sourceDocumentId? }
 * PATCH accepts: { billId, is_paid }
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'
import { BILL_PRIORITIES } from '@/lib/constants/bill-priority'

const CreateBillSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().max(50).nullable().optional(),
  recurrence: z.enum(['once', 'weekly', 'monthly', 'quarterly', 'yearly']).default('once'),
  sourceDocumentId: z.string().uuid().nullable().optional(),
  priority: z.enum(BILL_PRIORITIES).default('normal'),
})

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. RATE LIMIT
  if (!checkRateLimit(`bills:${user.id}`, RATE_LIMITS.bills.max, RATE_LIMITS.bills.windowMs)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  // 3. VALIDATE INPUT
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = CreateBillSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const { name, amount, dueDate, category, recurrence, sourceDocumentId, priority } = parsed.data

  try {
    // 4. VALIDATE SOURCE DOCUMENT (if provided) — must belong to this user
    if (sourceDocumentId) {
      const { data: doc } = await supabase
        .from('documents')
        .select('id')
        .eq('id', sourceDocumentId)
        .eq('user_id', user.id)
        .single()

      if (!doc) {
        return NextResponse.json({ error: 'Source document not found.' }, { status: 404 })
      }

      // 5. CHECK FOR DUPLICATE — prevent adding the same document twice
      const { data: existing } = await supabase
        .from('bills_upcoming')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_document_id', sourceDocumentId)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'This document has already been added as an expense.' },
          { status: 409 }
        )
      }
    }

    // 6. INSERT BILL
    const { data: bill, error: insertError } = await supabase
      .from('bills_upcoming')
      .insert({
        user_id: user.id,
        name,
        amount,
        currency: 'NOK',
        due_date: dueDate,
        is_auto_detected: false,
        is_paid: false,
        category: category ?? null,
        recurrence,
        source_document_id: sourceDocumentId ?? null,
        priority,
      })
      .select('id, name, amount, due_date, priority')
      .single()

    if (insertError) {
      console.error(`[BILLS] Insert error for user ${user.id}:`, insertError.message)
      return NextResponse.json({ error: 'Failed to create bill.' }, { status: 500 })
    }

    return NextResponse.json({ bill })
  } catch (error) {
    console.error(`[BILLS] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ── PATCH /api/bills — Mark a bill as paid/unpaid ────────────────────────────

const PatchBillSchema = z.object({
  billId: z.string().uuid(),
  is_paid: z.boolean().optional(),
  priority: z.enum(BILL_PRIORITIES).optional(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(`bills:${user.id}`, RATE_LIMITS.bills.max, RATE_LIMITS.bills.windowMs)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = PatchBillSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  try {
    const { billId, is_paid, priority } = parsed.data
    const updateFields: Record<string, unknown> = {}
    if (is_paid !== undefined) updateFields.is_paid = is_paid
    if (priority !== undefined) updateFields.priority = priority

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const { error: updateError, count } = await supabase
      .from('bills_upcoming')
      .update(updateFields, { count: 'exact' })
      .eq('id', billId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error(`[BILLS] PATCH error for user ${user.id}:`, updateError.message)
      return NextResponse.json({ error: 'Failed to update bill.' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Bill not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[BILLS] PATCH unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
