# PACERUNPRO — checklist de release (fase 4)

Data da auditoria: 2026-07-21  
Branch: `agent/enforce-paid-registration`

## Status executivo

**Não liberar para produção ainda.** O código local está compilando e os contratos passam, mas a homologação real está bloqueada por credenciais/infraestrutura ausentes nesta sessão.

## Como sair de NO-GO para GO

A decisão só pode mudar para **GO** depois que todas as credenciais/serviços abaixo forem fornecidos, configurados e comprovados por logs, IDs de transação e evidências visuais. Valores reais nunca devem ser commitados.

### Credenciais e serviços necessários

Fornecer ao responsável pela homologação, por canal seguro:

1. `TEST_DATABASE_URL`: URL completa de um PostgreSQL descartável, exclusivo para testes, com usuário que possa executar migrations. Exemplo de formato: `postgresql://usuario:senha@host:5432/pacerunpro_test?sslmode=require`.
2. `DATABASE_URL` e `DIRECT_URL` do ambiente publicado/homologação, separados do banco de produção.
3. `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL`: URL HTTPS pública do preview/homologação, acessível pelo navegador e pelo PagBank.
4. `PAGBANK_ENV=sandbox`.
5. `PAGBANK_TOKEN`: token de autenticação da conta PagBank sandbox.
6. `PAGBANK_WEBHOOK_SECRET`: segredo/token usado para validar a assinatura do webhook no ambiente configurado. Confirmar se o provedor entrega o valor como `x-authenticity-token` ou em outro header.
7. `PAGBANK_PLATFORM_ACCOUNT_ID`: identificador da conta plataforma que recebe a taxa PACERUNPRO.
8. Identificador da conta sandbox recebedora do coach, com split habilitado e permissão para receber valores.
9. Acesso ao painel sandbox PagBank para conferir pedido, charge, split, estorno e conciliação.
10. URL pública final do webhook: `https://<dominio>/api/webhooks/pagbank`.

O cartão deve ser tokenizado pelo PagBank; número, CVV e dados brutos de cartão não devem passar pelo backend PACERUNPRO.

### Execução passo a passo

Na raiz `pace-run-pro`, criar `.env.local` a partir de `.env.example` e preencher os valores de homologação. Depois executar:

```powershell
Copy-Item .env.example .env.local -Force
# editar .env.local com TEST_DATABASE_URL e credenciais sandbox
npm install
npx prisma generate
npx prisma migrate deploy
npm run env:validate
```

Configurar o banco de teste na sessão atual e rodar migrations/tests sem skip:

```powershell
$env:TEST_DATABASE_URL="postgresql://usuario:senha@host:5432/pacerunpro_test?sslmode=require"
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_URL=$env:TEST_DATABASE_URL
npx prisma migrate deploy
npm test -- tests/integration/phase3-db.test.ts
```

O resultado obrigatório é `0 skipped` no arquivo de integração de banco. Se houver falha de conexão, migration ou tabela ausente, manter NO-GO.

Subir o servidor local com segredo de autenticação e PagBank sandbox:

```powershell
$env:NEXTAUTH_SECRET="segredo-local-de-teste"
$env:AUTH_SECRET=$env:NEXTAUTH_SECRET
$env:PAGBANK_ENV="sandbox"
$env:PAGBANK_TOKEN="token-sandbox"
$env:PAGBANK_WEBHOOK_SECRET="segredo-webhook-sandbox"
$env:PAGBANK_WEBHOOK_URL="http://localhost:3000/api/webhooks/pagbank"
npm run dev
```

Em outro terminal, executar o simulador nos três cenários:

```powershell
$env:PAGBANK_WEBHOOK_URL="http://localhost:3000/api/webhooks/pagbank"
$env:PAGBANK_TOKEN="token-sandbox"
npm run pagbank:simulate valid
npm run pagbank:simulate duplicate
npm run pagbank:simulate invalid
```

Resultados esperados:

- `valid`: HTTP 200, pedido/assinatura atualizados, um `PaymentLedgerEntry` criado.
- `duplicate`: HTTP 200 com indicação de duplicidade, sem segundo ledger ou segunda ativação.
- `invalid`: HTTP 403, sem alteração no pedido, assinatura ou ledger.

### E2E coach-atleta em URL publicada

Com o preview publicado e `NEXT_PUBLIC_APP_URL` apontando para ele:

1. Criar contas de teste coach e atleta.
2. Vincular o atleta ao coach.
3. Criar treino e confirmar que o atleta de outro coach não consegue acessá-lo.
4. Mover treino no calendário e confirmar a nova data.
5. Copiar treino e confirmar que o original permanece intacto e a duplicação é ignorada.
6. Liberar uma semana e confirmar `released=true` e `releasedAt` preenchido.
7. Revogar a semana e confirmar `released=false` e `releasedAt=null`.
8. Entrar como atleta e confirmar que apenas semanas liberadas ficam disponíveis.
9. Salvar screenshots com URL, horário e usuário de teste para cada etapa.

### Validação real do split PagBank

1. Configurar `PAGBANK_PLATFORM_ACCOUNT_ID` e a conta sandbox recebedora do coach.
2. Publicar o webhook HTTPS e cadastrá-lo no PagBank sandbox.
3. Realizar checkout sandbox de valor conhecido, por exemplo R$ 99,00.
4. Conferir no painel PagBank o repasse ao recebedor e a parcela de 10% PACERUNPRO.
5. Conferir no banco: `grossCents=9900`, `platformFeeCents=990`, `netCents=8910`, `providerEventId` e `WebhookEvent.status=processed`.
6. Reenviar o mesmo evento e comprovar que os valores não duplicam.
7. Testar estorno/chargeback conforme o fluxo sandbox e registrar a conciliação.
8. Anexar IDs do pedido, charge e webhook ao checklist, sem expor tokens ou dados de cartão.

Só após todos os itens acima estarem anexados e revisados por outra pessoa autorizada a decisão pode ser alterada para GO.

## Fase 5 — evidências executadas

- Servidor local iniciado em `http://localhost:3002` porque a porta 3000 estava ocupada.
- Evento PagBank inválido: **403 `Invalid signature`** — passou.
- Evento PagBank válido: **500** — falhou ao persistir `WebhookEvent` por `ECONNREFUSED` no PostgreSQL.
- Evento PagBank duplicado: **500** — não foi possível alcançar a verificação de duplicidade sem PostgreSQL.
- E2E publicado: **não executado** — `NEXT_PUBLIC_APP_URL`/URL pública não configurada.
- Split sandbox: **não executado** — token, conta plataforma e recebedor reais ausentes.
- Decisão final: **NO-GO** até banco, URL publicada e PagBank sandbox serem configurados.

## Evidências locais

- [x] `npm run audit:ownership` — 65 rotas escopadas verificadas.
- [x] `npm run pagbank:simulate` — simulador disponível para eventos válido, duplicado e inválido.
- [x] `npm test` — suíte local executada; testes de banco só rodam quando `TEST_DATABASE_URL` existe.
- [x] `npm run lint` — zero erros; warnings classificados em `docs/LINT_WARNINGS.md`.
- [x] `npm run build` — build de produção concluído.
- [ ] PostgreSQL descartável conectado — bloqueado: `TEST_DATABASE_URL` ausente; Docker e `psql` não disponíveis.
- [ ] E2E em ambiente publicado — bloqueado: URL pública de homologação não configurada.
- [ ] Split PagBank sandbox com contas reais — bloqueado: token e contas recebedora/plataforma ausentes.

## Variáveis obrigatórias

### Aplicação

- `DATABASE_URL` e `DIRECT_URL`
- `NEXTAUTH_SECRET` ou `AUTH_SECRET`
- `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL`

### PagBank

- `PAGBANK_ENV=sandbox` durante homologação
- `PAGBANK_TOKEN`
- `PAGBANK_PLATFORM_ACCOUNT_ID`
- URL pública HTTPS para `/api/webhooks/pagbank`
- token/configuração de assinatura conforme a conta sandbox

Nunca commitar valores dessas variáveis nem trafegar número/CVV de cartão pelo backend.

## Homologação obrigatória antes do release

1. Criar banco PostgreSQL descartável e executar `npx prisma migrate deploy`.
2. Definir `TEST_DATABASE_URL` e executar `npm test -- tests/integration/phase3-db.test.ts` sem testes skipped.
3. Publicar preview protegido, criar coach e atleta de teste e executar o roteiro em `docs/PHASE3_VALIDATION.md`.
4. Validar mover/copiar treino, ownership entre dois coaches e liberar/revogar semana.
5. Executar PIX/cartão tokenizado no PagBank sandbox e conferir split de 90%/10% e ledger.
6. Reenviar webhook idêntico, testar assinatura inválida, charge não paga e estorno.
7. Anexar evidências: URL/commit, IDs de pedido/evento, screenshots do painel PagBank e consulta do ledger sem dados sensíveis.

## Riscos aceitos somente após aprovação explícita

- Warnings de `<img>` impactando apenas otimização de imagens, sem erro funcional.
- Variáveis não usadas em telas legadas, desde que não estejam em fluxo de pagamento/autorização.
- Avisos de cache/Prisma durante build, desde que o build e smoke test de runtime passem.

## Plano de rollback

1. Interromper a promoção e desabilitar novos checkouts via configuração de ambiente.
2. Reverter para o último commit aprovado da branch/produção.
3. Manter webhook idempotente; não apagar `WebhookEvent` nem `PaymentLedgerEntry`.
4. Reconciliar pagamentos PagBank por `providerEventId` antes de qualquer reprocessamento.
5. Restaurar migrations apenas com backup e procedimento Prisma aprovado; não usar `git reset --hard` em produção.
6. Registrar incidente, horário, commit revertido e divergências financeiras.
