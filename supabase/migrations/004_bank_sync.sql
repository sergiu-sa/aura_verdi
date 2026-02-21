-- supabase/migrations/004_bank_sync.sql
--
-- Adds the neonomics_account_id column so we can upsert accounts without
-- creating duplicates, and adds a unique constraint on transactions so that
-- the (account_id, internal_reference) pair can be used as an upsert key.
--
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- ── Accounts: store the Neonomics account ID ───────────────────────────────
-- This is the stable ID Neonomics uses for each account. We need it to match
-- existing rows on re-sync instead of inserting duplicates.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS neonomics_account_id TEXT;

-- Unique constraint so we can do ON CONFLICT upserts during sync.
-- One Neonomics account ID per bank connection.
ALTER TABLE public.accounts
  ADD CONSTRAINT IF NOT EXISTS accounts_connection_neonomics_id_unique
  UNIQUE (bank_connection_id, neonomics_account_id);

-- ── Transactions: unique constraint for deduplication ──────────────────────
-- The spec says: use internal_reference + account_id to detect duplicates.
-- NULLS are not considered equal in UNIQUE constraints, so transactions with
-- no internal_reference will not be deduplicated — that's acceptable.
ALTER TABLE public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_account_reference_unique
  UNIQUE (account_id, internal_reference);
