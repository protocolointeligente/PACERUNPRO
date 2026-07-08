# 🔄 DATABASE MIGRATION — PASSO-A-PASSO EXECUTIVO

## ⚠️ PREREQUISITO: Configure DATABASE_URL

Antes de executar a migration, você **DEVE** ter `DATABASE_URL` configurado apontando para seu banco de dados de **STAGING** (não produção!).

### Como configurar DATABASE_URL

**Opção 1: Variável de Ambiente (recomendado)**
```bash
export DATABASE_URL="postgresql://user:password@host:5432/pacerunpro_staging"
```

**Opção 2: Arquivo .env.local**
```bash
echo 'DATABASE_URL=postgresql://user:password@host:5432/pacerunpro_staging' >> .env.local
```

**Opção 3: Arquivo .env**
```bash
echo 'DATABASE_URL=postgresql://user:password@host:5432/pacerunpro_staging' >> .env
```

Depois, verifique:
```bash
echo $DATABASE_URL
# Output: postgresql://user:password@host:5432/pacerunpro_staging
```

---

## 📋 PRÉ-MIGRATION CHECKLIST

- [ ] DATABASE_URL configurado e testado
- [ ] Você está em STAGING (não produção!)
- [ ] Backup de banco criado e testado
- [ ] Schema Prisma validado
- [ ] Acesso de DBA/devops em standby
- [ ] Off-peak maintenance window (02:00-04:00 UTC)

---

## 🚀 EXECUÇÃO

### STEP 1: Backup do Banco (CRITICAL!)

```bash
# Create backup
pg_dump $DATABASE_URL > backup_p0_staging_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_p0_staging_*.sql

# Test restore (OPTIONAL but recommended)
# Don't restore, just verify it can be restored
# psql $DATABASE_URL < backup_p0_staging_YYYYMMDD_HHMMSS.sql
```

**Status after this step:** ✅ Backup criado e verificado

---

### STEP 2: Validate Schema Prisma

```bash
cd /workspaces/PACERUNPRO/pace-run-pro

# Validate schema
npx prisma validate

# Expected output:
# "The schema at prisma/schema.prisma is valid 🚀"
```

**Status after this step:** ✅ Schema validado

---

### STEP 3: Test Database Connection

```bash
# Test connection to database
psql $DATABASE_URL -c "SELECT NOW();"

# Expected: current timestamp

# Optional: Check current user count (before migration)
psql $DATABASE_URL -c "SELECT COUNT(*) as total_users FROM users;"

# Expected: <number> (save this value to compare after migration)
```

**Status after this step:** ✅ Database connection OK

---

### STEP 4: Execute Database Migration

```bash
# Option A: Use npm script (recommended)
npm run db:migrate

# Expected output:
# Prisma Migrate
# 
# ✔ Migrations to apply:
#   - add_soft_delete_fields
#   - add_missing_fk_indexes
# 
# ✔ Have not been applied yet
# 
# ✔ 2 migrations will be applied
# 
# Prisma Migrate
# 
# ✔ Migration sent to database (timing: XXms)
# ✔ Database migration successfully applied.

# Option B: Manual Prisma migration (if npm script fails)
npx prisma migrate deploy

# Expected: Same as above
```

**⏱️ Expected duration:** ~15 seconds (including downtime)

**Status after this step:** ✅ Migration executed

---

### STEP 5: Post-Migration Validation

```bash
# 1. Verify soft-delete fields were added
psql $DATABASE_URL << EOF
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='users' 
  AND column_name IN ('deleted_at', 'deletion_reason', 'deleted_by')
ORDER BY column_name;
EOF

# Expected output:
# column_name   | data_type
# ─────────────────────────────────────
# deleted_at    | timestamp without time zone
# deleted_by    | character varying
# deletion_reason | text

# 2. Verify foreign key indexes were created
psql $DATABASE_URL << EOF
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' 
  AND (tablename IN ('accounts', 'sessions', 'notifications', 'payments', 'subscriptions', 'feed_posts', 'feed_comments'))
ORDER BY tablename, indexname;
EOF

# Expected: Multiple indexes created
# Example:
# accounts         | accounts_user_id_idx
# notifications    | notifications_user_id_idx
# payments         | payments_user_id_status_idx

# 3. Verify data integrity (user count should be the same)
psql $DATABASE_URL -c "SELECT COUNT(*) as total_users FROM users;"

# Expected: <same number as before migration>

# 4. Verify no data loss
psql $DATABASE_URL << EOF
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT id) as unique_users,
  COUNT(email) as non_null_emails
FROM users;
EOF

# Expected: all three counts should be equal and match pre-migration count
```

**Status after this step:** ✅ Migration validated

---

## ✅ SUCCESS CRITERIA

After migration completes successfully:

- [ ] Schema changes applied (soft-delete fields present)
- [ ] FK indexes created (8+ new indexes visible)
- [ ] Data integrity maintained (user count same as before)
- [ ] No data loss (all records still present)
- [ ] Application starts without errors
- [ ] No performance degradation

---

## 🔄 ROLLBACK PROCEDURE (if needed)

If something goes wrong during or after migration:

```bash
# 1. Stop application
systemctl stop app
# OR if running locally: Ctrl+C

# 2. Restore from backup
psql $DATABASE_URL < backup_p0_staging_YYYYMMDD_HHMMSS.sql

# Expected: Database will be restored to state before migration

# 3. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Expected: Same user count as original

# 4. Check that deleted_at fields are gone (restored to before migration)
psql $DATABASE_URL -c "\d users" | grep deleted_at
# Expected: No results (fields should not exist)

# 5. Restart application
systemctl start app
# OR if running locally: npm run dev

# 6. Verify application works
npm test
curl http://localhost:3000/health
```

---

## 📊 NEXT STEPS

After successful database migration:

### Day 4: Data Encryption Migration
```bash
npm run migrate:encrypt
```
See: [DATA_ENCRYPTION_MIGRATION.md](../EXECUTION_GUIDE.md#dia-4-data-encryption-migration)

### Days 5-6: E2E Testing
```bash
npm test -- tests/P0.test.ts
```

### Day 7: Production Deployment
Follow: [P0_DEPLOYMENT_CHECKLIST.md](../P0_DEPLOYMENT_CHECKLIST.md#production-deployment-phase-7)

---

## 🆘 TROUBLESHOOTING

### Error: "DATABASE_URL not set"
**Solution:**
```bash
export DATABASE_URL="postgresql://user:password@host:5432/pacerunpro"
echo $DATABASE_URL  # Verify it's set
```

### Error: "Connection refused"
**Solution:**
1. Verify DATABASE_URL is correct
2. Verify PostgreSQL server is running
3. Verify firewall allows connection
4. Check credentials in DATABASE_URL

### Error: "Migration failed"
**Solution:**
1. Check backup file exists and is valid
2. Restore from backup
3. Review error message in console
4. Check PostgreSQL logs for details

### Error: "Schema validation failed"
**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Re-validate
npx prisma validate

# Try migration again
npm run db:migrate
```

### Performance issue after migration
**Solution:**
1. Verify indexes were created
2. Run `ANALYZE` command to update statistics
3. Check query plans with `EXPLAIN ANALYZE`

---

## 📞 SUPPORT

| Issue | Check |
|-------|-------|
| Database connection | `psql $DATABASE_URL -c "SELECT NOW();"` |
| Schema validity | `npx prisma validate` |
| Backup existence | `ls -la backup_p0_*.sql` |
| Migration status | `npx prisma migrate status` |
| Indexes created | `SELECT * FROM pg_indexes WHERE tablename IN (...)` |

---

## ✨ COMPLETION

When all validation passes:

```bash
echo "✅ Database Migration Complete!"
echo ""
echo "Status:"
echo "  ✓ Schema updated with soft-delete fields"
echo "  ✓ Foreign Key indexes created"
echo "  ✓ Data integrity verified"
echo "  ✓ Application ready for next step"
echo ""
echo "Next: Execute Day 4 Data Encryption Migration"
```

---

**Last Updated:** 2026-07-08  
**Status:** 🟢 Ready to Execute (with DATABASE_URL configured)
