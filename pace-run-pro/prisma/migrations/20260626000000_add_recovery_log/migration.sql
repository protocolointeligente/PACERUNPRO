-- CreateTable
CREATE TABLE "recovery_logs" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION NOT NULL,
    "ctl" DOUBLE PRECISION,
    "atl" DOUBLE PRECISION,
    "tsb" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recovery_logs_athleteId_date_idx" ON "recovery_logs"("athleteId", "date");

-- AddForeignKey
ALTER TABLE "recovery_logs" ADD CONSTRAINT "recovery_logs_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
