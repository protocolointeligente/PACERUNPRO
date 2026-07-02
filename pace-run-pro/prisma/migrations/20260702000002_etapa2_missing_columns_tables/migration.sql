-- Etapa 2: Corrigir Migrations
-- Missing column: checkins.stress (Hooper Index)
ALTER TABLE "checkins" ADD COLUMN IF NOT EXISTS "stress" INTEGER;

-- Missing enum: ReceivingMethod
DO $$ BEGIN
    CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'PAGBANK', 'MERCADOPAGO', 'STRIPE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Missing table: billing_settings (BillingSettings model)
CREATE TABLE IF NOT EXISTS "billing_settings" (
    "id"                   TEXT NOT NULL PRIMARY KEY,
    "userId"               TEXT NOT NULL UNIQUE,
    "razaoSocial"          TEXT,
    "cpfCnpj"              TEXT,
    "responsavel"          TEXT,
    "receivingMethod"      "ReceivingMethod",
    "pixKey"               TEXT,
    "bankName"             TEXT,
    "bankAgency"           TEXT,
    "bankAccount"          TEXT,
    "bankAccountType"      TEXT,
    "pagbankConnected"     BOOLEAN NOT NULL DEFAULT false,
    "mercadopagoConnected" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnected"      BOOLEAN NOT NULL DEFAULT false,
    "autoChargeEnabled"    BOOLEAN NOT NULL DEFAULT false,
    "autoChargeDayOfMonth" INTEGER DEFAULT 5,
    "gracePeriodDays"      INTEGER DEFAULT 3,
    "blockAfterDays"       INTEGER DEFAULT 15,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_settings_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);
