-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Notification System
-- Migration: 006_notifications.sql
--
-- Creates:
--   - notifications table (in-app + email alerts with deduplication)
--   - email_log table (audit trail for sent emails)
--   - RLS policies (users manage their own notifications only)
--   - Indexes for fast bell queries and email delivery checks
--   - Supabase Realtime subscription (powers instant bell updates)
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'bill_due', 'low_balance', 'document_deadline', 'consent_expiry',
    'daily_summary', 'analysis_complete', 'spending_anomaly', 'savings_milestone'
  )),
  urgency TEXT NOT NULL CHECK (urgency IN ('critical', 'info', 'background')),
  title TEXT NOT NULL,
  message TEXT NOT NULL, -- MUST be privacy-safe: no amounts, no account numbers, no PII
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'both')),
  notification_key TEXT NOT NULL, -- deduplication key, e.g. "bill_due:{bill_id}:{due_date}"
  is_read BOOLEAN DEFAULT false,
  is_emailed BOOLEAN DEFAULT false,
  related_entity_type TEXT, -- 'bill', 'document', 'account', 'bank_connection'
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- auto-dismiss after this date
  UNIQUE(user_id, notification_key) -- prevents duplicate notifications
);

-- Fast lookup: unread notifications for a user (the notification bell query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Fast lookup: notifications needing email delivery
CREATE INDEX IF NOT EXISTS idx_notifications_pending_email
  ON public.notifications(is_emailed, channel)
  WHERE is_emailed = false AND channel IN ('email', 'both');

-- ============================================
-- EMAIL LOG (audit trail for sent emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  resend_id TEXT, -- Resend API response ID for delivery tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own email log" ON public.email_log;
CREATE POLICY "Users see own email log"
  ON public.email_log FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- ENABLE SUPABASE REALTIME for notifications
-- (This is what powers the instant notification bell updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
