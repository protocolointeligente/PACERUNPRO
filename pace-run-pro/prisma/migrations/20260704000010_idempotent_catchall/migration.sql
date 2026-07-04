-- ============================================================
-- Migration 010: Idempotent catch-all
-- Ensures all schema objects from migrations 006–009 exist,
-- safe to run regardless of which prior steps succeeded or failed.
-- ============================================================

-- ── From 006: ListingStatus enum ────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── From 006: listing_status column on marketplace_products ─
DO $$ BEGIN
  ALTER TABLE "marketplace_products"
    ADD COLUMN "listing_status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Sync existing data (safe to re-run: only updates rows still at DRAFT)
UPDATE "marketplace_products"
  SET "listing_status" = 'APPROVED'
  WHERE "published" = true AND "listing_status" = 'DRAFT';

-- ── From 006: listing_status index ──────────────────────────
CREATE INDEX IF NOT EXISTS "marketplace_products_listing_status_idx"
  ON "marketplace_products"("listing_status");

-- ── From 006: AuditLog table ────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT,
    "action"     TEXT NOT NULL,
    "entity"     TEXT NOT NULL,
    "entity_id"  TEXT,
    "meta"       JSONB,
    "ip"         TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx"         ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"      ON "audit_logs"("created_at");

-- ── From 007/008: CoachAthlete N:M junction table ───────────
CREATE TABLE IF NOT EXISTS "coach_athletes" (
    "id"          TEXT NOT NULL,
    "coach_id"    TEXT NOT NULL,
    "athlete_id"  TEXT NOT NULL,
    "is_primary"  BOOLEAN NOT NULL DEFAULT false,
    "role"        TEXT NOT NULL DEFAULT 'coach',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes"       TEXT,
    CONSTRAINT "coach_athletes_pkey" PRIMARY KEY ("id")
);

-- Populate from athletes.coachId (camelCase — no @map annotation)
INSERT INTO "coach_athletes" ("id", "coach_id", "athlete_id", "is_primary", "role", "assigned_at")
SELECT gen_random_uuid()::text, "coachId", "id", true, 'coach', NOW()
FROM "athletes"
WHERE "coachId" IS NOT NULL
ON CONFLICT ("coach_id", "athlete_id") DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "coach_athletes_coach_id_athlete_id_key"
  ON "coach_athletes"("coach_id", "athlete_id");
CREATE INDEX IF NOT EXISTS "coach_athletes_coach_id_idx"   ON "coach_athletes"("coach_id");
CREATE INDEX IF NOT EXISTS "coach_athletes_athlete_id_idx" ON "coach_athletes"("athlete_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_athletes_coach_id_fkey') THEN
    ALTER TABLE "coach_athletes"
      ADD CONSTRAINT "coach_athletes_coach_id_fkey"
      FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_athletes_athlete_id_fkey') THEN
    ALTER TABLE "coach_athletes"
      ADD CONSTRAINT "coach_athletes_athlete_id_fkey"
      FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── From 007/008: ProcessedStripeEvent idempotency guard ────
CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
    "id"         TEXT NOT NULL,
    "type"       TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "processed_stripe_events_created_at_idx"
  ON "processed_stripe_events"("created_at");

-- ── From 009: PagBankSellerAccount ──────────────────────────
CREATE TABLE IF NOT EXISTS "pagbank_seller_accounts" (
    "id"                  TEXT NOT NULL,
    "coachId"             TEXT NOT NULL,
    "pagbankAccountId"    TEXT NOT NULL,
    "accessToken"         TEXT NOT NULL,
    "refreshToken"        TEXT,
    "tokenExpiresAt"      TIMESTAMP(3),
    "authorizationStatus" TEXT NOT NULL DEFAULT 'authorized',
    "scopes"              TEXT NOT NULL DEFAULT 'payments.create payments.read payments.refund accounts.read',
    "authorizedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagbank_seller_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "pagbank_seller_accounts_coachId_key"
  ON "pagbank_seller_accounts"("coachId");
CREATE INDEX IF NOT EXISTS "pagbank_seller_accounts_pagbankAccountId_idx"
  ON "pagbank_seller_accounts"("pagbankAccountId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagbank_seller_accounts_coachId_fkey') THEN
    ALTER TABLE "pagbank_seller_accounts"
      ADD CONSTRAINT "pagbank_seller_accounts_coachId_fkey"
      FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── From 009: commission rate update ────────────────────────
UPDATE "marketplace_stores" SET "commissionPct" = 0.10 WHERE "commissionPct" = 0.15;
UPDATE "marketplace_config" SET "defaultCommissionPct" = 0.10 WHERE "defaultCommissionPct" = 0.15;
