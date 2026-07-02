-- Migration: 20260702000000_missing_models
-- Creates tables for models that exist in schema.prisma but have no migration:
-- CoachPlan, CoachStrengthTemplate, CoachRunTemplate, Lead, Expense

-- PlanPeriod enum (needed by CoachPlan)
DO $$ BEGIN
    CREATE TYPE "PlanPeriod" AS ENUM ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- coach_plans
CREATE TABLE IF NOT EXISTS "coach_plans" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "coachId"     TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "priceCents"  INTEGER NOT NULL,
    "period"      "PlanPeriod" NOT NULL DEFAULT 'MENSAL',
    "features"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "active"      BOOLEAN NOT NULL DEFAULT true,
    "highlight"   BOOLEAN NOT NULL DEFAULT false,
    "maxSlots"    INTEGER,
    "usedSlots"   INTEGER NOT NULL DEFAULT 0,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coach_plans_coachId_fkey" FOREIGN KEY ("coachId")
        REFERENCES "coaches"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "coach_plans_coachId_idx" ON "coach_plans"("coachId");

-- coach_strength_templates
CREATE TABLE IF NOT EXISTS "coach_strength_templates" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "coachId"     TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "division"    TEXT,
    "targetLevel" TEXT NOT NULL DEFAULT 'Iniciante',
    "focus"       TEXT NOT NULL DEFAULT 'forca',
    "sessions"    JSONB NOT NULL DEFAULT '[]',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coach_strength_templates_coachId_fkey" FOREIGN KEY ("coachId")
        REFERENCES "coaches"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "coach_strength_templates_coachId_idx" ON "coach_strength_templates"("coachId");

-- coach_run_templates
CREATE TABLE IF NOT EXISTS "coach_run_templates" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "coachId"         TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "targetLevel"     TEXT NOT NULL DEFAULT 'Iniciante',
    "weeklyKm"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "focus"           TEXT NOT NULL DEFAULT 'aerobico',
    "sessions"        JSONB NOT NULL DEFAULT '[]',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coach_run_templates_coachId_fkey" FOREIGN KEY ("coachId")
        REFERENCES "coaches"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "coach_run_templates_coachId_idx" ON "coach_run_templates"("coachId");

-- leads
CREATE TABLE IF NOT EXISTS "leads" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "coachId"         TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "email"           TEXT,
    "phone"           TEXT,
    "source"          TEXT NOT NULL DEFAULT 'quiz',
    "stage"           TEXT NOT NULL DEFAULT 'novo',
    "notes"           TEXT,
    "monthlyFeeCents" INTEGER,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_coachId_fkey" FOREIGN KEY ("coachId")
        REFERENCES "coaches"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "leads_coachId_stage_idx" ON "leads"("coachId", "stage");

-- expenses
CREATE TABLE IF NOT EXISTS "expenses" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "coachId"     TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "category"    TEXT NOT NULL DEFAULT 'outros',
    "supplier"    TEXT,
    "date"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurring"   BOOLEAN NOT NULL DEFAULT false,
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expenses_coachId_fkey" FOREIGN KEY ("coachId")
        REFERENCES "coaches"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "expenses_coachId_date_idx" ON "expenses"("coachId", "date");
