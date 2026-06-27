-- P0/P1 Schema: indexes, Shoe model, PlanPurchaseStatus enum

-- Index: athletes(coachId)
CREATE INDEX IF NOT EXISTS "athletes_coachId_idx" ON "athletes"("coachId");

-- Index: subscriptions(userId)
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");

-- Index: plan_purchases(athleteId)
CREATE INDEX IF NOT EXISTS "plan_purchases_athleteId_idx" ON "plan_purchases"("athleteId");

-- PlanPurchaseStatus enum + migrate column
DO $$ BEGIN
  CREATE TYPE "PlanPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "plan_purchases"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "plan_purchases"
  ALTER COLUMN "status" TYPE "PlanPurchaseStatus"
  USING (
    CASE "status"
      WHEN 'paid'     THEN 'PAID'::"PlanPurchaseStatus"
      WHEN 'refunded' THEN 'REFUNDED'::"PlanPurchaseStatus"
      ELSE 'PENDING'::"PlanPurchaseStatus"
    END
  );

ALTER TABLE "plan_purchases"
  ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PlanPurchaseStatus";

-- Shoe table
CREATE TABLE IF NOT EXISTS "shoes" (
  "id"            TEXT NOT NULL,
  "athleteId"     TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "brand"         TEXT NOT NULL,
  "model"         TEXT NOT NULL,
  "color"         TEXT NOT NULL DEFAULT 'blue',
  "imageEmoji"    TEXT NOT NULL DEFAULT '👟',
  "imageUrl"      TEXT,
  "kmAccumulated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxKm"         DOUBLE PRECISION NOT NULL DEFAULT 700,
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "dateAdded"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "shoes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shoes_athleteId_fkey" FOREIGN KEY ("athleteId")
    REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "shoes_athleteId_idx" ON "shoes"("athleteId");
