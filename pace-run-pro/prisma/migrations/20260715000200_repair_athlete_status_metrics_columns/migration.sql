DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'athletes'
  ) THEN
    ALTER TABLE "athletes" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ativo';
    ALTER TABLE "athletes" ADD COLUMN IF NOT EXISTS "adherenceRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
    ALTER TABLE "athletes" ADD COLUMN IF NOT EXISTS "recoveryScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
  END IF;
END $$;
