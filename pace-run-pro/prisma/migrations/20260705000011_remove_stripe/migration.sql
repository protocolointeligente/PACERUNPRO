-- Remove all Stripe-related columns, tables and enum values.
-- No production data uses Stripe (feature was "em desenvolvimento").

-- 1. Drop stripe-related columns from existing tables
ALTER TABLE "marketplace_stores"  DROP COLUMN IF EXISTS "stripe_account_id";
ALTER TABLE "plan_purchases"      DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "marketplace_orders"  DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "billing_settings"    DROP COLUMN IF EXISTS "stripe_connected";

-- 2. Drop Stripe webhook idempotency guard table
DROP TABLE IF EXISTS "processed_stripe_events";

-- 3. Remove STRIPE from ReceivingMethod enum
--    PostgreSQL does not support DROP ENUM VALUE directly; we recreate the type.
ALTER TABLE "billing_settings" ALTER COLUMN "receiving_method" TYPE text;
DROP TYPE IF EXISTS "ReceivingMethod";
CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO');
ALTER TABLE "billing_settings"
  ALTER COLUMN "receiving_method" TYPE "ReceivingMethod"
  USING CASE
    WHEN "receiving_method" = 'STRIPE' THEN NULL
    ELSE "receiving_method"::"ReceivingMethod"
  END;
