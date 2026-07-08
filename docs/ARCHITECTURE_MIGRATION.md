# ARCHITECTURE MIGRATION — PACERUNPRO to ENKY OS

**Data:** 2026-07-08  
**Status:** Análise Comparativa Completa  
**Versão:** 0.1.0  
**Current State:** PACERUNPRO v0.1.0  
**Target State:** ENKY OS v2.0  
**Total Gaps:** 35+ diferenças identificadas

---

# Executive Summary

Comparação entre arquitetura atual (PACERUNPRO) e arquitetura alvo (ENKY OS). A transição requer mudanças estruturais significativas, mas pode ser executada incrementalmente sem quebrar o sistema existente.

## 🎯 Status Geral

| Aspecto | PACERUNPRO (Atual) | ENKY OS (Alvo) | Gap | Criticidade |
|--------|-------------------|------------------|-----|-------------|
| **Modularidade** | 70% (app router) | 100% (module-based) | Média | P1 |
| **Domain-Driven Design** | 20% | 100% | Alta | P1 |
| **Event-Driven** | 0% | 100% | Alta | P1 |
| **CQRS Pattern** | 0% | 100% | Média | P2 |
| **Cache Strategy** | Ad-hoc | Systematic Redis | Média | P1 |
| **Queue System** | Nenhuma | Complete | Média | P1 |
| **Search Strategy** | PostgreSQL FTS | Pluggable (Meilisearch) | Baixa | P2 |
| **Science Engine** | Nenhuma | Core | CRÍTICA | P0 |
| **Decision Engine** | Nenhuma | Core | CRÍTICA | P0 |
| **Analytics Engine** | Parcial | Complete | Média | P1 |
| **Integration Pattern** | Direct APIs | Adapter Pattern | Média | P1 |
| **Observability** | Basic (Sentry) | Complete | Média | P2 |
| **Multi-tenancy** | Single tenant | Ready | Baixa | P3 |

---

# 1. ANÁLISE DETALHADA DE GAPS

## 1.1 Modularidade & Organization

### Current State (PACERUNPRO)

```
src/
├─ app/               (Next.js App Router)
│  ├─ admin/
│  ├─ anamnese/
│  ├─ atleta/
│  ├─ cadastro/
│  ├─ checkout/
│  ├─ convite/
│  ├─ login/
│  ├─ loja/
│  ├─ onboarding/
│  ├─ p/
│  ├─ painel/
│  ├─ quiz/
│  ├─ treinador/
│  └─ api/           (96+ endpoints)
├─ components/        (40+ UI components)
├─ context/          (2 contexts)
├─ hooks/            (Custom hooks)
├─ lib/              (Utilities)
├─ services/         (Business logic)
└─ types/            (TypeScript types)
```

**Issues:**
- 🔴 Sem modularização de domínio
- 🔴 API endpoints espalhados em `app/api`
- 🟡 Componentes genéricos, não separados por domínio
- 🔴 Sem organização por módulo de negócio

---

### Target State (ENKY OS)

```
modules/
├─ identity/
│  ├─ domain/          (Entities, Value Objects)
│  ├─ application/     (Use Cases, DTOs)
│  ├─ infrastructure/  (Repositories, Adapters)
│  ├─ presentation/    (Pages, Components)
│  └─ tests/
├─ coach/
│  ├─ domain/
│  ├─ application/
│  ├─ infrastructure/
│  ├─ presentation/
│  └─ tests/
├─ athlete/
│  └─ (mesma estrutura)
├─ assessment/
│  └─ (mesma estrutura)
├─ training/
│  └─ (mesma estrutura)
├─ science/           (⭐ NEW - Core Engine)
│  └─ (mesma estrutura)
├─ analytics/
│  └─ (mesma estrutura)
├─ marketplace/
│  └─ (mesma estrutura)
├─ academy/           (Futuro)
│  └─ (mesma estrutura)
├─ integrations/      (⭐ NEW - Adapter Pattern)
│  ├─ garmin/
│  ├─ strava/
│  ├─ coros/
│  └─ adapters/
├─ admin/
│  └─ (mesma estrutura)
└─ platform/          (⭐ NEW - Cross-cutting)
   ├─ auth/
   ├─ notifications/
   ├─ search/
   └─ cache/
```

---

### Gap Analysis

| Diferença | Impacto | Prioridade | Esforço | Risco |
|-----------|---------|-----------|---------|-------|
| Criar modularidade por domínio | ALTO | P1 | 8 weeks | MÉDIO |
| Separar concerns por camada | ALTO | P1 | 6 weeks | MÉDIO |
| Mover API para module structure | ALTO | P1 | 4 weeks | MÉDIO |
| Reorganizar componentes por domínio | MÉDIO | P1 | 3 weeks | BAIXO |

---

## 1.2 Domain-Driven Design (DDD)

### Current State

```typescript
// PACERUNPRO: Sem DDD explícito
// Exemplo: Athlete como DTO + Prisma model

// prisma/schema.prisma
model Athlete {
  id: String @id
  userId: String @unique
  birthDate: DateTime?
  sex: String?
  level: String // Should be ENUM
  // ... 15 more fields
}

// services/athlete-service.ts
export async function updateAthlete(id, data) {
  return prisma.athlete.update({
    where: { id },
    data: data // No validation!
  });
}

// Problemas:
// ❌ Sem entities/aggregates
// ❌ Sem value objects
// ❌ Sem domain rules
// ❌ Sem specifications
// ❌ Sem domain events
```

---

### Target State (ENKY OS)

```typescript
// ENKY: Full DDD

// modules/athlete/domain/athlete.ts
export class Athlete extends AggregateRoot {
  private _id: AthletId;
  private _userId: UserId;
  private _profile: AthleteProfile; // Value Object
  private _performance: Performance; // Value Object
  private _status: AthleteStatus; // Enum
  
  static create(
    userId: UserId,
    profile: AthleteProfile,
    status: AthleteStatus
  ): Result<Athlete> {
    // Validation business rules
    if (!profile.isValid()) {
      return Result.fail('Invalid profile');
    }
    
    const athlete = new Athlete();
    athlete._userId = userId;
    athlete._profile = profile;
    athlete._status = status;
    
    // Domain event
    athlete.addDomainEvent(
      new AthleteCreated(athlete._id, userId)
    );
    
    return Result.ok(athlete);
  }
  
  updatePerformance(metrics: PerformanceMetrics): Result<void> {
    // Business rule: performance can only improve or stay same
    if (metrics.score < this._performance.score) {
      return Result.fail('Performance regression not allowed');
    }
    
    this._performance = metrics;
    this.addDomainEvent(
      new PerformanceUpdated(this._id, metrics)
    );
    
    return Result.ok();
  }
}

// modules/athlete/domain/athlete-repository.ts
export interface IAthleteRepository {
  save(athlete: Athlete): Promise<void>;
  findById(id: AthletId): Promise<Athlete | null>;
  findByUserId(userId: UserId): Promise<Athlete | null>;
}

// modules/athlete/application/create-athlete/create-athlete.command.ts
export class CreateAthleteCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly birthDate: Date,
    public readonly sex: Sex
  ) {}
}

// modules/athlete/application/create-athlete/create-athlete.handler.ts
export class CreateAthleteHandler
  implements ICommandHandler<CreateAthleteCommand>
{
  constructor(
    private repository: IAthleteRepository,
    private eventBus: IEventBus
  ) {}

  async execute(command: CreateAthleteCommand): Promise<Result<void>> {
    const userId = new UserId(command.userId);
    
    const profile = AthleteProfile.create(
      command.birthDate,
      command.sex
    );
    if (profile.isFailure) return Result.fail(profile.error);
    
    const athlete = Athlete.create(
      userId,
      profile.value,
      AthleteStatus.ACTIVE
    );
    if (athlete.isFailure) return Result.fail(athlete.error);
    
    await this.repository.save(athlete.value);
    
    // Publish domain events
    await this.eventBus.publishAll(athlete.value.domainEvents);
    
    return Result.ok();
  }
}

// modules/athlete/infrastructure/prisma-athlete.repository.ts
export class PrismaAthleteRepository implements IAthleteRepository {
  constructor(private db: PrismaClient) {}
  
  async save(athlete: Athlete): Promise<void> {
    const data = PrismaAthleteMapper.toPersistence(athlete);
    await this.db.athlete.upsert({
      where: { id: data.id },
      create: data,
      update: data
    });
  }
  
  async findById(id: AthletId): Promise<Athlete | null> {
    const raw = await this.db.athlete.findUnique({
      where: { id: id.value }
    });
    if (!raw) return null;
    return PrismaAthleteMapper.toDomain(raw);
  }
}

// modules/athlete/presentation/pages/athlete-profile.tsx
export default function AthleteProfile() {
  const { athleteId } = useParams();
  const { data: athlete } = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: async () => {
      // Calls application layer
      return await apiClient.get(`/api/athlete/${athleteId}`);
    }
  });
  
  return <AthleteProfileView athlete={athlete} />;
}
```

---

### Gap Analysis

| Item | Atual | Alvo | Esforço | Risco |
|------|-------|------|---------|-------|
| Entities & Aggregates | 0% | 100% | 8 weeks | ALTO |
| Value Objects | 0% | 100% | 6 weeks | ALTO |
| Domain Services | 20% | 100% | 4 weeks | MÉDIO |
| Specifications | 0% | 100% | 2 weeks | BAIXO |
| Domain Events | 0% | 100% | 4 weeks | MÉDIO |
| Repositories | 30% | 100% | 3 weeks | MÉDIO |

---

## 1.3 Event-Driven Architecture

### Current State (PACERUNPRO)

```
❌ Nenhum sistema de eventos
❌ Comunicação síncrona (REST)
❌ Sem message bus
❌ Sem event sourcing
❌ Sem replay capabilities

Exemplo atual:
1. API recebe update
2. Valida dados
3. Salva direto em Prisma
4. Retorna resposta
(sem eventos, sem cascata)
```

---

### Target State (ENKY OS)

```
✅ Event-Driven Architecture

Exemplo: Assessment Completed

1. Assessment Service
   └─ Commands: CompleteAssessment

2. Assessment Domain
   └─ Events: AssessmentCompleted
   
3. Event Bus (Message Queue)
   ├─ → Science Engine
   │  └─ Events: ScienceUpdated
   │
   ├─ → Decision Engine
   │  └─ Events: DecisionMade
   │
   ├─ → Recommendation Engine
   │  └─ Events: RecommendationGenerated
   │
   ├─ → Analytics Engine
   │  └─ Events: MetricsComputed
   │
   ├─ → Notification Engine
   │  └─ Events: NotificationCreated
   │
   └─ → Coaching Dashboard
      └─ Events: UIUpdated

Flow:
AssessmentCompleted
  ↓ [Event Bus]
  → ScienceEngine.Process()
      ↓
      ScienceUpdated
        ↓ [Event Bus]
        → DecisionEngine.Process()
            ↓
            DecisionMade
              ↓ [Event Bus]
              → RecommendationEngine.Process()
                  ↓
                  RecommendationGenerated
                    ↓ [Event Bus]
                    → [Cache Update]
                    → [Analytics Update]
                    → [Notification Send]
```

---

### Technology

```typescript
// Current: None
// Target: Bull + Redis (or similar)

import Queue from 'bull';

const eventQueue = new Queue('events', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Publish event
await eventQueue.add('assessment.completed', {
  assessmentId,
  athleteId,
  timestamp: new Date()
});

// Subscribe to events
eventQueue.process('assessment.completed', async (job) => {
  // Trigger Science Engine
  await scienceEngine.processAssessment(job.data);
  
  // Trigger Decision Engine
  await decisionEngine.analyzeAssessment(job.data);
  
  // Trigger Recommendations
  await recommendationEngine.generate(job.data);
});
```

---

### Gap Analysis

| Item | Impacto | Esforço | Risco | Criticidade |
|------|---------|---------|-------|------------|
| Message Queue Setup (Bull/Redis) | ALTO | 1 week | BAIXO | P1 |
| Event Bus Implementation | CRÍTICO | 2 weeks | MÉDIO | P0 |
| Domain Events (all modules) | CRÍTICO | 4 weeks | ALTO | P0 |
| Event Handlers (cascata lógica) | CRÍTICO | 6 weeks | ALTO | P0 |
| Event Sourcing (Futuro) | MÉDIO | TBD | TBD | P3 |

---

## 1.4 CQRS Pattern (Command Query Responsibility Segregation)

### Current State (PACERUNPRO)

```
❌ Sem separação de Read/Write
❌ Queries fazem updates
❌ Write models retornam dados
❌ Sem optimization para read

Exemplo:
// Bad: Mistura read e write
export async function getAthlete(id) {
  const athlete = await prisma.athlete.findUnique({ where: { id } });
  
  // Atualiza lastViewed (write inside read!)
  await prisma.athlete.update({
    where: { id },
    data: { lastViewed: new Date() }
  });
  
  return athlete;
}
```

---

### Target State (ENKY OS)

```
✅ Separação clara de Read/Write

// commands/create-athlete.command.ts
export class CreateAthleteCommand implements ICommand {
  constructor(userId: string, profile: AthleteProfile) {}
}

// command-handler: Atualiza banco
export class CreateAthleteHandler {
  async execute(cmd: CreateAthleteCommand): Promise<Result<void>> {
    // Apenas write
    await athleteRepository.save(athlete);
    return Result.ok();
  }
}

// queries/get-athlete.query.ts
export class GetAthleteQuery implements IQuery {
  constructor(public athleteId: string) {}
}

// query-handler: Apenas lê (read-optimized)
export class GetAthleteHandler implements IQueryHandler<GetAthleteQuery> {
  // Pode usar read replica
  // Pode usar cache
  // Pode usar view materializada
  
  async execute(query: GetAthleteQuery): Promise<AthleteDTO> {
    // Opção 1: Cache
    const cached = await cache.get(`athlete:${query.athleteId}`);
    if (cached) return cached;
    
    // Opção 2: Read replica
    const athlete = await readDb.athlete.findUnique({
      where: { id: query.athleteId }
    });
    
    await cache.set(`athlete:${query.athleteId}`, athlete);
    return athlete;
  }
}
```

---

### Benefits

- ✅ Queries podem ser otimizadas independentemente
- ✅ Suporta read replicas
- ✅ Suporta caching agressivo
- ✅ Permite materializar vistas
- ✅ Facilita busca (Elasticsearch, Meilisearch)

---

### Gap Analysis

| Item | Esforço | Criticidade |
|------|---------|------------|
| Command/Query Handlers | 3 weeks | P2 |
| Read Model Optimization | 2 weeks | P2 |
| Cache Layer | 2 weeks | P1 |
| Read Replicas (optional) | 3 weeks | P3 |

---

## 1.5 Science Engine & Decision Engine (NEW)

### Current State (PACERUNPRO)

```
❌ Nenhum Science Engine
❌ Nenhum Decision Engine
❌ Sem modelos fisiológicos
❌ Sem recomendações científicas
❌ Recomendações apenas de UI

Status: CRÍTICO - Não existe!
```

---

### Target State (ENKY OS)

```
✅ Science Engine (Core)

Responsabilidades:
├─ CTL (Chronic Training Load)
├─ ATL (Acute Training Load)
├─ TSB (Training Stress Balance)
├─ VO2Max estimation
├─ FTP prediction
├─ Heart Rate Zones
├─ Recovery Score
├─ Fatigue Index
├─ Load Distribution
└─ Proprietary Models

modules/science/
├─ domain/
│  ├─ models/
│  │  ├─ training-load.ts
│  │  ├─ recovery-model.ts
│  │  ├─ vo2max-model.ts
│  │  ├─ ftp-model.ts
│  │  └─ proprietary-models.ts
│  ├─ services/
│  │  └─ science.service.ts
│  └─ events/
│     └─ science-updated.event.ts
├─ application/
│  ├─ commands/
│  │  └─ calculate-training-load.command.ts
│  ├─ queries/
│  │  └─ get-athlete-metrics.query.ts
│  └─ handlers/
├─ infrastructure/
│  └─ repositories/
└─ tests/


✅ Decision Engine (Core)

Responsabilidades:
├─ Análise de risco (injury, burnout)
├─ Identificação de oportunidades
├─ Priorização de ajustes
├─ Necessidade de reassessment
├─ Load adjustment recommendations
├─ Recovery protocol selection
└─ Intervention prioritization

modules/decision/
├─ domain/
│  ├─ models/
│  │  ├─ risk-analysis.ts
│  │  ├─ opportunity-detection.ts
│  │  └─ intervention-prioritizer.ts
│  └─ services/
│     └─ decision.service.ts
├─ application/
│  ├─ commands/
│  │  └─ analyze-athlete.command.ts
│  └─ queries/
│     └─ get-recommendations.query.ts
└─ infrastructure/
```

---

### Science Engine - Example Implementation

```typescript
// modules/science/domain/models/training-load.ts
export class TrainingLoad {
  static calculateCTL(
    workouts: Workout[],
    window: number = 42
  ): number {
    // Chronic Training Load (42-day)
    const recentWorkouts = workouts.slice(-window);
    
    let ctl = 0;
    for (let i = 0; i < recentWorkouts.length; i++) {
      const workout = recentWorkouts[i];
      const daysAgo = window - i;
      const decayFactor = Math.exp(-daysAgo / 42);
      
      ctl += (workout.trainingStress * decayFactor) / 42;
    }
    
    return ctl;
  }
  
  static calculateATL(workouts: Workout[], window: number = 7): number {
    // Acute Training Load (7-day)
    return TrainingLoad.calculateCTL(workouts, window);
  }
  
  static calculateTSB(ctl: number, atl: number): number {
    // Training Stress Balance = CTL - ATL
    return ctl - atl;
  }
  
  static interpretTSB(tsb: number): TrainingState {
    if (tsb > 25) return TrainingState.FRESH;
    if (tsb > 5) return TrainingState.READY;
    if (tsb > -10) return TrainingState.MAINTAINING;
    if (tsb > -20) return TrainingState.FATIGUED;
    return TrainingState.EXHAUSTED;
  }
}

// modules/science/application/calculate-training-load.handler.ts
export class CalculateTrainingLoadHandler
  implements ICommandHandler<CalculateTrainingLoadCommand>
{
  async execute(cmd: CalculateTrainingLoadCommand): Promise<TrainingLoadDTO> {
    const workouts = await workoutRepository.findByAthlete(cmd.athleteId);
    
    const ctl = TrainingLoad.calculateCTL(workouts, 42);
    const atl = TrainingLoad.calculateATL(workouts, 7);
    const tsb = TrainingLoad.calculateTSB(ctl, atl);
    const state = TrainingLoad.interpretTSB(tsb);
    
    const metrics = TrainingLoadMetrics.create({
      athleteId: cmd.athleteId,
      ctl,
      atl,
      tsb,
      trainingState: state,
      timestamp: new Date()
    });
    
    await metricsRepository.save(metrics);
    
    // Publish event for Decision Engine to consume
    await eventBus.publish(
      new TrainingLoadCalculated(cmd.athleteId, metrics)
    );
    
    return TrainingLoadMapper.toDTO(metrics);
  }
}
```

---

### Gap Analysis

| Item | Criticidade | Esforço | Risco | Timeline |
|------|------------|---------|-------|----------|
| Science Engine Framework | P0 CRÍTICO | 8 weeks | ALTO | Q3 2026 |
| Training Load Models | P0 CRÍTICO | 4 weeks | MÉDIO | Q3 2026 |
| Recovery Models | P0 CRÍTICO | 4 weeks | MÉDIO | Q3 2026 |
| VO2Max/FTP Estimation | P1 ALTO | 3 weeks | MÉDIO | Q4 2026 |
| Decision Engine | P0 CRÍTICO | 6 weeks | ALTO | Q3 2026 |
| Proprietary Models | P1 ALTO | TBD | TBD | Q4 2026 |

---

## 1.6 Integration Pattern (Adapter)

### Current State (PACERUNPRO)

```typescript
// ❌ Direct API calls scattered everywhere

// services/strava-service.ts
export async function syncFromStrava(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const accessToken = user.stravaAccessToken; // Direct access!
  
  // Direct API call
  const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  const activities = await response.json();
  
  for (const activity of activities) {
    // Transform and save
    await prisma.workoutLog.create({
      data: {
        athleteId: userId,
        source: 'strava',
        stravaActivityId: activity.id,
        // ... map other fields
      }
    });
  }
}

// ❌ Problems:
// - Direct API access everywhere
// - No abstraction
// - Hard to test
// - Hard to swap providers
// - No error handling strategy
// - No rate limiting
// - No caching
```

---

### Target State (ENKY OS)

```typescript
// ✅ Adapter Pattern

// modules/integrations/adapters/strava-adapter.ts
export interface IActivityAdapter {
  fetchActivities(userId: string): Promise<ExternalActivity[]>;
  syncActivity(externalId: string): Promise<WorkoutLog>;
  getAccessToken(userId: string): Promise<string>;
}

export class StravaAdapter implements IActivityAdapter {
  private client: StravaClient;
  
  constructor(
    private tokenRepository: ITokenRepository,
    private logger: ILogger
  ) {
    this.client = new StravaClient(process.env.STRAVA_API_KEY);
  }
  
  async fetchActivities(userId: string): Promise<ExternalActivity[]> {
    try {
      const token = await this.tokenRepository.findByProvider(
        userId,
        'STRAVA'
      );
      
      if (!token || token.isExpired()) {
        await this.refreshToken(token);
      }
      
      const response = await this.client.get('/athlete/activities', {
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });
      
      this.logger.info(`Fetched ${response.length} activities from Strava`);
      return response.map(a => StravaActivityMapper.toExternal(a));
    } catch (error) {
      this.logger.error('Failed to fetch Strava activities', error);
      throw new IntegrationError('STRAVA_SYNC_FAILED', error.message);
    }
  }
  
  private async refreshToken(token: IntegrationToken): Promise<void> {
    const refreshed = await this.client.refreshAccessToken(token.refreshToken);
    await this.tokenRepository.update(token.id, {
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt
    });
  }
}

// modules/integrations/application/sync-external-activities.handler.ts
export class SyncExternalActivitiesHandler {
  constructor(
    private adapterFactory: IntegrationAdapterFactory,
    private workoutLogRepository: IWorkoutLogRepository,
    private eventBus: IEventBus
  ) {}
  
  async execute(cmd: SyncExternalActivitiesCommand): Promise<void> {
    // Get appropriate adapter
    const adapter = this.adapterFactory.create(cmd.provider); // STRAVA, GARMIN, COROS, etc
    
    // Fetch activities through adapter
    const activities = await adapter.fetchActivities(cmd.userId);
    
    for (const activity of activities) {
      const workoutLog = WorkoutLog.create(activity);
      await this.workoutLogRepository.save(workoutLog);
      
      await this.eventBus.publish(
        new ExternalActivitySynced(cmd.userId, workoutLog)
      );
    }
  }
}

// modules/integrations/adapters/index.ts
export class IntegrationAdapterFactory {
  create(provider: IntegrationProvider): IActivityAdapter {
    switch (provider) {
      case 'STRAVA':
        return new StravaAdapter(...);
      case 'GARMIN':
        return new GarminAdapter(...);
      case 'COROS':
        return new CorosAdapter(...);
      case 'POLAR':
        return new PolarAdapter(...);
      case 'SUUNTO':
        return new SuuntoAdapter(...);
      case 'APPLE_HEALTH':
        return new AppleHealthAdapter(...);
      case 'GOOGLE_FIT':
        return new GoogleFitAdapter(...);
      default:
        throw new UnknownProviderError(provider);
    }
  }
}
```

---

### Gap Analysis

| Item | Esforço | Criticidade |
|------|---------|------------|
| Adapter Factory Pattern | 2 weeks | P1 |
| Strava Adapter | 1 week | P1 |
| Garmin Adapter | 1 week | P1 |
| COROS Adapter | 1 week | P1 |
| Polar/Suunto/Apple Adapters | 2 weeks | P2 |
| Error Handling Strategy | 1 week | P1 |
| Rate Limiting & Caching | 1 week | P1 |

---

## 1.7 Cache Strategy

### Current State (PACERUNPRO)

```
❌ Cache ad-hoc
❌ Nenhuma estratégia
❌ Some endpoints cache, others don't
❌ No cache invalidation strategy
❌ No TTL policy
```

---

### Target State (ENKY OS)

```
✅ Systematic Redis caching

modules/platform/cache/
├─ cache.service.ts
├─ cache-invalidator.ts
├─ cache-strategies/
│  ├─ dashboard-cache.ts
│  ├─ analytics-cache.ts
│  ├─ marketplace-cache.ts
│  ├─ leaderboard-cache.ts
│  └─ search-cache.ts
└─ decorators/
   └─ cacheable.decorator.ts

// Usage:
@Cacheable({
  ttl: 3600, // 1 hour
  key: 'athlete:{{athleteId}}:dashboard',
  invalidateOn: [AthleteUpdated, TrainingLogCreated]
})
async getDashboard(athleteId: string): Promise<DashboardDTO> {
  // ... expensive computation
}

// Caching Strategy:
Cache Layer:
├─ Dashboard (1h TTL)
├─ Analytics (24h TTL)
├─ Leaderboards (15m TTL)
├─ Marketplace (4h TTL)
├─ Search Results (1h TTL)
└─ User Session (8h TTL)

Invalidation:
├─ Time-based (TTL)
├─ Event-based (DomainEvents)
└─ Manual (admin trigger)
```

---

### Gap Analysis

| Item | Esforço | Criticidade |
|------|---------|------------|
| Cache Infrastructure Setup | 1 week | P1 |
| Cache Decorators/Utilities | 1 week | P1 |
| Cache Invalidation Strategy | 2 weeks | P1 |
| Cache Policies per Module | 3 weeks | P1 |

---

## 1.8 Queue System

### Current State (PACERUNPRO)

```
❌ Nenhum sistema de fila
❌ Tudo síncrono
❌ Sem background jobs
❌ Sem delayed tasks
```

---

### Target State (ENKY OS)

```
✅ Bull + Redis Queue

modules/platform/queue/

Jobs:
├─ Email sending
├─ Integration syncing
├─ PDF generation
├─ FIT file import
├─ AI report generation
├─ Analytics computation
├─ Bulk operations
└─ Scheduled tasks

// Example: Send email via queue
export class SendEmailCommand implements ICommand {
  constructor(
    public to: string,
    public template: string,
    public data: Record<string, any>
  ) {}
}

@Injectable()
export class SendEmailHandler implements ICommandHandler<SendEmailCommand> {
  async execute(command: SendEmailCommand): Promise<void> {
    // Queue job instead of direct send
    await this.emailQueue.add(
      'send-email',
      {
        to: command.to,
        template: command.template,
        data: command.data
      },
      {
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );
  }
}

// Process queue
emailQueue.process('send-email', async (job) => {
  await emailService.send(job.data);
});
```

---

### Gap Analysis

| Item | Esforço | Criticidade |
|------|---------|------------|
| Bull + Redis Setup | 1 week | P1 |
| Queue Workers | 2 weeks | P1 |
| Retry Strategy | 1 week | P1 |
| Monitoring & Dead Letter Queue | 1 week | P2 |

---

## 1.9 Observability & Monitoring

### Current State (PACERUNPRO)

```
✅ Basic Sentry setup
❌ Limited logging
❌ No distributed tracing
❌ No structured logging
❌ No metrics collection
```

---

### Target State (ENKY OS)

```
✅ Complete Observability Stack

modules/platform/observability/
├─ logging/
│  └─ structured-logger.ts
├─ tracing/
│  └─ distributed-tracer.ts
├─ metrics/
│  └─ metrics-collector.ts
└─ monitoring/
   └─ health-checks.ts

Stack:
├─ Structured Logging (Winston/Pino)
├─ Distributed Tracing (OpenTelemetry)
├─ Metrics (Prometheus)
├─ Error Tracking (Sentry)
└─ APM (DataDog/New Relic)

// Structured Logging Example:
logger.info('Athlete profile updated', {
  athleteId,
  changes: { weight: '75kg', birthDate: '1990-05-10' },
  timestamp: new Date(),
  duration: endTime - startTime,
  traceId: context.traceId
});

// Distributed Tracing Example:
@Trace()
async calculateTrainingLoad(athleteId: string): Promise<TrainingLoadDTO> {
  // Automatically traced with distributed ID
}

// Metrics Collection Example:
@Metrics({
  histogram: 'query_duration_ms',
  counter: 'queries_executed'
})
async getAthleteMetrics(athleteId: string): Promise<MetricsDTO> {
  // Automatically collected
}
```

---

### Gap Analysis

| Item | Esforço | Criticidade |
|------|---------|------------|
| Structured Logging | 1 week | P1 |
| Distributed Tracing Setup | 2 weeks | P2 |
| Metrics Collection | 1 week | P2 |
| APM Integration | 1 week | P2 |

---

# 2. ARCHITECTURE MIGRATION ROADMAP

## Phase 1: Foundation (Weeks 1-4)

### Goal: Setup new architecture foundation without breaking current system

**Parallel Workstreams:**

#### 1.1: Create Module Structure
- [ ] Create `/modules` directory with DDD structure
- [ ] Create identity module structure
- [ ] Setup module imports/exports
- [ ] Document module boundaries
- [ ] Create example module (identity)

**Timeline:** 1 week
**Team:** 1-2 Backend Engineers
**Risk:** LOW (non-breaking, parallel to current)

#### 1.2: Setup Event Bus & Queue
- [ ] Install Bull + Redis
- [ ] Implement EventBus interface
- [ ] Create event publishing infrastructure
- [ ] Implement queue processors
- [ ] Add monitoring to events

**Timeline:** 1 week
**Team:** 1 Backend Engineer
**Risk:** LOW (infrastructure layer)

#### 1.3: Setup Observability
- [ ] Setup structured logging
- [ ] Add distributed tracing
- [ ] Add metrics collection
- [ ] Connect to monitoring tools
- [ ] Create dashboards

**Timeline:** 1 week
**Team:** 1 DevOps/Backend Engineer
**Risk:** LOW (non-breaking)

#### 1.4: Refactor Identity Module
- [ ] Implement Athlete aggregate root
- [ ] Implement Athlete value objects
- [ ] Implement Athlete repository
- [ ] Implement create athlete use case
- [ ] Add domain events
- [ ] Add tests

**Timeline:** 1.5 weeks
**Team:** 1-2 Backend Engineers
**Risk:** MÉDIO (new code, parallel deployment)

---

## Phase 2: Science Engine (Weeks 5-12)

### Goal: Build Science Engine as core platform capability

#### 2.1: Science Engine Architecture
- [ ] Design science models (CTL, ATL, TSB, VO2Max, FTP)
- [ ] Implement training load calculations
- [ ] Implement recovery models
- [ ] Create scientific repository
- [ ] Setup science event bus

**Timeline:** 3 weeks
**Team:** 2 Backend Engineers + 1 Sports Scientist
**Risk:** ALTO (complex domain)

#### 2.2: Decision Engine
- [ ] Design decision logic
- [ ] Implement risk analysis
- [ ] Implement opportunity detection
- [ ] Implement intervention prioritizer
- [ ] Connect to recommendations

**Timeline:** 2 weeks
**Team:** 1 Backend Engineer + 1 Sports Scientist
**Risk:** MÉDIO (business logic)

#### 2.3: Connect to Analytics
- [ ] Implement analytics queries
- [ ] Create dashboard data
- [ ] Cache analytics results
- [ ] Setup analytics updates

**Timeline:** 2 weeks
**Team:** 1 Backend Engineer
**Risk:** BAIXO (read-only)

---

## Phase 3: Module Migration (Weeks 13-24)

### Goal: Migrate existing modules to new architecture

#### 3.1: Coach Module
- [ ] Create coach module structure
- [ ] Implement coach aggregates
- [ ] Implement coach commands/queries
- [ ] Migrate existing functionality
- [ ] Setup coach event bus

**Timeline:** 3 weeks
**Team:** 2 Backend Engineers
**Risk:** MÉDIO (existing users)

#### 3.2: Training Module
- [ ] Create training module structure
- [ ] Implement training aggregates
- [ ] Migrate planning functionality
- [ ] Migrate workout functionality
- [ ] Setup training events

**Timeline:** 3 weeks
**Team:** 2 Backend Engineers
**Risk:** ALTO (core functionality)

#### 3.3: Assessment Module
- [ ] Create assessment module structure
- [ ] Implement assessment aggregates
- [ ] Integrate with science engine
- [ ] Setup assessment events
- [ ] Migrate existing functionality

**Timeline:** 2 weeks
**Team:** 1-2 Backend Engineers
**Risk:** MÉDIO (dependent on science)

#### 3.4: Marketplace Module
- [ ] Create marketplace module structure
- [ ] Implement product aggregates
- [ ] Implement purchase commands
- [ ] Setup marketplace events
- [ ] Migrate existing functionality

**Timeline:** 2 weeks
**Team:** 1 Backend Engineer
**Risk:** BAIXO (isolated module)

---

## Phase 4: Integration Pattern (Weeks 25-30)

### Goal: Implement adapter pattern for all integrations

#### 4.1: Integration Infrastructure
- [ ] Implement adapter factory
- [ ] Implement base adapter
- [ ] Setup error handling
- [ ] Setup rate limiting
- [ ] Setup caching

**Timeline:** 2 weeks
**Team:** 1 Backend Engineer
**Risk:** BAIXO (isolated)

#### 4.2: Migrate Integrations
- [ ] Migrate Strava to adapter
- [ ] Migrate Garmin to adapter
- [ ] Migrate COROS to adapter
- [ ] Migrate Polar/Suunto
- [ ] Migrate Apple Health/Google Fit

**Timeline:** 3 weeks
**Team:** 1-2 Backend Engineers
**Risk:** MÉDIO (external dependencies)

---

## Phase 5: CQRS & Cache (Weeks 31-36)

### Goal: Implement CQRS pattern and systematic caching

#### 5.1: CQRS Infrastructure
- [ ] Implement Command dispatcher
- [ ] Implement Query dispatcher
- [ ] Implement handlers
- [ ] Setup read models
- [ ] Setup read replicas (optional)

**Timeline:** 2 weeks
**Team:** 1-2 Backend Engineers
**Risk:** MÉDIO (architectural change)

#### 5.2: Cache Layer
- [ ] Implement cache service
- [ ] Implement cache decorators
- [ ] Setup cache invalidation
- [ ] Configure cache policies
- [ ] Monitor cache hits/misses

**Timeline:** 2 weeks
**Team:** 1 Backend Engineer
**Risk:** BAIXO (non-breaking)

---

## Phase 6: Frontend Migration (Weeks 37-48)

### Goal: Reorganize frontend components by domain module

#### 6.1: Component Consolidation
- [ ] Consolidate duplicate components (Phase 1)
- [ ] Extract shared styles
- [ ] Create component library
- [ ] Document components

**Timeline:** 2 weeks
**Team:** 1-2 Frontend Engineers
**Risk:** BAIXO (UI only)

#### 6.2: Module-based Organization
- [ ] Reorganize coach module components
- [ ] Reorganize athlete module components
- [ ] Reorganize assessment module components
- [ ] Organize shared components
- [ ] Create entry points

**Timeline:** 2 weeks
**Team:** 2 Frontend Engineers
**Risk:** MÉDIO (reorganization)

#### 6.3: State Management
- [ ] Evaluate state management (Zustand, Jotai)
- [ ] Implement module-specific stores
- [ ] Integrate with API layer
- [ ] Setup cache integration

**Timeline:** 2 weeks
**Team:** 1-2 Frontend Engineers
**Risk:** MÉDIO (architectural change)

---

# 3. MIGRATION STRATEGY

## Parallel Implementation (NOT Sequential!)

```
Current System (PACERUNPRO)           New System (ENKY OS)
    ↓                                      ↓
    Running in Production              Built in Parallel
    (unchanged)                         (isolated)
    
    ↓                                      ↓
    HTTP Requests                      Event Bus
    ↓                                      ↓
    API Handler                        Module Command Handler
    ↓                                      ↓
    Service                            Application Service
    ↓                                      ↓
    Prisma Update                      Domain Entity → Repository
    ↓                                      ↓
    Response                           Event Published
    
    After validation:
    Gradual traffic migration → 10% → 25% → 50% → 100%
```

---

## Database Migration Strategy

```
Current Prisma Schema (PACERUNPRO)
    ↓
    Add new tables for ENKY modules (parallel)
    ├─ athlete_aggregates
    ├─ athlete_events
    ├─ training_load_metrics
    └─ science_calculations
    
    ↓
    Dual-write pattern (transition period)
    ├─ Write to old tables (for existing queries)
    └─ Write to new tables (for ENKY modules)
    
    ↓
    Migrate queries to CQRS
    ├─ Old queries → still work
    └─ New queries → use read models
    
    ↓
    After validation (6 months)
    ├─ Deprecate old tables
    └─ Archive historical data
```

---

## Risk Mitigation

### 🔴 High Risk Items

**Science Engine (P0)**
- Risk: Incorrect calculations affect athlete safety
- Mitigation:
  - [ ] Extensive unit tests (100% coverage)
  - [ ] Validation against known datasets
  - [ ] Sports scientist review
  - [ ] Beta testing with coaches
  - [ ] A/B testing before full rollout
  - [ ] Monitoring for anomalies

**Event Bus (P0)**
- Risk: Broken event chain = cascading failures
- Mitigation:
  - [ ] Dead letter queue for failed events
  - [ ] Event replay capability
  - [ ] Circuit breaker pattern
  - [ ] Monitoring on event loss
  - [ ] Graceful degradation

**Domain-Driven Design (P1)**
- Risk: Incorrect domain modeling = hard to change
- Mitigation:
  - [ ] Domain expert involvement
  - [ ] Ubiquitous language documents
  - [ ] Domain events validation
  - [ ] Bounded context review
  - [ ] Architecture review board

---

## Rollback Strategy

Each phase has a rollback plan:

```
Phase 1 (Foundation):
├─ Rollback: Turn off new module, use old services
└─ Time: < 5 minutes

Phase 2 (Science Engine):
├─ Rollback: Disable science events, use cached values
└─ Time: < 10 minutes

Phase 3 (Module Migration):
├─ Rollback: Route to old API handlers
└─ Time: < 5 minutes (via feature flags)

Phase 4 (Integration):
├─ Rollback: Use old integration services
└─ Time: < 10 minutes

Phase 5 (CQRS):
├─ Rollback: Bypass command handlers, use direct updates
└─ Time: < 5 minutes

Phase 6 (Frontend):
├─ Rollback: Revert component changes
└─ Time: < 5 minutes (redeploy)
```

---

# 4. GAP SUMMARY TABLE

| # | Category | Current | Target | Gap | P | Effort | Risk | Timeline |
|---|----------|---------|--------|-----|---|--------|------|----------|
| 1 | **Organization** | App Router | Module-based | HIGH | P1 | 8w | MED | Wk 1-8 |
| 2 | **DDD** | 20% | 100% | HIGH | P1 | 10w | HIGH | Wk 1-10 |
| 3 | **Events** | 0% | 100% | CRIT | P0 | 4w | MED | Wk 1-4 |
| 4 | **Science Engine** | 0% | 100% | CRIT | P0 | 8w | HIGH | Wk 5-12 |
| 5 | **Decision Engine** | 0% | 100% | CRIT | P0 | 6w | HIGH | Wk 5-10 |
| 6 | **CQRS** | 0% | 100% | MED | P2 | 3w | MED | Wk 31-34 |
| 7 | **Adapter Pattern** | 0% | 100% | MED | P1 | 3w | LOW | Wk 25-28 |
| 8 | **Cache** | Ad-hoc | Systematic | MED | P1 | 4w | LOW | Wk 31-35 |
| 9 | **Queues** | None | Bull+Redis | MED | P1 | 3w | LOW | Wk 1-3 |
| 10 | **Observability** | Basic | Complete | LOW | P2 | 4w | LOW | Wk 1-4 |

---

# 5. ESTIMATED TIMELINE

**Best Case (4-person team, full-time):**
- Phase 1-2: 12 weeks (foundation + science)
- Phase 3: 12 weeks (module migration)
- Phase 4-5: 12 weeks (integration + CQRS)
- Phase 6: 12 weeks (frontend)
- **Total: 48 weeks (~1 year)**

**Realistic Case (3-person team, 80% allocation):**
- Add 50% overhead for testing, debugging, coordination
- **Total: 72 weeks (~1.5 years)**

**Aggressive Case (5-person team, 100% allocation):**
- Parallel tracks in phases 3-5
- **Total: 40 weeks (~9-10 months)**

---

# 6. NEXT STEPS

## Immediate (Week 1)

- [ ] Review this document with architecture team
- [ ] Obtain domain expert sign-off on science models
- [ ] Allocate team resources
- [ ] Setup infrastructure (Redis, message queue)
- [ ] Create module structure
- [ ] Start Phase 1 implementation

## Ongoing

- [ ] Weekly architecture reviews
- [ ] Bi-weekly demos to stakeholders
- [ ] Monthly rollout decisions
- [ ] Continuous monitoring of metrics
- [ ] Risk assessment updates

---

**Gerado em:** 2026-07-08  
**Versão:** 0.1.0  
**Status:** ✅ Pronto para Discussão  
**Próximo Passo:** Review com leadership + domain experts
