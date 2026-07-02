-- Migration: Integration Adapter Layer
-- Adds externalActivityId to workout_logs and tokenExpiresAt/scope to connected_devices

-- WorkoutLog: generic external activity ID for multi-provider dedup
ALTER TABLE "workout_logs"
  ADD COLUMN IF NOT EXISTS "externalActivityId" TEXT;

CREATE INDEX IF NOT EXISTS "workout_logs_source_externalActivityId_idx"
  ON "workout_logs" ("source", "externalActivityId");

-- ConnectedDevice: token expiry and OAuth scope
ALTER TABLE "connected_devices"
  ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scope" TEXT;
