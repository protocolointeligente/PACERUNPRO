-- CreateEnum: ListingStatus (idempotent — safe to re-run if previously failed)
DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: add listing_status column (idempotent)
DO $$ BEGIN
  ALTER TABLE "marketplace_products" ADD COLUMN "listing_status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Sync existing data: published → APPROVED, unpublished → DRAFT
UPDATE "marketplace_products" SET "listing_status" = 'APPROVED' WHERE "published" = true AND "listing_status" = 'DRAFT';

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "marketplace_products_listing_status_idx" ON "marketplace_products"("listing_status");

-- CreateTable: AuditLog (idempotent)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
