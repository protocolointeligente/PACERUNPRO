-- P2: Add onboarding progress tracking to Coach (replaces localStorage)
ALTER TABLE "coaches" ADD COLUMN IF NOT EXISTS "onboardingDone" TEXT[] NOT NULL DEFAULT '{}';
