-- Migration: add PhysicalAssessment table
CREATE TABLE IF NOT EXISTS "physical_assessments" (
  "id"              TEXT NOT NULL,
  "athleteId"       TEXT NOT NULL,
  "coachId"         TEXT,
  "assessedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- body composition
  "weightKg"        DOUBLE PRECISION,
  "bodyFatPct"      DOUBLE PRECISION,
  "muscleMassKg"    DOUBLE PRECISION,
  "bmi"             DOUBLE PRECISION,
  -- perimetry (cm)
  "neckCm"          DOUBLE PRECISION,
  "chestCm"         DOUBLE PRECISION,
  "waistCm"         DOUBLE PRECISION,
  "hipCm"           DOUBLE PRECISION,
  "thighCm"         DOUBLE PRECISION,
  "calfCm"          DOUBLE PRECISION,
  "armCm"           DOUBLE PRECISION,
  "forearmCm"       DOUBLE PRECISION,
  -- performance
  "vo2max"          DOUBLE PRECISION,
  "restingHr"       INTEGER,
  "hrv"             DOUBLE PRECISION,
  "flexibilityScore" DOUBLE PRECISION,
  -- photos & consent
  "photoUrls"       TEXT[] NOT NULL DEFAULT '{}',
  "lgpdConsent"     BOOLEAN NOT NULL DEFAULT false,
  "consentAt"       TIMESTAMP(3),
  "notes"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "physical_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "physical_assessments_athleteId_idx" ON "physical_assessments"("athleteId");

ALTER TABLE "physical_assessments"
  ADD CONSTRAINT "physical_assessments_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE;
