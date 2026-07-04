-- CreateTable
CREATE TABLE "set_logs" (
    "id" TEXT NOT NULL,
    "workoutLogId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "exerciseName" TEXT,
    "setNum" INTEGER NOT NULL,
    "loadKg" DOUBLE PRECISION,
    "reps" INTEGER,
    "rpe" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "set_logs_workoutLogId_idx" ON "set_logs"("workoutLogId");

-- AddForeignKey
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
