# 🚀 DAY 7: PRODUCTION DEPLOYMENT — COMPREHENSIVE GUIDE

**Date:** 2026-07-08  
**Status:** 🟢 Ready for Execution  
**Completion Level:** 80% of P0 roadmap → 100% with this deployment  

---

## 📋 PRE-DEPLOYMENT VERIFICATION (5 minutes)

### ✅ ALL PREREQUISITES VERIFIED

```bash
# 1. Verify all 24 tests passing
cd /workspaces/PACERUNPRO/pace-run-pro
npm test -- tests/P0.test.ts

# Expected output: "Test Files 1 passed (1), Tests 24 passed (24)"
```

✅ **Status:** 24/24 tests passing ✓

### ✅ DATABASE MIGRATION VERIFIED

```bash
# 2. Verify schema is up to date
npx prisma validate

# Expected output: "valid 🚀"
```

✅ **Status:** Schema validated ✓

### ✅ ENCRYPTION CONFIGURED

```bash
# 3. Verify encryption key is set
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:32}..."

# Expected: First 32 chars of key visible
```

✅ **Status:** Encryption key configured ✓

### ✅ ENVIRONMENT SETUP

```bash
# 4. Verify DATABASE_URL
echo "DATABASE_URL: ${DATABASE_URL:0:60}..."

# Expected: PostgreSQL connection string visible
```

✅ **Status:** Database connection configured ✓

---

## 🎯 DEPLOYMENT STRATEGY: Phased Rollout

### Phase 1: 10% Traffic (1 hour monitoring)
- Deploy to 10% of Vercel function instances
- Monitor: error rates, response times, database load
- Success criteria: No errors, normal response times

### Phase 2: 50% Traffic (2 hours monitoring)
- Scale to 50% of instances
- Monitor: same metrics
- Success criteria: Sustained normal performance

### Phase 3: 100% Traffic (24-48 hour monitoring)
- Full rollout to all instances
- Monitor: comprehensive metrics
- Success criteria: All systems nominal, cleanup job working

---

## 🔧 DAY 7 DEPLOYMENT EXECUTION

### STEP 1: Deploy to Staging (if not already done)

```bash
# From pace-run-pro directory
cd /workspaces/PACERUNPRO/pace-run-pro

# Build the application
npm run build

# Expected output: "built successfully"
```

### STEP 2: Phased Rollout via Vercel (10% → 50% → 100%)

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy with traffic splitting (10%)
vercel deploy --prod --skip-build --trim

# Configure traffic split on Vercel dashboard:
# 1. Go to: https://vercel.com/projects/pace-run-pro/deployments
# 2. Find latest deployment
# 3. Click "Production" settings
# 4. Set traffic: 10% to new version, 90% to stable
# 5. Monitor for 1 hour
```

#### Option B: Using Vercel Dashboard (Manual)

```
1. Go to https://vercel.com/dashboard
2. Select "pace-run-pro" project
3. Click "Deployments" tab
4. Find latest deployment
5. Click "Promote to Production"
6. Set traffic splitting:
   - 10% → new deployment
   - 90% → previous deployment
7. Monitor for 1 hour
8. If successful, increase to 50%, then 100%
```

#### Option C: Git-based (Automatic)

```bash
# Vercel auto-deploys on git push to main
git add .
git commit -m "Day 7: Production deployment - P0 compliance"
git push origin main

# Vercel will automatically create preview and prod deployments
# Use Vercel dashboard to manage traffic splitting
```

### STEP 3: Monitor Phase 1 (10% Traffic — 1 hour)

```bash
# Watch application logs
# URL: https://vercel.com/projects/pace-run-pro/deployments

# Key metrics to monitor:
# - Response time (target: < 100ms)
# - Error rate (target: 0%)
# - Database connection pool (target: < 80% usage)
# - CPU usage (target: < 50%)
# - Memory usage (target: < 70%)

# Manual test of delete API:
TEST_USER_ID="test-user-123"
curl -X POST http://localhost:3000/api/account/delete \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "user_requested",
    "message": "Testing Day 7 deployment"
  }'

# Expected response: { "success": true, "userId": "...", "graceRemaining": {...} }
```

**⏱️ Wait 1 hour, then proceed if successful**

### STEP 4: Scale to 50% Traffic (2 hours monitoring)

```bash
# On Vercel dashboard:
# 1. Update traffic split to 50/50
# 2. Trigger new requests to test both versions
# 3. Monitor metrics same as Phase 1

echo "Phase 2: 50% traffic split active"
echo "Monitoring for 2 hours..."
```

**⏱️ Wait 2 hours, then proceed if successful**

### STEP 5: Full Rollout to 100% Traffic

```bash
# On Vercel dashboard:
# 1. Update traffic split to 100% new deployment
# 2. Archive previous deployment version
# 3. Begin 24-48 hour monitoring period

echo "Phase 3: 100% traffic split active"
echo "Monitoring for 24-48 hours..."
```

---

## ⏰ SETUP CLEANUP CRON JOB

The cleanup job deletes users 30+ days after soft deletion (LGPD grace period).

### Option A: Vercel Cron Jobs (Recommended)

**File: vercel.json**

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-soft-deletes",
    "schedule": "0 2 * * *"
  }]
}
```

**File: src/app/api/cron/cleanup-soft-deletes/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cleanupSoftDeletedUsers } from '@/lib/deletion-service';

export async function GET(request: NextRequest) {
  // Verify Vercel cron auth
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await cleanupSoftDeletedUsers({
      grace_days: 30,
      batchSize: 100,
      dryRun: false
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup job completed',
      result
    });
  } catch (error) {
    console.error('Cleanup job failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Cron job runs at 2 AM UTC daily
export const runtime = 'nodejs';
```

**Set CRON_SECRET:**

```bash
# Generate random secret
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$CRON_SECRET"

# Add to Vercel environment variables:
vercel env add CRON_SECRET
# Or on dashboard: Settings > Environment Variables
```

### Option B: External Scheduler (Heroku/Railway/etc.)

```bash
# If using external service, create a scheduled task:
# Schedule: Every day at 2 AM UTC
# Endpoint: https://pace-run-pro.vercel.app/api/cron/cleanup-soft-deletes
# Method: GET
# Headers: Authorization: Bearer <CRON_SECRET>

# Test locally first:
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup-soft-deletes
```

### Option C: Node.js Scheduled Task (Self-hosted)

```bash
# If running self-hosted, create cron job:
# 0 2 * * * cd /app && npm run cleanup:soft-deletes

# Test the command:
npm run cleanup:soft-deletes

# Expected output:
# Cleanup job started...
# Processing batch 1 of N users...
# [SUCCESS] Cleanup job completed
```

---

## 📊 MONITORING PROCEDURES (24-48 hours)

### Real-time Monitoring Dashboard

**Setup Sentry Dashboard:**

```bash
# Navigate to: https://sentry.io/organizations/YOUR_ORG/issues/
# Filter by:
# - Release: latest
# - Tags: environment=production
# - Recent errors

# Alert thresholds:
# - Error rate > 1%: ALERT
# - Response time > 200ms: WARNING
# - Database errors > 5/hour: ALERT
```

### Manual Health Checks (Every 4 hours)

```bash
# 1. Test soft delete API
curl -X POST https://pace-run-pro.vercel.app/api/account/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"reason": "user_requested"}'

# Expected: 200 OK with graceRemaining info

# 2. Check database connectivity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;" | tail -1

# Expected: Integer > 0

# 3. Verify encryption middleware
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj LIKE 'enc:%';" | tail -1

# Expected: Integer >= 0 (some encrypted records)

# 4. Monitor cleanup job execution
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE deletedAt IS NOT NULL AND deletedAt < NOW() - INTERVAL '30 days';"

# Expected: Should decrease after cron job runs (2 AM UTC)
```

### Performance Metrics Check

```bash
# Check response times via Vercel Analytics:
# https://vercel.com/projects/pace-run-pro/analytics

# Target metrics:
# - API response time: < 100ms p99
# - Database query time: < 50ms p99
# - Middleware overhead: < 5ms
# - Total page load: < 2s

# Database performance:
psql $DATABASE_URL << EOF
-- Check slow queries
SELECT 
  query,
  mean_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%users%'
  OR query LIKE '%delete%'
ORDER BY mean_time DESC
LIMIT 10;
EOF
```

---

## 🛑 INCIDENT RESPONSE PROCEDURES

### If Error Rate Spikes Above 1%

```bash
# 1. IMMEDIATE: Rollback via Vercel
# On https://vercel.com/projects/pace-run-pro/deployments
# Click "Rollback to Previous" button
# Or manually revert traffic split to previous version

# 2. Investigate
# Check Sentry for error patterns:
# https://sentry.io/organizations/YOUR_ORG/issues/

# 3. Fix
# Address the issue in code, commit, and redeploy

# 4. Resume
# Start over with 10% traffic phase
```

### If Database Connection Fails

```bash
# 1. Check database status
psql $DATABASE_URL -c "SELECT 1;"

# 2. Check connection pool
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;" | wc -l

# 3. Check for stuck connections
psql $DATABASE_URL -c "SELECT pid, usename, state FROM pg_stat_activity WHERE state = 'idle in transaction';"

# 4. If needed, terminate stuck connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename='neondb_owner' AND state='idle in transaction' LIMIT 10;"

# 5. Verify Prisma connection pool
# Restart application (Vercel will auto-redeploy)
```

### If Encryption Middleware Fails

```bash
# 1. Check ENCRYPTION_KEY is set
echo $ENCRYPTION_KEY

# 2. Verify key format (should be 64 hex characters)
echo -n $ENCRYPTION_KEY | wc -c

# 3. Check middleware logs
tail -100 /path/to/app/logs/production.log | grep -i encrypt

# 4. Test encryption locally
npm run test -- tests/P0.test.ts -t "encryption"

# 5. If failed:
# - Review encryption.ts for syntax errors
# - Check that ENCRYPTION_KEY environment variable is correctly set
# - Restart application
```

### If Cleanup Job Fails

```bash
# 1. Check cleanup script logs
vercel logs pace-run-pro --tail

# 2. Test cleanup manually
npm run cleanup:soft-deletes

# 3. Check for stuck transactions
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 4. Verify cleanup user exists
psql $DATABASE_URL -c "SELECT * FROM users WHERE deletedAt < NOW() - INTERVAL '30 days' LIMIT 5;"

# 5. Manual cleanup if needed (use with caution)
psql $DATABASE_URL << EOF
-- Dry run first
SELECT COUNT(*) FROM users WHERE deletedAt < NOW() - INTERVAL '30 days';

-- Then execute
DELETE FROM users WHERE deletedAt < NOW() - INTERVAL '30 days';
EOF
```

---

## ✅ POST-DEPLOYMENT VERIFICATION (After 48 hours)

### Compliance Verification Checklist

- [ ] **LGPD Compliance**
  - Soft delete working: Users can request deletion
  - 30-day grace period active: Users have time to cancel
  - Automatic cleanup: Hard delete runs daily at 2 AM UTC
  - Audit trail: All deletions logged with timestamps

- [ ] **GDPR Compliance**
  - Right to be forgotten: Can export/delete user data
  - Data portability: User data exportable in standard format
  - Privacy by design: Encryption transparent to application

- [ ] **PCI-DSS Compliance**
  - Sensitive data encrypted: Payment info, PII encrypted
  - Key management: Encryption key in secure environment variables
  - No plaintext storage: All sensitive fields encrypted in database
  - Audit logging: All data access logged

### Performance Verification

```bash
# Verify 30x improvement target achieved
psql $DATABASE_URL << EOF
SELECT 
  'Users by ID (with FK index)' as metric,
  pg_size_pretty(pg_relation_size('idx_users_id')) as index_size,
  (SELECT count(*) FROM users) as total_users
UNION ALL
SELECT
  'FK Indexes created',
  COUNT(*)::text,
  NULL
FROM pg_indexes 
WHERE tablename IN ('accounts', 'sessions', 'notifications', 'payments', 'subscriptions')
  AND indexname LIKE '%_idx';
EOF

# Response time check
ab -n 1000 -c 100 https://pace-run-pro.vercel.app/api/health

# Expected: Requests/sec > 10, Mean time < 100ms
```

### Data Integrity Verification

```bash
# Check for orphaned records
psql $DATABASE_URL << EOF
-- Orphaned accounts (user deleted but account not)
SELECT COUNT(*) as orphaned_accounts 
FROM accounts a 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);

-- Orphaned sessions (user deleted but session not)
SELECT COUNT(*) as orphaned_sessions 
FROM sessions s 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);

-- Soft deleted users with no deletion info
SELECT COUNT(*) as incomplete_deletions 
FROM users 
WHERE deleted_at IS NOT NULL 
  AND (deletion_reason IS NULL OR deleted_by IS NULL);
EOF

# All should return 0
```

### Final Success Criteria

- ✅ All tests still passing (24/24)
- ✅ Error rate < 0.1%
- ✅ Response time < 100ms p99
- ✅ Database performance: 30x+ improvement verified
- ✅ Encryption working transparently
- ✅ Soft delete functioning correctly
- ✅ Cleanup job running daily
- ✅ Zero data loss or corruption
- ✅ All compliance requirements met (LGPD/GDPR/PCI-DSS)

---

## 📞 QUICK REFERENCE COMMANDS

### Immediate Actions

```bash
# Deploy
git push origin main

# Monitor
vercel logs pace-run-pro --tail

# Rollback (if emergency)
vercel deploy --prod --skip-build --previous

# Test
npm test -- tests/P0.test.ts

# Manual cleanup
npm run cleanup:soft-deletes

# Verify
npx prisma validate
```

### Database Checks

```bash
# Connection
psql $DATABASE_URL -c "SELECT NOW();"

# Soft delete status
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL;"

# Encryption check
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj LIKE 'enc:%';"

# Index verification
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('accounts', 'sessions', 'notifications');"
```

---

## 🎉 SUCCESS INDICATORS

You'll know Day 7 is successful when:

1. ✅ **Phased rollout completed** — All 3 phases (10% → 50% → 100%) executed successfully
2. ✅ **No errors during rollout** — Error rate stayed below 0.1%
3. ✅ **Performance maintained** — Response times remained < 100ms
4. ✅ **Cleanup job active** — First scheduled run completes successfully
5. ✅ **Compliance verified** — All LGPD/GDPR/PCI-DSS requirements confirmed
6. ✅ **Data integrity confirmed** — Zero data loss or corruption
7. ✅ **Monitoring stable** — 48-hour period shows consistent metrics

---

## 📅 TIMELINE

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| **Pre-checks** | 5 min | Now | +5m | 🟢 Ready |
| **Phase 1 (10%)** | 1 hour | +5m | +65m | 🔄 Execute |
| **Phase 2 (50%)** | 2 hours | +65m | +185m | 🔄 Execute |
| **Phase 3 (100%)** | 24-48h | +185m | +48h | 🔄 Execute |
| **Monitoring** | 48h | +185m | +48h | 🔄 Active |
| **Verification** | 1h | +48h | +49h | ⏳ Final |

---

## 🏁 NEXT STEPS AFTER DEPLOYMENT

1. **Hour 1-6:** Monitor Phase 1 (10% traffic)
2. **Hour 6-8:** Monitor Phase 2 (50% traffic)
3. **Hour 8-56:** Monitor Phase 3 (100% traffic)
4. **Hour 56-57:** Final verification
5. **Hour 57+:** Post-deployment documentation and celebration 🎉

---

**🚀 Ready to deploy? Begin with Step 1: Deploy to Staging**

**Questions?** Check DAYS_5_6_QUICK_REFERENCE.md for common issues or see incident response section above.
