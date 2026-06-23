CREATE TABLE "workout_log_comments" (
    "id"           TEXT NOT NULL,
    "workoutLogId" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "text"         TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_log_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workout_log_comments_workoutLogId_idx" ON "workout_log_comments"("workoutLogId");
ALTER TABLE "workout_log_comments"
    ADD CONSTRAINT "workout_log_comments_workoutLogId_fkey"
    FOREIGN KEY ("workoutLogId") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_log_comments"
    ADD CONSTRAINT "workout_log_comments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
