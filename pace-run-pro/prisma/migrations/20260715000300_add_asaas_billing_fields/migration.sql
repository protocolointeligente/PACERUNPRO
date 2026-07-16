DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'ASAAS'
      AND enumtypid = '"ReceivingMethod"'::regtype
  ) THEN
    ALTER TYPE "ReceivingMethod" ADD VALUE 'ASAAS';
  END IF;
END $$;

ALTER TABLE "billing_settings"
  ADD COLUMN IF NOT EXISTS "asaasAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "asaasWalletId" TEXT,
  ADD COLUMN IF NOT EXISTS "asaasApiKeyLast4" TEXT,
  ADD COLUMN IF NOT EXISTS "asaasOnboardingStatus" TEXT NOT NULL DEFAULT 'pending';
