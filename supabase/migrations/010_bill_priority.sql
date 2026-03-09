-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 010 — Add priority levels to bills_upcoming + bypass_quiet_hours
--
-- Priority values: critical | high | normal | low
-- Default: normal (safe for all existing rows and new auto-detected bills)
-- ═══════════════════════════════════════════════════════════════════════════

-- Add priority column with constraint and default
ALTER TABLE public.bills_upcoming
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('critical', 'high', 'normal', 'low'));
 
-- Index for notification engine: "critical bills due within N days"
CREATE INDEX idx_bills_critical
  ON public.bills_upcoming(user_id, due_date)
  WHERE is_paid = false AND priority = 'critical';

-- Add bypass_quiet_hours to notifications for critical-priority bill alerts
ALTER TABLE public.notifications
  ADD COLUMN bypass_quiet_hours BOOLEAN NOT NULL DEFAULT false;
