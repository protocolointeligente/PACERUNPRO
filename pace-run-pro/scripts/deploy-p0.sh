#!/bin/bash

# ============================================================================
# P0 DEPLOYMENT EXECUTION GUIDE
# ============================================================================
# Este script documenta os passos para deployment dos P0 items em produção
# IMPORTANTE: Execute em ambiente de STAGING primeiro antes de PRODUÇÃO
# ============================================================================

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}P0 DEPLOYMENT EXECUTION GUIDE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# ============================================================================
# STEP 1: PRE-DEPLOYMENT CHECKS
# ============================================================================
echo -e "${YELLOW}Step 1: Pre-Deployment Checks${NC}\n"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não configurado${NC}"
    echo "Configure antes de prosseguir:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/pacerunpro'"
    exit 1
fi

# Check if ENCRYPTION_KEY is set
if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${RED}❌ ENCRYPTION_KEY não configurado${NC}"
    echo "Configure antes de prosseguir:"
    echo "  export ENCRYPTION_KEY='$(openssl rand -hex 32)'"
    exit 1
fi

# Check if ENCRYPTION_KEY has correct format
if [[ ! $ENCRYPTION_KEY =~ ^[0-9a-f]{64}$ ]]; then
    echo -e "${RED}❌ ENCRYPTION_KEY inválido (deve ser 64 caracteres hex)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL configurado${NC}"
echo -e "${GREEN}✅ ENCRYPTION_KEY configurado (64 hex chars)${NC}\n"

# ============================================================================
# STEP 2: BACKUP DATABASE
# ============================================================================
echo -e "${YELLOW}Step 2: Backup Database (CRITICAL)${NC}\n"

# Create backup timestamp
BACKUP_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_p0_${BACKUP_TIME}.sql"

echo "⏳ Fazendo backup do banco de dados..."
echo "📁 Arquivo: $BACKUP_FILE"

# Uncomment to actually backup (requires psql installed)
# pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
# echo -e "${GREEN}✅ Backup criado com sucesso${NC}\n"

echo -e "${YELLOW}⚠️  IMPORTANTE: Sempre faça backup antes de migration!${NC}"
echo "Comando: pg_dump \$DATABASE_URL > $BACKUP_FILE"
echo "Verify: psql \$DATABASE_URL < $BACKUP_FILE"
echo ""

# ============================================================================
# STEP 3: DATABASE MIGRATION (Schema Changes + FK Indexes)
# ============================================================================
echo -e "${YELLOW}Step 3: Database Migration (Schema Changes + FK Indexes)${NC}\n"

echo "Esta migration adiciona:"
echo "  • deletedAt campos para: User, Athlete, Coach, Subscription, BillingSettings"
echo "  • deletionReason, deletedBy para: User"
echo "  • 8 Foreign Key indexes para performance"
echo ""

echo -e "${YELLOW}Comandos a executar:${NC}"
echo ""
echo "1️⃣  Criar nova migration:"
echo "   npx prisma migrate dev --name add_p0_soft_delete_and_indexes"
echo ""
echo "2️⃣  Ou deploy de migration existente:"
echo "   npx prisma migrate deploy"
echo ""
echo -e "${YELLOW}⚠️  Esperado: ~15 segundos de downtime durante migration${NC}"
echo "   Executar em off-peak: 02:00-04:00 UTC"
echo ""

# Check schema validity
echo "⏳ Validando schema Prisma..."
npx prisma validate
echo -e "${GREEN}✅ Schema válido${NC}\n"

# ============================================================================
# STEP 4: DATA ENCRYPTION MIGRATION
# ============================================================================
echo -e "${YELLOW}Step 4: Data Encryption Migration${NC}\n"

echo "Esta migration encripta dados existentes:"
echo "  • BillingSettings: cpfCnpj, pixKey, bankAccount, bankAccountType"
echo "  • ConnectedDevice: accessToken, refreshToken"
echo ""

# Check if migration script exists
if [ ! -f "scripts/migrate-encryption.ts" ]; then
    echo -e "${RED}❌ scripts/migrate-encryption.ts não encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}Comando a executar:${NC}"
echo ""
echo "npm run migrate:encrypt"
echo ""
echo -e "${YELLOW}Informações:${NC}"
echo "  • Tempo esperado: < 30 segundos"
echo "  • Idempotente: Seguro rodar múltiplas vezes"
echo "  • Sem downtime"
echo ""

# ============================================================================
# STEP 5: E2E TESTING
# ============================================================================
echo -e "${YELLOW}Step 5: Comprehensive E2E Testing${NC}\n"

echo -e "${YELLOW}5.1: Unit Tests${NC}"
echo "  npm test -- tests/P0.test.ts"
echo "  Esperado: 24/24 tests passing ✓"
echo ""

echo -e "${YELLOW}5.2: Manual API Testing${NC}"
echo "  curl -X POST http://localhost:3000/api/account/delete \\"
echo "    -H \"Authorization: Bearer \$TOKEN\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"reason\":\"user_requested\"}'"
echo ""
echo "  Verificar response:"
echo "    {\"success\":true, \"deletedAt\": \"...\", \"graceRemaining\": {\"days\": 30}}"
echo ""

echo -e "${YELLOW}5.3: Soft Delete Verification${NC}"
echo "  SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL;"
echo "  (Deve retornar 0 após test, ou N onde N = deleted test users)"
echo ""

echo -e "${YELLOW}5.4: Encryption Verification${NC}"
echo "  SELECT access_token FROM connected_devices LIMIT 1;"
echo "  (Deve retornar: 'enc:...' format, não plaintext)"
echo ""

echo -e "${YELLOW}5.5: Performance Testing${NC}"
echo "  SELECT COUNT(*) FROM notifications WHERE user_id = 'test-user';"
echo "  Esperado tempo: < 5ms (índices FK working)"
echo ""

echo -e "${YELLOW}5.6: Middleware Testing${NC}"
echo "  SELECT * FROM users WHERE deleted_at IS NOT NULL;"
echo "  (Deve ser vazio após middleware auto-filter)"
echo ""

# ============================================================================
# STEP 6: PRODUCTION DEPLOYMENT (Phased Rollout)
# ============================================================================
echo -e "${YELLOW}Step 6: Production Deployment (Phased Rollout)${NC}\n"

echo "Estratégia: Blue-Green deployment com phased rollout"
echo ""

echo -e "${YELLOW}6.1: Pre-Deployment (30 min antes)${NC}"
echo "  ✓ Verificar todos os alertas estão funcionando"
echo "  ✓ Preparar rollback procedure"
echo "  ✓ Notificar team"
echo "  ✓ Ter DBA em standby"
echo ""

echo -e "${YELLOW}6.2: Database Migration Window${NC}"
echo "  ⏰ Off-peak time (02:00-04:00 UTC)"
echo "  📊 Expected downtime: ~15 seconds"
echo "  "
echo "  1. Lock database (prevent writes)"
echo "  2. Run: npx prisma migrate deploy"
echo "  3. Verify schema changes"
echo "  4. Unlock database"
echo ""

echo -e "${YELLOW}6.3: Data Encryption Migration${NC}"
echo "  ⏰ Immediately after DB migration"
echo "  📊 Expected time: < 30 seconds (no downtime)"
echo "  "
echo "  1. Set ENCRYPTION_KEY in production"
echo "  2. Run: npm run migrate:encrypt"
echo "  3. Verify: No plaintext tokens in DB"
echo ""

echo -e "${YELLOW}6.4: Code Deployment (Phase 1: 10%)${NC}"
echo "  1. Deploy code to 10% of servers"
echo "  2. Monitor for 1 hour:"
echo "     - Error rates"
echo "     - Response times"
echo "     - Soft delete API errors"
echo "     - Decryption failures"
echo "  3. If healthy → proceed to Phase 2"
echo "  4. If issues → rollback to previous version"
echo ""

echo -e "${YELLOW}6.5: Code Deployment (Phase 2: 50%)${NC}"
echo "  1. Deploy code to 50% of servers"
echo "  2. Monitor for 1 hour (same metrics)"
echo "  3. If healthy → proceed to Phase 3"
echo "  4. If issues → rollback"
echo ""

echo -e "${YELLOW}6.6: Code Deployment (Phase 3: 100%)${NC}"
echo "  1. Deploy code to remaining 50% of servers"
echo "  2. Monitor closely for 2-4 hours"
echo "  3. Setup cron job for daily cleanup:"
echo ""
echo "     0 2 * * * cd /app && npx tsx scripts/cleanup-soft-deletes.ts"
echo ""

echo -e "${YELLOW}6.7: Post-Deployment Monitoring (24-48 hours)${NC}"
echo "  ✓ Soft-deleted user count"
echo "  ✓ Query performance (should be 30x faster)"
echo "  ✓ Decryption failures (should be 0)"
echo "  ✓ Cleanup job execution"
echo "  ✓ Error rates"
echo ""

# ============================================================================
# STEP 7: MONITORING & ALERTING
# ============================================================================
echo -e "${YELLOW}Step 7: Production Monitoring Setup${NC}\n"

echo "Setup alerts for these metrics:"
echo ""
echo "Soft Delete:"
echo "  • ALTER TABLE users ADD COLUMN monitoring_deleted_count INT;"
echo "  • Alert if: (deleted_at IS NOT NULL AND (NOW() - deleted_at > 30 days))"
echo ""

echo "Encryption:"
echo "  • Alert if: Decryption failures > 0 in logs"
echo "  • Alert if: access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL"
echo ""

echo "Performance:"
echo "  • Alert if: Query time > 100ms (should be < 20ms)"
echo "  • Alert if: FK index usage drops (index not being used)"
echo ""

echo "Cleanup Job:"
echo "  • Alert if: Job fails or doesn't run daily"
echo "  • Alert if: Hard deleted users < expected"
echo ""

# ============================================================================
# STEP 8: ROLLBACK PROCEDURE
# ============================================================================
echo -e "${YELLOW}Step 8: Rollback Procedure (if needed)${NC}\n"

echo "If issues occur, rollback in this order:"
echo ""
echo "1️⃣  Immediate: Stop traffic to new deployment (fast)"
echo "   • Route 100% traffic to previous version"
echo "   • Application code reverts immediately"
echo ""
echo "2️⃣  Database Rollback (if migration issues):"
echo "   • Restore from backup: psql \$DATABASE_URL < backup_p0_${BACKUP_TIME}.sql"
echo "   • Time: Depends on database size (typically 2-5 min)"
echo ""
echo "3️⃣  Validation:"
echo "   • Verify schema is back to original"
echo "   • Verify user data is intact"
echo "   • Verify application works"
echo ""
echo "4️⃣  Post-Mortem:"
echo "   • Identify root cause"
echo "   • Fix and re-test in staging"
echo "   • Schedule retry (next off-peak window)"
echo ""

# ============================================================================
# CHECKLIST
# ============================================================================
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PRE-DEPLOYMENT CHECKLIST${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo "Database & Backup:"
echo "  ☐ DATABASE_URL configured"
echo "  ☐ Database backup created and tested"
echo "  ☐ Backup can be restored (verified)"
echo "  ☐ DBA approval obtained"
echo ""

echo "Code & Tests:"
echo "  ☐ All 24 tests passing"
echo "  ☐ npm run build succeeds"
echo "  ☐ npm run lint passes"
echo "  ☐ TypeScript compilation clean"
echo "  ☐ No console errors/warnings"
echo ""

echo "Security Review:"
echo "  ☐ Encryption middleware reviewed"
echo "  ☐ Soft delete logic reviewed"
echo "  ☐ No hardcoded secrets in code"
echo "  ☐ ENCRYPTION_KEY stored in vault"
echo "  ☐ API endpoint authenticated"
echo ""

echo "Staging Validation:"
echo "  ☐ Staging deployment successful"
echo "  ☐ All E2E tests passed in staging"
echo "  ☐ Performance validated (30x improvement)"
echo "  ☐ No decryption failures"
echo "  ☐ Soft delete API works"
echo ""

echo "Production Readiness:"
echo "  ☐ Rollback procedure documented"
echo "  ☐ Monitoring alerts configured"
echo "  ☐ Team trained on new features"
echo "  ☐ User communication prepared"
echo "  ☐ Off-peak maintenance window confirmed"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Next Action: Run this script and follow each step${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
