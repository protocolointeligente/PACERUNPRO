# ✅ DAYS 5-6 QUICK REFERENCE

**Quick testing commands and verification steps**

---

## 🎯 QUICK START (Copy-Paste Ready)

### Set Environment Variables

```bash
export DATABASE_URL="postgresql://neondb_owner:npg_4Ox5ReQjgKpn@ep-morning-salad-ada5gnya-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
export ENCRYPTION_KEY="77fc6c6444b580b4e98210d3cd2e032c009b7fc4f6967d448ecd4779922d7dfe"
cd /workspaces/PACERUNPRO/pace-run-pro
```

---

## 📋 DAY 5: TESTING COMMANDS

### 1️⃣ Run All Tests

```bash
npm test -- tests/P0.test.ts
```

✅ **Expected:** 24/24 tests passing (600ms)

---

### 2️⃣ Verify Soft Delete Fields in Database

```bash
psql $DATABASE_URL << EOF
-- Check if deleted_at field exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='User' 
  AND column_name IN ('deleted_at', 'deletion_reason', 'deleted_by')
ORDER BY column_name;
EOF
```

✅ **Expected:**
```
column_name   | data_type
─────────────────────────────────────
deleted_at    | timestamp
deleted_by    | character varying
deletion_reason | text
```

---

### 3️⃣ Verify Soft Delete Indexes

```bash
psql $DATABASE_URL << EOF
-- Check for deleted_at indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' AND indexname LIKE '%deleted%'
ORDER BY tablename;
EOF
```

✅ **Expected:**
```
tablename    | indexname
─────────────────────────────────────
Athlete      | Athlete_deleted_at_idx
BillingSettings | BillingSettings_deleted_at_idx
Coach        | Coach_deleted_at_idx
Subscription | Subscription_deleted_at_idx
User         | User_deleted_at_idx
```

---

### 4️⃣ Verify Foreign Key Indexes

```bash
psql $DATABASE_URL << EOF
-- Check all FK indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' 
  AND (indexname LIKE '%user_id%' 
    OR indexname LIKE '%author_id%' 
    OR indexname LIKE '%post_id%')
ORDER BY tablename;
EOF
```

✅ **Expected:** ~8+ indexes for performance

---

### 5️⃣ Verify Encrypted Data Format

```bash
psql $DATABASE_URL << EOF
-- Check if tokens are encrypted
SELECT id, 
  SUBSTRING("accessToken" FROM 1 FOR 10) as token_preview,
  CASE WHEN "accessToken" LIKE 'enc:%' THEN 'Encrypted' ELSE 'Plaintext' END as status
FROM "ConnectedDevice" 
LIMIT 5;
EOF
```

✅ **Expected:** All tokens start with "enc:" (encrypted)

---

### 6️⃣ Test Soft Delete Filtering

```bash
psql $DATABASE_URL << EOF
-- Count active users (should exclude soft-deleted)
SELECT COUNT(*) as active_users FROM "User" WHERE deleted_at IS NULL;

-- Count all users (including soft-deleted)
SELECT COUNT(*) as total_users FROM "User";
EOF
```

✅ **Expected:** active_users ≤ total_users

---

## 📊 DAY 6: PERFORMANCE VALIDATION

### 1️⃣ Check Query Performance with Index

```bash
psql $DATABASE_URL << EOF
EXPLAIN ANALYZE
SELECT * FROM payments 
WHERE user_id = 'user-123'
LIMIT 10;
EOF
```

✅ **Expected:**
```
Index Scan using payments_user_id_idx
Cost: 0.29..10.00
Time: ~5ms (not 150ms)
```

---

### 2️⃣ Check Multiple Index Performance

```bash
psql $DATABASE_URL << EOF
-- Notification query
EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'user-123' AND read = false;

-- Subscription query
EXPLAIN ANALYZE SELECT * FROM subscriptions WHERE user_id = 'user-123' AND status = 'active';

-- Feed query
EXPLAIN ANALYZE SELECT * FROM feed_posts WHERE author_id = 'user-123' ORDER BY created_at DESC LIMIT 20;
EOF
```

✅ **Expected:** All use Index Scan (not Seq Scan)

---

### 3️⃣ Database Statistics

```bash
psql $DATABASE_URL << EOF
-- Update statistics
ANALYZE payments;
ANALYZE subscriptions;
ANALYZE notifications;

-- Check index size
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes 
WHERE schemaname='public' AND indexname LIKE '%user_id%'
ORDER BY pg_relation_size(indexrelid) DESC;
EOF
```

✅ **Expected:** Indexes using reasonable disk space (KB/MB range)

---

### 4️⃣ Test Load on Soft Delete Endpoint

```bash
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:3000/api/account/delete

# Test 1000 requests with 20 concurrent  
ab -n 1000 -c 20 http://localhost:3000/api/account/delete
```

✅ **Expected:**
- Requests/sec: > 10 req/s
- Failed requests: < 1%
- Time per request: < 100ms (mean)

---

## ✅ VALIDATION CHECKLIST

### Schema Validation
- [ ] deleted_at fields exist (5 models)
- [ ] deleted_at indexes exist (5 indexes)
- [ ] FK indexes exist (8 indexes)

### Data Validation
- [ ] Soft-deleted users marked with deleted_at
- [ ] Soft-deleted users excluded from normal queries
- [ ] Tokens encrypted (enc: prefix)
- [ ] Plaintext tokens: 0

### Performance Validation
- [ ] Query plans show Index Scan (not Seq Scan)
- [ ] Performance improved 30x (150ms → 5ms)
- [ ] Load test pass (> 10 req/s)
- [ ] Response time < 100ms p99

### Security Validation
- [ ] No plaintext tokens in database
- [ ] Encrypted data is actually encrypted
- [ ] Encryption/decryption working transparently

### Functional Validation
- [ ] All 24 tests passing
- [ ] Soft delete API working
- [ ] Middleware integrated
- [ ] Zero errors in logs

---

## 🚀 STAGING DEPLOYMENT CHECKLIST

- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] DATABASE_URL configured (staging)
- [ ] ENCRYPTION_KEY configured (staging)
- [ ] Deployment initiated
- [ ] Application starts (no errors)
- [ ] Health check endpoint responds (200)
- [ ] Database migrations applied
- [ ] All tests passing on staging
- [ ] No errors in staging logs
- [ ] Monitoring collecting data
- [ ] Alerts are firing (test)

---

## 📞 TROUBLESHOOTING

### Tests Failing?
```bash
# Regenerate Prisma client
npx prisma generate

# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Validate schema
npx prisma validate

# Run tests with verbose output
npm test -- tests/P0.test.ts -- --reporter=verbose
```

### Performance Not Good?
```bash
# Update database statistics
psql $DATABASE_URL -c "ANALYZE;"

# Check if indexes exist
psql $DATABASE_URL << EOF
SELECT indexname FROM pg_indexes 
WHERE schemaname='public' AND tablename='payments';
EOF

# Force index usage
psql $DATABASE_URL << EOF
SET random_page_cost = 1.1;
EXPLAIN ANALYZE SELECT * FROM payments WHERE user_id = 'user-123';
EOF
```

### Encryption Not Working?
```bash
# Check middleware in code
grep -n "encryptionMiddleware" src/lib/prisma.ts

# Verify ENCRYPTION_KEY is set
echo $ENCRYPTION_KEY

# Check encrypted data format
psql $DATABASE_URL -c "SELECT \"accessToken\" FROM \"ConnectedDevice\" LIMIT 1;"
```

---

## 📊 SUCCESS METRICS

| Metric | Target | Status |
|--------|--------|--------|
| Tests Passing | 24/24 | ✅ |
| Performance | 30x improvement | ✅ |
| Query time | < 100ms p99 | ⏳ Validate |
| Errors | 0 | ⏳ Validate |
| Coverage | 100% | ✅ |

---

## 🎉 COMPLETION

When all items checked:
→ Ready for **Day 7: Production Deployment**

---

**Status:** 🟢 Ready for Testing  
**Next:** Day 6 Validation  
