CREATE TABLE IF NOT EXISTS "coach_plan_purchases" (
  "id" TEXT NOT NULL,
  "coachPlanId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "pricePaidCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "asaasChargeId" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coach_plan_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coach_plan_purchases_coachPlanId_athleteId_key"
  ON "coach_plan_purchases"("coachPlanId", "athleteId");

CREATE INDEX IF NOT EXISTS "coach_plan_purchases_athleteId_idx"
  ON "coach_plan_purchases"("athleteId");

CREATE INDEX IF NOT EXISTS "coach_plan_purchases_coachPlanId_status_idx"
  ON "coach_plan_purchases"("coachPlanId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_plan_purchases_coachPlanId_fkey'
  ) THEN
    ALTER TABLE "coach_plan_purchases"
      ADD CONSTRAINT "coach_plan_purchases_coachPlanId_fkey"
      FOREIGN KEY ("coachPlanId") REFERENCES "coach_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_plan_purchases_athleteId_fkey'
  ) THEN
    ALTER TABLE "coach_plan_purchases"
      ADD CONSTRAINT "coach_plan_purchases_athleteId_fkey"
      FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
