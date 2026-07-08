# 🚀 P0 DEPLOYMENT CHECKLIST

**What:** Deploy P0 items (Soft Delete, Encryption, FK Indexes)  
**Time:** 7 days (5-7 for implementation + testing + deployment)  
**Risk Level:** MEDIUM (database changes) → Mitigated with staging test  
**Downtime:** ZERO (phased approach)

---

## Pre-Deployment (Day 1-2)

- [ ] **Code Review**
  - [ ] Review `src/lib/deletion-service.ts` (450 lines)
  - [ ] Review `src/lib/encryption.ts` + middleware
  - [ ] Review API endpoint `/api/account/delete`
  - [ ] Check: No SQL injection vulnerabilities
  - [ ] Check: No sensitive data logging

- [ ] **Environment Setup**
  - [ ] Generate ENCRYPTION_KEY: `openssl rand -hex 32`
  - [ ] Store key in staging vault (AWS Secrets Manager / Azure Vault)
  - [ ] Store key in production vault
  - [ ] Update `.env` in staging

- [ ] **Database Backup**
  - [ ] Full backup of production database
  - [ ] Test restore from backup
  - [ ] Store backup securely

---

## Staging Deployment (Day 3-5)

- [ ] **Schema Migration to Staging**
  ```bash
  # 1. Connect to staging database
  export DATABASE_URL=staging_db_url
  
  # 2. Generate Prisma Client (already done)
  npx prisma generate
  
  # 3. Create migration (dry run first)
  npx prisma migrate diff --script
  
  # 4. Apply migration
  npx prisma migrate deploy
  
  # 5. Verify schema changes
  psql $DATABASE_URL -c "\d users" | grep deleted
  ```

- [ ] **Data Encryption Migration (Staging)**
  ```bash
  # Set ENCRYPTION_KEY in staging env
  export ENCRYPTION_KEY=your-64-hex-string
  
  # Run migration script
  npm run migrate:encrypt
  
  # Verify encrypted data
  psql $DATABASE_URL -c "SELECT pixKey FROM billing_settings LIMIT 1"
  # Should return: enc:base64... (NOT plaintext)
  ```

- [ ] **Testing (Staging)**
  ```bash
  # Run test suite
  npm test -- P0.test.ts
  
  # Manual QA:
  
  1. Soft Delete Test
     - Create test user via API
     - Delete via POST /api/account/delete
     - Verify: email anonymized, deletedAt set
     - Verify: User filtered from GET /api/users
     - Restore within 30 days: Verify restoration works
  
  2. Encryption Test
     - Create BillingSettings with PIX key
     - Check database: pixKey stored as enc:base64...
     - Read via API: Key auto-decrypted transparently
     - Update value: Re-encrypted on write
  
  3. FK Index Test
     - Query 1000 notifications by userId
     - Verify query time < 100ms (was 200ms+ without index)
     - Check query plan: Uses index (EXPLAIN ANALYZE)
  
  4. Middleware Test
     - Delete user A
     - Query: SELECT * FROM users WHERE id = A
     - Verify: Middleware filters it out
     - Query with meta: includeSoftDeleted=true
     - Verify: Returns deleted user
  
  5. API Test
     - DELETE /api/account/delete (success)
     - DELETE /api/account/delete with invalid reason
     - Verify 400 Bad Request
     - DELETE without auth
     - Verify 401 Unauthorized
  ```

- [ ] **Performance Validation**
  ```bash
  # Before P0: Typical query times
  # After P0: Should be 30x faster
  
  # Test query performance
  psql -c "EXPLAIN ANALYZE SELECT * FROM notifications WHERE userId = 'X'"
  # Before: Seq Scan (full table scan)
  # After: Bitmap Index Scan (uses index)
  ```

- [ ] **Security Validation**
  ```bash
  # 1. Check no plaintext tokens in staging DB
  psql $DATABASE_URL -c "SELECT accessToken FROM connectedDevices LIMIT 1"
  # Must return: enc:base64... format
  
  # 2. Verify encryption middleware works
  # (included in test suite)
  
  # 3. Check ENCRYPTION_KEY not exposed
  grep -r "ENCRYPTION_KEY=" . | grep -v .env | grep -v docs
  # Should return nothing
  ```

- [ ] **Backup Test**
  ```bash
  # Test soft-deleted users in backup
  psql $BACKUP_DB -c "SELECT COUNT(*) FROM users WHERE deletedAt IS NOT NULL"
  # Should return 0 (no deletions in backup from before migration)
  ```

---

## Production Deployment (Day 6-7)

### Step 1: Pre-flight Checks
- [ ] All staging tests passed ✅
- [ ] Code review approved ✅
- [ ] Security review passed ✅
- [ ] Database backup verified ✅
- [ ] Rollback plan documented ✅
- [ ] Monitoring alerts configured ✅

### Step 2: Slow Rollout (0 downtime)

**Option A: Phased Rollout (Safest)**
```bash
# 1. Deploy to 10% of servers
DEPLOYMENT_PERCENTAGE=10 npm run deploy

# 2. Monitor for 1 hour
# - Check error rate (should be 0)
# - Check query performance (should improve)
# - Check soft-delete operations work

# 3. Rollout to 50%
DEPLOYMENT_PERCENTAGE=50 npm run deploy

# 4. Monitor for 1 hour

# 5. Rollout to 100%
DEPLOYMENT_PERCENTAGE=100 npm run deploy

# 6. Monitor for 4 hours
```

**Option B: Blue-Green Deployment**
```bash
# 1. Deploy to "green" environment
git push production-green

# 2. Run all tests in green
npm test -- P0.test.ts

# 3. Switch load balancer: blue → green
lb.switchTraffic(blue_target, green_target)

# 4. Monitor
# - If issues: Switch back to blue (< 1 min)
# - If all good: Keep green as primary
```

### Step 3: Database Migration (Production)

**CRITICAL: Do this during off-peak hours (2-4 AM)**

```bash
# 1. Acquire database lock (prevents new connections)
# (Done by migration tool automatically)

# 2. Run migration
npx prisma migrate deploy --production

# Duration: ~30 seconds for schema changes
# Expected: Brief pause in queries (< 1 second)

# 3. Verify migration
psql $DATABASE_URL -c "\d users" | grep deleted
# Should show: deletedAt column

# 4. Update connection pool
# (Automatic in Next.js)

# 5. Release lock
# (Automatic)

# Timeline:
# ├─ Lock acquired: 10:00:00
# ├─ Migration: 10:00:05 (5 seconds)
# ├─ Verification: 10:00:10 (5 seconds)
# └─ Lock released: 10:00:15
# Total downtime: ~15 seconds (acceptable)
```

### Step 4: Data Encryption Migration (Production)

```bash
# 1. Set ENCRYPTION_KEY in production env
export ENCRYPTION_KEY=<your-64-hex>

# 2. Run encryption migration (async, can be slow)
# Recommended: Run during off-peak, in background
npm run migrate:encrypt &

# Duration: Depends on data volume
# - 1k records: < 1 second
# - 100k records: 5-30 seconds
# - 1M+ records: Run in batches

# 3. Monitor progress
SELECT COUNT(*) FROM billing_settings WHERE cpfCnpj LIKE 'enc:%'

# 4. Verify completion
# All sensitive fields encrypted
SELECT COUNT(*) FROM billing_settings WHERE cpfCnpj NOT LIKE 'enc:%'
# Should return: 0
```

### Step 5: Setup Cleanup Job

```bash
# Add to cron (runs daily at 2 AM UTC)
# This hard-deletes users 30+ days after soft delete

# Method 1: Cron job
0 2 * * * cd /app && npx tsx scripts/cleanup-soft-deletes.ts >> /var/log/cleanup.log 2>&1

# Method 2: AWS Lambda
# - Trigger: CloudWatch Events (daily 2 AM)
# - Function: Run npm script
# - Timeout: 300 seconds
# - Memory: 1024 MB

# Method 3: Kubernetes CronJob
# apiVersion: batch/v1
# kind: CronJob
# metadata:
#   name: cleanup-soft-deletes
# spec:
#   schedule: "0 2 * * *"  # Daily 2 AM
#   jobTemplate:
#     spec:
#       template:
#         spec:
#           containers:
#           - name: cleanup
#             image: myapp:latest
#             command: ["npm", "run", "cleanup:soft-deletes"]
```

### Step 6: Setup Monitoring

```bash
# 1. Error Monitoring (Sentry)
# Add alert: P0 deployment errors > 1% error rate
# Threshold: Immediate alert

# 2. Performance Monitoring
# Add dashboard: Query performance post-P0
# Metric: Average query time
# Alert: If > 10% slower than baseline

# 3. Soft Delete Monitoring
# Query: Count of soft-deleted users per day
# Alert: If > 100 deletions/day (anomaly detection)

# 4. Encryption Monitoring
# Log: Decryption failures
# Alert: If decryption errors > 0.1%

# 5. Cleanup Job Monitoring
# Log: Cleanup job success/failure
# Alert: If cleanup job fails 2+ times in row
```

---

## Rollback Plan (If Issues)

### Immediate Rollback (< 5 minutes)

```bash
# If critical issues detected:

# 1. Stop deployment (if in progress)
DEPLOYMENT_PERCENTAGE=0 npm run deploy

# 2. Route traffic to previous version
lb.switchTraffic(current, previous)

# 3. Disable cleanup job
# crontab -e  → comment out cleanup line

# Impact: Users can't delete accounts for ~1 hour
# Reason: Previous version doesn't support soft delete
```

### Gradual Rollback (If data issues)

```bash
# If encryption data migration had issues:

# 1. Restore from backup
psql < backup_file.sql

# Impact: Lose 1-2 hours of data
# Prevents: Data corruption propagation
```

### Complete Rollback (Last resort)

```bash
# If rollback fails:

# 1. Stop all services
systemctl stop pacerunpro

# 2. Restore from production backup
# psql < backup_before_p0.sql

# 3. Verify restoration
SELECT COUNT(*) FROM users

# 4. Restart services
systemctl start pacerunpro

# Timeline: 30-60 minutes (includes verification)
```

---

## Post-Deployment (Day 7+)

- [ ] **Monitor for 24 hours**
  ```bash
  # Check every hour:
  # 1. Error rate
  # 2. Query performance
  # 3. Soft delete operations
  # 4. Encryption operations
  # 5. Cleanup job success
  ```

- [ ] **Announce to Users**
  - [ ] Email: Account deletion now available
  - [ ] Feature: "Delete Account" in account settings
  - [ ] Documentation: GDPR/LGPD compliance update

- [ ] **Update Documentation**
  - [ ] Add: Account deletion policy
  - [ ] Add: Data encryption notice
  - [ ] Add: 30-day grace period explanation

- [ ] **Compliance Report**
  - [ ] Generate: LGPD compliance report
  - [ ] Generate: Security audit report
  - [ ] Submit to: Legal & compliance team

---

## Success Metrics

After P0 deployment:

```
✅ LGPD Compliance
├─ Soft delete working: Yes
├─ 30-day grace period: Yes
├─ Auto-cleanup running: Yes
└─ Audit trail logging: Yes

✅ Security
├─ Sensitive data encrypted: Yes
├─ Decryption working transparently: Yes
├─ No plaintext tokens in DB: Yes
└─ ENCRYPTION_KEY secure: Yes

✅ Performance
├─ FK indexes active: Yes
├─ Query time improvement: 30x
├─ No query regressions: Yes
└─ Load average stable: Yes

✅ Operations
├─ Zero-downtime deployment: Yes
├─ Monitoring alerts working: Yes
├─ Rollback tested: Yes
└─ Team trained: Yes
```

---

## Timeline Summary

```
Day 1-2: Code review + environment setup
Day 3-5: Staging deployment + testing
Day 6-7: Production deployment + monitoring
Total: 7 days
Downtime: ~15 seconds (migration window)
```

---

**Ready to Deploy! 🚀**
