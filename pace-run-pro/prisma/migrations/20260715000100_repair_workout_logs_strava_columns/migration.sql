-- Repair production schema drift from the Strava workout log migration.
-- Some databases have the migration recorded but are missing these columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'workout_logs'
  ) THEN
    ALTER TABLE "workout_logs" ALTER COLUMN "workoutId" DROP NOT NULL;
    ALTER TABLE "workout_logs" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
    ALTER TABLE "workout_logs" ADD COLUMN IF NOT EXISTS "stravaActivityId" TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "workout_logs_stravaActivityId_key"
  ON "workout_logs"("stravaActivityId")
  WHERE "stravaActivityId" IS NOT NULL;
