-- CreateTable: CoachAthlete (N:M junction — non-breaking, coexists with Athlete.coachId)
-- Corrected version of 007 — athletes.coachId is camelCase (no @map), not coach_id
CREATE TABLE IF NOT EXISTS "coach_athletes" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'coach',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "coach_athletes_pkey" PRIMARY KEY ("id")
);

-- Populate from existing coachId (mark as primary)
-- athletes.coachId is stored as "coachId" (camelCase, no @map annotation)
INSERT INTO "coach_athletes" ("id", "coach_id", "athlete_id", "is_primary", "role", "assigned_at")
SELECT
    gen_random_uuid()::text,
    "coachId",
    "id",
    true,
    'coach',
    NOW()
FROM "athletes"
WHERE "coachId" IS NOT NULL
ON CONFLICT ("coach_id", "athlete_id") DO NOTHING;

-- CreateIndex (IF NOT EXISTS guards against partial prior run)
CREATE UNIQUE INDEX IF NOT EXISTS "coach_athletes_coach_id_athlete_id_key" ON "coach_athletes"("coach_id", "athlete_id");
CREATE INDEX IF NOT EXISTS "coach_athletes_coach_id_idx" ON "coach_athletes"("coach_id");
CREATE INDEX IF NOT EXISTS "coach_athletes_athlete_id_idx" ON "coach_athletes"("athlete_id");

-- AddForeignKey (IF NOT EXISTS via DO NOTHING pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_athletes_coach_id_fkey'
  ) THEN
    ALTER TABLE "coach_athletes"
      ADD CONSTRAINT "coach_athletes_coach_id_fkey"
      FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_athletes_athlete_id_fkey'
  ) THEN
    ALTER TABLE "coach_athletes"
      ADD CONSTRAINT "coach_athletes_athlete_id_fkey"
      FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: ProcessedStripeEvent (idempotency guard)
CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "processed_stripe_events_created_at_idx" ON "processed_stripe_events"("created_at");
