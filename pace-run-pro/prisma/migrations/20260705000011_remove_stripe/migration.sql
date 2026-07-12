-- Removes all Stripe-related columns, tables and enum values.
-- Fully idempotent — safe to re-run on any state of the DB.

-- 1. Drop stripe columns (IF EXISTS — safe even if never created)
ALTER TABLE "marketplace_stores"  DROP COLUMN IF EXISTS "stripe_account_id";
ALTER TABLE "plan_purchases"      DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "marketplace_orders"  DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "billing_settings"    DROP COLUMN IF EXISTS "stripe_connected";

-- 2. Drop Stripe webhook idempotency guard table
DROP TABLE IF EXISTS "processed_stripe_events";

-- 3. Remove STRIPE from ReceivingMethod enum.
--    Discovers the actual column name from pg_catalog (handles camelCase
--    or snake_case regardless of how the migration created it).
DO $$
DECLARE
  v_col_name      text    := NULL;
  v_enum_exists   boolean;
  v_stripe_exists boolean;
BEGIN
  -- (a) Does the enum type exist at all?
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ReceivingMethod'
  ) INTO v_enum_exists;

  IF NOT v_enum_exists THEN
    CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO');
    RETURN;
  END IF;

  -- (b) Is STRIPE still a member of the enum?
  SELECT EXISTS (
    SELECT 1
    FROM   pg_enum  e
    JOIN   pg_type  t ON t.oid = e.enumtypid
    WHERE  t.typname    = 'ReceivingMethod'
      AND  e.enumlabel  = 'STRIPE'
  ) INTO v_stripe_exists;

  IF NOT v_stripe_exists THEN
    RETURN;  -- already clean
  END IF;

  -- (c) Find the actual column name in billing_settings that uses this enum
  --     (handles both "receivingMethod" camelCase and "receiving_method" snake_case)
  SELECT a.attname INTO v_col_name
  FROM   pg_attribute a
  JOIN   pg_class     c ON c.oid = a.attrelid
  JOIN   pg_type      t ON t.oid = a.atttypid
  JOIN   pg_namespace n ON n.oid = c.relnamespace
  WHERE  c.relname  = 'billing_settings'
    AND  t.typname  = 'ReceivingMethod'
    AND  n.nspname  = 'public'
    AND  a.attnum   > 0
    AND  NOT a.attisdropped;

  IF v_col_name IS NOT NULL THEN
    -- Convert the column to plain text so the enum type has no dependents
    EXECUTE format(
      'ALTER TABLE "billing_settings" ALTER COLUMN %I TYPE text',
      v_col_name
    );
  END IF;

  -- Drop the old enum (no dependents remain)
  DROP TYPE "ReceivingMethod";

  -- Recreate without STRIPE
  CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO');

  IF v_col_name IS NOT NULL THEN
    -- Restore column with the new enum; nullify any STRIPE rows
    EXECUTE format(
      $q$ALTER TABLE "billing_settings"
           ALTER COLUMN %I TYPE "ReceivingMethod"
           USING CASE WHEN %I = 'STRIPE' THEN NULL
                      ELSE %I::"ReceivingMethod"
                 END$q$,
      v_col_name, v_col_name, v_col_name
    );
  END IF;
END $$;
