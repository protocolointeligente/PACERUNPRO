ALTER TABLE "workouts" ADD COLUMN "structured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workouts" ADD COLUMN "blocks" JSONB;
