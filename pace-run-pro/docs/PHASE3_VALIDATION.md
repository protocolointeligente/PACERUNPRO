# Fase 3 — roteiro de homologação

## E2E manual coach → atleta

1. Criar um coach e um atleta de teste; confirmar que cada conta não acessa o painel da outra.
2. Vincular o atleta ao coach; abrir o perfil do atleta e confirmar que o vínculo aparece nos dois lados.
3. Criar um treino, mover para outra data e confirmar a alteração no calendário do atleta.
4. Alternar para **Copiar**, copiar o treino para outra data e confirmar que o original permanece intacto e que uma segunda cópia idêntica é ignorada.
5. Criar uma semana com pelo menos um treino, salvar como rascunho e usar **Liberar para atleta**.
6. Confirmar no banco/API que `TrainingWeek.released=true` e `releasedAt` foi preenchido; remover a liberação e confirmar `released=false` e `releasedAt=null`.
7. Como atleta, confirmar que a semana liberada aparece e que uma semana não liberada não fica disponível para execução.
8. No checkout sandbox, concluir PIX/cartão tokenizado e confirmar pedido, assinatura e ledger financeiro.
9. Reenviar o mesmo webhook: a segunda resposta deve indicar duplicidade e não criar novo lançamento.
10. Enviar assinatura inválida: deve retornar 403 e não alterar pedido, assinatura ou ledger.

## Simulador PagBank local

Com o servidor em `npm run dev`:

```powershell
$env:PAGBANK_TOKEN="local-pagbank-token"
node scripts/pagbank-webhook-simulator.mjs valid
node scripts/pagbank-webhook-simulator.mjs duplicate
node scripts/pagbank-webhook-simulator.mjs invalid
```

O simulador usa a mesma assinatura SHA-256 do endpoint. `PAGBANK_WEBHOOK_URL` permite apontar para uma URL de homologação.

## Split PagBank sandbox

1. Criar/confirmar a conta recebedora da plataforma e as contas dos coaches no ambiente sandbox.
2. Configurar `PAGBANK_ENV=sandbox`, `PAGBANK_TOKEN`, `PAGBANK_PLATFORM_ACCOUNT_ID` e a URL pública HTTPS do webhook.
3. Fazer um checkout com valor conhecido e conferir no painel PagBank o split de 90% para o coach e 10% para PACERUNPRO.
4. Conferir no banco `PaymentLedgerEntry.grossCents`, `platformFeeCents`, `netCents`, `providerEventId` e o status de `WebhookEvent`.
5. Repetir o evento e confirmar idempotência; testar assinatura inválida e evento sem charge paga.
6. Só promover para produção depois de conferir conciliação, estorno, chargeback, arredondamento de centavos e logs sem dados de cartão.

## Checklist de produção

- [ ] Banco de produção com migrations aplicadas e backup recente.
- [ ] Variáveis obrigatórias validadas, sem segredos no repositório.
- [ ] Webhook PagBank público, HTTPS, assinatura validada e monitoramento ativo.
- [ ] Split sandbox conciliado com 10% PACERUNPRO.
- [ ] Coach/atleta, ownership e liberação semanal homologados.
- [ ] Checkout aprovado, duplicado e inválido testados.
- [ ] Rollback definido e contato operacional responsável.
