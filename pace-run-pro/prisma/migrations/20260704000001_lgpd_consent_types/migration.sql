-- Create ConsentType enum with all values (idempotent: no-op if already exists)
DO $$ BEGIN
  CREATE TYPE "ConsentType" AS ENUM (
    'TERMS_OF_SERVICE',
    'PRIVACY_POLICY',
    'MARKETING_EMAILS',
    'DATA_PROCESSING',
    'GPS_TRACKING',
    'HEALTH_DATA'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new values if the enum already existed without them (no-op if already present)
DO $$ BEGIN
  ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'GPS_TRACKING';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'HEALTH_DATA';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create data_consent_records table (idempotent)
CREATE TABLE IF NOT EXISTS "data_consent_records" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "type"       "ConsentType" NOT NULL,
    "granted"    BOOLEAN NOT NULL DEFAULT true,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "version"    TEXT,
    "revokedAt"  TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_consent_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_consent_records_userId_idx" ON "data_consent_records"("userId");

ALTER TABLE "data_consent_records"
    DROP CONSTRAINT IF EXISTS "data_consent_records_userId_fkey";

ALTER TABLE "data_consent_records"
    ADD CONSTRAINT "data_consent_records_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
