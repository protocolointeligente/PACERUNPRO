CREATE TABLE "coach_zone_models" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL DEFAULT 'CORRIDA',
    "method" TEXT NOT NULL DEFAULT 'FC_MAXIMA',
    "zoneCount" INTEGER NOT NULL DEFAULT 5,
    "zones" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coach_zone_models_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "coach_zone_models" ADD CONSTRAINT "coach_zone_models_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
