# PACERUNPRO — checklist de release (fase 4)

Data da auditoria: 2026-07-21  
Branch: `agent/enforce-paid-registration`

## Status executivo

**Não liberar para produção ainda.** O código local está compilando e os contratos passam, mas a homologação real está bloqueada por credenciais/infraestrutura ausentes nesta sessão.

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
