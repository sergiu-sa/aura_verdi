-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Partner Linking (Safety Migration)
-- Migration: 007_partner_linking.sql
--
-- This migration ensures all partner-related schema exists.
-- The partner_sharing table and partner RLS policies were defined in
-- migrations 001 and 002, but this migration applies them safely with
-- IF NOT EXISTS / DROP IF EXISTS in case anything was missed.
--
-- Safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Ensure partner_id column on profiles ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.profiles(id);

-- ── Ensure is_shared_with_partner column on accounts ────────────────────────
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN DEFAULT false;

-- ── Ensure partner_sharing table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_account_ids UUID[] DEFAULT '{}',
  permission_level TEXT DEFAULT 'view_only' CHECK (permission_level IN ('view_only', 'full')),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

-- ── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.partner_sharing ENABLE ROW LEVEL SECURITY;

-- ── Partner sharing policies ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own sharing" ON public.partner_sharing;
CREATE POLICY "Users manage own sharing"
  ON public.partner_sharing FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- ── Partner can see shared accounts ─────────────────────────────────────────
DROP POLICY IF EXISTS "Partners see shared accounts" ON public.accounts;
CREATE POLICY "Partners see shared accounts"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_sharing ps
      WHERE ps.partner_id = auth.uid()
        AND ps.user_id = accounts.user_id
        AND ps.accepted = true
        AND accounts.is_shared_with_partner = true
    )
  );

-- ── Partner can see transactions on shared accounts ──────────────────────────
DROP POLICY IF EXISTS "Partners see shared transactions" ON public.transactions;
CREATE POLICY "Partners see shared transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.partner_sharing ps ON ps.user_id = a.user_id
      WHERE a.id = transactions.account_id
        AND ps.partner_id = auth.uid()
        AND ps.accepted = true
        AND a.is_shared_with_partner = true
    )
  );

-- ── Index for fast partner lookups ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_partner_sharing_partner_id
  ON public.partner_sharing(partner_id)
  WHERE accepted = false;
