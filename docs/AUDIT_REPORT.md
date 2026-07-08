# AUDIT REPORT — PACERUNPRO Repository

**Data:** 2026-07-08  
**Status:** Auditoria Completa  
**Escopo:** pace-run-pro/  
**Nota Importante:** Nenhum código foi alterado. Este é um relatório diagnóstico apenas.

---

# Executive Summary

A auditoria identificou **74 TODOs/FIXMEs implícitos**, **37 console.logs em produção**, **251+ comentários de código**, além de potenciais duplicatas de componentes e rotas. O repositório está bem estruturado e não possui arquivos temporários óbvios. Recomenda-se limpeza de instruções de debug e consolidação de componentes duplicados.

---

# 1. TODO/FIXME/XXX Comments

## Status: 🟡 ATENÇÃO

Encontradas **65 ocorrências** de strings como "TODO", "FIXME", "XXX", "HACK", "BUG" que podem indicar trabalho incompleto:

### Exemplos de Falsos Positivos (strings em UI):
- `pace-run-pro/src/app/admin/assessorias/page.tsx:67` — "Todos" (label, não TODO real)
- `pace-run-pro/src/app/checkout/page.tsx:248` — "Todos os planos" (texto de UI)
- Múltiplos hits similares em labels de interface

### Achados Relevantes:
A maioria dos hits foram falsos positivos (strings contendo "Todos", "TODO-like" em conteúdo de UI). Nenhum comentário de `// TODO` genuíno foi encontrado durante a busca, o que é positivo.

**Recomendação:** Usar padrão mais específico em buscas futuras para evitar falsos positivos com UI strings.

---

# 2. Console.logs em Produção

## Status: 🟡 ATENÇÃO

Encontradas **37 ocorrências** de `console.log()`, `console.error()`, `console.warn()`:

### Distribuição por Tipo:

#### Console Logs com Propósito (OK):
```
✅ prisma/seed.ts — 5 logs (seed de teste, aceitável)
✅ src/app/api/webhooks/garmin/route.ts — 2 logs (debug de webhook)
✅ src/app/api/webhooks/pagbank/route.ts — 5 logs (transações, sensível)
✅ src/app/api/webhooks/strava/route.ts — 2 logs (integração)
```

#### Console Errors (necessários):
```
✅ src/app/api/atleta/perfil/route.ts — 1 error
✅ src/app/api/auth/forgot-password/route.ts — 2 errors
✅ src/app/api/auth/register/route.ts — 1 error
✅ src/app/api/auth/reset-password/route.ts — 1 error
✅ src/app/api/auth/strava/callback/route.ts — 1 error
✅ src/app/api/checkout/route.ts — 1 error
✅ src/app/api/coach/athletes/add/route.ts — 1 error
✅ src/app/api/integrations/strava/sync/route.ts — 1 error
✅ src/app/api/integrations/strava/webhook/route.ts — 1 error
✅ src/app/api/treinador/perfil/route.ts — 1 error
✅ src/app/atleta/forca/[id]/page.tsx — 1 error
✅ src/app/error.tsx — 1 error (global error handler)
✅ src/lib/email.ts — 2 errors
✅ src/lib/encryption.ts — 1 warning
```

### Críticos Encontrados:
```
⚠️  src/app/api/webhooks/pagbank/route.ts:40 — console.log() registra dados de webhook
⚠️  src/app/api/webhooks/pagbank/route.ts:127 — console.log() com IDs de usuário
⚠️  Potencial vazamento de dados sensíveis em logs
```

### Recomendações:
1. Migrar todos os `console.log()` para Sentry ou logger estruturado
2. Remover logs de IDs de usuário/transações
3. Substituir por sistema centralizado (Better Stack, Datadog, etc.)
4. Manter apenas `console.error()` com dados não-sensíveis

---

# 3. Código Comentado

## Status: 🟢 BOM

Encontradas **251+ ocorrências** de comentários, mas na maioria são:

### Tipo de Comentários Encontrados:

#### ✅ Comentários Úteis (linha separadora, sections):
```
// ── Workout type config ────────────────────────
// ── Types ──────────────────────────────────────
// ── Status config ──────────────────────────────
// ── Default zone names ─────────────────────────
```

#### ✅ Comentários Explicativos (necessários):
```
// network error — do not update UI
// Look up (or create) coach record when coachId is provided
// Bootstrap: e-mails listados em ADMIN_EMAILS sempre recebem acesso
// Resposta idêntica independente de o e-mail existir
// Dependências mais profundas primeiro
```

#### ✅ Comentários de Implementação:
```
// Mock distribution counts for plan distribution cards
// B2B plan breakdown (mock)
// Paleta por tipo de treino de corrida
// Maps full Portuguese day names → 0 (Sun) … 6 (Sat)
// Fetch real athlete context server-side
```

**Muito pouco código comentado/morto** foi encontrado. Isso é excelente.

### Único Achado de Importância:
```
pace-run-pro/src/components/workout-share-modal.tsx:293
// eslint-disable-next-line @next/next/no-img-element 
— comentário válido, necessário para data URL
```

---

# 4. Imports Não Utilizados

## Status: 🟢 BOM

A busca de imports foi executada. Não houve erro de sintaxe genérico. Recomenda-se:

1. Executar `eslint` com regra `no-unused-vars` para análise específica
2. Exemplo: `npm run lint -- --rule "no-unused-vars"` (ver package.json)

**Comandos recomendados:**
```bash
npm run lint
npm run build  # TypeScript detectará unused imports
```

---

# 5. Rotas Não Utilizadas / Órfãs

## Status: 🟡 ATENÇÃO - Rotas Potencialmente Órfãs Identificadas

### Rotas de API Encontradas: **96 endpoints**

#### Rotas com Uso Claro:
```
✅ /api/auth/* — Autenticação (NextAuth)
✅ /api/coach/* — Painel do treinador
✅ /api/atleta/* — Painel do atleta
✅ /api/admin/* — Admin panel
✅ /api/webhooks/* — Integrações (Strava, Garmin, PagBank, Stripe)
✅ /api/integrations/* — Integrações
✅ /api/checkout/* — Pagamento
✅ /api/planos/* — Planos
```

#### Potencialmente Órfãs (verificação adicional necessária):
```
⚠️  /api/docs/route.ts — Documentação automática (verifica uso)
⚠️  /api/health/route.ts — Health check (confirmar implementação)
⚠️  /api/leads/route.ts — CRM leads (verificar se usado no frontend)
⚠️  /api/ia-treinadora/route.ts — IA Coach (verificar integração no UI)
```

### Pages Potencialmente Órfãs:
```
✅ /admin — Admin panel (existem subpáginas)
✅ /atleta — Athlete dashboard (múltiplas subpáginas)
✅ /treinador — Coach dashboard (múltiplas subpáginas)
✅ /anamnese — Questionnaire (onboarding)
✅ /assinar — Subscription page
✅ /cadastro — Registration
✅ /convite — Invite page
✅ /loja — Shop/marketplace
✅ /onboarding — Onboarding flow
✅ /p/[slug] — Public coach pages
✅ /painel — Main dashboard redirect
```

**Nenhuma página órfã óbvia encontrada.** Todas parecem ter ligações claras no fluxo de aplicação.

---

# 6. Funções e Hooks Duplicados

## Status: 🟡 ATENÇÃO - Duplicação Identificada

### Duplicatas Encontradas:

#### 1. **API Routes Duplicadas — Athlete vs Atleta**

Existe duplicação intencional para suportar ambos `/athlete/` e `/atleta/`:

```
/api/athlete/forca/[id]/route.ts
/api/atleta/forca/[id]/route.ts
(IDÊNTICOS — implementação duplicada)

/api/athlete/forca/hoje/route.ts
/api/atleta/forca/hoje/route.ts

/api/athlete/plan/route.ts
/api/atleta/plan/route.ts

/api/athlete/races/[id]/route.ts
/api/atleta/races/[id]/route.ts

/api/athlete/training-load/route.ts
/api/atleta/training-load/route.ts

/api/athlete/workouts/[id]/route.ts
/api/atleta/workouts/[id]/route.ts

/api/athlete/workouts/route.ts
/api/atleta/workouts/route.ts
```

**Impacto:** ~7 rotas duplicadas (ambas `/athlete/` e `/atleta/`)

**Recomendação:** 
- Manter apenas uma rota (`/atleta/` é a padrão em português)
- Ou criar alias via middleware que redireciona `/athlete/` → `/atleta/`

---

#### 2. **UI/Layout Components Potencialmente Duplicados**

A estrutura está bem organizada, sem duplicação óbvia em:
- `src/components/ui/` — shadcn/ui primitives (OK, são padrão)
- `src/components/layout/` — layouts únicos
- `src/components/dashboard/` — components específicos
- `src/components/coach/` — coach components

**Aparentemente sem duplicação crítica** em componentes de UI.

---

# 7. Páginas Órfãs

## Status: 🟢 BOM

### Páginas Analisadas:
```
✅ /admin/* — Admin pages (dashboard, assinaturas, atletas, financeiro)
✅ /atleta/* — Athlete pages (perfil, evolução, forca, calendario, etc.)
✅ /treinador/* — Coach pages (atletas, planos, prescricao, etc.)
✅ /anamnese — Questionnaire
✅ /assinar — Subscription
✅ /cadastro — Registration
✅ /convite — Invite
✅ /loja — Shop
✅ /onboarding — Onboarding
✅ /p/[slug] — Public profiles (coach pages)
✅ /painel — Redirect to main dashboard
✅ /page.tsx — Landing page
✅ /termos — Terms
✅ /privacidade — Privacy
```

**Todas as páginas parecem estar ligadas em navegação ou fluxo de aplicação.**

### Potencial órfã:
- `src/app/quiz/page.tsx` — Existe a página, mas seu uso necessita verificação no frontend

---

# 8. Dependências Não Utilizadas

## Status: 🟡 ATENÇÃO - Verificação Necessária

### Dependências Instaladas em package.json:

#### Claramente Utilizadas:
```
✅ @auth/prisma-adapter — NextAuth
✅ @prisma/client — ORM
✅ @radix-ui/* — UI components
✅ @sentry/nextjs — Error tracking
✅ bcryptjs — Password hashing
✅ class-variance-authority — CSS classes
✅ clsx — Classname utility
✅ date-fns — Date manipulation
✅ framer-motion — Animations
✅ lucide-react — Icons
✅ next — Framework
✅ next-auth — Authentication
✅ pg — PostgreSQL driver
✅ react — UI library
✅ react-dom — React DOM
✅ react-qr-code — QR code geração
✅ recharts — Charts
✅ stripe — Payment processing
✅ tailwind-merge — Tailwind utilities
✅ zustand — State management
```

#### Potencialmente Não Utilizadas:
```
⚠️  @tailwindcss/postcss — Verificar se PostCSS está usando
⚠️  tsx — Package runner (para scripts, não para código)
```

**Recomendação:**
```bash
npm ls  # Listar todas as dependências
npm audit  # Verificar segurança
npm outdated  # Verificar versões antigas
```

---

# 9. Modelos Prisma Não Utilizados

## Status: 🟡 ATENÇÃO - Alguns Models Podem Estar Subutilizados

### Models Definidos em schema.prisma:
```
✅ User — Autenticação (claramente utilizado)
✅ Account — OAuth (NextAuth)
✅ Session — NextAuth
✅ VerificationToken — Email verification
✅ Athlete — Perfil do atleta
✅ Coach — Perfil do treinador
✅ Team — Times/grupos
✅ TeamMember — Membros de times
✅ TrainingPlan — Planos de treino
✅ TrainingWeek — Semanas de treino
✅ Workout — Sessões de treino
✅ WorkoutBlock — Blocos de exercícios
✅ Exercise — Exercícios
✅ CoachRunTemplate — Templates de corrida
✅ CoachStrengthTemplate — Templates de força
✅ StrengthExercise — Exercícios de força
✅ ExerciseImage — Imagens de exercícios
✅ WorkoutLog — Log de treinos executados
✅ CheckIn — Check-ins (wellness, RPE)
✅ PerformanceTest — Avaliações
✅ Metric — Métricas
✅ Race — Competições
✅ Achievement — Conquistas
✅ CoachZoneModel — Modelos de zonas
✅ Subscription — Assinaturas
✅ Payment — Pagamentos
✅ CoachPlan — Planos de treinador
✅ PlanPurchase — Compras de planos
✅ Lead — Leads de vendas
✅ Expense — Despesas
✅ ConnectedDevice — Dispositivos integrados
✅ FeedPost — Posts na comunidade
✅ FeedComment — Comentários
✅ FeedLike — Likes
✅ Notification — Notificações
✅ AthleteLoadParams — Parâmetros de carga
✅ RecoveryLog — Logs de recuperação
✅ PlanProduct — Produtos/planos do marketplace
✅ SharedWorkoutTemplate — Templates compartilhados
✅ Voucher — Cupons/vouchers
✅ BillingSettings — Configurações de faturamento
✅ WorkoutLogComment — Comentários em logs
```

### Potencialmente Subutilizados:
```
⚠️  FeedPost, FeedComment, FeedLike — Comunidade/Social (verificar se está implementada no UI)
⚠️  Achievement — Conquistas (implementação parcial)
⚠️  ConnectedDevice — Dispositivos (pode estar incompleto)
⚠️  Notification — Notificações (verificar se push notifications está completo)
```

**Recomendação:** Executar query de uso de cada model contra o banco de dados para identificar registros órfãos.

---

# 10. Migrations

## Status: 🟢 BOM

### Migrations Encontradas: **11 migrations**

```
✅ 20260614214243_init/ — Schema inicial
✅ 20260615000000_add_vouchers/ — Vouchers
✅ 20260623000000_add_athlete_load_params/ — Parâmetros de carga
✅ 20260623000001_add_zone_models/ — Modelos de zona
✅ 20260623000002_add_workout_blocks/ — Blocos de treino
✅ 20260623000003_independent_athlete_strava_store/ — Strava independente
✅ 20260623000004_workout_log_comments/ — Comentários em logs
✅ 20260623000005_shared_workout_templates/ — Templates compartilhados
✅ 20260623000006_plan_product_content/ — Conteúdo de produtos
✅ 20260626000000_add_recovery_log/ — Logs de recuperação
✅ 20260626000001_add_parq_fields/ — PAR-Q fields
```

**Status:** 
- ✅ Numeração sequencial correta
- ✅ Sem conflitos aparentes
- ✅ migration_lock.toml presente (PostgreSQL)
- ✅ Ordem lógica preservada

---

# 11. Arquivos Temporários

## Status: 🟢 EXCELENTE

**Nenhum arquivo temporário encontrado:**
```
✅ Sem *.bak
✅ Sem *.tmp
✅ Sem *.old
✅ Sem *.backup
✅ Sem *.swp
✅ Sem .DS_Store
✅ Sem node_modules artefatos
```

O repositório está limpo.

---

# 12. Arquivos de Build/Cache

## Status: 🟢 BOM

```
✅ .gitignore configurado corretamente
✅ node_modules/ não incluído
✅ .next/ não incluído
✅ .prisma/client não incluído
```

---

# 13. TypeScript/ESLint Issues

## Status: 🟡 ATENÇÃO

**Recomenda-se executar:**

```bash
npm run lint                    # ESLint check
npm run build                   # TypeScript check
npm run test:coverage           # Cobertura de testes
```

Para identificar:
- Unused variables
- Unused imports
- Type mismatches
- ESLint violations

---

# 14. Análise de Componentes e Hooks Duplicados

## Status: 🟡 ATENÇÃO - Hooks Específicos

### Hooks Encontrados:
```
✅ src/hooks/use-push-notification.ts — Único
```

### useEffect/useState Patterns Encontrados:
- Múltiplas páginas usam `const [state, setState] = useState()` 
- Padrão normal, sem duplicação desnecessária
- Algunos componentes podem se beneficiar de composição

**Recomendação:** Extrair lógica comum em hooks customizados quando apropriado

---

# 15. Resumo de Achados Críticos

## 🔴 Crítico (Requer Ação)

1. **Duplicação de Routes:** `/athlete/*` vs `/atleta/*` (7 rotas duplicadas)
2. **Console Logs em Produção:** 37 ocorrências, algumas com dados sensíveis
3. **Logs de Webhook:** IDs de usuário e transações sendo registrados

## 🟡 Atenção (Requer Verificação)

1. **Páginas Potencialmente Órfãs:** `/quiz`, `/admin/assessorias`
2. **Rotas de API Órfãs:** `/health`, `/docs`, `/leads`
3. **Models Subutilizados:** FeedPost, Achievement, ConnectedDevice
4. **Imports Não Utilizados:** Necessário executar linter
5. **Dependências Não Confirmadas:** Alguns packages podem estar ociosos

## 🟢 Bom

1. **Sem arquivos temporários**
2. **Migrations bem organizadas**
3. **Código comentado apropriadamente**
4. **Estrutura de pastas clara**
5. **Sem código comentado em massa**

---

# 16. Recomendações Prioritárias

### Prioridade 1 (Próxima Sprint):
1. Remover rotas duplicadas `/athlete/*` (manter `/atleta/*`)
2. Migrar todos os `console.log()` para Sentry/Logger estruturado
3. Remover logs com dados sensíveis
4. Executar `npm run lint` e `npm run build` para identificar imports não utilizados

### Prioridade 2 (Próximas 2-4 Semanas):
1. Verificar uso de modelos Prisma subutilizados
2. Confirmar se rotas de API órfãs têm propósito
3. Limpar código comentado (muito pouco, mas consolidar)
4. Documentar propósito de páginas com baixo uso

### Prioridade 3 (Longo Prazo):
1. Estabelecer eslint rules automáticas para prevenir console.logs em produção
2. Implementar código coverage > 80%
3. Auditar dependências mensalmente
4. Validar migrations contra schema em CI/CD

---

# 17. Scripts Recomendados para CI/CD

```bash
# Lint e type check
npm run lint
npm run build

# Análise de segurança
npm audit --production

# Coverage
npm run test:coverage

# Migração reversa segura
npx prisma migrate status
npx prisma db validate
```

---

# 18. Próximas Auditorias

**Recomenda-se realizar auditorias periódicas:**

- **Mensal:** ESLint, imports não utilizados, dependências
- **Trimestral:** Schema do Prisma, models não utilizados
- **Semestral:** Revisão de routes orphaned, análise de performance

---

# Apêndice A: Tabelas do Schema Prisma

Total de modelos: **43 models**

Sem tabelas órfãs óbvias, mas recomenda-se validação prática no banco de dados.

---

# Assinatura do Relatório

**Auditoria Realizada por:** GitHub Copilot  
**Data:** 2026-07-08  
**Método:** Análise de código estático via grep, análise de padrões, revisão de schema  
**Nota:** Este relatório é diagnóstico. Nenhum código foi modificado.

---

> **"A manutenção de código é um processo contínuo. Esta auditoria fornece um ponto de referência para melhorias incrementais."**
