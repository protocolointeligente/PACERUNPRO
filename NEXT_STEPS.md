# 🚀 PRÓXIMOS PASSOS — ROADMAP VISUAL

## 📊 Visão Geral (7 Dias para Produção)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Dia 1-2: ✅ Code Review + Setup              (COMPLETE)              │
│  ├─ ENCRYPTION_KEY gerada e configurada                               │
│  ├─ Todos os testes passando (24/24)                                  │
│  ├─ Schema validado                                                   │
│  └─ Documentação completa                                             │
│                                                                         │
│  Dia 3: 🔄 Database Migration              (PRÓXIMO PASSO)            │
│  ├─ Backup do banco                                                   │
│  ├─ Deploy schema changes (soft delete fields + FK indexes)          │
│  ├─ Validar schema aplicado corretamente                             │
│  └─ ~15 segundos de downtime (off-peak)                              │
│                                                                         │
│  Dia 4: 🔐 Data Encryption Migration         (SEM DOWNTIME)          │
│  ├─ Executar npm run migrate:encrypt                                 │
│  ├─ Encriptar dados existentes                                       │
│  ├─ Verificar: 0 plaintext tokens no DB                              │
│  └─ < 30 segundos                                                    │
│                                                                         │
│  Dia 5-6: 🧪 E2E Testing & Staging           (VALIDAÇÃO)            │
│  ├─ Rodar 24 testes P0                                               │
│  ├─ Manual API testing (soft delete)                                 │
│  ├─ Performance testing (30x melhoria)                               │
│  ├─ Encryption verification                                          │
│  └─ Security validation                                              │
│                                                                         │
│  Dia 7: 🚀 Production Deployment              (PHASED ROLLOUT)       │
│  ├─ DB migration (15 sec downtime)                                   │
│  ├─ Deploy to 10% (1 hora monitoring)                                │
│  ├─ Deploy to 50% (1 hora monitoring)                                │
│  ├─ Deploy to 100% (2-4 horas monitoring)                            │
│  └─ Setup cleanup cron job                                           │
│                                                                         │
│  Dias 8+: 📊 Production Monitoring           (24-48 HORAS)          │
│  ├─ Daily cleanup job checks                                         │
│  ├─ Query performance verification                                   │
│  ├─ Error rate monitoring                                            │
│  └─ User feedback monitoring                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PASSO IMEDIATO: Dia 3 Database Migration

### Step 1: Preparação (30 min antes)

```bash
# ✓ Verificar que DATABASE_URL está configurado
echo $DATABASE_URL
# Output esperado: postgresql://...

# ✓ Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"
# Output esperado: current timestamp

# ✓ Criar backup
pg_dump $DATABASE_URL > backup_p0_$(date +%Y%m%d_%H%M%S).sql
echo "Backup criado: backup_p0_*.sql"

# ✓ Validar backup pode ser restaurado
# (não restaurar agora, só testar restore)
```

### Step 2: Validação do Schema

```bash
# ✓ Garantir que schema está válido
cd /workspaces/PACERUNPRO/pace-run-pro
npx prisma validate
# Output esperado: "The schema at prisma/schema.prisma is valid 🚀"
```

### Step 3: Database Migration

```bash
# ✓ Deploy das mudanças de schema
npm run db:migrate

# Output esperado:
# Prisma Migrate
#
# ✔ Migration sent to database (timing: XXms)
# ✔ Database migration successfully applied.
```

### Step 4: Validar Changes

```bash
# ✓ Verificar se campos soft-delete foram adicionados
psql $DATABASE_URL -c "\d users" | grep -E "deleted_at|deletion_reason|deleted_by"

# Output esperado:
# deleted_at | timestamp without time zone
# deletion_reason | text
# deleted_by | character varying

# ✓ Verificar se FK indexes foram criados
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename='accounts' ORDER BY indexname;"

# Output esperado (deve incluir):
# accounts_user_id_idx

# ✓ Verificar integridade de dados
psql $DATABASE_URL -c "SELECT COUNT(*) as total_users FROM users;"
# Output esperado: <same as before, sem perda de dados>
```

### Step 5: Validação de Indexes

```bash
# ✓ Verificar que indexes foram criados em todos os modelos
psql $DATABASE_URL << EOF
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('accounts', 'sessions', 'notifications', 'payments', 'subscriptions', 'feed_posts', 'feed_comments')
ORDER BY tablename, indexname;
EOF

# Esperado: múltiplos índices criados
```

**⏱️ Tempo total: ~30-45 minutos**  
**⏰ Downtime: ~15 segundos (durante `npx prisma migrate deploy`)**

---

## 📋 Checklist: Dia 3 Database Migration

```
PRÉ-MIGRATION:
☐ DATABASE_URL configurado
☐ Conexão ao banco testada
☐ Backup criado com sucesso
☐ Restore do backup testado (opcional)
☐ Schema validado (npx prisma validate)

MIGRATION:
☐ npm run db:migrate executado
☐ Sem erros de migration
☐ Downtime foi ~15 segundos

PÓS-MIGRATION:
☐ Campos deleted_at adicionados às tabelas
☐ FK indexes criados
☐ Integridade de dados verificada
☐ Sem data loss
☐ Aplicação ainda funciona

VALIDAÇÃO:
☐ SELECT COUNT(*) FROM users = <expected>
☐ Indexes visíveis em pg_indexes
☐ No errors in application logs
```

---

## 🔐 Próximo: Dia 4 Data Encryption Migration

Após completar Dia 3, executar:

```bash
# Verificar dados não-encriptados ANTES
psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL;"

# Executar migration
npm run migrate:encrypt

# Verificar dados encriptados DEPOIS
psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL;"
# Esperado: 0 (zero plaintext tokens)

# Verificar formato
psql $DATABASE_URL -c "SELECT access_token FROM connected_devices LIMIT 1;"
# Esperado: enc:<base64_string>
```

---

## 🧪 Próximo: Dias 5-6 Testing

```bash
# Testes unitários
npm test -- tests/P0.test.ts
# Esperado: 24/24 tests passing ✓

# Performance check
npm run build
# Verificar sem erros

# Manual testing será feito em staging antes de produção
```

---

## 🚀 Próximo: Dia 7 Production Deployment

**Estratégia:** Phased rollout 10% → 50% → 100%

```bash
# Pre-deployment
npm test
npm run build

# DB Migration (15 sec downtime)
npm run db:migrate

# Data Encryption (no downtime)
npm run migrate:encrypt

# Deploy code com phased traffic shift
# (via deployment tool: canary, blue-green, etc)

# Setup cleanup cron job
# 0 2 * * * cd /app && npm run cleanup:soft-deletes

# Monitor por 24-48 horas
```

---

## 📞 Troubleshooting

### Erro: "DATABASE_URL not set"
```bash
export DATABASE_URL="postgresql://user:password@host:5432/pacerunpro"
```

### Erro: "Migration conflict"
```bash
# Se houve erro e precisa refazer
npx prisma migrate resolve --rolled-back <migration_name>
npm run db:migrate
```

### Erro: "Decryption failed"
```bash
# Verificar ENCRYPTION_KEY está correto
echo $ENCRYPTION_KEY | wc -c
# Esperado: 65 (64 chars + newline)

# Verificar se chave mudou
# Se sim, precisa fazer decrypt com chave antiga e encrypt com chave nova
```

### Rollback de Database Migration
```bash
# Restaurar do backup
psql $DATABASE_URL < backup_p0_YYYYMMDD_HHMMSS.sql

# Verificar
\d users
```

---

## 📚 Documentação Relacionada

| Documento | Propósito | Leitura |
|-----------|----------|---------|
| [P0_FINAL_STATUS.md](P0_FINAL_STATUS.md) | Status completo | 5 min |
| [EXECUTION_GUIDE.md](EXECUTION_GUIDE.md) | Guia de execução detalhado | 20 min |
| [P0_DEPLOYMENT_CHECKLIST.md](P0_DEPLOYMENT_CHECKLIST.md) | Checklist completo | 30 min |
| [README_P0.md](README_P0.md) | Quick overview | 2 min |
| [docs/P0_IMPLEMENTATION_SUMMARY.md](docs/P0_IMPLEMENTATION_SUMMARY.md) | Implementação técnica | 20 min |

---

## ✅ Status Atual

```
COMPLETO (✅):
├─ P0.3 Foreign Key Indexes ........................ 100% (Schema ready)
├─ P0.1 Soft Delete ............................... 100% (Code + Tests)
├─ P0.2 Data Encryption ........................... 100% (Code + Tests)
├─ Tests (24/24) .................................. Passando ✓
├─ ENCRYPTION_KEY .................................. Configurada ✓
└─ Documentação .................................... Completa ✓

PRONTO PARA EXECUTAR (⏳):
├─ Dia 3: Database Migration ....................... Pronto
├─ Dia 4: Data Encryption Migration ............... Pronto
├─ Dia 5-6: E2E Testing ............................ Pronto
└─ Dia 7: Production Deployment ................... Pronto
```

---

## 🎯 AÇÃO RECOMENDADA

**Próximo Passo:** Executar Database Migration (Dia 3)

```bash
# 1. Criar backup
pg_dump $DATABASE_URL > backup_p0_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy schema
npx prisma validate
npm run db:migrate

# 3. Validar
psql $DATABASE_URL -c "\d users" | grep deleted_at

# ✅ Database Migration Completa!
```

---

**Tempo para Produção:** 7 dias (3 dias de setup + testing + 1 dia deployment)

**Risk Level:** ⚠️ BAIXO (staging test first, phased rollout, rollback ready)

**Compliance:** ✅ LGPD + GDPR + PCI-DSS
