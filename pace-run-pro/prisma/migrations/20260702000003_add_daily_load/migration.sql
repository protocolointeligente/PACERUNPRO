-- CreateTable
CREATE TABLE "daily_loads" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "atl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tsb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ewmaAcute" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ewmaChronic" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ewmaRatio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "weeklyLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acwr" DOUBLE PRECISION,
    "trend" TEXT,
    "form" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_loads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_loads_athleteId_date_idx" ON "daily_loads"("athleteId", "date");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "daily_loads_athleteId_date_key" ON "daily_loads"("athleteId", "date");

-- AddForeignKey
ALTER TABLE "daily_loads" ADD CONSTRAINT "daily_loads_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
