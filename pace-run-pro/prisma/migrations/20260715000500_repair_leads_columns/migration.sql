DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'leads'
  ) THEN
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'novo';
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'quiz';
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "monthlyFeeCents" INTEGER;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "phone" TEXT;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "leads_coachId_stage_idx" ON "leads"("coachId", "stage");
