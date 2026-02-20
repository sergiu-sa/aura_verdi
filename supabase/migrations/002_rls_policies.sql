-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Run AFTER 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS is the SAFETY NET. Application code still explicitly filters by user_id.
-- Belt AND suspenders — both layers are required.

-- Enable RLS on ALL tables (nothing is readable without a policy)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_upcoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sharing ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── BANK CONNECTIONS ──────────────────────────────────────────────────────
CREATE POLICY "Users manage own bank connections"
  ON public.bank_connections FOR ALL
  USING (auth.uid() = user_id);

-- ─── ACCOUNTS ──────────────────────────────────────────────────────────────
CREATE POLICY "Users manage own accounts"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id);

-- Partner can see accounts that have been explicitly shared
CREATE POLICY "Partners see shared accounts"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_sharing ps
      WHERE ps.partner_id = auth.uid()
        AND ps.user_id = accounts.user_id
        AND ps.accepted = true
        AND accounts.id = ANY(ps.shared_account_ids)
    )
  );

-- ─── TRANSACTIONS ──────────────────────────────────────────────────────────
CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Partners can read transactions on shared accounts only
CREATE POLICY "Partners see shared transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.accounts a
      JOIN public.partner_sharing ps ON ps.user_id = a.user_id
      WHERE a.id = transactions.account_id
        AND ps.partner_id = auth.uid()
        AND ps.accepted = true
        AND a.id = ANY(ps.shared_account_ids)
    )
  );

-- ─── BILLS ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users manage own bills"
  ON public.bills_upcoming FOR ALL
  USING (auth.uid() = user_id);

-- ─── DOCUMENTS ─────────────────────────────────────────────────────────────
CREATE POLICY "Users manage own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

-- ─── CHAT MESSAGES ─────────────────────────────────────────────────────────
CREATE POLICY "Users manage own chat"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- ─── LEGAL TEMPLATES ───────────────────────────────────────────────────────
-- Templates are Aura-maintained content — all authenticated users can read.
-- No user can insert/update/delete (only Supabase dashboard admin).
CREATE POLICY "Authenticated users read active templates"
  ON public.legal_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- ─── PARTNER SHARING ───────────────────────────────────────────────────────
-- Both the owner and the partner can manage sharing records.
CREATE POLICY "Users manage own sharing records"
  ON public.partner_sharing FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);
