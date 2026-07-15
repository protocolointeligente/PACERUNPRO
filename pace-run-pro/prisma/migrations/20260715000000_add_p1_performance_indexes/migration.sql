-- P1.3 performance indexes.
-- Idempotent guards keep deploy safe across preview databases that may be
-- missing optional CRM/template tables from older snapshots.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_athletes_status ON "athletes"("status")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'coachId') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_athletes_coach_id ON "athletes"("coachId")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'type') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workouts_type ON "workouts"("type")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workouts_status ON "workouts"("status")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'date') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workouts_date ON "workouts"("date")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'source') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workout_logs_source ON "workout_logs"("source")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vouchers' AND column_name = 'active') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vouchers_active ON "vouchers"("active")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_plans' AND column_name = 'active') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coach_plans_active ON "coach_plans"("active")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'blocks') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workouts_blocks_gin ON "workouts" USING GIN ("blocks")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'gpsTrack') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workout_logs_gpstrack_gin ON "workout_logs" USING GIN ("gpsTrack")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_logs' AND column_name = 'splits') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workout_logs_splits_gin ON "workout_logs" USING GIN ("splits")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_products' AND column_name = 'planContent') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_plan_products_content_gin ON "plan_products" USING GIN ("planContent")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_products' AND column_name = 'published') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_plan_products_published ON "plan_products"("published")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_zone_models' AND column_name = 'zones') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coach_zone_models_zones_gin ON "coach_zone_models" USING GIN ("zones")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_strength_templates' AND column_name = 'sessions') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coach_strength_templates_sessions_gin ON "coach_strength_templates" USING GIN ("sessions")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coach_run_templates' AND column_name = 'sessions') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coach_run_templates_sessions_gin ON "coach_run_templates" USING GIN ("sessions")';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_workout_templates' AND column_name = 'blocks') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_shared_workout_templates_blocks_gin ON "shared_workout_templates" USING GIN ("blocks")';
  END IF;
END $$;
