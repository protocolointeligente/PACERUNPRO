-- CreateEnum
CREATE TYPE "TemplateScope" AS ENUM ('PERSONAL', 'TEAM');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('CORRIDA', 'FORCA', 'MOBILIDADE', 'FUNCIONAL');

-- CreateTable
CREATE TABLE "shared_workout_templates" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateCategory" NOT NULL DEFAULT 'CORRIDA',
    "workoutType" "WorkoutType",
    "scope" "TemplateScope" NOT NULL DEFAULT 'PERSONAL',
    "tags" TEXT[],
    "objective" TEXT,
    "warmup" TEXT,
    "mainSet" TEXT,
    "cooldown" TEXT,
    "notes" TEXT,
    "structured" BOOLEAN NOT NULL DEFAULT false,
    "blocks" JSONB,
    "targetPaceSecPerKm" INTEGER,
    "targetHrZone" TEXT,
    "targetRpe" INTEGER,
    "targetDistanceKm" DOUBLE PRECISION,
    "targetDurationMin" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_workout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_workout_templates_coachId_idx" ON "shared_workout_templates"("coachId");

-- CreateIndex
CREATE INDEX "shared_workout_templates_scope_idx" ON "shared_workout_templates"("scope");

-- AddForeignKey
ALTER TABLE "shared_workout_templates" ADD CONSTRAINT "shared_workout_templates_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
