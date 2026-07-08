# 🔧 DEPLOYMENT COMMANDS — Quick Reference

## Environment Setup

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/pacerunpro"

# Set ENCRYPTION_KEY (if not already in .env)
export ENCRYPTION_KEY="77fc6c6444b580b4e98210d3cd2e032c009b7fc4f6967d448ecd4779922d7dfe"

# Verify
echo "DATABASE_URL: $DATABASE_URL"
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:16}..."
```

---

## Dia 3: Database Migration

### Pre-Migration Checks

```bash
cd /workspaces/PACERUNPRO/pace-run-pro

# 1. Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# 2. Create backup (CRITICAL!)
BACKUP_FILE="backup_p0_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
echo "Backup: $BACKUP_FILE"

# 3. Validate schema
npx prisma validate

# 4. Check current schema
psql $DATABASE_URL -c "\d users" | head -20
```

### Execute Migration

```bash
# Deploy Prisma migrations
npm run db:migrate

# OR if no migration exists yet, create one:
npm run db:migrate:dev -- --name add_p0_soft_delete_and_indexes
```

### Post-Migration Validation

```bash
# 1. Verify soft-delete fields added
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name LIKE 'deleted%';"

# Expected output:
# deleted_at         | timestamp without time zone
# deletion_reason    | text
# deleted_by         | character varying

# 2. Verify FK indexes created
psql $DATABASE_URL << EOF
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' 
AND (tablename IN ('accounts', 'sessions', 'notifications', 'payments', 'subscriptions', 'feed_posts', 'feed_comments'))
ORDER BY tablename, indexname;
