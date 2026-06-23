-- CreateTable
CREATE TABLE "athlete_load_params" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "thresholdPaceSecPerKm" INTEGER,
    "ftpWatts" INTEGER,
    "swimThresholdSecPer100m" INTEGER,
    "hrMax" INTEGER,
    "hrRest" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_load_params_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_load_params_athleteId_key" ON "athlete_load_params"("athleteId");

-- AddForeignKey
ALTER TABLE "athlete_load_params" ADD CONSTRAINT "athlete_load_params_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
