# UI INVENTORY — PACERUNPRO v0.1.0

**Data:** 2026-07-08  
**Status:** Inventário Completo de Componentes  
**Versão:** 0.1.0  
**Escopo:** src/app + src/components

---

# Executive Summary

Inventário completo da interface de usuário com **32+ páginas**, **40+ componentes**, **15+ formulários**, **8+ tabelas**, **3 dashboards principais** e **6+ modais**.

| Categoria | Quantidade | Status |
|-----------|-----------|--------|
| Páginas | 32 | ✅ Mapeadas |
| Componentes | 40+ | ✅ Inventariados |
| Formulários | 15+ | ✅ Identificados |
| Tabelas | 8+ | ✅ Listadas |
| Dashboards | 3 | ✅ Documentados |
| Modais | 6+ | ✅ Catalogados |
| Menus | 3 | ✅ Mapeados |

---

# 1. Páginas Principais (32 Total)

## 1.1 Public Pages (7 páginas)

### Landing & Public Screens

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Landing Page** | `/` | Hero, Features, Pricing, Testimonials, CTA | Homepage com proposta de valor |
| **Login** | `/login` | Login Form, Social Auth, Link Recuperar Senha | Autenticação de usuários |
| **Registro** | `/cadastro` | Registration Form, Email Verification | Criação de conta |
| **Recuperar Senha** | `/recuperar-senha` | Email Input Form | Solicitar link de reset |
| **Reset Senha** | `/redefinir-senha/[token]` | New Password Form | Redefinir password com token |
| **Termos** | `/termos` | Static Content | Termos de serviço |
| **Privacidade** | `/privacidade` | Static Content | Política de privacidade |

---

## 1.2 Coach Pages — Public Profile (1 página)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Coach Profile** | `/p/[slug]` | Coach Info, Planos, Especialidades, Testimonials | Vitrine pública do coach |

---

## 1.3 Onboarding Flow (4 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Onboarding Intro** | `/onboarding` | Intro Flow, CTA Buttons | Guia inicial |
| **Select Coach** | `/onboarding/assessoria` | Option Grid, Coach Cards | Escolher assessoria |
| **PAR-Q Questionnaire** | `/anamnese` | Form PAR-Q, Medical Questions | Questionário de saúde |
| **Assessment Quiz** | `/quiz` | Quiz Form, Goal Selection | Quiz de profile |

---

## 1.4 Checkout & Subscription (3 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Subscription Page** | `/assinar` | Plan Cards, Selection, CTA | Escolher plano |
| **Checkout** | `/checkout` | Cart, Payment Form, Summary | Carrinho de compras |
| **Checkout Success** | `/checkout/sucesso` | Success Message, Next Steps | Confirmação de pagamento |

---

## 1.5 Marketplace (2 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Marketplace** | `/loja` | Plan Grid, Search, Filter, Sort | Listar planos à venda |
| **Plan Detail** | `/loja/[slug]` | Plan Detail, Reviews, CTA | Detalhe de plano |

---

## 1.6 Invite (1 página)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Invite Link** | `/convite` | Coach Info, CTA Join | Página de convite |

---

## 1.7 Page Redirect (1 página)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Dashboard Redirect** | `/painel` | Router, Loading | Redirecionamento inteligente |

---

## 1.8 Error Pages (3 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Error Boundary** | `/error` | Error Message, Retry | Tratamento de erros |
| **404 Not Found** | `/not-found` | 404 Message, Home Link | Página não encontrada |
| **Loading Skeleton** | `/loading` | Skeleton Screen | Estado de carregamento |

---

## 1.9 Admin Pages (7 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Admin Dashboard** | `/admin` | Dashboard Overview, Stats | Visão geral administrativa |
| **Approvals** | `/admin/aprovacoes` | Approval List, Review Panel | Aprovar upgrades |
| **Coaches List** | `/admin/assessorias` | Table, Filters, Actions | Gerenciar coaches |
| **Athletes List** | `/admin/atletas` | Table, Filters, Status | Listar atletas |
| **Subscriptions** | `/admin/assinaturas` | Table, Filters, Status | Gerenciar assinaturas |
| **Financial** | `/admin/financeiro` | Charts, Reports, Filters | Relatório financeiro |
| **Vouchers** | `/admin/vouchers` | Table, Create, Edit | Gerenciar vouchers |

---

## 1.10 Athlete Dashboard (18 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Dashboard** | `/atleta/dashboard` | Cards, Charts, Workout Overview | Tela inicial atleta |
| **Calendar** | `/atleta/calendario` | Calendar Grid, Workout Indicators | Calendário de treinos |
| **Workout of the Day** | `/atleta/treino` | Workout Details, Execute Button | Treino do dia |
| **Strength Workouts** | `/atleta/forca` | Grid, Cards, Status Badges | Lista de força |
| **Strength Detail** | `/atleta/forca/[id]` | Workout Blocks, Exercise Details | Detalhe de força |
| **Execute Strength** | `/atleta/forca/[id]/executar` | Exercise List, Log, RFP Input | Executar força |
| **Structured Workout** | `/atleta/forca/treino/[id]` | Block Editor, Exercise List | Detalhe treino estruturado |
| **Evolution** | `/atleta/evolucao` | Charts, Metrics, Trends | Gráficos de evolução |
| **Activity History** | `/atleta/atividade` | Activity Feed, List, Filters | Histórico de atividades |
| **Activity Detail** | `/atleta/atividade/[logId]` | Workout Summary, Map, Comments | Detalhe de atividade |
| **Timeline** | `/atleta/timeline` | Timeline Events, Filters | Timeline de eventos |
| **Community** | `/atleta/comunidade` | Feed, Posts, Comments, Likes | Feed social |
| **Performance Tests** | `/atleta/testes` | Test Form, Results, History | Registrar testes |
| **Races** | `/atleta/provas` | Race List, Add, Edit | Histórico de provas |
| **Plans Available** | `/atleta/planos` | Plan Grid, Purchase CTA | Planos disponíveis |
| **Profile** | `/atleta/perfil` | Profile Form, Avatar Upload | Editar perfil |
| **Weekly Analysis** | `/atleta/analise-semanal` | Charts, Stats, Recommendations | Análise semanal |
| **AI Coach** | `/atleta/ia-treinadora` | Chat Interface, Messages | Chat com IA |

---

## 1.11 Coach Dashboard (22 páginas)

| Página | Rota | Componentes Principais | Funcionalidade |
|--------|------|----------------------|-----------------|
| **Dashboard** | `/treinador/dashboard` | Overview Cards, Athlete List, Alerts | Visão geral coach |
| **Athletes List** | `/treinador/atletas` | Table, Search, Filter, Actions | Gerenciar atletas |
| **Athlete Detail** | `/treinador/atletas/[id]` | Profile, Stats, Training Plans | Detalhe do atleta |
| **Invite Athlete** | `/treinador/atletas/convidar` | Invite Form, Email Input | Convidar atleta |
| **Alerts** | `/treinador/alertas` | Alert List, Risk Indicators | Alertas de risco |
| **Weekly Analysis** | `/treinador/analise-semanal` | Charts, Table, Recommendations | Análise de carga |
| **Calendar** | `/treinador/calendario` | Calendar Grid, Drag-drop, Release | Calendário com liberação |
| **Prescription — Run** | `/treinador/prescricao/corrida` | Workout Builder, Templates | Prescrever corrida |
| **Prescription — Strength** | `/treinador/prescricao/forca` | Block Editor, Exercise Picker | Prescrever força |
| **Prescription — Periodization** | `/treinador/prescricao/periodizacao` | Cycle Builder, Phase Planner | Montar ciclos |
| **Library** | `/treinador/biblioteca` | Exercise Grid, Videos, Templates | Exercícios e templates |
| **Zone Configuration** | `/treinador/configuracoes/zonas` | Zone Model Editor, Form | Configurar zonas |
| **Teams** | `/treinador/grupos` | Team List, Add Members, Manage | Gerenciar times |
| **CRM Leads** | `/treinador/crm` | Lead Table, Stage Tracking | Leads de prospecção |
| **Store — Marketplace** | `/treinador/loja` | Store Overview, Stats | Dashboard da loja |
| **Store — My Plans** | `/treinador/loja-planos` | Plan Grid, Create, Edit | Criar/editar planos |
| **Store — Products** | `/treinador/minha-loja` | Product Table, Publish, Edit | Gerenciar produtos |
| **Store — Pricing** | `/treinador/planos-venda` | Plan List, Price Edit | Planos de venda |
| **Vouchers** | `/treinador/vouchers` | Voucher Manager, Create | Gerenciar vouchers |
| **Financial** | `/treinador/financeiro` | Dashboard, Charts, Reports | Relatório financeiro |
| **Profile** | `/treinador/perfil` | Profile Form, Avatar Upload | Editar perfil |
| **System Help** | `/treinador/conheca-o-sistema` | Documentation, Guides | Ajuda do sistema |

---

# 2. Componentes (40+)

## 2.1 UI Components (8 - shadcn/ui)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Avatar** | `components/ui/avatar.tsx` | src, alt, fallback | Fotos de perfil |
| **Badge** | `components/ui/badge.tsx` | variant, children | Labels, status |
| **Button** | `components/ui/button.tsx` | variant, size, disabled | Botões de ação |
| **Card** | `components/ui/card.tsx` | CardHeader, CardContent | Containers |
| **Dialog** | `components/ui/dialog.tsx` | open, onOpenChange | Modais genéricos |
| **Tabs** | `components/ui/tabs.tsx` | value, onValueChange | Abas/tabs |
| **Progress** | `components/ui/progress.tsx` | value, max | Barras de progresso |
| **Info Tooltip** | `components/ui/info-tooltip.tsx` | content, trigger | Tooltips informativos |

---

## 2.2 Dashboard Components (2)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Stat Card** | `components/dashboard/stat-card.tsx` | label, value, change | Cartão de estatística |
| **Workout Card** | `components/dashboard/workout-card.tsx` | workout, status | Card de treino |

---

## 2.3 Coach Components (6)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Athlete Calendar** | `components/coach/athlete-calendar.tsx` | workouts, onSelect | Calendário de atleta |
| **Training Load Panel** | `components/coach/training-load-panel.tsx` | ctl, atl, tsb | Painel de carga |
| **Weekly Release Dialog** | `components/coach/weekly-release-dialog.tsx` | week, onRelease | Diálogo de liberação |
| **Workout Block Editor** | `components/coach/workout-block-editor.tsx` | blocks, onChange | Editor de blocos |
| **Delete Buttons** | `components/coach/delete-buttons.tsx` | onConfirm | Botões de deleção |
| **Onboarding Steps** | `components/coach/onboarding-steps.tsx` | currentStep | Passos de setup |

---

## 2.4 Charts Components (2)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Trend Chart** | `components/charts/trend-chart.tsx` | data, metric | Gráfico de tendência |
| **Splits Chart** | `components/charts/splits-chart.tsx` | splits, pace | Gráfico de splits |

---

## 2.5 Layout Components (3)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **App Shell** | `components/layout/app-shell.tsx` | children | Shell principal da app |
| **Bottom Nav** | `components/layout/bottom-nav.tsx` | currentPath | Navegação inferior |
| **Nav Config** | `components/layout/nav-config.ts` | (config data) | Configuração de rotas |

---

## 2.6 Landing Components (4)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Pricing Section** | `components/landing/pricing-section.tsx` | plans | Seção de preços |
| **Platform Showcase** | `components/landing/platform-showcase.tsx` | features | Showcase de recursos |
| **Comparison Table** | `components/landing/comparison-table.tsx` | plans | Tabela comparativa |
| **About Coach** | `components/landing/about-coach.tsx` | coaches | Seção sobre coaches |

---

## 2.7 Shared Components (2)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Access Restricted** | `components/shared/access-restricted.tsx` | requiredRole | Acesso denegado |
| **Section Header** | `components/shared/section-header.tsx` | title, action | Cabeçalho de seção |

---

## 2.8 Interaction Components (5+)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Cookie Consent** | `components/cookie-consent.tsx` | onAccept | Banner de cookies |
| **Theme Toggle** | `components/theme-toggle.tsx` | onChange | Alternador light/dark |
| **Logo** | `components/logo.tsx` | size | Logo PACERUNPRO |
| **Particle Burst** | `components/particle-burst.tsx` | position | Animação de partículas |
| **Check-in Scale Input** | `components/checkin/scale-input.tsx` | value, onChange | Input de escala 0-10 |

---

## 2.9 Feature-Specific Components (5+)

| Componente | Caminho | Props Principais | Uso |
|-----------|--------|-----------------|-----|
| **Workout Log Comments** | `components/workout-log-comments.tsx` | logId, comments | Comentários de treino |
| **Workout Share Modal** | `components/workout-share-modal.tsx` | workoutId, onShare | Modal de compartilhamento |
| **Voucher Manager** | `components/vouchers/voucher-manager.tsx` | onVoucherCreated | Gerenciador de vouchers |
| **Onboarding Grid** | `components/onboarding/option-grid.tsx` | options, onSelect | Grid de seleção |

---

# 3. Formulários (15+)

## 3.1 Authentication Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Login Form** | `/login` | Email, Password | Email unique, Password strength |
| **Register Form** | `/cadastro` | Email, Name, Password, Confirm Password | Email unique, LGPD consent |
| **Forgot Password** | `/recuperar-senha` | Email | Email exists |
| **Reset Password** | `/redefinir-senha/[token]` | New Password, Confirm Password | Token valid, Password strength |

---

## 3.2 Athlete Profile Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Profile Edit** | `/atleta/perfil` | Name, Email, Phone, City, State, Bio | Email unique, Phone format |
| **PAR-Q Questionnaire** | `/anamnese` | Medical Questions (20+), Acceptance | Required, Timestamp |
| **Profile Quiz** | `/quiz` | Goal, Level, Availability, Injury History | Required |
| **Performance Test** | `/atleta/testes` | Test Type, Date, Distance, Duration, HR | Type-specific validation |
| **Race Registration** | `/atleta/provas` | Name, Date, Distance, Goal Time | Date > today |

---

## 3.3 Coach Profile Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Coach Profile** | `/treinador/perfil` | Name, Bio, Public Bio, Specialties, Logo | URL valid |
| **Billing Setup** | `/treinador/financeiro` | Razão Social, CPF/CNPJ, PIX Key, Bank Acc | CPF/CNPJ format |

---

## 3.4 Workout Prescription Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Run Workout** | `/treinador/prescricao/corrida` | Type, Distance, Duration, Pace, RFP, Notes | Type required |
| **Strength Workout** | `/treinador/prescricao/forca` | Exercise, Sets, Reps, Load, Rest, RFP | Exercise required |
| **Periodization** | `/treinador/prescricao/periodizacao` | Macrocycle, Phases, Duration, Goals | Dates valid |

---

## 3.5 Plan & Product Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Create Plan** | `/treinador/loja-planos` | Title, Description, Price, Duration | Price > 0 |
| **Edit Plan** | `/treinador/minha-loja` | (same as above) | (same as above) |
| **Voucher Create** | `/treinador/vouchers` | Code, Type, Value, Audience, Expiry | Code unique |

---

## 3.6 Check-in Forms

| Formulário | Localização | Campos | Validação |
|-----------|-----------|--------|----------|
| **Daily Check-in** | `/atleta/dashboard` | RPE, Sleep, Fatigue, Mood, Pain, Stress | Range 0-10 |

---

# 4. Tabelas (8+)

## 4.1 Admin Tables

| Tabela | Página | Colunas | Ações | Filtros |
|--------|--------|---------|-------|---------|
| **Athletes Table** | `/admin/atletas` | ID, Name, Email, Status, Coach, Created | View, Edit, Ban | Status, Coach |
| **Coaches Table** | `/admin/assessorias` | ID, Name, Plan, Athletes, Revenue | Approve, View | Plan, Status |
| **Subscriptions Table** | `/admin/assinaturas` | User, Plan, Status, Started, Renews | Cancel, View | Status, Plan |
| **Vouchers Table** | `/admin/vouchers` | Code, Type, Value, Uses, Expires | Edit, Deactivate | Status, Expires |

---

## 4.2 Coach Tables

| Tabela | Página | Colunas | Ações | Filtros |
|--------|--------|---------|-------|---------|
| **Athletes Table** | `/treinador/atletas` | Name, Status, Load, Adherence, Last Activity | View, Edit, Remove | Status, Adherence |
| **Leads Table** | `/treinador/crm` | Name, Email, Source, Stage, Date | Edit, Convert, Delete | Stage, Source |
| **Weekly Workouts** | `/treinador/analise-semanal` | Athlete, Load, RPE, Completed | View, Edit, Release | Load Range, Status |

---

## 4.3 Athlete Tables

| Tabela | Página | Colunas | Ações | Filtros |
|--------|--------|---------|-------|---------|
| **Performance Tests** | `/atleta/testes` | Test Type, Date, Result, VO2Max | Edit, Delete | Type, Date |
| **Races** | `/atleta/provas` | Name, Date, Distance, Goal, Result | Edit, Delete | Year, Upcoming |

---

# 5. Dashboards (3 Principais)

## 5.1 Athlete Dashboard (`/atleta/dashboard`)

```
┌─────────────────────────────────────────────────────────┐
│ ATHLETE DASHBOARD                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Quick Stats]                                          │
│  ┌─────────────┬─────────────┬──────────────┐           │
│  │ Form (TSB)  │ Fitness     │ Fatigue (ATL)│           │
│  │ (Green)     │ (Blue)      │ (Red)        │           │
│  └─────────────┴─────────────┴──────────────┘           │
│                                                          │
│  [Workout of Today Card]                                │
│  ┌────────────────────────────────────────┐             │
│  │ RODAGEM LEVE — 8km @ Z2                │             │
│  │ Liberar  |  Ver Detalhes               │             │
│  └────────────────────────────────────────┘             │
│                                                          │
│  [CTL/ATL/TSB Chart]                                    │
│  ├─ Linha azul (CTL)                                    │
│  ├─ Linha laranja (ATL)                                 │
│  └─ Linha verde (TSB)                                   │
│                                                          │
│  [Recent Activities]                                    │
│  ├─ 30 ago: Corrida de 12km (manual)                    │
│  ├─ 28 ago: Treino de força (Strava)                    │
│  └─ [Ver mais...]                                       │
│                                                          │
│  [CTA Sections]                                         │
│  ├─ Registre seus sentimentos                           │
│  ├─ Veja seu plano de treino                            │
│  └─ Explore análises                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Componentes:** StatCard, WorkoutCard, TrendChart, ActivityFeed, CTA Cards
**Dados:** CTL, ATL, TSB, Last Workout, Recent Activities
**Ações:** Start Workout, Logging Check-in, View Details

---

## 5.2 Coach Dashboard (`/treinador/dashboard`)

```
┌─────────────────────────────────────────────────────────┐
│ COACH DASHBOARD                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Overview Stats]                                       │
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │ Athletes: 24 │ In Risk: 3   │ Revenue: R$  │         │
│  │              │              │ 12.500       │         │
│  └──────────────┴──────────────┴──────────────┘         │
│                                                          │
│  [Risk Alerts]                                          │
│  ┌──────────────────────────────────────┐               │
│  │ 🔴 João — High fatigue (ATL > 85%)   │               │
│  │ 🟡 Maria — Missed 2 workouts         │               │
│  │ 🟢 Pedro — On track                  │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [Athletes Overview Table]                              │
│  ├─ Name | Status | Load | RPE | Last Activity         │
│  ├─ João | Risco | 120  | 8   | 2 dias atrás          │
│  ├─ Maria | Ativo | 95  | 6   | Hoje                   │
│  └─ [Ver todos...]                                      │
│                                                          │
│  [This Week Overview]                                   │
│  ├─ Workouts Prescribed: 142                            │
│  ├─ Completed: 128 (90%)                                │
│  └─ Missing: 14                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Componentes:** StatCard, AlertsList, AthletesTable, WeeklyChart, ActionCenter
**Dados:** Athlete Count, Risk Alerts, Weekly Load, Adherence %
**Ações:** View Athlete, Release Workouts, Send Alert

---

## 5.3 Admin Dashboard (`/admin`)

```
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Platform Metrics]                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Total    │ Active   │ MRR      │ Churn    │          │
│  │ Users:   │ Coaches: │ BRL      │ Rate:    │          │
│  │ 5.234    │ 127      │ 48.500   │ 5.2%     │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
│                                                          │
│  [Revenue Chart]                                        │
│  ├─ MRR Trend (últimos 12 meses)                       │
│  ├─ AR (Atletas) vs BR (Coaches)                        │
│  └─ Forecast                                            │
│                                                          │
│  [Recent Approvals]                                     │
│  ├─ 3 coaches pending approval                          │
│  ├─ 12 payment issues                                   │
│  └─ [Action Required]                                   │
│                                                          │
│  [System Health]                                        │
│  ├─ API: ✅ Operational                                 │
│  ├─ Database: ✅ Healthy                                │
│  ├─ Webhooks: ⚠️ 2 failures                             │
│  └─ Storage: ✅ 45% used                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Componentes:** StatCard, RevenueChart, ApprovalsPanel, HealthStatus
**Dados:** Total Users, MRR, Churn, Health Metrics
**Ações:** Approve, Reject, View Logs

---

# 6. Modais (6+)

## 6.1 Workout & Training Modals

| Modal | Trigger | Conteúdo | Ações |
|-------|---------|----------|-------|
| **Weekly Release** | Calendar cell | Workouts to release | Release, Cancel |
| **Workout Details** | Workout card | Full workout info | Edit, Delete, Execute |
| **Share Workout** | Activity detail | Social share options | Share, Copy, Close |
| **Block Editor** | Strength workout | Edit exercises | Add, Remove, Save |

---

## 6.2 User & Settings Modals

| Modal | Trigger | Conteúdo | Ações |
|-------|---------|----------|-------|
| **Delete Confirmation** | Delete button | Confirm message | Delete, Cancel |
| **Coach Invite** | Add athlete | Email form | Send, Cancel |

---

# 7. Menus & Navigation

## 7.1 Main Navigation Menu

### Top Navigation (Desktop)

```
┌─────────────────────────────────────────────────────┐
│ LOGO  Dashboard  Workouts  Analytics  Settings ▼   │
└─────────────────────────────────────────────────────┘
```

**Items:**
- Logo (Home link)
- Dashboard
- Workouts / Prescricao
- Analytics
- Settings
- User Avatar (Dropdown)

---

### User Dropdown Menu

```
┌──────────────────┐
│ Perfil           │
│ Configurações    │
│ Ajuda            │
│ ──────────────   │
│ Sair (Sign out)  │
└──────────────────┘
```

---

### Bottom Navigation (Mobile)

```
┌─────────────────────────────────────────────────┐
│ 🏠      📅      📊      ⚙️      👤            │
│ Home  Calendar  Stats Settings Profile         │
└─────────────────────────────────────────────────┘
```

**Mobile Only:**
- Home / Dashboard
- Calendar
- Statistics
- Settings
- Profile

---

## 7.2 Sidebar Navigation (Coach)

```
COACH NAVIGATION
├─ Dashboard
├─ Atletas
│  ├─ Listar
│  └─ Convidar
├─ Prescrição
│  ├─ Corrida
│  ├─ Força
│  └─ Periodização
├─ Biblioteca
│  ├─ Exercícios
│  └─ Templates
├─ Loja
│  ├─ Meus Planos
│  ├─ Produtos
│  └─ Vouchers
├─ Financeiro
│  ├─ Dashboard
│  └─ Configurações
├─ Alertas
├─ Grupos
├─ CRM
└─ Configurações
```

---

## 7.3 Sidebar Navigation (Athlete)

```
ATHLETE NAVIGATION
├─ Dashboard
├─ Calendario
├─ Treino
├─ Força
├─ Evolução
├─ Atividades
├─ Timeline
├─ Comunidade
├─ Testes
├─ Provas
├─ Planos
├─ IA Treinadora
└─ Perfil
```

---

# 8. Detailed Component Breakdown

## 8.1 Forms in Detail

### Login Form

```
Fields:
  - Email [text input]
  - Password [password input]
  - "Esqueceu a senha?" [link]
  - "Entrar com Google" [OAuth button]
  
Validation:
  - Email required + valid format
  - Password required
  - Error messages inline
```

---

### Workout Prescription Form (Run)

```
Tabs:
  ├─ Básico
  │  ├─ Date [date picker]
  │  ├─ Type [select: RODAGEM_LEVE, etc.]
  │  ├─ Title [text input]
  │  └─ Status [select: AGENDADO, etc.]
  │
  ├─ Targets
  │  ├─ Distance [number input]
  │  ├─ Duration [time input]
  │  ├─ Pace [select or input]
  │  ├─ HR Zone [select]
  │  └─ RPE [number 0-10]
  │
  ├─ Descrição
  │  ├─ Objective [textarea]
  │  ├─ Warmup [textarea]
  │  ├─ Main Set [textarea]
  │  ├─ Cooldown [textarea]
  │  └─ Notes [textarea]
  │
  └─ Media
     ├─ Video URL [input]
     ├─ Image [file upload]
     └─ Preview
```

---

### Strength Workout Builder

```
Layout:
  ├─ Select Athlete
  ├─ Select Template or Blank
  │
  ├─ Block List (Sortable)
  │  ├─ Block 1
  │  │  ├─ Exercise [searchable select]
  │  │  ├─ Sets [number]
  │  │  ├─ Reps [text: "10-12", "30s"]
  │  │  ├─ Load [text: "60% 1RM"]
  │  │  ├─ Rest [seconds]
  │  │  ├─ RPE [0-10]
  │  │  └─ [Delete]
  │  │
  │  └─ Block 2...
  │
  ├─ [+ Add Block]
  └─ [Save] [Cancel]
```

---

# 9. Charts & Data Visualization

## 9.1 Training Load Chart

```
CTL/ATL/TSB Over Time
├─ X-axis: Date (last 90 days)
├─ Y-axis: Load (0-150)
├─ Lines:
│  ├─ CTL (blue) — Chronic Load
│  ├─ ATL (orange) — Acute Load
│  └─ TSB (green) — Training Stress Balance
└─ Hover: Show exact values + recommendation
```

---

## 9.2 Performance Evolution Chart

```
Athlete Metrics
├─ Metric selector: VO2Max, Pace, HR, etc.
├─ Time range: 3 months, 6 months, 1 year
├─ Line chart with trend line
└─ Min/max/avg values shown
```

---

## 9.3 Pace & Splits Chart

```
Activity Splits
├─ X-axis: Distance (km)
├─ Y-axis: Pace (min/km)
├─ Bar chart: Each split's pace
└─ Avg pace line overlay
```

---

# 10. Icons & Visual Elements

## 10.1 Icons Used (Lucide React)

```
Navigation:
├─ Home, Settings, Users, Menu
└─ ChevronRight, ChevronLeft, Menu

Actions:
├─ Plus, Edit, Delete, Save
├─ Download, Upload, Share
└─ Search, Filter, Sort

Status:
├─ Check, X, AlertTriangle, Info
├─ CheckCircle2, AlertCircle
└─ Clock, Lock, Unlock

Sports:
├─ Activity, Dumbbell, HeartPulse
├─ TrendingUp, BarChart2
└─ Calendar, MapPin

Social:
├─ Heart, MessageCircle, Share2
└─ User, Users, Building2
```

---

# 11. Color Scheme & Theming

## 11.1 Design Tokens

```
Primary Colors:
├─ Primary: #3B82F6 (Blue)
├─ Secondary: #10B981 (Green)
├─ Accent: #F59E0B (Amber)
└─ Danger: #EF4444 (Red)

Status Colors:
├─ Success: #10B981 (Green)
├─ Warning: #F59E0B (Amber)
├─ Error: #EF4444 (Red)
└─ Info: #3B82F6 (Blue)

Neutral:
├─ Light: #F9FAFB
├─ Medium: #E5E7EB
├─ Dark: #374151
└─ Darkest: #1F2937

Training Zones:
├─ Zone 1 (Easy): #A1E03A
├─ Zone 2 (Endurance): #3B82F6
├─ Zone 3 (Threshold): #FBBF24
├─ Zone 4 (Tempo): #F97316
└─ Zone 5 (Max): #EF4444
```

---

## 11.2 Theme Support

```
Light Mode (Default):
├─ Background: White (#FFFFFF)
├─ Text: Dark (#1F2937)
└─ Cards: Light gray (#F9FAFB)

Dark Mode:
├─ Background: Dark (#111827)
├─ Text: Light (#F3F4F6)
└─ Cards: Dark gray (#1F2937)

Toggle: Header right corner
```

---

# 12. Accessibility Features

## 12.1 WCAG Compliance

```
✅ Semantic HTML
✅ ARIA labels
✅ Keyboard navigation
✅ Color contrast > 4.5:1
✅ Focus indicators
✅ Screen reader support
✅ Form validation messages
✅ Error descriptions
```

---

# 13. Responsive Breakpoints

```
Mobile: < 640px
├─ Single column layout
├─ Bottom navigation
└─ Full-width cards

Tablet: 640px - 1024px
├─ 2-column grid
├─ Side drawer nav
└─ Adjusted padding

Desktop: > 1024px
├─ 3-4 column grid
├─ Sidebar navigation
└─ Full layouts
```

---

# 14. Performance & Loading States

## 14.1 Skeleton Screens

```
Dashboard Skeleton:
├─ Stat card skeletons (3x)
├─ Chart skeleton
├─ Table skeleton
└─ Activity list skeletons
```

---

## 14.2 Loading Indicators

```
Types:
├─ Spinner (small actions)
├─ Progress bar (file uploads)
├─ Skeleton (data loading)
└─ Pulse animation (real-time)
```

---

# 15. Inventory Summary

## 15.1 Component Count by Category

```
UI Primitives:        8 components
  ├─ Avatar, Badge, Button, Card
  ├─ Dialog, Tabs, Progress, Tooltip

Dashboard:           2 components
  ├─ StatCard, WorkoutCard

Coach Features:      6 components
  ├─ AthleteCalendar, TrainingLoadPanel
  ├─ WeeklyReleaseDialog, WorkoutBlockEditor
  ├─ DeleteButtons, OnboardingSteps

Charts:             2 components
  ├─ TrendChart, SplitsChart

Layout:             3 components
  ├─ AppShell, BottomNav, NavConfig

Landing:            4 components
  ├─ PricingSection, PlatformShowcase
  ├─ ComparisonTable, AboutCoach

Shared:             2 components
  ├─ AccessRestricted, SectionHeader

Interaction:        5+ components
  ├─ CookieConsent, ThemeToggle
  ├─ Logo, ParticleBurst, CheckInScaleInput

Feature-Specific:   5+ components
  ├─ WorkoutLogComments, WorkoutShareModal
  ├─ VoucherManager, OnboardingGrid

TOTAL:              ~40+ components
```

---

## 15.2 Page Count by Category

```
Public:              7 pages (/, /login, /cadastro, etc.)
Onboarding:          4 pages (/onboarding, /anamnese, /quiz)
Checkout:            3 pages (/checkout, /sucesso)
Marketplace:         2 pages (/loja, /loja/[slug])
Admin:               7 pages (/admin/*)
Athlete:            18 pages (/atleta/*)
Coach:              22 pages (/treinador/*)
Error:               3 pages (/error, /not-found, /loading)
Misc:                1 page (/convite, /painel)

TOTAL:              32+ pages
```

---

## 15.3 Forms by Category

```
Authentication:      4 forms
  ├─ Login, Register, Forgot Password, Reset

Athlete Profile:     5 forms
  ├─ Profile, PAR-Q, Quiz, Tests, Races

Coach Profile:       2 forms
  ├─ Profile, Billing

Workouts:            3 forms
  ├─ Run, Strength, Periodization

Plans:               3 forms
  ├─ Create, Edit, Voucher

Check-in:            1 form
  ├─ Daily Check-in

TOTAL:              15+ forms
```

---

## 15.4 Tables by Category

```
Admin:               4 tables
  ├─ Athletes, Coaches, Subscriptions, Vouchers

Coach:               3 tables
  ├─ Athletes, Leads, Weekly Workouts

Athlete:             2 tables
  ├─ Performance Tests, Races

TOTAL:              8+ tables
```

---

# 16. Known Gaps & TODOs

```
🟡 Missing Components:
  ├─ ❓ Notification Center (badge, dropdown)
  ├─ ❓ Search Bar (global search)
  ├─ ❓ Date Range Picker (advanced)
  ├─ ❓ Dropdown Select (for forms)
  ├─ ❓ Map/Location (activity visualization)
  └─ ❓ Export/Print (reports, plans)

🟡 Incomplete Pages:
  ├─ ❓ /treinador/admin (admin submenu)
  ├─ ❓ /treinador/relatorios (reports page)
  ├─ ❓ /treinador/gestao (management page)
  ├─ ❓ /treinador/white-label (customization)
  ├─ ❓ /atleta/previsao (forecasting)
  └─ ❓ /atleta/tenis (tennis-specific page)

🟡 Missing Features:
  ├─ ❓ Notifications dropdown (mobile)
  ├─ ❓ Search functionality (global)
  ├─ ❓ Filters on tables (advanced)
  ├─ ❓ Bulk actions (multi-select)
  ├─ ❓ Export/Import (CSV, Excel)
  └─ ❓ Audit logs (for admin)
```

---

# Conclusão

A UI está bem estruturada com componentes reutilizáveis, bom suporte mobile, e interfaces claras para os três papéis principais (Admin, Coach, Athlete). Faltam alguns componentes avançados (data picker, search, notificações) e algumas páginas de gerenciamento avançado.

**Próximos passos:**
1. Implementar componentes faltantes (Search, DateRangePicker)
2. Completar páginas em desenvolvimento (reports, gestão)
3. Adicionar notificações em tempo real
4. Melhorar modais com transições
5. Implementar confirmations globais

---

**Gerado em:** 2026-07-08  
**Versão:** 0.1.0  
**Status:** Inventário Completo ✅
