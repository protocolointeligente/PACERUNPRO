-- Migration 003: independent athlete + strava activity persistence + plan store

-- 1. Allow training plans without a coach (independent athletes)
ALTER TABLE "training_plans" ALTER COLUMN "coachId" DROP NOT NULL;

-- 2. Allow workout logs without a scheduled workout (Strava imports)
ALTER TABLE "workout_logs" ALTER COLUMN "workoutId" DROP NOT NULL;

-- 3. Track activity source and Strava ID on workout logs
ALTER TABLE "workout_logs" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "workout_logs" ADD COLUMN "stravaActivityId" TEXT;
CREATE UNIQUE INDEX "workout_logs_stravaActivityId_key"
    ON "workout_logs"("stravaActivityId")
    WHERE "stravaActivityId" IS NOT NULL;

-- 4. Plan store: coaches publish training plans for independent athletes to buy
CREATE TABLE "plan_products" (
    "id"            TEXT NOT NULL,
    "coachId"       TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "description"   TEXT NOT NULL DEFAULT '',
    "sport"         TEXT NOT NULL DEFAULT 'CORRIDA',
    "level"         TEXT NOT NULL DEFAULT 'Intermediário',
    "durationWeeks" INTEGER NOT NULL DEFAULT 12,
    "weeklyHoursMin" DOUBLE PRECISION,
    "weeklyHoursMax" DOUBLE PRECISION,
    "goal"          TEXT NOT NULL DEFAULT 'PERFORMANCE',
    "priceCents"    INTEGER NOT NULL DEFAULT 0,
    "currency"      TEXT NOT NULL DEFAULT 'BRL',
    "coverUrl"      TEXT,
    "published"     BOOLEAN NOT NULL DEFAULT false,
    "featured"      BOOLEAN NOT NULL DEFAULT false,
    "purchases"     INTEGER NOT NULL DEFAULT 0,
    "rating"        DOUBLE PRECISION,
    "ratingCount"   INTEGER NOT NULL DEFAULT 0,
    "included"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plan_products_slug_key" ON "plan_products"("slug");
CREATE INDEX "plan_products_coachId_idx" ON "plan_products"("coachId");
ALTER TABLE "plan_products"
    ADD CONSTRAINT "plan_products_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Plan purchases: record when an athlete buys a plan
CREATE TABLE "plan_purchases" (
    "id"              TEXT NOT NULL,
    "productId"       TEXT NOT NULL,
    "athleteId"       TEXT NOT NULL,
    "pricePaidCents"  INTEGER NOT NULL DEFAULT 0,
    "currency"        TEXT NOT NULL DEFAULT 'BRL',
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plan_purchases_productId_athleteId_key"
    ON "plan_purchases"("productId", "athleteId");
ALTER TABLE "plan_purchases"
    ADD CONSTRAINT "plan_purchases_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "plan_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_purchases"
    ADD CONSTRAINT "plan_purchases_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
