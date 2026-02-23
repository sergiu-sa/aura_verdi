-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Development Test Data Seed
-- File: supabase/seeds/dev_seed.sql
--
-- ⚠️  DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
--
-- WHY THIS EXISTS:
--   Neonomics sandbox sessions endpoint (POST /ics/v3/sessions) returns
--   HTTP 510 errorCode 2006 "API Not found", making real bank connections
--   impossible until Neonomics support resolves the issue.
--   This seed lets you develop and test the dashboard, chat, and AI features
--   while waiting for that fix.
--
-- WHEN TO DELETE:
--   Once Neonomics sessions are working and real bank data has been synced,
--   delete this test data by running:
--
--     DELETE FROM public.bank_connections
--     WHERE neonomics_session_id = 'seed-test-session-001';
--
--   The ON DELETE CASCADE on accounts and transactions will automatically
--   clean up all related records. Then also run:
--
--     DELETE FROM public.bills_upcoming
--     WHERE user_id = '<your-user-id>'
--       AND name IN ('Telenor mobilabonnement', 'Husleie mars');
--


DO $$
DECLARE
  -- ⚠️  Update this if running as a different user
  v_user_id        UUID := '5e3562e8-cc5d-4b75-ac32-56e06dd7b662';

  -- Fixed UUIDs so re-runs produce the same records (easy to delete later)
  v_connection_id  UUID := 'a1b2c3d4-0000-0000-0000-000000000001';
  v_checking_id    UUID := 'b2c3d4e5-0000-0000-0000-000000000002';
  v_savings_id     UUID := 'c3d4e5f6-0000-0000-0000-000000000003';

BEGIN

-- ── Clean up any previous seed data first ─────────────────────────────────
-- DELETE cascades from bank_connections → accounts → transactions
DELETE FROM public.bank_connections
  WHERE neonomics_session_id = 'seed-test-session-001';

DELETE FROM public.bills_upcoming
  WHERE user_id = v_user_id
    AND name IN ('Telenor mobilabonnement', 'Husleie mars');


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
  'seed-test-session-001',       -- sentinel value — identifies seed data
  'DNB',
  'RG5iLm5vLnYxRE5CQU5PS0s=',  -- real Neonomics sandbox ID for DNB
  'active',
  NOW() + INTERVAL '173 days',  -- consent valid ~6 months
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '7 days'
);


-- ── 2. Accounts ────────────────────────────────────────────────────────────

-- DNB Brukskonto (everyday checking account)
INSERT INTO public.accounts (
  id,
  user_id,
  bank_connection_id,
  account_name,
  iban,
  balance,
  currency,
  account_type,
  last_updated_at
) VALUES (
  v_checking_id,
  v_user_id,
  v_connection_id,
  'DNB Brukskonto',
  'NO8230001234567',   -- fake IBAN — never sent to Claude
  28420.50,
  'NOK',
  'checking',
  NOW() - INTERVAL '2 hours'
);

-- DNB BSU (boligsparing for ungdom — tax-advantaged savings account)
INSERT INTO public.accounts (
  id,
  user_id,
  bank_connection_id,
  account_name,
  iban,
  balance,
  currency,
  account_type,
  last_updated_at
) VALUES (
  v_savings_id,
  v_user_id,
  v_connection_id,
  'DNB BSU',
  'NO8230009876543',   -- fake IBAN — never sent to Claude
  44800.00,
  'NOK',
  'savings',
  NOW() - INTERVAL '2 hours'
);


-- ── 3. Transactions (past 30 days) ─────────────────────────────────────────
-- Negative = expense, Positive = income
-- internal_reference prefixed with 'seed-' to identify seed data

-- Income (salary)
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-20', 35000.00, 'NOK', 'Lønn februar',  'inntekt',  'seed-tx-001'),
  (v_checking_id, v_user_id, '2026-01-20', 35000.00, 'NOK', 'Lønn januar',   'inntekt',  'seed-tx-002');

-- Rent (biggest expense)
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -9200.00, 'NOK', 'Husleie februar', 'bolig', 'seed-tx-003'),
  (v_checking_id, v_user_id, '2026-01-01', -9200.00, 'NOK', 'Husleie januar',  'bolig', 'seed-tx-004');

-- Groceries (spread across the month)
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-22', -412.50, 'NOK', 'Rema 1000 Grünerløkka', 'mat', 'seed-tx-005'),
  (v_checking_id, v_user_id, '2026-02-19', -634.20, 'NOK', 'Meny Majorstuen',        'mat', 'seed-tx-006'),
  (v_checking_id, v_user_id, '2026-02-15', -289.00, 'NOK', 'Kiwi Torshov',           'mat', 'seed-tx-007'),
  (v_checking_id, v_user_id, '2026-02-10', -547.80, 'NOK', 'Coop Extra',             'mat', 'seed-tx-008'),
  (v_checking_id, v_user_id, '2026-02-05', -321.60, 'NOK', 'Rema 1000',              'mat', 'seed-tx-009'),
  (v_checking_id, v_user_id, '2026-01-28', -498.30, 'NOK', 'Meny Frogner',           'mat', 'seed-tx-010');

-- Restaurants & takeaway
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-21', -189.00, 'NOK', 'Foodora levering',   'restaurant', 'seed-tx-011'),
  (v_checking_id, v_user_id, '2026-02-14', -245.00, 'NOK', 'Olivia Restaurant',  'restaurant', 'seed-tx-012'),
  (v_checking_id, v_user_id, '2026-02-08', -142.00, 'NOK', 'Peppes Pizza',       'restaurant', 'seed-tx-013'),
  (v_checking_id, v_user_id, '2026-01-31', -98.00,  'NOK', 'Kaffebrenneriet',    'restaurant', 'seed-tx-014');

-- Transport
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-18', -375.00, 'NOK', 'Ruter månedskort',         'transport', 'seed-tx-015'),
  (v_checking_id, v_user_id, '2026-02-12', -89.00,  'NOK', 'Bysykkel årsabonnement',   'transport', 'seed-tx-016'),
  (v_checking_id, v_user_id, '2026-01-25', -375.00, 'NOK', 'Ruter månedskort',         'transport', 'seed-tx-017');

-- Subscriptions
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-17', -649.00, 'NOK', 'Telenor mobilabonnement', 'abonnement', 'seed-tx-018'),
  (v_checking_id, v_user_id, '2026-02-16', -109.00, 'NOK', 'Netflix',                 'abonnement', 'seed-tx-019'),
  (v_checking_id, v_user_id, '2026-02-15', -159.00, 'NOK', 'Spotify Family',          'abonnement', 'seed-tx-020'),
  (v_checking_id, v_user_id, '2026-02-10', -99.00,  'NOK', 'Viaplay',                 'abonnement', 'seed-tx-021');

-- Power / energy
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-03', -1240.00, 'NOK', 'Tibber strøm januar', 'strom', 'seed-tx-022');

-- Insurance
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -520.00, 'NOK', 'Gjensidige innboforsikring', 'forsikring', 'seed-tx-023');

-- Gym / fitness
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-01', -329.00, 'NOK', 'SATS treningssenter', 'trening', 'seed-tx-024');

-- Savings transfer to BSU (shows up in both accounts)
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-21', -2500.00, 'NOK', 'Overføring til BSU',         'sparing', 'seed-tx-025'),
  (v_savings_id,  v_user_id, '2026-02-21',  2500.00, 'NOK', 'Overføring fra brukskonto',  'sparing', 'seed-tx-026');

-- Clothes
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-13', -899.00, 'NOK', 'H&M Oslo S', 'klaer', 'seed-tx-027');

-- Entertainment
INSERT INTO public.transactions
  (account_id, user_id, transaction_date, amount, currency, description, category, internal_reference)
VALUES
  (v_checking_id, v_user_id, '2026-02-07', -350.00, 'NOK', 'Nationaltheatret billetter', 'underholdning', 'seed-tx-028');


-- ── 4. Upcoming Bills ──────────────────────────────────────────────────────
INSERT INTO public.bills_upcoming
  (user_id, name, amount, currency, due_date, is_auto_detected, is_paid, category, recurrence)
VALUES
  (v_user_id, 'Telenor mobilabonnement', 649.00, 'NOK', '2026-02-28', true, false, 'abonnement', 'monthly'),
  (v_user_id, 'Husleie mars',           9200.00, 'NOK', '2026-03-01', true, false, 'bolig',       'monthly');


RAISE NOTICE '✓ Seed complete. Bank connection: %, Checking: %, BSU: %',
  v_connection_id, v_checking_id, v_savings_id;

END $$;
