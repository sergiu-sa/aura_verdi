-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Privacy Shield Columns
-- Migration: 005_privacy_shield.sql
-
-- The Privacy Shield flow:
--   1. upload     → file stored in Supabase Storage, DB record created
--   2. detect-pii → Claude extracts text (OCR), regex detects PII findings
--   3. user confirms/edits redactions in the UI
--   4. confirm-redaction → redacted_text + redaction_map stored
--   5. analyze    → Claude receives ONLY redacted_text, never raw PII
--   6. un-redact  → analysis shown to user with originals restored
-- ═══════════════════════════════════════════════════════════════════════════

-- Add Privacy Shield columns to documents table
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,           -- raw OCR text (NEVER sent to analysis Claude call)
  ADD COLUMN IF NOT EXISTS redacted_text TEXT,            -- text after user-confirmed PII redaction (THIS goes to Claude)
  ADD COLUMN IF NOT EXISTS redaction_map JSONB DEFAULT '{}'::jsonb,   -- {"[PERSON A]": "Ola Nordmann", ...}
  ADD COLUMN IF NOT EXISTS redaction_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pii_detections JSONB DEFAULT '[]'::jsonb,  -- [{type, start, end, original, suggestedMask, confirmed}]
  ADD COLUMN IF NOT EXISTS ai_summary_redacted TEXT;      -- Claude's raw output before un-redaction (audit trail)

-- Add check constraint for redaction status
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_redaction_status_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_redaction_status_check
  CHECK (redaction_status IN ('pending', 'auto_detected', 'user_confirmed', 'skipped'));

-- Update status check constraint to include Privacy Shield statuses
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check
  CHECK (status IN (
    'uploaded',
    'text_extracted',
    'pii_detected',
    'redaction_confirmed',
    'analyzing',
    'analyzed',
    'error'
  ));
