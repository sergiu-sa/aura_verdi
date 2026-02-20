-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Run this in the Supabase SQL Editor after creating your project.
-- CRITICAL: Create Supabase project in EU region (Ireland or Frankfurt) FIRST.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ──────────────────────────────────────────────────────────────
-- Extends Supabase's built-in auth.users table.
-- Auto-created on signup via the trigger below.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  partner_id UUID REFERENCES public.profiles(id),
  preferred_language TEXT DEFAULT 'no' CHECK (preferred_language IN ('no', 'en')),
  notification_preferences JSONB DEFAULT '{"daily_checkin": true, "bill_reminders": true, "anomaly_alerts": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BANK CONNECTIONS ──────────────────────────────────────────────────────
-- One record per bank the user has connected via Neonomics.
CREATE TABLE public.bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  neonomics_session_id TEXT,
  bank_name TEXT NOT NULL,
  bank_id TEXT NOT NULL,                    -- Neonomics bank identifier
  consent_expires_at TIMESTAMPTZ,           -- PSD2 consent: up to 180 days
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACCOUNTS ──────────────────────────────────────────────────────────────
-- Bank accounts retrieved from Neonomics after consent.
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  account_name TEXT,
  iban TEXT,                                -- Stored but NEVER sent to Claude API
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'NOK',
  account_type TEXT,                        -- checking, savings, credit, etc.
  is_shared_with_partner BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRANSACTIONS ──────────────────────────────────────────────────────────
-- Individual bank transactions. user_id is denormalized for RLS performance.
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- denormalized
  transaction_date DATE NOT NULL,
  booking_date DATE,
  amount DECIMAL(15, 2) NOT NULL,           -- Negative = expense, positive = income
  currency TEXT DEFAULT 'NOK',
  description TEXT,                         -- Original bank description
  category TEXT,                            -- Aura spending category key
  category_confidence REAL,                 -- AI confidence 0-1
  is_recurring BOOLEAN DEFAULT false,
  counterpart_name TEXT,
  internal_reference TEXT,                  -- Bank's own reference (for deduplication)
  raw_data JSONB,                           -- Original Neonomics response (never sent to Claude)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast dashboard queries
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account ON public.transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category);
-- Deduplication index: prevent duplicate transactions on sync
CREATE UNIQUE INDEX idx_transactions_dedup ON public.transactions(account_id, internal_reference)
  WHERE internal_reference IS NOT NULL;

-- ─── UPCOMING BILLS ────────────────────────────────────────────────────────
-- Bills detected from recurring transactions or added manually.
CREATE TABLE public.bills_upcoming (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'NOK',
  due_date DATE NOT NULL,
  is_auto_detected BOOLEAN DEFAULT false,   -- true = detected from transaction patterns
  is_paid BOOLEAN DEFAULT false,
  category TEXT,
  recurrence TEXT CHECK (recurrence IN ('once', 'weekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for bill countdown widget (next unpaid bills)
CREATE INDEX idx_bills_user_due ON public.bills_upcoming(user_id, due_date) WHERE is_paid = false;

-- ─── DOCUMENTS ─────────────────────────────────────────────────────────────
-- User-uploaded documents (contracts, letters, tax, etc.)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,                  -- Supabase Storage path: {user_id}/{timestamp}-{filename}
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('contract', 'letter', 'invoice', 'tax', 'bank_statement', 'inkasso', 'other')),
  ai_summary TEXT,                          -- Claude's plain-language summary
  ai_flags JSONB,                           -- { "concerns": [...], "deadlines": [...], "urgency": "..." }
  ai_analyzed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'analyzing', 'analyzed', 'error')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHAT MESSAGES ─────────────────────────────────────────────────────────
-- Conversation history. Includes token tracking for cost monitoring.
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_snapshot JSONB,                   -- Financial snapshot used for this response
  tokens_used INTEGER DEFAULT 0,            -- Track for cost monitoring
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_conv ON public.chat_messages(user_id, conversation_id, created_at);

-- ─── LEGAL TEMPLATES ───────────────────────────────────────────────────────
-- Template letters (inkasso responses, rent dispute, etc.)
-- Populated by Aura — not user-created.
CREATE TABLE public.legal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL,              -- stopp_brev, payment_plan, dispute, etc.
  name_no TEXT NOT NULL,
  name_en TEXT,
  description_no TEXT,
  template_body TEXT NOT NULL,              -- Template with {{placeholder}} variables
  relevant_law TEXT,                        -- e.g., "Inkassoloven § 9"
  last_verified_date DATE,                  -- When the legal basis was last checked
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PARTNER SHARING ───────────────────────────────────────────────────────
-- Controls which accounts one partner can see from another.
CREATE TABLE public.partner_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_account_ids UUID[] DEFAULT '{}',   -- Which of user_id's accounts partner_id can see
  permission_level TEXT DEFAULT 'view_only' CHECK (permission_level IN ('view_only', 'full')),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

-- ─── AUTO-UPDATE TIMESTAMP TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────────────────
-- When a user registers via Supabase Auth, automatically create their profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
