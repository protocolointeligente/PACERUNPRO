-- Add real soft-delete columns and persistent deletion audit logs.
-- Safe to run on existing databases: all new columns are nullable.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

ALTER TABLE "athletes"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "coaches"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "billing_settings"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "deletion_audit_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "deletedBy" TEXT,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "relatedEntities" JSONB NOT NULL,

  CONSTRAINT "deletion_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX IF NOT EXISTS "athletes_deletedAt_idx" ON "athletes"("deletedAt");
CREATE INDEX IF NOT EXISTS "coaches_deletedAt_idx" ON "coaches"("deletedAt");
CREATE INDEX IF NOT EXISTS "subscriptions_deletedAt_idx" ON "subscriptions"("deletedAt");
CREATE INDEX IF NOT EXISTS "billing_settings_deletedAt_idx" ON "billing_settings"("deletedAt");
CREATE INDEX IF NOT EXISTS "deletion_audit_logs_userId_idx" ON "deletion_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "deletion_audit_logs_deletedAt_idx" ON "deletion_audit_logs"("deletedAt");
