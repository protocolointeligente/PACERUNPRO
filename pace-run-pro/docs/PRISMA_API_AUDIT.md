# Auditoria Prisma, migrations e APIs

Data: 2026-07-22  
Base analisada: `main` em `1b8c909`

## Resumo executivo

O schema possui 49 modelos e 20 migrations de domínio. Há um sinal claro de
drift de manutenção: o `schema.prisma` declara restrições `@unique`/`@@unique`,
mas não declara `@@index` para os caminhos de leitura mais frequentes. A pasta
de migrations contém uma migration explícita de índices (`add_p1_performance_indexes`)
e um SQL legado (`add_missing_fk_indexes.sql`). Antes de criar novas migrations,
é necessário confirmar quais índices existem no banco de produção e reproduzi-los
no schema Prisma.

## Mapa de entidades críticas e consumidores

| Domínio | Entidades principais | Consumidores esperados |
| --- | --- | --- |
| Identidade e acesso | `User`, `Account`, `Session`, `Coach`, `Athlete`, `TeamMember` | autenticação, áreas de treinador/atleta, administração |
| Planejamento | `TrainingPlan`, `TrainingWeek`, `Workout`, `WorkoutLog`, `WorkoutFeedback` | calendário, prescrição, execução, feedback, métricas |
| Força e exercícios | `StrengthWorkout`, `StrengthBlock`, `Exercise`, `ExerciseVideo`, `CoachStrengthTemplate`, `CoachRunTemplate`, `SharedWorkoutTemplate` | biblioteca, templates, treinos de força e corrida |
| Métricas | `DerivedMetric`, `Metric`, `PerformanceTest`, `CheckIn`, `RecoveryLog`, `AthleteLoadParams` | dashboard, carga, recuperação, avaliações |
| Comercial/billing | `Subscription`, `Payment`, `PaymentLedgerEntry`, `WebhookEvent`, `CoachPlan`, `CoachPlanPurchase`, `BillingSettings`, `PlanProduct`, `PlanPurchase`, `Voucher` | checkout, Asaas, webhooks, planos e acesso pago |
| Social/operação | `FeedPost`, `FeedComment`, `FeedLike`, `Notification`, `AuditLog`, `DeletionAuditLog`, `Lead`, `Expense`, `ConnectedDevice` | feed, notificações, auditoria, CRM, despesas e integrações |

## Achados

### P1 — confirmar e declarar índices no schema

O schema tem `@@unique` para relações importantes, mas não expõe índices para
consultas compostas recorrentes como atleta + data, treinador + data, status de
pagamento, webhook por evento e logs por treino. Como há migrations separadas de
índices e reparos de colunas, o banco pode estar otimizado de forma diferente do
que o Prisma Client comunica.

Próxima ação: executar `prisma migrate diff` contra um snapshot do banco de
produção/staging e adicionar ao schema somente os índices confirmados pelos
plans de consulta.

### P1 — tratar migrations de reparo como dívida de consolidação

As migrations `20260715000100_repair_workout_logs_strava_columns`,
`20260715000200_repair_athlete_status_metrics_columns` e
`20260715000500_repair_leads_columns` indicam que o histórico já precisou
corrigir colunas depois da criação inicial. Elas não devem ser reescritas em
ambientes já aplicados, mas o estado final precisa ser validado contra o schema
e coberto por um teste de migration em banco vazio.

### P2 — separar entidades com alto risco de tabela sem uso

`GenerationBatch`, `DerivedMetric`, `Achievement`, `ConnectedDevice`, `Expense`,
`CoachZoneModel` e `BillingSettings` devem receber uma busca de consumidores
direta antes de novas features. Se uma entidade não tiver rota, job, seed ou
query que a consuma, ela deve ser classificada como legado, feature incompleta
ou candidata a remoção futura.

### P2 — auditar duplicidade comercial

Existem dois fluxos de compra (`PlanPurchase` e `CoachPlanPurchase`) além de
`Subscription`, `Payment` e `PaymentLedgerEntry`. Isso pode ser correto — compra,
assinatura, pagamento e lançamento contábil têm ciclos diferentes — mas precisa
de um contrato explícito de origem, estado e idempotência. Webhooks devem apontar
para um único registro financeiro canônico e gerar ledger de forma idempotente.

### P2 — validar cobertura de APIs

Para cada rota que grava ou lê uma entidade crítica, registrar: modelo Prisma,
permissão exigida, estado/status usado, índice esperado e migration que criou o
campo. Rotas que usam campos adicionados por migrations de reparo devem ter teste
de integração, pois são as mais suscetíveis a funcionar em um banco e falhar em
outro.

## Plano recomendado

1. Capturar o schema do staging e rodar `prisma migrate diff`.
2. Inventariar índices reais com `pg_indexes` e comparar com as queries de calendário,
   workouts, pagamentos e webhooks.
3. Criar uma matriz entidade → rota → permissão → migration → índice.
4. Adicionar testes de migration em banco vazio e testes de idempotência de webhook/ledger.
5. Só depois consolidar migrations futuras; migrations já aplicadas não devem ser editadas.

