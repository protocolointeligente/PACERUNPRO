-- Removes all Stripe-related columns, tables and enum values.
-- Fully idempotent: every destructive operation uses IF EXISTS or
-- a PL/pgSQL guard so it is safe to re-run on any state of the DB.

-- 1. Drop stripe columns (IF EXISTS — safe even if columns were never created)
ALTER TABLE "marketplace_stores"  DROP COLUMN IF EXISTS "stripe_account_id";
ALTER TABLE "plan_purchases"      DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "marketplace_orders"  DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "billing_settings"    DROP COLUMN IF EXISTS "stripe_connected";

-- 2. Drop Stripe webhook idempotency guard table
DROP TABLE IF EXISTS "processed_stripe_events";

-- 3. Remove STRIPE from ReceivingMethod enum (fully guarded PL/pgSQL block)
--    Handles all cases:
--      a) enum does not exist at all
--      b) STRIPE already removed from enum
--      c) receiving_method column does not exist in billing_settings
--      d) normal case: column + enum both exist, STRIPE present
DO $$
DECLARE
  v_col_exists     boolean;
  v_enum_exists    boolean;
  v_stripe_exists  boolean;
BEGIN
  -- Does the enum type exist?
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ReceivingMethod'
  ) INTO v_enum_exists;

  IF NOT v_enum_exists THEN
    -- Enum was never created; create it fresh without STRIPE.
    EXECUTE $q$CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO')$q$;
    RETURN;
  END IF;

  -- Is STRIPE still a member of the enum?
  SELECT EXISTS (
    SELECT 1
    FROM   pg_enum  e
    JOIN   pg_type  t ON t.oid = e.enumtypid
    WHERE  t.typname    = 'ReceivingMethod'
      AND  e.enumlabel  = 'STRIPE'
  ) INTO v_stripe_exists;

  IF NOT v_stripe_exists THEN
    -- STRIPE already gone; nothing to do.
    RETURN;
  END IF;

  -- Does the column that uses the enum exist?
  SELECT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'billing_settings'
      AND  column_name  = 'receiving_method'
  ) INTO v_col_exists;

  IF v_col_exists THEN
    -- Step 1: decouple column from enum so we can drop & recreate the type.
    EXECUTE $q$ALTER TABLE "billing_settings" ALTER COLUMN "receiving_method" TYPE text$q$;
  END IF;

  -- Step 2: drop old enum (no dependents remain because column is now text).
  DROP TYPE "ReceivingMethod";

  -- Step 3: create the enum without STRIPE.
  EXECUTE $q$CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO')$q$;

  IF v_col_exists THEN
    -- Step 4: restore the column with the new enum type.
    --         Any row that somehow had STRIPE is silently nullified.
    EXECUTE $q$
      ALTER TABLE "billing_settings"
        ALTER COLUMN "receiving_method" TYPE "ReceivingMethod"
        USING CASE
                WHEN "receiving_method" = 'STRIPE' THEN NULL
                ELSE "receiving_method"::"ReceivingMethod"
              END
    $q$;
  END IF;
END $$;
