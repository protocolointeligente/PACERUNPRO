-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED');

-- AlterTable: add listingStatus column
ALTER TABLE "marketplace_products" ADD COLUMN "listing_status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';

-- Sync existing data: published products → APPROVED, unpublished → DRAFT
UPDATE "marketplace_products" SET "listing_status" = 'APPROVED' WHERE "published" = true;
UPDATE "marketplace_products" SET "listing_status" = 'DRAFT' WHERE "published" = false;

-- CreateIndex
CREATE INDEX "marketplace_products_listing_status_idx" ON "marketplace_products"("listing_status");

-- CreateTable: AuditLog
CREATE TABLE "audit_logs" (
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

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
