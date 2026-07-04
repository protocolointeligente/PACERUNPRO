-- CreateTable: CoachAthlete (N:M junction — non-breaking, coexists with Athlete.coachId)
CREATE TABLE "coach_athletes" (
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
INSERT INTO "coach_athletes" ("id", "coach_id", "athlete_id", "is_primary", "role", "assigned_at")
SELECT
    gen_random_uuid()::text,
    "coach_id",
    "id",
    true,
    'coach',
    NOW()
FROM "athletes"
WHERE "coach_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "coach_athletes_coach_id_athlete_id_key" ON "coach_athletes"("coach_id", "athlete_id");
CREATE INDEX "coach_athletes_coach_id_idx" ON "coach_athletes"("coach_id");
CREATE INDEX "coach_athletes_athlete_id_idx" ON "coach_athletes"("athlete_id");

-- AddForeignKey
ALTER TABLE "coach_athletes"
    ADD CONSTRAINT "coach_athletes_coach_id_fkey"
    FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coach_athletes"
    ADD CONSTRAINT "coach_athletes_athlete_id_fkey"
    FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProcessedStripeEvent (idempotency guard)
CREATE TABLE "processed_stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processed_stripe_events_created_at_idx" ON "processed_stripe_events"("created_at");
