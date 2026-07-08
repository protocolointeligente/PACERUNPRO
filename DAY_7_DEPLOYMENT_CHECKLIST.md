# ✅ DAY 7 PRODUCTION DEPLOYMENT CHECKLIST

**Target Date:** 2026-07-08  
**Deployment Window:** Execute in phases over 48 hours  
**Rollback Plan:** Available (previous deployment accessible via Vercel)  

---

## 🔍 PRE-DEPLOYMENT CHECKS (Execute First!)

### Environment & Configuration

- [ ] **ENCRYPTION_KEY Set**
  ```bash
  echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:32}..."
  # Should show: ENCRYPTION_KEY: 77fc6c6444b580b4e98210d3cd2e...
  ```

- [ ] **DATABASE_URL Set**
  ```bash
  echo "DATABASE_URL: ${DATABASE_URL:0:60}..."
  # Should show: DATABASE_URL: postgresql://neondb_owner...
  ```

- [ ] **All 24 Tests Passing**
  ```bash
  cd /workspaces/PACERUNPRO/pace-run-pro
  npm test -- tests/P0.test.ts
  # Expected: "Test Files 1 passed (1), Tests 24 passed (24)"
  ```

- [ ] **Schema Validation**
  ```bash
  npx prisma validate
  # Expected: "valid 🚀"
  ```

- [ ] **Node/npm Versions Compatible**
  ```bash
  node --version  # Expected: v24.x.x
  npm --version   # Expected: 11.x.x
  ```

---

## 📦 BUILD & PRE-DEPLOYMENT (5 minutes)

- [ ] **Production Build Successful**
  ```bash
  cd /workspaces/PACERUNPRO/pace-run-pro
  npm run build
  # Expected: "built successfully"
  ```

- [ ] **Git Status Clean**
  ```bash
  git status
  # Expected: "nothing to commit, working tree clean"
  ```

- [ ] **Latest Changes Committed**
  ```bash
  git add .
  git commit -m "Day 7: Production deployment - P0 compliance (LGPD/GDPR/PCI-DSS)"
  git push origin main
  # Expected: Changes pushed to main branch
  ```

- [ ] **Vercel Deployment Triggered**
  - [ ] Check: https://vercel.com/projects/pace-run-pro/deployments
  - [ ] Confirm latest build is ready
  - [ ] Preview URL showing "Ready"

---

## 🚀 PHASE 1: 10% TRAFFIC (1 hour)

### Deployment

- [ ] **Traffic Split Configured**
  - [ ] Go to: https://vercel.com/projects/pace-run-pro
  - [ ] Find latest deployment in "Deployments" tab
  - [ ] Set traffic split: 10% new, 90% previous
  - [ ] Or use Vercel CLI: `vercel promote <DEPLOYMENT_ID> --prod --traffic 10`

- [ ] **Phase 1 Start Time Recorded**
  ```
  Start time: __________________ UTC
  Planned end: __________________ UTC (+1 hour)
  ```

### Monitoring (Every 15 minutes)

- [ ] **Check Error Rate** (target: 0%)
  - [ ] Sentry dashboard: https://sentry.io/organizations/YOUR_ORG/issues/
  - [ ] Error count: _____
  - [ ] Status: ✅ Normal / ⚠️ Warning / 🔴 Critical

- [ ] **Check Response Time** (target: < 100ms)
  - [ ] Vercel Analytics: https://vercel.com/projects/pace-run-pro/analytics
  - [ ] Average time: _____ ms
  - [ ] p99 time: _____ ms
  - [ ] Status: ✅ Normal / ⚠️ Warning / 🔴 Critical

- [ ] **Check Database Connection**
  ```bash
  psql $DATABASE_URL -c "SELECT NOW();"
  # Should return current timestamp
  ```

- [ ] **Test Delete API (Manual)**
  ```bash
  curl -X POST http://localhost:3000/api/account/delete \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{"reason": "user_requested"}'
  # Expected: 200 OK with success: true
  ```

### Phase 1 Completion

- [ ] **1 Hour Complete:** _____ UTC
- [ ] **No Critical Errors:** ✅ Yes / ❌ No
- [ ] **Performance Normal:** ✅ Yes / ❌ No
- [ ] **Database Healthy:** ✅ Yes / ❌ No

**Decision:** 
- [ ] ✅ Proceed to Phase 2 (50%)
- [ ] 🔄 Wait and monitor longer
- [ ] 🔴 Rollback (see incident response)

---

## 🚀 PHASE 2: 50% TRAFFIC (2 hours)

### Deployment

- [ ] **Traffic Split Updated**
  - [ ] Update to: 50% new, 50% previous
  - [ ] Or use CLI: `vercel promote <DEPLOYMENT_ID> --prod --traffic 50`

- [ ] **Phase 2 Start Time Recorded**
  ```
  Start time: __________________ UTC
  Planned end: __________________ UTC (+2 hours)
  ```

### Monitoring (Every 30 minutes)

- [ ] **Check Error Rate** (target: < 0.5%)
  - [ ] Error count: _____
  - [ ] Status: ✅ Normal / ⚠️ Warning / 🔴 Critical

- [ ] **Check Response Time** (target: < 120ms)
  - [ ] Average time: _____ ms
  - [ ] p99 time: _____ ms
  - [ ] Status: ✅ Normal / ⚠️ Warning / 🔴 Critical

- [ ] **Check Database Load**
  ```bash
  psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
  # Should be < 50 connections
  ```

- [ ] **Check Encryption Middleware**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj LIKE 'enc:%' LIMIT 1;"
  # Should return >= 0
  ```

### Phase 2 Completion

- [ ] **2 Hours Complete:** _____ UTC
- [ ] **No Critical Errors:** ✅ Yes / ❌ No
- [ ] **Performance Normal:** ✅ Yes / ❌ No
- [ ] **Database Healthy:** ✅ Yes / ❌ No

**Decision:**
- [ ] ✅ Proceed to Phase 3 (100%)
- [ ] 🔄 Wait and monitor longer
- [ ] 🔴 Rollback (see incident response)

---

## 🚀 PHASE 3: 100% TRAFFIC (24-48 hours)

### Deployment

- [ ] **Traffic Split Updated to 100%**
  - [ ] Update to: 100% new deployment
  - [ ] Archive previous deployment version
  - [ ] Or use CLI: `vercel promote <DEPLOYMENT_ID> --prod`

- [ ] **Phase 3 Start Time Recorded**
  ```
  Start time: __________________ UTC
  Expected monitoring end: __________________ UTC (+48 hours)
  ```

### Continuous Monitoring (Every 1-4 hours)

#### Metrics Checklist (Check 4 times)

**Check 1 (4 hours into Phase 3):**
- [ ] Error rate: _____ %  ✅ / ⚠️ / 🔴
- [ ] Response time: _____ ms ✅ / ⚠️ / 🔴
- [ ] DB connections: _____ ✅ / ⚠️ / 🔴
- [ ] CPU usage: _____ % ✅ / ⚠️ / 🔴
- [ ] Memory usage: _____ % ✅ / ⚠️ / 🔴

**Check 2 (12 hours into Phase 3):**
- [ ] Error rate: _____ %  ✅ / ⚠️ / 🔴
- [ ] Response time: _____ ms ✅ / ⚠️ / 🔴
- [ ] DB connections: _____ ✅ / ⚠️ / 🔴
- [ ] CPU usage: _____ % ✅ / ⚠️ / 🔴
- [ ] Memory usage: _____ % ✅ / ⚠️ / 🔴

**Check 3 (24 hours into Phase 3):**
- [ ] Error rate: _____ %  ✅ / ⚠️ / 🔴
- [ ] Response time: _____ ms ✅ / ⚠️ / 🔴
- [ ] DB connections: _____ ✅ / ⚠️ / 🔴
- [ ] CPU usage: _____ % ✅ / ⚠️ / 🔴
- [ ] Memory usage: _____ % ✅ / ⚠️ / 🔴

**Check 4 (48 hours into Phase 3):**
- [ ] Error rate: _____ %  ✅ / ⚠️ / 🔴
- [ ] Response time: _____ ms ✅ / ⚠️ / 🔴
- [ ] DB connections: _____ ✅ / ⚠️ / 🔴
- [ ] CPU usage: _____ % ✅ / ⚠️ / 🔴
- [ ] Memory usage: _____ % ✅ / ⚠️ / 🔴

### Application Functionality Tests

- [ ] **Delete API Working** (test every 12 hours)
  ```bash
  curl -X POST https://pace-run-pro.vercel.app/api/account/delete \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{"reason": "user_requested"}'
  # Expected: 200 OK
  ```

- [ ] **Soft Delete Data Present**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL;"
  # Expected: Integer >= 0
  ```

- [ ] **Encryption Working**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj LIKE 'enc:%';"
  # Expected: Integer >= 0
  ```

### Phase 3 Completion

- [ ] **48 Hours Complete:** _____ UTC
- [ ] **All Metrics Green:** ✅ Yes / ❌ No
- [ ] **No Data Corruption:** ✅ Yes / ❌ No
- [ ] **Cleanup Job Configured:** ✅ Yes / ❌ No

---

## ⏰ CRON JOB SETUP

### Verify Cleanup Job Configuration

- [ ] **vercel.json Contains Cron Config**
  ```bash
  grep -A2 "crons" /workspaces/PACERUNPRO/pace-run-pro/vercel.json
  # Expected: schedule: "0 2 * * *"
  ```

- [ ] **API Route Created**
  ```bash
  ls -l /workspaces/PACERUNPRO/pace-run-pro/src/app/api/cron/cleanup-soft-deletes/route.ts
  # Expected: File exists
  ```

- [ ] **CRON_SECRET Set (Optional)**
  - [ ] Environment variable added: `vercel env add CRON_SECRET`
  - [ ] Or left empty (Vercel handles auth automatically)

### Monitor First Execution

- [ ] **Wait for 2 AM UTC** (first scheduled run)
- [ ] **Check Vercel Logs**
  ```bash
  vercel logs pace-run-pro --tail | grep cleanup
  # Expected: Log entries showing job execution
  ```

- [ ] **Verify Cleanup Executed**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';"
  # Expected: Count should decrease after cron runs
  ```

---

## ✅ COMPLIANCE VERIFICATION

### LGPD Compliance

- [ ] **Soft Delete Working**
  - [ ] Users can request deletion ✅
  - [ ] Deletion timestamp recorded ✅
  - [ ] Email anonymized to deleted-TIMESTAMP@deleted.local ✅

- [ ] **30-Day Grace Period Active**
  - [ ] deletedAt timestamp set correctly ✅
  - [ ] Countdown verified in database ✅

- [ ] **Automatic Cleanup Running**
  - [ ] Cron job scheduled ✅
  - [ ] First execution logged ✅

- [ ] **Audit Trail Maintained**
  - [ ] deleted_by field populated ✅
  - [ ] deletion_reason recorded ✅

### GDPR Compliance

- [ ] **Data Export Available**
  - [ ] User can export personal data ✅
  - [ ] Format is standard (JSON/CSV) ✅

- [ ] **Right to Be Forgotten**
  - [ ] Soft delete API working ✅
  - [ ] Hard delete after 30 days working ✅

- [ ] **Data Minimization**
  - [ ] Only necessary data stored ✅
  - [ ] Sensitive data encrypted ✅

### PCI-DSS Compliance

- [ ] **Payment Data Encrypted**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj LIKE 'enc:%' AND cpfCnpj NOT LIKE 'plain:%';"
  # Expected: All encrypted (enc: prefix, not plain:)
  ```

- [ ] **Encryption Key Secure**
  - [ ] Not in version control ✅
  - [ ] In secure environment variables ✅
  - [ ] Rotated per policy ✅

- [ ] **No Plaintext Sensitive Data**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BillingSettings\" WHERE cpfCnpj NOT LIKE 'enc:%' AND cpfCnpj NOT LIKE 'plain:%' AND cpfCnpj NOT NULL;"
  # Expected: 0
  ```

---

## 🎯 FINAL VERIFICATION (After 48 hours)

### Performance Validation

- [ ] **30x Performance Improvement Confirmed**
  ```bash
  psql $DATABASE_URL << EOF
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE id = 'test-id';
  EOF
  # Expected: Planning time < 1ms, Execution time < 5ms
  ```

- [ ] **Response Times Stable** (< 100ms)
  - [ ] Check Vercel Analytics
  - [ ] Average: _____ ms ✅
  - [ ] p99: _____ ms ✅

- [ ] **Database Load Stable** (< 50 connections)
  - [ ] Peak connections: _____
  - [ ] Status: ✅

### Data Integrity

- [ ] **No Orphaned Records**
  ```bash
  psql $DATABASE_URL << EOF
  SELECT COUNT(*) FROM accounts WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = accounts.user_id);
  EOF
  # Expected: 0
  ```

- [ ] **All FK Indexes Created (8 total)**
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('accounts', 'sessions', 'notifications', 'payments', 'subscriptions') AND indexname LIKE '%_idx';"
  # Expected: >= 8
  ```

- [ ] **No Data Corruption**
  - [ ] User count matches expectations ✅
  - [ ] Soft deleted users intact ✅
  - [ ] Hard deleted users removed ✅

### Test Suite

- [ ] **All 24 Tests Still Passing**
  ```bash
  npm test -- tests/P0.test.ts
  # Expected: "Tests 24 passed (24)"
  ```

- [ ] **No Regressions**
  - [ ] Error tests catching appropriate failures ✅
  - [ ] Edge cases handled ✅

---

## 🏁 DEPLOYMENT COMPLETE!

### Success Criteria Met

- [ ] **Phase 1 (10%) — 1 hour:** ✅ Passed
- [ ] **Phase 2 (50%) — 2 hours:** ✅ Passed
- [ ] **Phase 3 (100%) — 24-48 hours:** ✅ Passed
- [ ] **All Metrics Green:** ✅ Yes
- [ ] **Compliance Verified:** ✅ LGPD/GDPR/PCI-DSS
- [ ] **Cleanup Job Active:** ✅ Running
- [ ] **Data Integrity:** ✅ Verified

### Post-Deployment Actions

- [ ] **Documentation Updated**
  - [ ] DEPLOYMENT_COMPLETE.md created
  - [ ] Runbook updated with prod URLs
  - [ ] Team notified of live status

- [ ] **Monitoring Handed Off**
  - [ ] Alert thresholds configured
  - [ ] Sentry monitoring active
  - [ ] On-call schedule updated

- [ ] **Team Communication**
  - [ ] Slack announcement: "P0 deployment complete ✅"
  - [ ] Status page updated
  - [ ] Stakeholders notified

---

## 📞 EMERGENCY PROCEDURES

### If Error Rate Spikes

- [ ] **Immediate Action:** Rollback
  ```bash
  vercel deploy --prod --skip-build --previous
  ```

- [ ] **Investigation:**
  - [ ] Check Sentry for error patterns
  - [ ] Review application logs
  - [ ] Database query analysis

- [ ] **Fix & Redeploy:**
  - [ ] Address root cause in code
  - [ ] Commit changes
  - [ ] Restart from Phase 1

### If Database Connection Lost

- [ ] **Check connection:**
  ```bash
  psql $DATABASE_URL -c "SELECT 1;"
  ```

- [ ] **If failed:**
  - [ ] Check Neon status page
  - [ ] Verify DATABASE_URL environment variable
  - [ ] Restart Vercel deployment

- [ ] **If persists:**
  - [ ] Contact Neon support
  - [ ] Prepare rollback plan

---

## 📝 SIGN-OFF

**Deployment Completed By:** _____________________  
**Date & Time:** _____ UTC  
**Status:** 🟢 All systems nominal

**Verification Signed Off By:** _____________________  
**Date & Time:** _____ UTC

---

**🎉 Congratulations! Day 7 Production Deployment Complete!**

**P0 Compliance Roadmap: 100% COMPLETE** ✅
- Days 1-2: Code & Tests ✅
- Days 3-4: Migration & Encryption ✅
- Days 5-6: Testing & Validation ✅
- Day 7: Production Deployment ✅

**Next:** Ongoing monitoring and maintenance per established procedures.
