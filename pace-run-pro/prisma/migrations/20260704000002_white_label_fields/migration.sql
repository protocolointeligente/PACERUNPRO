-- Add white-label and DNS fields to billing_settings
ALTER TABLE "billing_settings" ADD COLUMN IF NOT EXISTS "custom_domain" TEXT;
ALTER TABLE "billing_settings" ADD COLUMN IF NOT EXISTS "domain_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "billing_settings" ADD COLUMN IF NOT EXISTS "domain_verified_at" TIMESTAMP(3);
ALTER TABLE "billing_settings" ADD COLUMN IF NOT EXISTS "white_label_config" JSONB;
