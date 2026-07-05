-- Adds columns that exist in schema.prisma but were never migrated to the DB.
-- All statements use ADD COLUMN IF NOT EXISTS so this is safe to re-run.

-- ── training_plans ─────────────────────────────────────────────────────────
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "targetRaceName"   TEXT;
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "status"           TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "loadPattern"      TEXT;
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "currentVolumeKm"  DOUBLE PRECISION;
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "maxVolumeKm"      DOUBLE PRECISION;

-- ── workout_logs ────────────────────────────────────────────────────────────
ALTER TABLE "workout_logs" ADD COLUMN IF NOT EXISTS "painLevel"    INTEGER;
ALTER TABLE "workout_logs" ADD COLUMN IF NOT EXISTS "fatigueLevel" INTEGER;
