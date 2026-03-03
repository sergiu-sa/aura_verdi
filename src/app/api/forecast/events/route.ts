/**
 * GET/POST/PATCH/DELETE /api/forecast/events
 *
 * CRUD for user-created planned financial events (forecast feature).
 * Events are displayed on the cash flow forecast chart.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/utils/rate-limiter'

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurrence: z.enum(['once', 'weekly', 'monthly', 'quarterly', 'yearly']).nullable().default('once'),
  category: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  amount: z.number().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurrence: z.enum(['once', 'weekly', 'monthly', 'quarterly', 'yearly']).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const DeleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('planned_events')
    .select('id, name, amount, event_date, recurrence, category, notes')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('event_date', { ascending: true })

  if (error) {
    console.error(`[FORECAST_EVENTS] GET failed for user ${user.id}:`, error.message)
    return NextResponse.json({ error: 'Failed to load events.' }, { status: 500 })
  }

  return NextResponse.json({ events: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(`forecast-events:${user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event data.' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('planned_events')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        event_date: parsed.data.eventDate,
        recurrence: parsed.data.recurrence,
        category: parsed.data.category ?? null,
        notes: parsed.data.notes ?? null,
      })
      .select('id, name, amount, event_date, recurrence, category, notes')
      .single()

    if (error) {
      console.error(`[FORECAST_EVENTS] POST failed for user ${user.id}:`, error.message)
      return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 })
    }

    return NextResponse.json({ event: data }, { status: 201 })
  } catch (error) {
    console.error(`[FORECAST_EVENTS] POST error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event data.' }, { status: 400 })
  }

  const { id, ...updates } = parsed.data

  // Map camelCase to snake_case for DB columns
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount
  if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate
  if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('planned_events')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error(`[FORECAST_EVENTS] PATCH failed for user ${user.id}:`, error.message)
      return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[FORECAST_EVENTS] PATCH error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid event ID.' }, { status: 400 })
  }

  try {
    // Soft delete
    const { error } = await supabase
      .from('planned_events')
      .update({ is_active: false })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)

    if (error) {
      console.error(`[FORECAST_EVENTS] DELETE failed for user ${user.id}:`, error.message)
      return NextResponse.json({ error: 'Failed to delete event.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[FORECAST_EVENTS] DELETE error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to delete event.' }, { status: 500 })
  }
}
