# CURRENT ARCHITECTURE — PACERUNPRO v0.1.0

**Data:** 2026-07-08  
**Status:** Documento de Referência Arquitetural  
**Versão:** 0.1.0 (Early Beta)  
**Escopo:** pace-run-pro/

---

# 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     PACERUNPRO                              │
│        Intelligent Training Intelligence Platform            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer (Next.js 15 + React 19)                 │
│  - Pages (App Router)                                        │
│  - Components (React + Tailwind)                             │
│  - UI Library (shadcn/ui + Radix)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Application Layer (API Routes)                              │
│  - NextAuth Authentication                                   │
│  - RESTful APIs (96+ endpoints)                              │
│  - Webhook Handlers                                          │
│  - Business Logic                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer (Business Logic)                               │
│  - Training Load Calculations                               │
│  - VDOT / FTP Algorithms                                     │
│  - Assessment Scoring                                        │
│  - Recommendation Engine                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (Prisma ORM + PostgreSQL)                        │
│  - 43 Models                                                 │
│  - 11 Migrations                                             │
│  - Relationships & Constraints                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure & Integrations                               │
│  - PostgreSQL (Neon)                                         │
│  - Redis (Upstash) — Cache                                   │
│  - Strava API                                                │
│  - Garmin Connect                                            │
│  - Apple HealthKit                                           │
│  - Google Health Connect                                     │
│  - PagBank                                                   │
│  - Stripe                                                    │
│  - Sentry — Error Tracking                                   │
│  - Vercel — Hosting & Deploy                                 │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. Stack Tecnológico

## Frontend
- **Framework:** Next.js 15.5.19 (App Router)
- **UI Library:** React 19.2.7 + React DOM
- **Component Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS 4 + PostCSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **Data Fetching:** TanStack Query (React Query)
- **State Management:** Zustand
- **Charts:** Recharts
- **QR Codes:** react-qr-code

## Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Next.js API Routes
- **ORM:** Prisma 7.8.0
- **Database:** PostgreSQL (Neon)
- **Authentication:** NextAuth 5.0.0-beta
- **API Documentation:** Auto-generated OpenAPI

## Infrastructure
- **Hosting:** Vercel
- **Database:** PostgreSQL (Neon)
- **Cache:** Redis (Upstash)
- **CDN:** Cloudflare
- **Error Tracking:** Sentry
- **Monitoring:** OpenTelemetry + Better Stack (planned)
- **Email:** Resend

## Development
- **Language:** TypeScript 5
- **Linting:** ESLint 9
- **Testing:** Vitest 4.1.9
- **Build Tool:** esbuild (via tsx)
- **Package Manager:** npm
- **VCS:** Git

---

# 3. Fluxo de Autenticação

## Estratégia: NextAuth v5 + JWT + Credentials + OAuth Google

```
┌──────────────────────────────────────────────────────────────┐
│                    Autenticação                              │
└──────────────────────────────────────────────────────────────┘

┌─ Opção 1: Login por Email/Senha ─────────────────────────┐
│                                                            │
│  1. Usuário submete credenciais                           │
│  2. API POST /auth/signin (Credentials Provider)          │
│  3. Validator: email existe + password match (bcrypt)     │
│  4. Sucesso: JWT gerado + sessão criada                   │
│  5. Token contém: id, email, role, nome                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ Opção 2: Google OAuth ──────────────────────────────────┐
│                                                            │
│  1. Botão "Login com Google"                              │
│  2. Redirecionamento para Google                          │
│  3. Retorna token + profile                               │
│  4. PrismaAdapter registra/busca usuário                  │
│  5. Usuário criado automaticamente (role: ATHLETE)        │
│  6. Sessão JWT criada                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ Fluxo de Admin Bootstrap ──────────────────────────────┐
│                                                            │
│  ENV: ADMIN_EMAILS="admin@enky.com,dev@enky.com"         │
│                                                            │
│  1. Durante JWT creation ou token refresh                 │
│  2. Se email está em ADMIN_EMAILS                         │
│  3. Promove role para ADMIN automaticamente               │
│  4. Persiste na database                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

Token JWT Structure:
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "Nome Completo",
  "role": "ADMIN | COACH | ATHLETE",
  "image": "avatar_url",
  "iat": 1234567890,
  "exp": 1234568790
}

Session Strategy: JWT (stateless)
Cookies: Secure, HttpOnly, SameSite=Lax
Refresh: Automático via token rotation
```

## Guardrails de Segurança

```
✅ Senha: bcryptjs (12+ rounds)
✅ Email: Normalizado (lowercase, trim)
✅ RBAC: Role-based access control (ADMIN, COACH, ATHLETE)
✅ LGPD: Soft delete, audit logs
✅ Rate Limit: Por endpoint sensível
✅ CORS: Configurado por ambiente
✅ CSRF: NextAuth protege automaticamente
✅ XSS: React escape automático
✅ SQL Injection: Prisma prepared statements
```

---

# 4. Módulos e Domínios

## 4.1 Identity & Accounts

**Responsabilidade:** Autenticação, sessões, contas de usuário.

**Modelos:**
- `User` — Conta central
- `Account` — OAuth providers
- `Session` — Sessões JWT
- `VerificationToken` — Email verification tokens

**APIs:**
- `POST /auth/register` — Criar conta
- `POST /auth/forgot-password` — Recuperação de senha
- `POST /auth/reset-password` — Resetar senha
- `POST /auth/strava/callback` — OAuth Strava
- `GET/POST /auth/[...nextauth]` — NextAuth handlers

**Serviços:**
- `lib/auth-guard.ts` — Middleware de proteção
- `lib/encryption.ts` — Token encryption/decryption

---

## 4.2 Coach Management

**Responsabilidade:** Perfil de treinador, assessorias, configurações.

**Modelos:**
- `Coach` — Perfil principal (credenciais, bio, slug público)
- `Team` — Grupos/assessorias
- `TeamMember` — Membros do time
- `CoachPlan` — Planos de venda (mensal, trimestral, etc.)
- `CoachZoneModel` — Configuração de zonas de treino
- `CoachStrengthTemplate` — Templates de força personalizados
- `CoachRunTemplate` — Templates de corrida personalizados
- `Lead` — CRM de prospects
- `Expense` — Despesas operacionais
- `BillingSettings` — Configuração de recebimento (PIX, PagBank, Stripe)

**APIs:**
- `GET /api/coach/profile` — Info do treinador
- `PATCH /api/treinador/perfil` — Atualizar perfil
- `GET/POST /api/coach/athletes` — Listar/adicionar atletas
- `GET/POST /api/coach/grupos` — Times/grupos
- `GET/POST /api/coach/leads` — CRM
- `GET/POST /api/coach/zone-models` — Zonas de treino
- `GET/POST /api/coach/planos` — Planos de venda
- `POST /api/admin/set-plan` — Admin: atribuir plano a usuário

**Páginas:**
- `/treinador/perfil` — Editar perfil
- `/treinador/atletas` — Listar atletas
- `/treinador/grupos` — Gerenciar times
- `/treinador/configuracoes/zonas` — Configurar zonas
- `/treinador/financeiro` — Dashboard financeiro
- `/treinador/crm` — Leads CRM
- `/treinador/perfil` — Perfil público

---

## 4.3 Athlete Management

**Responsabilidade:** Perfil de atleta, dados pessoais, histórico.

**Modelos:**
- `Athlete` — Perfil principal
- `AthleteLoadParams` — Parâmetros para cálculo de carga
- `RecoveryLog` — Histórico de recuperação
- `CheckIn` — Check-ins diários (RPE, sono, fadiga, etc.)
- `Metric` — Métricas corporais (peso, % gordura, HR repouso, HRV)
- `Achievement` — Conquistas desbloqueadas

**APIs:**
- `GET /api/atleta/perfil` — Info do atleta
- `PATCH /api/atleta/perfil` — Atualizar perfil
- `GET /api/atleta/evolucao` — Dados de evolução
- `POST /api/checkins` — Registrar check-in
- `GET /api/atleta/achievements` — Conquistas
- `GET /api/atleta/parq` — Status do PAR-Q

**Páginas:**
- `/atleta/perfil` — Editar perfil
- `/atleta/dashboard` — Dashboard principal
- `/atleta/analise-semanal` — Análise semanal
- `/atleta/evolucao` — Gráficos de evolução
- `/atleta/timeline` — Timeline de eventos

---

## 4.4 Training & Planning

**Responsabilidade:** Periodização, prescrição de treinos, execução.

**Modelos:**
- `TrainingPlan` — Plano anual/macrociclo
- `TrainingWeek` — Semana de treino
- `Workout` — Sessão de treino individual
- `WorkoutLog` — Execução de treino (resultado real)
- `WorkoutLogComment` — Comentários sobre execução
- `SharedWorkoutTemplate` — Templates compartilhados entre coaches
- `StrengthWorkout` — Treino de força estruturado
- `StrengthBlock` — Bloco de exercícios
- `Exercise` — Catálogo de exercícios
- `ExerciseVideo` — Vídeos de exercícios

**Enums:**
- `WorkoutType` — 15+ tipos (rodagem leve, intervalado, força, etc.)
- `WorkoutStatus` — Agendado, liberado, concluído, perdido, ajustado
- `CyclePhase` — Base, construção, específico, polimento, competição, recuperação

**APIs:**
- `GET/POST /api/coach/prescriptions/corrida` — Prescrever treino de corrida
- `GET/POST /api/coach/prescriptions/forca` — Prescrever treino de força
- `GET /api/coach/workouts` — Listar treinos da semana
- `GET/POST /api/coach/workouts/copy` — Copiar/duplicar treino
- `PATCH /api/coach/workouts/[id]` — Editar treino
- `GET/POST /api/atleta/workouts` — Treinos do atleta
- `GET/POST /api/atleta/workouts/[id]` — Detalhe do treino
- `POST /api/planos` — Criar plano de treino
- `GET/POST /api/coach/prescriptions/periodizacao` — Periodização

**Páginas:**
- `/treinador/prescricao/corrida` — Builder de corrida
- `/treinador/prescricao/forca` — Builder de força
- `/treinador/prescricao/periodizacao` — Montador de periodização
- `/treinador/calendario` — Calendário visual
- `/atleta/calendario` — Visualização de treinos
- `/atleta/treino` — Treino do dia
- `/atleta/forca` — Treinos de força

---

## 4.5 Performance & Assessment

**Responsabilidade:** Avaliações, testes, métricas.

**Modelos:**
- `PerformanceTest` — Testes (Cooper, 5min, 3km, VAM, RAST, etc.)
- `Race` — Competições
- `Metric` — Série temporal de métricas

**APIs:**
- `GET/POST /api/atleta/performance-tests` — Registrar teste
- `GET/POST /api/atleta/races` — Registrar prova
- `DELETE /api/atleta/races/[id]` — Deletar prova
- `GET /api/atleta/peak-pace` — Ritmo máximo atingido

**Páginas:**
- `/atleta/testes` — Registrar testes de performance
- `/atleta/provas` — Histórico de provas
- `/treinador/avaliacoes` — Avaliar atleta

---

## 4.6 Training Load & Analytics

**Responsabilidade:** Cálculo de carga, CTL/ATL/TSB, alertas de fadiga.

**Modelos:**
- `AthleteLoadParams` — Parâmetros individuais (FTP, limiar, HR max/rest)
- `RecoveryLog` — Série temporal de scores de recuperação

**Serviços:**
- `services/training-load.service.ts`
  - `computeAthleteLoad()` — Calcula CTL, ATL, TSB, ACWR
  - `logRecoveryScore()` — Registra score de recuperação
- `services/vdot.service.ts`
  - `upsertVdotFromResult()` — Calcula VDOT a partir de teste

**APIs:**
- `GET /api/atleta/training-load` — CTL/ATL/TSB atual
- `GET /api/coach/athletes/[id]/training-load` — Carga do atleta
- `GET /api/coach/athletes/[id]/load-params` — Parâmetros
- `PATCH /api/coach/athletes/[id]/load-params` — Atualizar parâmetros

**Páginas:**
- `/treinador/analise-semanal` — Análise semanal por atleta
- `/treinador/alertas` — Alertas de risco/fadiga

**Fórmulas:**
```
CTL (Chronic Training Load) — média móvel de 42 dias de carga
ATL (Acute Training Load) — média móvel de 7 dias de carga
TSB (Training Stress Balance) — CTL - ATL
ACWR (Acute:Chronic) — ATL / CTL
TRIMP — VDOT-based training impulse
TSS — Training Stress Score (ciclo/força)
```

---

## 4.7 Integrations

**Responsabilidade:** Sincronização com wearables e plataformas externas.

**Provedores Suportados:**
- Strava (running, cycling)
- Garmin Connect
- Apple HealthKit
- Google Health Connect
- Polar
- Coros
- Suunto

**Modelos:**
- `ConnectedDevice` — Dispositivo vinculado
- `WorkoutLog.source` — Rastreamento de origem

**APIs:**
- `GET /api/integrations/status` — Status de conexões
- `GET /api/integrations/strava/connect` — OAuth Strava
- `POST /api/integrations/strava/disconnect` — Desconectar
- `POST /api/integrations/strava/sync` — Sincronizar manual
- `GET/POST /api/webhooks/strava` — Webhook Strava
- `POST /api/webhooks/garmin` — Webhook Garmin

**Webhooks Recebidos:**
- Strava: `activity.created`, `activity.updated`
- Garmin: Activity upload notifications
- PagBank: Payment status updates
- Stripe: Subscription events

---

## 4.8 Marketplace & Products

**Responsabilidade:** Venda de planos, produtos, templates.

**Modelos:**
- `PlanProduct` — Plano para venda (estruturado)
- `PlanPurchase` — Compra de plano por atleta
- `CoachPlan` — Assinatura de assessoria
- `Subscription` — Assinatura do usuário
- `Payment` — Histórico de pagamentos
- `Voucher` — Cupons de desconto

**Payment Providers:**
- Stripe (checkout, subscriptions)
- PagBank (PIX, cartão, boleto)
- MercadoPago (mercados latino-americanos)

**APIs:**
- `GET /api/loja` — Listar planos disponíveis
- `GET /api/loja/[slug]` — Detalhe do plano
- `POST /api/checkout` — Iniciar checkout
- `POST /api/stripe/create-checkout-session` — Sessão Stripe
- `POST /api/webhooks/stripe` — Webhook Stripe
- `POST /api/webhooks/pagbank` — Webhook PagBank
- `GET/POST /api/vouchers` — Validar/gerenciar vouchers
- `POST /api/vouchers/validate` — Validar cupom

**Páginas:**
- `/loja` — Marketplace de planos
- `/loja/[slug]` — Detalhe do plano
- `/checkout` — Checkout
- `/assinar` — Página de assinatura
- `/treinador/loja-planos` — Criar/editar planos
- `/treinador/minha-loja` — Dashboard da loja
- `/treinador/vouchers` — Gerenciar vouchers

---

## 4.9 Community & Social

**Responsabilidade:** Feed social, comunidade, comentários.

**Modelos:**
- `FeedPost` — Post na comunidade
- `FeedComment` — Comentário
- `FeedLike` — Like
- `WorkoutLogComment` — Comentário em treino executado

**APIs:**
- `GET/POST /api/workout-logs/[id]/comments` — Comentários em treino
- `DELETE /api/workout-logs/[id]/comments/[commentId]` — Deletar comentário

**Páginas:**
- `/atleta/comunidade` — Feed da comunidade
- `/atleta/atividade/[logId]` — Detalhe de treino executado

---

## 4.10 Notifications & Push

**Responsabilidade:** Notificações em tempo real.

**Modelos:**
- `Notification` — Notificação salva

**Hooks:**
- `use-push-notification.ts` — Hook para registro de push notifications

**APIs:**
- `POST /api/atleta/push` — Registrar dispositivo
- `DELETE /api/atleta/push` — Desregistrar dispositivo

**Eventos Notificados:**
- Treino liberado
- Alerta de fadiga/lesão
- Mensagem de treinador
- Novo comentário
- Conquista desbloqueada
- Pagamento recebido

---

# 5. Banco de Dados — Modelo de Dados

## 5.1 Total de Modelos: 43

### Core Identity (5 models)
- `User` — Conta central
- `Account` — OAuth
- `Session` — JWT sessions
- `VerificationToken` — Email tokens
- `BillingSettings` — Configuração fiscal/recebimento

### Pessoas (3 models)
- `Athlete` — Perfil atleta
- `Coach` — Perfil treinador
- `Team`, `TeamMember` — Grupos

### Treino & Periodização (9 models)
- `TrainingPlan` — Macrociclo
- `TrainingWeek` — Mesociclo
- `Workout` — Sessão
- `WorkoutLog` — Execução
- `WorkoutLogComment` — Feedback
- `StrengthWorkout`, `StrengthBlock` — Força estruturada
- `Exercise`, `ExerciseVideo` — Catálogo

### Performance & Avaliação (5 models)
- `PerformanceTest` — Testes (Cooper, etc.)
- `CheckIn` — Wellness diário
- `Metric` — Série temporal (peso, HRV, etc.)
- `RecoveryLog` — Score de recuperação
- `Achievement` — Conquistas

### Comercial & Assinatura (8 models)
- `CoachPlan` — Plano de assessoria
- `Subscription` — Assinatura do usuário
- `Payment` — Pagamento
- `PlanProduct` — Plano para venda
- `PlanPurchase` — Compra de plano
- `Voucher` — Cupons
- `Lead` — CRM
- `Expense` — Despesas

### Templates & Configuração (6 models)
- `SharedWorkoutTemplate` — Templates compartilhados
- `CoachStrengthTemplate` — Templates força
- `CoachRunTemplate` — Templates corrida
- `CoachZoneModel` — Zonas de treino
- `AthleteLoadParams` — Parâmetros de carga
- `Race` — Competições

### Social & Notificação (4 models)
- `FeedPost` — Post
- `FeedComment` — Comentário
- `FeedLike` — Like
- `Notification` — Notificação
- `ConnectedDevice` — Wearables conectados

---

## 5.2 Relacionamentos Principais

```
User (1) ──→ (1) Athlete
         ──→ (1) Coach
         ──→ (1) BillingSettings
         ──→ (*) Subscription
         ──→ (*) Payment
         ──→ (*) Notification
         ──→ (*) ConnectedDevice
         ──→ (*) FeedPost
         ──→ (*) FeedComment
         ──→ (*) FeedLike

Coach (1) ──→ (*) Athlete (coaching)
         ──→ (*) Team
         ──→ (*) CoachPlan
         ──→ (*) TrainingPlan
         ──→ (*) Exercise
         ──→ (*) CoachStrengthTemplate
         ──→ (*) CoachRunTemplate
         ──→ (*) Lead
         ──→ (*) Expense
         ──→ (*) CoachZoneModel
         ──→ (*) PlanProduct
         ──→ (*) SharedWorkoutTemplate

Athlete (1) ──→ (1) AthleteLoadParams
         ──→ (1) Coach (assigned)
         ──→ (*) TrainingPlan
         ──→ (*) TrainingWeek
         ──→ (*) WorkoutLog
         ──→ (*) CheckIn
         ──→ (*) PerformanceTest
         ──→ (*) Metric
         ──→ (*) RecoveryLog
         ──→ (*) Race
         ──→ (*) Achievement
         ──→ (*) PlanPurchase
         ──→ (*) TeamMember

TrainingPlan (1) ──→ (*) TrainingWeek
              ──→ (1) Athlete

TrainingWeek (1) ──→ (*) Workout
              ──→ (1) TrainingPlan

Workout (1) ──→ (*) WorkoutLog
         ──→ (0,1) StrengthWorkout
         ──→ (1) TrainingWeek

StrengthWorkout (1) ──→ (*) StrengthBlock
                  ──→ (1) Workout

StrengthBlock (1) ──→ (1) Exercise
               ──→ (1) StrengthWorkout

Exercise (1) ──→ (*) StrengthBlock
          ──→ (*) ExerciseVideo
          ──→ (0,1) Coach (custom)

PlanProduct (1) ──→ (*) PlanPurchase
             ──→ (1) Coach

WorkoutLog (1) ──→ (0,1) Workout
            ──→ (1) Athlete
            ──→ (*) WorkoutLogComment

Subscription (1) ──→ (*) Payment
             ──→ (1) User

PlanPurchase (1) ──→ (1) PlanProduct
             ──→ (1) Athlete
```

---

## 5.3 Índices Principais

```
athletes:       (coachId), (status)
coaches:        (slug) — UNIQUE (páginas públicas)
training_plans: (athleteId), (coachId)
training_weeks: (planId, weekNumber) — UNIQUE
workouts:       (weekId, date)
workout_logs:   (athleteId, startedAt), (workoutId)
                (stravaActivityId) — UNIQUE
performance_tests: (athleteId, date)
checkins:       (athleteId, date)
metrics:        (athleteId, date)
recovery_logs:  (athleteId, date)
connections:    (userId, provider) — UNIQUE
leads:          (coachId, stage)
shared_templates: (coachId), (scope)
```

---

# 6. APIs — 96+ Endpoints Mapeados

## 6.1 Autenticação & Identidade (8 endpoints)

```
POST   /api/auth/register                    Registrar conta
POST   /api/auth/forgot-password             Recuperação de senha
POST   /api/auth/reset-password              Resetar senha
GET    /api/auth/strava/callback             OAuth Strava
POST   /api/auth/[...nextauth]               NextAuth routes
GET    /api/auth/[...nextauth]               NextAuth routes
POST   /api/integrations/strava/connect      OAuth Strava
POST   /api/integrations/strava/disconnect   Desconectar Strava
```

## 6.2 Admin (4 endpoints)

```
GET    /api/admin/coaches                    Listar coaches
POST   /api/admin/approve                    Aprovar upgrade
PATCH  /api/admin/set-plan                   Atribuir plano
GET    /api/admin/assessorias                (?) Dados de assessorias
```

## 6.3 Coach — Athletes (8 endpoints)

```
GET    /api/coach/athletes                   Listar atletas
POST   /api/coach/athletes/add                Adicionar atleta
GET    /api/coach/athletes/[id]/load-params  Parâmetros de carga
PATCH  /api/coach/athletes/[id]/load-params  Atualizar parâmetros
GET    /api/coach/athletes/[id]/training-load Carga do atleta
GET    /api/coach/athletes/week               Treinos da semana
GET    /api/coach/action-center               Action center
```

## 6.4 Coach — Planning & Prescription (9 endpoints)

```
POST   /api/coach/prescriptions/corrida      Prescrever corrida
POST   /api/coach/prescriptions/forca        Prescrever força
GET    /api/coach/planos                     Listar planos
POST   /api/coach/planos                     Criar plano
DELETE /api/coach/planos/[id]                Deletar plano
GET    /api/coach/workouts/copy              Copiar semana
POST   /api/coach/workouts/copy              Executar cópia
POST   /api/coach/workouts/copy-week         Copiar week
GET    /api/coach/workouts                   Listar workouts
POST   /api/coach/workouts                   Criar workout
PATCH  /api/coach/workouts/[id]              Atualizar workout
DELETE /api/coach/workouts/[id]              Deletar workout
```

## 6.5 Coach — Library & Templates (12 endpoints)

```
GET    /api/coach/biblioteca                 Listar exercícios
POST   /api/coach/biblioteca                 Criar exercício
GET    /api/coach/biblioteca/[id]            Detalhe
DELETE /api/coach/biblioteca/[id]            Deletar
POST   /api/coach/biblioteca/[id]/usar       Usar template
GET    /api/coach/templates/corrida          Listar templates corrida
POST   /api/coach/templates/corrida          Criar template
DELETE /api/coach/templates/corrida/[id]     Deletar
GET    /api/coach/templates/forca            Listar templates força
POST   /api/coach/templates/forca            Criar template
DELETE /api/coach/templates/forca/[id]       Deletar
```

## 6.6 Coach — Grupos & Teams (6 endpoints)

```
GET    /api/coach/grupos                     Listar grupos
POST   /api/coach/grupos                     Criar grupo
GET    /api/coach/grupos/[id]                Detalhe
PATCH  /api/coach/grupos/[id]                Atualizar grupo
DELETE /api/coach/grupos/[id]                Deletar grupo
```

## 6.7 Coach — Configuração (7 endpoints)

```
GET    /api/coach/profile                    Info coach
PATCH  /api/treinador/perfil                 Atualizar perfil
GET    /api/coach/zone-models                Listar zonas
POST   /api/coach/zone-models                Criar zona
PATCH  /api/coach/zone-models/[id]           Atualizar zona
DELETE /api/coach/zone-models/[id]           Deletar zona
```

## 6.8 Coach — Financeiro (7 endpoints)

```
GET    /api/coach/billing                    Configuração de faturamento
GET    /api/coach/expenses                   Listar despesas
POST   /api/coach/expenses                   Registrar despesa
DELETE /api/coach/expenses/[id]              Deletar despesa
GET    /api/coach/leads                      Listar leads
POST   /api/coach/leads                      Criar lead
POST   /api/coach/leads/convert              Converter lead
```

## 6.9 Coach — Marketplace (6 endpoints)

```
GET    /api/coach/produtos                   Listar produtos
POST   /api/coach/produtos                   Criar produto
PATCH  /api/coach/produtos/[id]              Atualizar produto
DELETE /api/coach/produtos/[id]              Deletar produto
GET    /api/loja                             Listar público
GET    /api/loja/[slug]                      Detalhe público
```

## 6.10 Athlete — Treino (9 endpoints)

```
GET    /api/atleta/workouts                  Listar treinos
POST   /api/atleta/workouts/[id]             Executar treino
GET    /api/atleta/workouts/[id]             Detalhe treino
POST   /api/atleta/forca                     Listar força
GET    /api/atleta/forca/[id]                Detalhe força
GET    /api/atleta/forca/hoje                Força de hoje
POST   /api/athlete/workouts/[id]            (alt) Executar treino
GET    /api/athlete/workouts                 (alt) Listar
GET    /api/athlete/forca                    (alt) Listar força
```

## 6.11 Athlete — Performance & Assessment (7 endpoints)

```
GET    /api/atleta/performance-tests         Listar testes
POST   /api/atleta/performance-tests         Registrar teste
GET    /api/atleta/races                     Listar provas
POST   /api/atleta/races                     Registrar prova
DELETE /api/atleta/races/[id]                Deletar prova
GET    /api/atleta/parq                      Status PAR-Q
PATCH  /api/atleta/parq                      Aceitar PAR-Q
```

## 6.12 Athlete — Profile & Dados (8 endpoints)

```
GET    /api/atleta/perfil                    Info completa
PATCH  /api/atleta/perfil                    Atualizar perfil
PATCH  /api/atleta/avatar                    Upload avatar
PATCH  /api/atleta/banner                    Upload banner
GET    /api/atleta/evolucao                  Dados de evolução
GET    /api/atleta/achievements              Conquistas
GET    /api/atleta/hr-zones                  Zonas de FC
GET    /api/athlete/plan                     (alt) Plano
```

## 6.13 Athlete — Check-ins & Monitoramento (4 endpoints)

```
GET    /api/checkins                         Listar check-ins
POST   /api/checkins                         Registrar check-in
GET    /api/atleta/training-load             CTL/ATL/TSB
GET    /api/atleta/peak-pace                 Ritmo máximo
```

## 6.14 Athlete — Integrações (4 endpoints)

```
GET    /api/integrations/status              Status de conexões
POST   /api/integrations/strava/sync         Sincronizar Strava
GET    /api/integrations/strava/webhook      Webhook Strava
POST   /api/integrations/strava/webhook      Webhook Strava
```

## 6.15 Coach/Athlete — Pagamento & Assinatura (9 endpoints)

```
GET    /api/planos                           Listar planos
POST   /api/planos                           Criar plano
POST   /api/checkout                         Iniciar checkout
POST   /api/stripe/create-checkout-session   Sessão Stripe
POST   /api/webhooks/stripe                  Webhook Stripe
POST   /api/webhooks/pagbank                 Webhook PagBank
GET    /api/vouchers                         Listar vouchers
POST   /api/vouchers                         Criar voucher
POST   /api/vouchers/validate                Validar código
```

## 6.16 Notificações & Push (3 endpoints)

```
POST   /api/atleta/push                      Registrar dispositivo
DELETE /api/atleta/push                      Desregistrar
GET    /api/treinador/alertas                Listar alertas
```

## 6.17 Comentários & Social (4 endpoints)

```
GET    /api/workout-logs/[id]/comments       Comentários
POST   /api/workout-logs/[id]/comments       Criar comentário
DELETE /api/workout-logs/[id]/comments/[cId] Deletar
GET    /api/atleta/ia-context                Contexto para IA
```

## 6.18 Utilities (3 endpoints)

```
GET    /api/health                           Health check
GET    /api/docs                             API docs (OpenAPI)
POST   /api/ia-treinadora                    Chat com IA
```

---

# 7. Páginas — Estrutura de Routes

## 7.1 Public Pages

```
/                           Landing page
/login                      Login
/cadastro                   Registro
/recuperar-senha            Recuperar senha
/redefinir-senha/[token]    Resetar senha
/termos                     Termos de serviço
/privacidade                Política de privacidade
/p/[slug]                   Página pública do coach
```

## 7.2 Onboarding

```
/onboarding                 Flow de onboarding
/onboarding/assessoria      Selecionar assessoria
/anamnese                   Questionário PAR-Q
/quiz                       Quiz de profile
/assinar                    Plano de assinatura
```

## 7.3 Athlete Dashboard

```
/atleta/dashboard           Dashboard principal
/atleta/calendario          Calendário de treinos
/atleta/treino              Treino do dia
/atleta/forca               Treinos de força
/atleta/forca/[id]          Detalhe força
/atleta/forca/[id]/executar Executar força
/atleta/forca/treino/[id]   Força estruturada
/atleta/evolucao            Gráficos de evolução
/atleta/atividade           Histórico de atividades
/atleta/atividade/[logId]   Detalhe de treino
/atleta/timeline            Timeline de eventos
/atleta/comunidade          Feed social
/atleta/testes              Testes de performance
/atleta/perfil              Editar perfil
/atleta/planos              Planos disponíveis
/atleta/provas              Histórico de provas
/atleta/ia-treinadora       Chat com IA
```

## 7.4 Coach Dashboard

```
/treinador/dashboard        Dashboard principal
/treinador/atletas          Listar atletas
/treinador/atletas/[id]     Detalhe atleta
/treinador/atletas/convidar Convidar atleta
/treinador/alertas          Alertas de risco
/treinador/analise-semanal  Análise semanal
```

## 7.5 Coach — Planning

```
/treinador/prescricao/corrida        Builder corrida
/treinador/prescricao/forca          Builder força
/treinador/prescricao/periodizacao   Montador de ciclos
/treinador/calendario                Calendário
```

## 7.6 Coach — Biblioteca & Configuração

```
/treinador/biblioteca                Exercícios e templates
/treinador/configuracoes/zonas       Configurar zonas
/treinador/grupos                    Times/grupos
/treinador/conheca-o-sistema         Documentação do sistema
```

## 7.7 Coach — Comercial

```
/treinador/loja                      Landing da loja
/treinador/loja-planos               Criar planos
/treinador/minha-loja                Dashboard loja
/treinador/loja-planos               Planos personalizados
/treinador/planos-venda              Listar planos
/treinador/vouchers                  Gerenciar vouchers
/treinador/crm                       CRM de leads
```

## 7.8 Coach — Financeiro & Perfil

```
/treinador/perfil                    Editar perfil
/treinador/perfil/_profile-client    (nested client component)
/treinador/configuracoes             Configurações
/treinador/financeiro                Dashboard financeiro
/treinador/relatorios                Relatórios
/treinador/gestao                    Gestão operacional
/treinador/minha-pagina              Página pública
/treinador/white-label               White label settings
```

## 7.9 Admin

```
/admin                               Dashboard admin
/admin/page                          Visão geral
/admin/assinaturas                   Assinaturas
/admin/atletas                       Atletas
/admin/assessorias                   Assessorias
/admin/financeiro                    Financeiro
```

## 7.10 Checkout & Loja

```
/loja                                Marketplace público
/loja/[slug]                         Detalhe do plano
/checkout                            Carrinho e checkout
```

## 7.11 Pagina Redirect

```
/painel                              Redirect → dashboard apropriado
```

## 7.12 Error Handling

```
/error                               Error boundary global
/not-found                           404 page
/loading                             Loading skeleton
```

---

# 8. Dashboards

## 8.1 Coach Dashboard (`/treinador/dashboard`)

**Componentes:**
- Visão geral de atletas
- Últimas atividades
- Alertas de risco
- Estatísticas de carga
- Calendário semanal
- Check-ins dos atletas

**Dados Chave:**
```
- Total de atletas ativos
- Atletas em risco (TSB baixo, sono ruim)
- Aderência média
- Volume total semanal
- Treinos liberados vs executados
```

**APIs Consumidas:**
- `GET /api/coach/athletes`
- `GET /api/coach/action-center`
- `GET /api/treinador/alertas`
- `GET /api/coach/athletes/week`

---

## 8.2 Athlete Dashboard (`/atleta/dashboard`)

**Componentes:**
- Treino do dia
- Próximos treinos
- CTL/ATL/TSB visual
- Últimas atividades
- Feedback de treinador
- Conquistas recentes

**Dados Chave:**
```
- Treino para hoje
- Próximos 7 dias
- Forma (CTL)
- Fadiga aguda (ATL)
- Balance (TSB)
- Aderência % semanal
```

**APIs Consumidas:**
- `GET /api/atleta/workouts`
- `GET /api/atleta/training-load`
- `GET /api/atleta/achievements`
- `GET /api/checkins`

---

## 8.3 Admin Dashboard (`/admin`)

**Componentes:**
- Visão geral de usuários
- Assinaturas ativas
- Receita
- Relatório de leads
- Health check

**Dados Chave:**
```
- Total coaches/athletes
- MRR (Monthly Recurring Revenue)
- Churn rate
- Leads por fonte
- Status do sistema
```

---

# 9. Integrações

## 9.1 Strava (Activity Syncing)

**Flow:**
```
1. User clicks "Connect Strava"
2. OAuth → /api/integrations/strava/connect
3. Redirect to Strava authorization
4. Strava callback → connectedDevice saved
5. Webhook → /api/webhooks/strava
6. Activity created/updated → WorkoutLog created/updated
```

**Webhook Events:**
- `activity.created` — Nova atividade
- `activity.updated` — Atividade modificada

**Dados Sincronizados:**
```
- Distance (km)
- Duration (seconds)
- Avg Heart Rate
- Max Heart Rate
- Elevation Gain (m)
- GPS Track (polyline)
- Cadence
- Activity Type → WorkoutType mapping
```

---

## 9.2 Garmin Connect (Activity Upload)

**Flow:**
```
1. User connects Garmin account via web portal
2. ConnectedDevice saved
3. Garmin → Webhook POST /api/webhooks/garmin
4. Activity data → WorkoutLog created
```

**Webhook Format:**
```json
{
  "userId": "garmin_user_id",
  "activityId": "garmin_activity_id",
  "totalDistanceInMeters": 12000,
  "durationInSeconds": 3600,
  "averageHeartRateInBeatsPerMinute": 145,
  "maxHeartRateInBeatsPerMinute": 165,
  "elevationGainInMeters": 250
}
```

---

## 9.3 Apple HealthKit & Google Health Connect (Data Access)

**Purpose:**
- Síncrone resting heart rate
- Heart rate variability (HRV)
- Sleep tracking
- Metabolic data

**Implementation:**
- Mobile app reads native health APIs
- Data sent via `POST /api/metrics`
- Stored in `Metric` model

---

## 9.4 PagBank (Payment Processing)

**Flow:**
```
1. Coach configures PIX/Bank account in /treinador/financeiro
2. BillingSettings saved
3. Athlete purchases plan → `/api/checkout`
4. PagBank charge initiated
5. Webhook → `/api/webhooks/pagbank`
6. Payment status updated
7. Subscription activated
```

**Methods:**
- PIX (instant)
- Credit Card
- Boleto (banking slip)

---

## 9.5 Stripe (Subscriptions & Payments)

**Flow:**
```
1. Coach can enable Stripe for recurring charges
2. Athlete checks out → `/api/stripe/create-checkout-session`
3. Stripe checkout hosted page
4. Payment processed
5. Webhook → `/api/webhooks/stripe`
6. Subscription created/updated
```

---

## 9.6 MercadoPago (Latin America)

**Planned Integration:**
- Alternative payment processor
- Local payment methods per country
- Scheduled implementation in Phase 2

---

## 9.7 Email Service (Resend)

**Use Cases:**
- Welcome email
- Password reset
- Invitation to coach
- Subscription confirmation
- Payment receipts

**API:**
```typescript
sendEmail({
  to: "user@example.com",
  subject: "...",
  html: "..."
})
```

---

## 9.8 Sentry (Error Tracking)

**Configuration:**
```typescript
// sentry.client.config.ts
// sentry.edge.config.ts
// sentry.server.config.ts
```

**Features:**
- Exception tracking
- Performance monitoring
- Release tracking
- Session replay (partial)

---

# 10. Observabilidade & Monitoramento

## 10.1 Logs

```
✅ console.log() → (needs migration to Sentry)
✅ console.error() → Errors captured
✅ API endpoints → Request/response logging
✅ Webhooks → Event logging
✅ Integrations → Activity logging
```

## 10.2 Métricas

```
Performance:
- API response time < 300ms
- Dashboard load < 2 seconds
- Mobile responsive

Application:
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- Aderência de treino %
- Retenção de assinatura

Business:
- MRR
- Churn rate
- Customer acquisition cost
- Lifetime value
```

## 10.3 Rastreamento de Eventos

```
Rastreado:
- Login/logout
- Assessment completed
- Workout prescribed
- Workout executed
- Plan purchased
- Payment received
- Support contacted
```

---

# 11. Segurança

## 11.1 Autenticação & Autorização

```
✅ JWT strategy (stateless)
✅ Bcrypt password hashing
✅ NextAuth v5
✅ Email verification (with tokens)
✅ RBAC: ADMIN, COACH, ATHLETE
✅ Per-route middleware guards
```

## 11.2 Data Protection

```
✅ HTTPS only
✅ HttpOnly cookies
✅ SameSite=Lax
✅ CORS configured
✅ Rate limiting on sensitive endpoints
✅ Soft deletes (no hard deletes)
✅ Audit logging
```

## 11.3 Compliance

```
✅ LGPD (Lei Geral de Proteção de Dados)
✅ Data retention policies
✅ User consent tracking
✅ Data export capability (planned)
✅ Right to be forgotten (planned)
```

---

# 12. Deployment & DevOps

## 12.1 Hosting

```
Vercel:
- Next.js deployment
- Serverless functions
- Edge functions (middleware)
- Preview deployments
- Environment management
```

## 12.2 Database

```
Neon PostgreSQL:
- Multi-region replicas
- Automated backups
- Point-in-time recovery
- Connection pooling
```

## 12.3 Cache & CDN

```
Redis (Upstash):
- Session cache
- Dashboard cache
- Rate limiting
- Scheduled jobs

Cloudflare:
- Static assets CDN
- DDoS protection
- DNS management
```

## 12.4 CI/CD

```
GitHub Actions:
- Lint on PR
- Type check
- Test on PR
- Build verification
- Auto-deploy on main
```

---

# 13. Performance Targets

```
Frontend:
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Page load: < 2 seconds
- Mobile: Responsive, PWA-ready
- Accessibility: WCAG AA

Backend:
- API response: < 300ms (p95)
- Database query: < 100ms (p95)
- Webhook processing: < 5 seconds
- Availability: > 99.9%

Database:
- Read replicas for scale
- Indexed queries
- Connection pooling
- Slow query monitoring
```

---

# 14. Próximas Fases de Desenvolvimento

## Phase 1 (Current) — Foundation MVP
```
✅ Authentication
✅ Coach/Athlete basic workflows
✅ Training planning
✅ Strava integration
✅ Payment basic
✅ Dashboards MVP
```

## Phase 2 — Science Engine
```
→ Advanced metrics calculations
→ Assessment framework
→ Recommendation engine
→ Knowledge graph
→ Explainable Science
```

## Phase 3 — Intelligence
```
→ AI Coach assistant
→ Predictive analytics
→ Risk prediction
→ Automated insights
```

## Phase 4 — Marketplace & Academy
```
→ Plan marketplace
→ Coach academy
→ Certifications
→ Knowledge base
```

## Phase 5 — Enterprise
```
→ White label
→ SSO
→ Public API
→ Multi-organization
```

---

# 15. Matriz de Responsabilidades (RACI)

| Feature | Product | Engineering | Design | Science |
|---------|---------|-------------|--------|---------|
| Authentication | A | R | I | I |
| Coach Workflow | R | A | R | I |
| Athlete Workflow | R | A | R | I |
| Training Load | C | R | I | A |
| Integrations | C | R | I | I |
| Marketplace | R | A | R | I |
| Science Engine | I | R | I | A |
| AI Assistant | I | R | I | A |
| Analytics | R | A | R | C |

R = Responsible | A = Accountable | C = Consulted | I = Informed

---

# Conclusão

PACERUNPRO é uma aplicação web moderna, bem estruturada, com clara separação de concerns entre frontend, backend e dados. Possui 43 modelos de dados, 96+ endpoints de API, suporte a múltiplas integrações e mecanismos robusto de autenticação.

A arquitetura é escalável, com padrões bem definidos de autenticação (JWT), autorização (RBAC), e comunicação de dados (REST + Webhooks). O sistema está pronto para evolução rumo a capacidades avançadas de ciência do esporte e inteligência artificial.

**Status:** Funcional para MVP | **Qualidade:** Boa | **Documentação:** Necessária

---

**Gerado em:** 2026-07-08  
**Versão:** 0.1.0
