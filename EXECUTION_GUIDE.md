# 🚀 P0 DEPLOYMENT — PRÓXIMOS PASSOS

## Status Atual
✅ Código completo + Testes passando (24/24)  
✅ Schema validado  
✅ ENCRYPTION_KEY gerada e configurada  
⏳ **Pronto para iniciar: Database Migration → Data Encryption → Testing → Production**

---

## 📋 Ordem de Execução (7 Dias)

### Dia 1-2: ✅ Revisão & Setup (COMPLETO)
```bash
# Já feito:
✓ ENCRYPTION_KEY gerada
✓ Testes passando
✓ Código validado
✓ Schema validado
```

### Dia 3: 🔄 Database Migration (Pronto para executar)

**IMPORTANTE:** Fazer PRIMEIRO em staging, depois em produção

**1. Preparação (antes da migração):**
```bash
# Backup do banco
pg_dump $DATABASE_URL > backup_p0_$(date +%Y%m%d_%H%M%S).sql

# Verificar conexão
psql $DATABASE_URL -c "SELECT version();"

# Verificar schema atual
psql $DATABASE_URL -c "\d users" | grep -E "Column|id|email"
```

**2. Executar migração (janela off-peak: 02:00-04:00 UTC):**
```bash
# Validar schema antes
npx prisma validate

# Deploy das migrations
npm run db:migrate

# Ou criar nova se não existir:
npm run db:migrate:dev --name add_p0_soft_delete_and_indexes
```

**3. Validar após migração:**
```bash
# Verificar se campos foram adicionados
psql $DATABASE_URL -c "\d users" | grep deleted_at

# Verificar se índices foram criados
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename='accounts';"

# Verificar integridade
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

**⏱️ Esperado:** ~15 segundos de downtime  
**Rollback (se necessário):**
```bash
psql $DATABASE_URL < backup_p0_YYYYMMDD_HHMMSS.sql
```

---

### Dia 4: 🔐 Data Encryption Migration (Sem downtime)

**1. Antes de executar:**
```bash
# Verificar se há dados não-encriptados
psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL;"
```

**2. Executar migração:**
```bash
npm run migrate:encrypt

# Saída esperada:
# ✓ Encrypting ConnectedDevice tokens...
# ✓ Migrated 123 records
# ✓ Encrypting BillingSettings...
# ✓ Migrated 45 records
```

**3. Validar após migração:**
```bash
# Verificar se todos os tokens estão encriptados
psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL;"
# Resultado esperado: 0

# Verificar formato de encriptação
psql $DATABASE_URL -c "SELECT access_token FROM connected_devices LIMIT 1;"
# Resultado esperado: enc:<base64_data>
```

**⏱️ Esperado:** < 30 segundos (sem downtime)

---

### Dias 5-6: 🧪 E2E Testing

**1. Executar testes unitários:**
```bash
npm test -- tests/P0.test.ts

# Esperado: 24/24 tests passing ✓
```

**2. Testar Soft Delete API:**
```bash
# Criar teste user
curl -X POST http://localhost:3000/api/account/delete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"user_requested","message":"Testing"}'

# Resposta esperada:
# {
#   "success": true,
#   "userId": "user-id",
#   "deletedAt": "2026-07-08T...",
#   "graceRemaining": {
#     "days": 30,
#     "message": "Sua conta pode ser restaurada em 30 dias"
#   },
#   "reason": "user_requested"
# }
```

**3. Validar que usuário foi deletado (soft delete):**
```bash
# Usuário deve estar em deleted_at IS NOT NULL
psql $DATABASE_URL -c "SELECT id, email, deleted_at FROM users WHERE deleted_at IS NOT NULL LIMIT 5;"

# Mas não deve aparecer em queries normais (middleware filtra)
# Testar no aplicativo: usuário não pode fazer login
```

**4. Testar encriptação:**
```bash
# Criar billing settings com PIX key
curl -X POST http://localhost:3000/api/billing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pixKey":"test@example.com"}'

# Verificar no DB que está encriptado
psql $DATABASE_URL -c "SELECT pix_key FROM billing_settings LIMIT 1;"
# Esperado: enc:<base64>, não "test@example.com"

# Mas na API, deve retornar plaintext (middleware decripta)
# GET /api/billing deve retornar pixKey: "test@example.com"
```

**5. Performance testing (30x melhoria):**
```bash
# Testar query com FK index
# Antes: 150-300ms
# Depois: 5-20ms

# Usar EXPLAIN ANALYZE
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'test' ORDER BY created_at DESC LIMIT 10;"

# Deve usar o índice (ver "Index Scan" no output)
```

**6. Manual QA Checklist:**
```
☐ Soft delete API retorna sucesso
☐ Usuário deletado não pode fazer login
☐ Email está anonimizado (deleted-TIMESTAMP@deleted.local)
☐ Tokens estão encriptados (enc: format)
☐ Queries de notificações < 20ms (30x mais rápido)
☐ Sem erros de decriptação nos logs
☐ Middleware filtra usuários deletados automaticamente
```

---

### Dia 7: 🚀 Production Deployment (Phased Rollout)

**FASE 0: Pre-Deployment (30 min antes)**
```bash
# 1. Verificar tudo funciona
npm test
npm run build

# 2. Verificar backups
ls -la backup_p0_*.sql

# 3. Preparar monitoramento
# - Abrir dashboards de logs
# - Preparar alertas
# - Team em standby
```

**FASE 1: Database Migration (Off-Peak Window)**
```bash
# Executar exatamente como no Dia 3
pg_dump $DATABASE_URL > backup_p0_prod_$(date +%Y%m%d_%H%M%S).sql
npm run db:migrate
# Validar: psql $DATABASE_URL -c "\d users" | grep deleted_at
```

**FASE 2: Data Encryption Migration**
```bash
# Executar exatamente como no Dia 4
npm run migrate:encrypt
# Validar: psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%';"
```

**FASE 3: Code Deployment - 10% Traffic (1 hora)**
```bash
# Deploy code para 10% dos servidores
# Monitor:
#   - Error rate (deve ser 0)
#   - Response times (deve ser normal)
#   - Soft delete API calls (deve funcionar)
#   - Decryption failures (deve ser 0)

# Se healthy → continue
# Se problemas → rollback imediato
```

**FASE 4: Code Deployment - 50% Traffic (1 hora)**
```bash
# Deploy code para 50% dos servidores
# Monitor os mesmos métricas por 1 hora
```

**FASE 5: Code Deployment - 100% Traffic**
```bash
# Deploy code para 100% dos servidores
# Monitor continuamente por 2-4 horas
```

**FASE 6: Setup Cleanup Cron Job**
```bash
# Adicionar cron job para daily cleanup
# no crontab ou systemd timer

# Crontab:
0 2 * * * cd /app && npx tsx scripts/cleanup-soft-deletes.ts

# Ou via systemd:
# systemctl enable p0-cleanup.timer
# systemctl start p0-cleanup.timer
```

**Rollback Procedure (if needed):**
```bash
# Rápido: Reverter código
git revert <commit-hash>
npm run build && npm run start

# Se banco corrompido: Restaurar backup
psql $DATABASE_URL < backup_p0_prod_YYYYMMDD_HHMMSS.sql

# Reiniciar aplicação
# Validar que tudo funciona
```

---

## 📊 Monitoring (24-48 horas pós-deployment)

```bash
# 1. Soft-deleted users
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL;"

# 2. Query performance
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'test' LIMIT 10;"
# Esperado: < 10ms

# 3. Encryption status
psql $DATABASE_URL -c "SELECT COUNT(*) FROM connected_devices WHERE access_token NOT LIKE 'enc:%' AND access_token IS NOT NULL;"
# Esperado: 0

# 4. Cleanup job success
tail -f /var/log/p0-cleanup.log
# Esperado: "Successfully deleted X expired records"

# 5. Error rate
grep -i "decryption failed\|soft delete error" /var/log/app.log
# Esperado: 0 erros
```

---

## 🎯 Success Criteria

✅ **Database Migration:**
- [ ] Schema changes applied successfully
- [ ] FK indexes created
- [ ] No data corruption
- [ ] < 15 seconds downtime

✅ **Data Encryption:**
- [ ] All tokens encrypted
- [ ] No plaintext data in DB
- [ ] < 30 seconds execution time
- [ ] Zero data loss

✅ **E2E Testing:**
- [ ] 24/24 tests passing
- [ ] Soft delete API works
- [ ] Encryption transparent to app
- [ ] 30x performance improvement

✅ **Production Deployment:**
- [ ] Zero errors during phased rollout
- [ ] Monitoring active and healthy
- [ ] Cleanup job running daily
- [ ] No user complaints

---

## 🔧 Quick Reference Commands

```bash
# Schema validation
npx prisma validate

# Run tests
npm test -- tests/P0.test.ts

# Database migration
npm run db:migrate

# Data encryption migration
npm run migrate:encrypt

# Cleanup job (manual run)
npm run cleanup:soft-deletes

# Check encrypted data
psql $DATABASE_URL -c "SELECT access_token FROM connected_devices LIMIT 1;"

# Check soft-deleted users
psql $DATABASE_URL -c "SELECT id, email, deleted_at FROM users WHERE deleted_at IS NOT NULL;"

# Performance check
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'test' LIMIT 10;"

# Deployment script
npm run deploy:p0
```

---

## 📞 Emergency Contacts

- **Database Admin:** Needed for backup/restore
- **DevOps:** Needed for phased deployment
- **Security Team:** Review before production deployment
- **On-Call:** Alert in case of rollback

---

## 📝 Completion Checklist

- [ ] Database migration successful
- [ ] Data encryption migration successful
- [ ] All tests passing
- [ ] Staging deployment validated
- [ ] Security review approved
- [ ] Production backup created
- [ ] Monitoring configured
- [ ] Team trained
- [ ] Rollback procedure ready
- [ ] User communication prepared

---

**Status:** 🚀 **READY FOR EXECUTION**

**Next Action:** Execute Database Migration (Dia 3)

```bash
# Step 1: Backup
pg_dump $DATABASE_URL > backup_p0_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Migrate
npm run db:migrate

# Step 3: Validate
psql $DATABASE_URL -c "\d users" | grep deleted_at
```
