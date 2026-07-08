-- Migration: Add Soft Delete Fields for LGPD Compliance (P0.1)
-- Author: PACERUNPRO Audit
-- Date: 2026-07-08
-- Impact: LGPD Compliance + Data Safety
-- Risk: LOW (non-breaking, adds new columns)
-- Execution Time: ~500ms

-- Purpose:
-- Implement soft delete (logical deletion) instead of hard delete
-- Required for LGPD compliance (right to be forgotten with 30-day grace period)
-- All related data preserved for audit, but marked as deleted

-- ============================================================================
-- 1. Add soft delete fields to users table
-- ============================================================================

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "deletionReason" TEXT,
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users"("deletedAt");

-- ============================================================================
-- 2. Add soft delete field to athletes table
-- ============================================================================

ALTER TABLE "athletes"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_athletes_deleted_at" ON "athletes"("deletedAt");

-- ============================================================================
-- 3. Add soft delete field to coaches table
-- ============================================================================

ALTER TABLE "coaches"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_coaches_deleted_at" ON "coaches"("deletedAt");

-- ============================================================================
-- 4. Add soft delete field to subscriptions table
-- ============================================================================

ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_subscriptions_deleted_at" ON "subscriptions"("deletedAt");

-- ============================================================================
-- 5. Add soft delete field to billing_settings table
-- ============================================================================

ALTER TABLE "billing_settings"
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS "idx_billing_settings_deleted_at" ON "billing_settings"("deletedAt");

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name LIKE 'deleted%';

-- Check indexes were created
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE indexname LIKE 'idx_%_deleted_at';

-- Count soft-deleted records (should be 0 initially)
-- SELECT 'users' as table_name, COUNT(*) as deleted_count 
-- FROM users WHERE "deletedAt" IS NOT NULL
-- UNION ALL
-- SELECT 'athletes', COUNT(*) FROM athletes WHERE "deletedAt" IS NOT NULL
-- UNION ALL
-- SELECT 'coaches', COUNT(*) FROM coaches WHERE "deletedAt" IS NOT NULL
-- UNION ALL
-- SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE "deletedAt" IS NOT NULL
-- UNION ALL
-- SELECT 'billing_settings', COUNT(*) FROM billing_settings WHERE "deletedAt" IS NOT NULL;
