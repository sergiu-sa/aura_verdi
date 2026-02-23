/**
 * Notification Engine
 *
 * Core logic: checks the user's financial state and generates notification
 * records. Runs from the cron route (/api/notifications/check) or can be
 * called on-demand.
 *
 * All notification messages are privacy-safe — no amounts, account numbers,
 * or personal identifiers. Users open the app to see details.
 */

import { SupabaseClient } from '@supabase/supabase-js'

interface NotificationInput {
  type: string
  urgency: 'critical' | 'info' | 'background'
  title: string
  message: string // MUST be privacy-safe — no amounts, no account numbers
  channel: 'in_app' | 'email' | 'both'
  notification_key: string // dedup key — same key = no duplicate
  related_entity_type?: string
  related_entity_id?: string
  expires_at?: string
}

export async function runNotificationChecks(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationInput[]> {
  const notifications: NotificationInput[] = []
  const now = new Date()
  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().split('T')[0]

  // Load user preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.notification_preferences as Record<string, unknown>) || {}
  const emailChannel = prefs.email_critical !== false ? 'both' : 'in_app'

  // ── CHECK 1: Bills due within 48 hours ──────────────────────────────────
  if (prefs.bill_reminders !== false) {
    const { data: dueBills } = await supabase
      .from('bills_upcoming')
      .select('id, name, due_date')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .lte('due_date', twoDays.toISOString().split('T')[0])
      .gte('due_date', todayStr)

    for (const bill of dueBills || []) {
      const isToday = bill.due_date === todayStr
      notifications.push({
        type: 'bill_due',
        urgency: 'critical',
        title: 'Bill due soon',
        message: `You have a bill due ${isToday ? 'today' : 'tomorrow'}. Open Aura to review.`,
        channel: emailChannel,
        notification_key: `bill_due:${bill.id}:${bill.due_date}`,
        related_entity_type: 'bill',
        related_entity_id: bill.id,
        expires_at: new Date(new Date(bill.due_date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  // ── CHECK 2: Low balance vs upcoming bills ───────────────────────────────
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', userId)

  const totalBalance = (accounts || []).reduce((sum, a) => sum + Number(a.balance), 0)

  const { data: upcomingBills } = await supabase
    .from('bills_upcoming')
    .select('amount')
    .eq('user_id', userId)
    .eq('is_paid', false)
    .lte('due_date', sevenDays.toISOString().split('T')[0])

  const totalUpcoming = (upcomingBills || []).reduce((sum, b) => sum + Number(b.amount), 0)

  if (totalBalance > 0 && totalUpcoming > 0 && totalBalance < totalUpcoming) {
    // Use week number to create at most one low-balance alert per week
    const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`
    notifications.push({
      type: 'low_balance',
      urgency: 'critical',
      title: 'Balance alert',
      message: 'Your balance may not cover upcoming bills this week. Open Aura to review your options.',
      channel: emailChannel,
      notification_key: `low_balance:${userId}:${weekKey}`,
      expires_at: sevenDays.toISOString(),
    })
  }

  // ── CHECK 3: Bank consent expiring within 7 days ─────────────────────────
  const { data: expiringConsents } = await supabase
    .from('bank_connections')
    .select('id, bank_name, consent_expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('consent_expires_at', sevenDays.toISOString())
    .gte('consent_expires_at', now.toISOString())

  for (const conn of expiringConsents || []) {
    notifications.push({
      type: 'consent_expiry',
      urgency: 'critical',
      title: 'Bank connection expiring soon',
      message: 'Your bank connection will expire soon. Reconnect in Settings to keep your data up to date.',
      channel: emailChannel,
      notification_key: `consent_expiry:${conn.id}`,
      related_entity_type: 'bank_connection',
      related_entity_id: conn.id,
      expires_at: conn.consent_expires_at,
    })
  }

  // ── CHECK 4: Document deadlines within 5 days ────────────────────────────
  const { data: analyzedDocs } = await supabase
    .from('documents')
    .select('id, ai_flags')
    .eq('user_id', userId)
    .eq('status', 'analyzed')

  for (const doc of analyzedDocs || []) {
    const flags = doc.ai_flags as Record<string, unknown>
    if (!flags?.deadlines) continue

    for (const deadline of flags.deadlines as string[]) {
      // Deadlines stored as "YYYY-MM-DD: description"
      const dateStr = deadline.split(':')[0]?.trim()
      if (!dateStr) continue
      const deadlineDate = new Date(dateStr)
      if (isNaN(deadlineDate.getTime())) continue
      if (deadlineDate > now && deadlineDate < fiveDays) {
        notifications.push({
          type: 'document_deadline',
          urgency: 'critical',
          title: 'Document deadline approaching',
          message: 'A document you uploaded has an upcoming deadline. Open Aura to review.',
          channel: emailChannel,
          notification_key: `doc_deadline:${doc.id}:${dateStr}`,
          related_entity_type: 'document',
          related_entity_id: doc.id,
          expires_at: deadlineDate.toISOString(),
        })
      }
    }
  }

  return notifications
}

/**
 * Insert notifications with deduplication.
 * The UNIQUE(user_id, notification_key) constraint on the DB means
 * re-running checks never creates duplicates.
 */
export async function createNotifications(
  supabase: SupabaseClient,
  userId: string,
  notifications: NotificationInput[]
): Promise<number> {
  if (notifications.length === 0) return 0

  let created = 0
  for (const notif of notifications) {
    const { error } = await supabase
      .from('notifications')
      .upsert(
        { user_id: userId, ...notif },
        { onConflict: 'user_id,notification_key', ignoreDuplicates: true }
      )
    if (!error) created++
  }
  return created
}
