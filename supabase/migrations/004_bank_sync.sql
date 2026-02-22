-- supabase/migrations/004_bank_sync.sql (corrected)
--
-- Adds the neonomics_account_id column and unique constraints for upserts.
-- Uses DROP-then-ADD pattern because PostgreSQL doesn't support
-- ADD CONSTRAINT IF NOT EXISTS.

-- ── Accounts: store the Neonomics account ID ───────────────────────────────
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS neonomics_account_id TEXT;

-- Unique constraint so we can do ON CONFLICT upserts during sync.
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_connection_neonomics_id_unique;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_connection_neonomics_id_unique
  UNIQUE (bank_connection_id, neonomics_account_id);

-- ── Transactions: unique constraint for deduplication ──────────────────────
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_account_reference_unique;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_reference_unique
  UNIQUE (account_id, internal_reference);