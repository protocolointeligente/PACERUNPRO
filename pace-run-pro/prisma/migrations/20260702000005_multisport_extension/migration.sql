-- Etapa Multisport — adiciona SportType, tipos de treino/teste, campos por modalidade e AthleteSportProfile

-- ── Enums novos ────────────────────────────────────────────────────────────────

CREATE TYPE "SportType" AS ENUM (
  'RUN', 'BIKE', 'SWIM', 'STRENGTH', 'MOBILITY', 'TRIATHLON', 'BRICK'
);

-- ── WorkoutType — novos valores ────────────────────────────────────────────────

ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'ENDURANCE_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'RECOVERY_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'TEMPO_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'SWEET_SPOT';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'THRESHOLD_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'VO2MAX_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'ANAEROBIC_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'SPRINT_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'LONG_RIDE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'TECNICA_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'ENDURANCE_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'INTERVALADO_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'LIMIAR_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'SPRINT_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'RECUPERACAO_NATACAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'AGUAS_ABERTAS';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'BRICK_BIKE_RUN';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'BRICK_SWIM_BIKE';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'TRANSICAO';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'SIMULADO_TRIATHLON';
ALTER TYPE "WorkoutType" ADD VALUE IF NOT EXISTS 'TREINO_COMBINADO';

-- ── TestType — novos valores ───────────────────────────────────────────────────

ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'FTP_20MIN';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'FTP_RAMP';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'CRITICAL_POWER_5MIN';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'CRITICAL_POWER_20MIN';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'FC_LIMIAR_BIKE';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'CSS_400_200';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'CSS_1000M';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'SWIM_30MIN';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'PACE_CRITICO_NATACAO';
ALTER TYPE "TestType" ADD VALUE IF NOT EXISTS 'TECNICA_NATACAO';

-- ── Goal — novos valores ───────────────────────────────────────────────────────

ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'GRAN_FONDO';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'CICLISMO_PERFORMANCE';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'NATACAO_PERFORMANCE';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'SPRINT_TRIATHLON';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'OLIMPICO';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'MEIO_IRONMAN';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'IRONMAN';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'AQUATLON';
ALTER TYPE "Goal" ADD VALUE IF NOT EXISTS 'DUATLON';

-- ── Workout — novos campos ─────────────────────────────────────────────────────

ALTER TABLE "workouts"
  ADD COLUMN IF NOT EXISTS "sport"             "SportType",
  ADD COLUMN IF NOT EXISTS "targetTss"         INTEGER,
  ADD COLUMN IF NOT EXISTS "plannedLoad"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "targetPowerWatts"  INTEGER,
  ADD COLUMN IF NOT EXISTS "targetPowerPctFtp" INTEGER,
  ADD COLUMN IF NOT EXISTS "targetCadence"     INTEGER,
  ADD COLUMN IF NOT EXISTS "targetPacePer100m" INTEGER,
  ADD COLUMN IF NOT EXISTS "targetStrokeRate"  INTEGER,
  ADD COLUMN IF NOT EXISTS "targetSwolf"       INTEGER;

-- ── WorkoutLog — novos campos ─────────────────────────────────────────────────

ALTER TABLE "workout_logs"
  ADD COLUMN IF NOT EXISTS "sport"            "SportType",
  ADD COLUMN IF NOT EXISTS "tss"              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "actualLoad"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "avgWatts"         INTEGER,
  ADD COLUMN IF NOT EXISTS "normalizedPower"  INTEGER,
  ADD COLUMN IF NOT EXISTS "intensityFactor"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "tssFromPower"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "poolLengthM"      INTEGER,
  ADD COLUMN IF NOT EXISTS "swimStroke"       TEXT,
  ADD COLUMN IF NOT EXISTS "swolf"            INTEGER,
  ADD COLUMN IF NOT EXISTS "strokeRate"       INTEGER,
  ADD COLUMN IF NOT EXISTS "avgPacePer100m"   INTEGER,
  ADD COLUMN IF NOT EXISTS "coachFeedback"    TEXT,
  ADD COLUMN IF NOT EXISTS "athleteFeedback"  TEXT;

CREATE INDEX IF NOT EXISTS "workout_logs_athleteId_sport_idx"
  ON "workout_logs" ("athleteId", "sport");

-- ── PerformanceTest — novos campos ────────────────────────────────────────────

ALTER TABLE "performance_tests"
  ADD COLUMN IF NOT EXISTS "sport"                "SportType",
  ADD COLUMN IF NOT EXISTS "avgWatts"             INTEGER,
  ADD COLUMN IF NOT EXISTS "ftpWatts"             INTEGER,
  ADD COLUMN IF NOT EXISTS "criticalPowerWatts"   INTEGER,
  ADD COLUMN IF NOT EXISTS "cssPacePer100m"       INTEGER,
  ADD COLUMN IF NOT EXISTS "time400mSec"          INTEGER,
  ADD COLUMN IF NOT EXISTS "time200mSec"          INTEGER;

CREATE INDEX IF NOT EXISTS "performance_tests_athleteId_sport_idx"
  ON "performance_tests" ("athleteId", "sport");

-- ── AthleteSportProfile — nova tabela ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "athlete_sport_profiles" (
  "id"                    TEXT NOT NULL,
  "athleteId"             TEXT NOT NULL,
  "sport"                 "SportType" NOT NULL,

  -- Corrida
  "thresholdPaceSecPerKm" INTEGER,
  "vdot"                  DOUBLE PRECISION,
  "vamKmh"                DOUBLE PRECISION,
  "vo2max"                DOUBLE PRECISION,

  -- Ciclismo
  "ftpWatts"              INTEGER,
  "ftpWattsPerKg"         DOUBLE PRECISION,
  "criticalPowerWatts"    INTEGER,
  "wPrimeJoules"          INTEGER,

  -- Natação
  "cssPacePer100m"        INTEGER,
  "cssMetersPerSec"       DOUBLE PRECISION,

  -- FC
  "hrMax"                 INTEGER,
  "hrRest"                INTEGER,
  "hrThreshold"           INTEGER,

  -- Zonas
  "zones"                 JSONB,

  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "athlete_sport_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "athlete_sport_profiles_athleteId_sport_key" UNIQUE ("athleteId", "sport"),
  CONSTRAINT "athlete_sport_profiles_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "athlete_sport_profiles_athleteId_idx"
  ON "athlete_sport_profiles" ("athleteId");
