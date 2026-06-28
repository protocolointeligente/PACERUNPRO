-- Migration: add Questionnaire table
CREATE TABLE IF NOT EXISTS "questionnaires" (
  "id"          TEXT NOT NULL,
  "athleteId"   TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "title"       TEXT,
  "responses"   JSONB NOT NULL,
  "score"       DOUBLE PRECISION,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "questionnaires_athleteId_type_idx" ON "questionnaires"("athleteId", "type");

ALTER TABLE "questionnaires"
  ADD CONSTRAINT "questionnaires_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE;
