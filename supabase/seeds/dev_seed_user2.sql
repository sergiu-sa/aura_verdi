-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Development Test Data Seed (User 2)
-- File: supabase/seeds/dev_seed_user2.sql
--
-- ⚠️  DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
--

-- WHEN TO DELETE:
--   DELETE FROM public.bank_connections
--   WHERE neonomics_session_id = 'seed-test-session-002';
--
--   DELETE FROM public.bills_upcoming
--   WHERE user_id = '9fd028da-a7f1-40e4-9e1d-95cdb5d610f2'
--     AND name IN ('If skadeforsikring', 'Husleie mars', 'Telia mobil');
--

DO $$
DECLARE
  v_user_id        UUID := '9fd028da-a7f1-40e4-9e1d-95cdb5d610f2';

  v_connection_id  UUID := 'd1e2f3a4-0000-0000-0000-000000000011';
  v_checking_id    UUID := 'e2f3a4b5-0000-0000-0000-000000000012';
  v_savings_id     UUID := 'f3a4b5c6-0000-0000-0000-000000000013';

BEGIN

-- ── Clean up any previous seed data first ─────────────────────────────────
DELETE FROM public.bank_connections
  WHERE neonomics_session_id = 'seed-test-session-002';

DELETE FROM public.bills_upcoming
  WHERE user_id = v_user_id
    AND name IN ('If skadeforsikring', 'Husleie mars', 'Telia mobil');


-- ── 1. Bank Connection ─────────────────────────────────────────────────────
INSERT INTO public.bank_connections (
  id,
  user_id,
  neonomics_session_id,
  bank_name,
  bank_id,
  status,
  consent_expires_at,
  last_synced_at,
  created_at
) VALUES (
  v_connection_id,
  v_user_id,
  'seed-test-session-002',
  'Nordea',
  'Tm9yZGVhLm5vLnYxTk9SREVB',
  'active',
  NOW() + INTERVAL '160 days',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '5 days'
);


-- ── 2. Accounts ────────────────────────────────────────────────────────────

-- Nordea Brukskonto
INSERT INTO public.accounts (
  id, user_id, bank_connection_id,
  account_name, iban, balance, currency, account_type, is_shared_with_partner, last_updated_at
) VALUES (
  v_checking_id,
  v_user_id,
  v_connection_id,
  'Nordea Brukskonto',
  'NO4712345678901',
  19850.75,
  'NOK',
  'checking',
  true,
  NOW() - INTERVAL '3 hours'
);

-- Nordea Sparekonto
INSERT INTO public.accounts (
  id, user_id, bank_connection_id,
  account_name, iban, balance, currency, account_type, is_shared_with_partner, last_updated_at
) VALUES (
  v_savings_id,
  v_user_id,
  v_connection_id,
  'Nordea Sparekonto',
  'NO4712345678902',
  62300.00,
  'NOK',
  'savings',
  true,
  NOW() - INTERVAL '3 hours'
);


-- ── 3. Transactions (past 30 days) ─────────────────────────────────────────

-- Income (salary — slightly higher than user 1)
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-25', 42000.00, 'NOK', 'Lønn februar',  'inntekt',  'seed2-tx-001'),
  (v_checking_id, v_user_id, '2026-01-25', 42000.00, 'NOK', 'Lønn januar',   'inntekt',  'seed2-tx-002');

-- Rent
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -11500.00, 'NOK', 'Husleie februar', 'bolig', 'seed2-tx-003'),
  (v_checking_id, v_user_id, '2026-01-01', -11500.00, 'NOK', 'Husleie januar',  'bolig', 'seed2-tx-004');

-- Groceries
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-24', -378.90, 'NOK', 'Joker Storo',          'mat', 'seed2-tx-005'),
  (v_checking_id, v_user_id, '2026-02-20', -712.40, 'NOK', 'Meny Aker Brygge',     'mat', 'seed2-tx-006'),
  (v_checking_id, v_user_id, '2026-02-14', -245.00, 'NOK', 'Rema 1000 Sagene',     'mat', 'seed2-tx-007'),
  (v_checking_id, v_user_id, '2026-02-09', -589.30, 'NOK', 'Coop Mega Nydalen',    'mat', 'seed2-tx-008'),
  (v_checking_id, v_user_id, '2026-02-03', -432.10, 'NOK', 'Kiwi Vulkan',          'mat', 'seed2-tx-009'),
  (v_checking_id, v_user_id, '2026-01-27', -367.50, 'NOK', 'Rema 1000 Løren',      'mat', 'seed2-tx-010');

-- Restaurants & coffee
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-22', -320.00, 'NOK', 'Sushi Palace',         'restaurant', 'seed2-tx-011'),
  (v_checking_id, v_user_id, '2026-02-16', -175.00, 'NOK', 'Illegal Burger',       'restaurant', 'seed2-tx-012'),
  (v_checking_id, v_user_id, '2026-02-11', -68.00,  'NOK', 'Tim Wendelboe kaffe',  'restaurant', 'seed2-tx-013'),
  (v_checking_id, v_user_id, '2026-02-02', -285.00, 'NOK', 'Ling Ling Hakkasan',   'restaurant', 'seed2-tx-014');

-- Transport
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-18', -375.00, 'NOK', 'Ruter månedskort',  'transport', 'seed2-tx-015'),
  (v_checking_id, v_user_id, '2026-01-18', -375.00, 'NOK', 'Ruter månedskort',  'transport', 'seed2-tx-016');

-- Subscriptions
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-15', -449.00, 'NOK', 'Telia mobil',       'abonnement', 'seed2-tx-017'),
  (v_checking_id, v_user_id, '2026-02-15', -119.00, 'NOK', 'HBO Max',           'abonnement', 'seed2-tx-018'),
  (v_checking_id, v_user_id, '2026-02-15', -109.00, 'NOK', 'Spotify Premium',   'abonnement', 'seed2-tx-019');

-- Power / energy
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-05', -1580.00, 'NOK', 'Fjordkraft strøm januar', 'strom', 'seed2-tx-020');

-- Insurance
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -690.00, 'NOK', 'If innboforsikring', 'forsikring', 'seed2-tx-021');

-- Gym
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -449.00, 'NOK', 'Evo Fitness Nydalen', 'trening', 'seed2-tx-022');

-- Savings transfer
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-26', -5000.00, 'NOK', 'Overføring til sparekonto',      'sparing', 'seed2-tx-023'),
  (v_savings_id,  v_user_id, '2026-02-26',  5000.00, 'NOK', 'Overføring fra brukskonto',      'sparing', 'seed2-tx-024');

-- Shopping
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-08', -1299.00, 'NOK', 'Elkjøp headset',    'klaer', 'seed2-tx-025');

-- Entertainment
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-12', -290.00, 'NOK', 'Oslo Kino Colosseum', 'underholdning', 'seed2-tx-026');


-- ── 4. Upcoming Bills ──────────────────────────────────────────────────────
INSERT INTO public.bills_upcoming
  (user_id, name, amount, currency, due_date, is_auto_detected, is_paid, category, recurrence)
VALUES
  (v_user_id, 'Telia mobil',        449.00,  'NOK', '2026-03-15', true, false, 'abonnement', 'monthly'),
  (v_user_id, 'Husleie mars',      11500.00, 'NOK', '2026-03-01', true, false, 'bolig',      'monthly'),
  (v_user_id, 'If skadeforsikring',  690.00, 'NOK', '2026-03-01', true, false, 'forsikring',  'monthly');


RAISE NOTICE '✓ Seed (user 2) complete. Bank connection: %, Checking: %, Savings: %',
  v_connection_id, v_checking_id, v_savings_id;

END $$;
