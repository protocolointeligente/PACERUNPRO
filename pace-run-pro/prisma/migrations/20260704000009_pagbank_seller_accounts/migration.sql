-- CreateTable: PagBankSellerAccount
-- Stores PagBank Connect OAuth2 authorization data per coach
CREATE TABLE "pagbank_seller_accounts" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "pagbankAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "authorizationStatus" TEXT NOT NULL DEFAULT 'authorized',
    "scopes" TEXT NOT NULL DEFAULT 'payments.create payments.read payments.refund accounts.read',
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagbank_seller_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pagbank_seller_accounts_coachId_key" ON "pagbank_seller_accounts"("coachId");
CREATE INDEX "pagbank_seller_accounts_pagbankAccountId_idx" ON "pagbank_seller_accounts"("pagbankAccountId");

ALTER TABLE "pagbank_seller_accounts"
    ADD CONSTRAINT "pagbank_seller_accounts_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update commission rate from 15% to 10% on all existing stores
UPDATE "marketplace_stores" SET "commissionPct" = 0.10 WHERE "commissionPct" = 0.15;

-- Update MarketplaceConfig default commission to 10%
UPDATE "marketplace_config" SET "defaultCommissionPct" = 0.10 WHERE "defaultCommissionPct" = 0.15;
