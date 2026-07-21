# Integração com banco de teste

Use um PostgreSQL descartável, separado de produção:

```powershell
$env:TEST_DATABASE_URL="postgresql://.../pacerunpro_test"
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npx prisma migrate deploy
npm test -- tests/integration/phase3-db.test.ts
```

Sem `TEST_DATABASE_URL`, os testes são marcados como `skipped` para não tocar no banco local ou produtivo. O smoke test verifica conectividade, isolamento transacional e presença das tabelas centrais. Os testes de rota e ownership ficam nos contratos em `tests/phase2-integration-contracts.test.ts`; a homologação completa deve usar sessão autenticada e fixtures nesse banco descartável.
