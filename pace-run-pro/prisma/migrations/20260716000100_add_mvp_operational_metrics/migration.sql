-- Add MVP operational traceability without destructive changes.

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'PUBLISH',
    'UNPUBLISH',
    'MOVE',
    'PAYMENT',
    'ACCESS',
    'AI_GENERATION',
    'APPROVAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MetricScope" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'CYCLE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MetricSource" AS ENUM (
    'MANUAL',
    'WORKOUT',
    'FEEDBACK',
    'STRAVA',
    'SYSTEM',
    'INTELLIGENCE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "training_plans"
  ADD COLUMN IF NOT EXISTS "modality" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "training_weeks"
  ADD COLUMN IF NOT EXISTS "targetDurationMin" INTEGER,
  ADD COLUMN IF NOT EXISTS "targetTss" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "generation_batches" (
  "id" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "planId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'periodization',
  "modality" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "rationale" TEXT,
  "confidence" DOUBLE PRECISION,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),

  CONSTRAINT "generation_batches_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "generation_batches"
    ADD CONSTRAINT "generation_batches_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "generation_batches"
    ADD CONSTRAINT "generation_batches_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "generation_batches"
    ADD CONSTRAINT "generation_batches_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "training_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "generation_batches_coachId_createdAt_idx" ON "generation_batches"("coachId", "createdAt");
CREATE INDEX IF NOT EXISTS "generation_batches_athleteId_createdAt_idx" ON "generation_batches"("athleteId", "createdAt");

ALTER TABLE "workouts"
  ADD COLUMN IF NOT EXISTS "modality" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "generationBatchId" TEXT,
  ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "rationale" TEXT,
  ADD COLUMN IF NOT EXISTS "trainerModified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "modalityData" JSONB;

DO $$ BEGIN
  ALTER TABLE "workouts"
    ADD CONSTRAINT "workouts_generationBatchId_fkey"
    FOREIGN KEY ("generationBatchId") REFERENCES "generation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "workouts_modality_date_idx" ON "workouts"("modality", "date");
CREATE INDEX IF NOT EXISTS "workouts_source_idx" ON "workouts"("source");
CREATE INDEX IF NOT EXISTS "workouts_generationBatchId_idx" ON "workouts"("generationBatchId");

CREATE TABLE IF NOT EXISTS "workout_feedbacks" (
  "id" TEXT NOT NULL,
  "workoutId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'realizado',
  "source" TEXT NOT NULL DEFAULT 'manual',
  "durationSec" INTEGER,
  "distanceKm" DOUBLE PRECISION,
  "volume" DOUBLE PRECISION,
  "avgHr" INTEGER,
  "maxHr" INTEGER,
  "rpe" INTEGER,
  "sessionRpeLoad" DOUBLE PRECISION,
  "feeling" TEXT,
  "fatigue" INTEGER,
  "recovery" INTEGER,
  "sleepHours" DOUBLE PRECISION,
  "stress" INTEGER,
  "pain" BOOLEAN NOT NULL DEFAULT false,
  "painLocation" TEXT,
  "painIntensity" INTEGER,
  "notes" TEXT,
  "raw" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workout_feedbacks_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "workout_feedbacks"
    ADD CONSTRAINT "workout_feedbacks_workoutId_fkey"
    FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "workout_feedbacks"
    ADD CONSTRAINT "workout_feedbacks_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "workout_feedbacks_workoutId_athleteId_key" ON "workout_feedbacks"("workoutId", "athleteId");
CREATE INDEX IF NOT EXISTS "workout_feedbacks_athleteId_createdAt_idx" ON "workout_feedbacks"("athleteId", "createdAt");

CREATE TABLE IF NOT EXISTS "derived_metrics" (
  "id" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "textValue" TEXT,
  "unit" TEXT,
  "scope" "MetricScope" NOT NULL DEFAULT 'WEEKLY',
  "source" "MetricSource" NOT NULL DEFAULT 'SYSTEM',
  "confidence" DOUBLE PRECISION,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "derived_metrics_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "derived_metrics"
    ADD CONSTRAINT "derived_metrics_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "derived_metrics_athleteId_key_scope_periodStart_periodEnd_key"
  ON "derived_metrics"("athleteId", "key", "scope", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "derived_metrics_athleteId_key_idx" ON "derived_metrics"("athleteId", "key");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "coachId" TEXT,
  "athleteId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "message" TEXT,
  "before" JSONB,
  "after" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_coachId_createdAt_idx" ON "audit_logs"("coachId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_athleteId_createdAt_idx" ON "audit_logs"("athleteId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
