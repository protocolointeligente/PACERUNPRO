# DATABASE MAP — PACERUNPRO v0.1.0

**Data:** 2026-07-08  
**Status:** ERD Completo — Textual + ASCII  
**Versão:** 0.1.0  
**Total Entidades:** 43  
**Relacionamentos:** 95+

---

# Executive Summary

ERD completo da base de dados PostgreSQL com todas as 43 entidades, 95+ relacionamentos, cardinalidades, dependências e regras de cascata.

| Métrica | Valor |
|---------|-------|
| Entidades | 43 |
| Foreign Keys | 95+ |
| Índices | 25+ |
| Enums | 13 |
| M:N Relationships | 2 |
| 1:1 Relationships | 15 |
| 1:N Relationships | 78 |
| Cascade Deletes | 38 |
| Soft Deletes | 0 (⚠️ TODO) |

---

# 1. Diagrama Geral — Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    PACERUNPRO DATABASE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 1: IDENTITY & ACCOUNTS (5 entities)           │   │
│  │ ├─ User                                              │   │
│  │ ├─ Account                                           │   │
│  │ ├─ Session                                           │   │
│  │ ├─ VerificationToken                                │   │
│  │ └─ BillingSettings                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 2: PEOPLE (3 entities)                         │   │
│  │ ├─ Athlete                                           │   │
│  │ ├─ Coach                                             │   │
│  │ └─ Team                                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 3: TRAINING & PLANNING (11 entities)           │   │
│  │ ├─ TrainingPlan, TrainingWeek, Workout              │   │
│  │ ├─ WorkoutLog, WorkoutLogComment                    │   │
│  │ ├─ StrengthWorkout, StrengthBlock                   │   │
│  │ ├─ Exercise, ExerciseVideo                          │   │
│  │ ├─ Race                                              │   │
│  │ └─ RecoveryLog                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 4: PERFORMANCE & ASSESSMENT (8 entities)       │   │
│  │ ├─ PerformanceTest, CheckIn, Metric                 │   │
│  │ ├─ Achievement, AthleteLoadParams                   │   │
│  │ ├─ CoachZoneModel                                    │   │
│  │ └─ (Notifications, Connections)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 5: COMMERCE & SUBSCRIPTIONS (9 entities)       │   │
│  │ ├─ CoachPlan, Subscription, Payment                 │   │
│  │ ├─ PlanProduct, PlanPurchase                        │   │
│  │ ├─ Voucher, Lead, Expense                           │   │
│  │ └─ ConnectedDevice                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 6: TEMPLATES & CONFIG (5 entities)             │   │
│  │ ├─ SharedWorkoutTemplate                            │   │
│  │ ├─ CoachStrengthTemplate                            │   │
│  │ ├─ CoachRunTemplate                                 │   │
│  │ └─ (BillingSettings, CoachZoneModel)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LAYER 7: SOCIAL & COMMUNITY (4 entities)             │   │
│  │ ├─ FeedPost, FeedComment                            │   │
│  │ ├─ FeedLike                                          │   │
│  │ └─ Notification                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. Entidades por Domínio

## 2.1 Identity & Accounts (5 entities)

### User (Core)
```
User
├─ id: String (PK)
├─ email: String (UNIQUE)
├─ passwordHash: String?
├─ name: String
├─ avatarUrl: String?
├─ bannerUrl: String?
├─ image: String?
├─ role: UserRole (ENUM: ADMIN, COACH, ATHLETE)
├─ phone: String?
├─ city: String?
├─ state: String?
├─ emailVerified: DateTime?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**ForeignKeys:** 0
**Outgoing:** 13 (athlete, coach, notifications, subscriptions, payments, devices, feedPosts, feedComments, feedLikes, accounts, sessions, vouchersCreated, billingSettings, workoutLogComments)
**Incoming:** 10+ (from Athlete, Coach, Notification, etc.)

---

### Account (OAuth)
```
Account
├─ id: String (PK)
├─ userId: String (FK → User) ⚠️ NO INDEX
├─ type: String
├─ provider: String
├─ providerAccountId: String
├─ refresh_token: String?
├─ access_token: String?
├─ expires_at: Int?
├─ token_type: String?
├─ scope: String?
├─ id_token: String?
├─ session_state: String?
└─ @@unique([provider, providerAccountId])
```

**Cascades:** onDelete: Cascade (User)
**Indexes:** ⚠️ MISSING @@index([userId])

---

### Session (JWT)
```
Session
├─ id: String (PK)
├─ sessionToken: String (UNIQUE)
├─ userId: String (FK → User) ⚠️ NO INDEX
├─ expires: DateTime
└─ user: User
```

**Cascades:** onDelete: Cascade (User)
**Indexes:** ⚠️ MISSING @@index([userId])

---

### VerificationToken (Email Verification)
```
VerificationToken
├─ identifier: String (PK1)
├─ token: String (UNIQUE, PK2)
├─ expires: DateTime
└─ @@unique([identifier, token])
```

**Cascades:** None
**Indexes:** ⚠️ MISSING @@index([expires]) — Cleanup needed

---

### BillingSettings (Financial Config)
```
BillingSettings
├─ id: String (PK)
├─ userId: String (UNIQUE, FK → User)
├─ razaoSocial: String?
├─ cpfCnpj: String? ⚠️ PLAINTEXT
├─ responsavel: String?
├─ receivingMethod: ReceivingMethod? (ENUM)
├─ pixKey: String? ⚠️ PLAINTEXT
├─ bankName: String?
├─ bankAgency: String?
├─ bankAccount: String? ⚠️ PLAINTEXT
├─ bankAccountType: String?
├─ pagbankConnected: Boolean
├─ mercadopagoConnected: Boolean
├─ stripeConnected: Boolean
├─ autoChargeEnabled: Boolean
├─ autoChargeDayOfMonth: Int?
├─ gracePeriodDays: Int?
├─ blockAfterDays: Int?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (User)
**Concerns:** ⚠️ Sensitive data in plaintext (see PRISMA_REVIEW.md)

---

## 2.2 People & Teams (3 entities)

### Athlete (Core)
```
Athlete
├─ id: String (PK)
├─ userId: String (UNIQUE, FK → User)
├─ coachId: String? (FK → Coach) ⚠️ REDUNDANT with TrainingPlan.coachId
├─ birthDate: DateTime?
├─ sex: Sex? (ENUM: MASCULINO, FEMININO, OUTRO)
├─ heightCm: Float?
├─ weightKg: Float?
├─ goal: Goal? (ENUM: 5KM, 10KM, etc.)
├─ level: ExperienceLevel (ENUM: INICIANTE, INTERMEDIARIO, AVANCADO, PRO)
├─ weeklyAvailability: Int?
├─ availableMinutes: Int?
├─ injuryHistory: String?
├─ raceDate: DateTime? ⚠️ REDUNDANT with Race.date
├─ recentBestTime: String? ⚠️ FRÁGIL (should use Race.resultTime)
├─ status: String (DEFAULT: ativo) ⚠️ NO INDEX, should be ENUM
├─ adherenceRate: Float
├─ recoveryScore: Float ⚠️ CACHE (use RecoveryLog.score)
├─ parqAccepted: Boolean
├─ parqAcceptedAt: DateTime?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 2 (userId, coachId)
**Outgoing:** 11 (metrics, checkins, performanceTests, trainingPlans, workoutLogs, races, achievements, teamMemberships, loadParams, planPurchases, recoveryLogs)
**Indexes:** ⚠️ MISSING @@index([coachId]), @@index([status])

---

### Coach (Core)
```
Coach
├─ id: String (PK)
├─ userId: String (UNIQUE, FK → User)
├─ credential: String?
├─ bio: String?
├─ publicBio: String?
├─ specialties: String[]
├─ slug: String? (UNIQUE) — public URL
├─ logoUrl: String?
├─ whatsapp: String?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 1 (userId)
**Outgoing:** 10 (plans, athletes, teams, trainingPlans, exercises, strengthTemplates, runTemplates, leads, expenses, zoneModels, planProducts, sharedTemplates)

---

### Team & TeamMember (Group)
```
Team
├─ id: String (PK)
├─ name: String
├─ coachId: String (FK → Coach)
├─ createdAt: DateTime
└─ members: TeamMember[]

TeamMember
├─ id: String (PK)
├─ teamId: String (FK → Team)
├─ athleteId: String (FK → Athlete)
├─ joinedAt: DateTime
└─ @@unique([teamId, athleteId])
```

**Cascades:** onDelete: Cascade (Team, Athlete)
**Constraints:** Unique per team+athlete

---

## 2.3 Training & Planning (11 entities)

### TrainingPlan (Macrocycle)
```
TrainingPlan
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ coachId: String? (FK → Coach) ⚠️ REDUNDANT
├─ name: String
├─ goal: Goal (ENUM)
├─ raceDate: DateTime?
├─ macrocycle: String?
├─ phase: CyclePhase (ENUM: BASE, CONSTRUCAO, ESPECIFICO, POLIMENTO, COMPETICAO, RECUPERACAO)
├─ startDate: DateTime
├─ endDate: DateTime
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 2 (athleteId, coachId)
**Outgoing:** 1 (weeks)
**Indexes:** ⚠️ MISSING @@index([athleteId]), @@index([coachId])

---

### TrainingWeek (Mesocycle)
```
TrainingWeek
├─ id: String (PK)
├─ planId: String (FK → TrainingPlan)
├─ weekNumber: Int
├─ mesocycle: String?
├─ phase: CyclePhase
├─ startDate: DateTime
├─ endDate: DateTime
├─ targetLoad: Float?
├─ targetVolumeKm: Float?
├─ released: Boolean
├─ releasedAt: DateTime?
└─ @@unique([planId, weekNumber])
    @@index([planId, weekNumber])
```

**Cascades:** onDelete: Cascade (TrainingPlan)
**ForeignKeys:** 1 (planId)
**Outgoing:** 1 (workouts)
**Constraints:** Unique per plan+week

---

### Workout (Session)
```
Workout
├─ id: String (PK)
├─ weekId: String (FK → TrainingWeek)
├─ date: DateTime
├─ type: WorkoutType (ENUM: 15 tipos)
├─ title: String
├─ status: WorkoutStatus (ENUM: AGENDADO, LIBERADO, CONCLUIDO, PERDIDO, AJUSTADO)
├─ objective: String?
├─ warmup: String?
├─ mainSet: String?
├─ cooldown: String?
├─ notes: String?
├─ structured: Boolean
├─ blocks: Json? — WorkoutBlock[]
├─ targetPaceSecPerKm: Int?
├─ targetHrZone: String?
├─ targetRpe: Int?
├─ targetDistanceKm: Float?
├─ targetDurationMin: Int?
├─ videoUrl: String?
├─ imageUrl: String?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (TrainingWeek)
**ForeignKeys:** 1 (weekId)
**Outgoing:** 2 (strengthWorkout, logs)
**Indexes:** @@index([weekId, date])
**Concerns:** ⚠️ NO INDEX on type, status

---

### WorkoutLog (Execution)
```
WorkoutLog
├─ id: String (PK)
├─ workoutId: String? (FK → Workout) [SetNull]
├─ athleteId: String (FK → Athlete)
├─ source: String (DEFAULT: manual)
├─ stravaActivityId: String? (UNIQUE)
├─ startedAt: DateTime?
├─ finishedAt: DateTime?
├─ distanceKm: Float?
├─ durationSec: Int?
├─ avgPaceSecPerKm: Int?
├─ avgHr: Int?
├─ maxHr: Int?
├─ cadence: Int?
├─ elevationGainM: Float?
├─ calories: Int?
├─ gpsTrack: Json?
├─ splits: Json?
├─ rpe: Int?
├─ feeling: String?
├─ createdAt: DateTime
└─ comments: WorkoutLogComment[]
```

**Cascades:** onDelete: SetNull (Workout), Cascade (Athlete)
**ForeignKeys:** 2 (workoutId, athleteId)
**Outgoing:** 1 (comments)
**Indexes:** @@index([athleteId, startedAt]), @@index([workoutId])
**Concerns:** ⚠️ NO INDEX on source

---

### WorkoutLogComment (Feedback)
```
WorkoutLogComment
├─ id: String (PK)
├─ workoutLogId: String (FK → WorkoutLog)
├─ userId: String (FK → User)
├─ text: String
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (WorkoutLog, User)
**ForeignKeys:** 2 (workoutLogId, userId)
**Indexes:** @@index([workoutLogId])

---

### StrengthWorkout (Força Estruturada)
```
StrengthWorkout
├─ id: String (PK)
├─ workoutId: String (UNIQUE, FK → Workout)
├─ split: StrengthSplit (ENUM: AB, ABC, ABCD, ABCDE, FULL_BODY, UPPER_LOWER, PERSONALIZADA)
├─ label: String?
└─ blocks: StrengthBlock[]
```

**Cascades:** onDelete: Cascade (Workout)
**ForeignKeys:** 1 (workoutId)
**Outgoing:** 1 (blocks)
**Constraints:** 1:1 with Workout

---

### StrengthBlock (Exercise Block)
```
StrengthBlock
├─ id: String (PK)
├─ strengthWorkoutId: String (FK → StrengthWorkout)
├─ exerciseId: String (FK → Exercise)
├─ order: Int
├─ sets: Int
├─ reps: String
├─ load: String?
├─ restSec: Int?
├─ rpe: Int?
└─ notes: String?
```

**Cascades:** onDelete: Cascade (StrengthWorkout)
**ForeignKeys:** 2 (strengthWorkoutId, exerciseId)

---

### Exercise & ExerciseVideo (Library)
```
Exercise
├─ id: String (PK)
├─ coachId: String? (FK → Coach)
├─ name: String
├─ category: ExerciseCategory (ENUM: 10 categorias)
├─ description: String?
├─ execution: String?
├─ commonMistakes: String? ⚠️ LOW USAGE?
├─ musclesWorked: String[]
├─ imageUrl: String?
├─ createdAt: DateTime
└─ updatedAt: DateTime

ExerciseVideo
├─ id: String (PK)
├─ exerciseId: String (FK → Exercise)
├─ url: String
├─ title: String?
└─ durationSec: Int?
```

**Cascades:** onDelete: Cascade (Exercise)
**ForeignKeys:** 1 (coachId) + 1 (exerciseId)

---

### Race (Competitions)
```
Race
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ name: String
├─ date: DateTime
├─ distanceKm: Float
├─ goalTime: String?
├─ resultTime: String?
└─ location: String?
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Indexes:** ⚠️ MISSING @@index([athleteId, date])

---

### RecoveryLog (Time Series)
```
RecoveryLog
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ date: DateTime
├─ score: Float (0–1)
├─ ctl: Float?
├─ atl: Float?
├─ tsb: Float?
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Indexes:** @@index([athleteId, date])

---

## 2.4 Performance & Assessment (8 entities)

### PerformanceTest
```
PerformanceTest
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ type: TestType (ENUM: 7 tipos)
├─ date: DateTime
├─ distanceM: Float?
├─ durationSec: Int?
├─ avgHr: Int?
├─ maxHr: Int?
├─ vo2max: Float?
├─ vamKmh: Float?
├─ thresholdPaceSecPerKm: Int?
├─ notes: String?
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Indexes:** @@index([athleteId, date])

---

### CheckIn (Wellness)
```
CheckIn
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ date: DateTime
├─ rpe: Int? (0-10)
├─ pain: Int? (0-10)
├─ sleep: Int? (0-10)
├─ fatigue: Int? (0-10)
├─ mood: Int? (0-10)
├─ stress: Int? (0-10)
├─ notes: String?
├─ flagged: Boolean
├─ flagReason: String?
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Indexes:** @@index([athleteId, date])

---

### Metric (Body Metrics)
```
Metric
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ date: DateTime
├─ weightKg: Float?
├─ bodyFatPct: Float?
├─ restingHr: Int?
├─ hrv: Float?
├─ vo2max: Float?
├─ notes: String?
└─ (createdAt implicit from date)
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Indexes:** @@index([athleteId, date])

---

### Achievement
```
Achievement
├─ id: String (PK)
├─ athleteId: String (FK → Athlete)
├─ title: String
├─ description: String?
├─ icon: String?
└─ earnedAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)

---

### AthleteLoadParams (Carga Config)
```
AthleteLoadParams
├─ id: String (PK)
├─ athleteId: String (UNIQUE, FK → Athlete)
├─ thresholdPaceSecPerKm: Int?
├─ ftpWatts: Int?
├─ swimThresholdSecPer100m: Int?
├─ hrMax: Int?
├─ hrRest: Int?
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Athlete)
**ForeignKeys:** 1 (athleteId)
**Constraints:** 1:1 with Athlete
**Concerns:** ⚠️ Too many optional fields, should be sport-specific

---

### CoachZoneModel
```
CoachZoneModel
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ sport: String (DEFAULT: CORRIDA)
├─ method: String (DEFAULT: FC_MAXIMA)
├─ zoneCount: Int
├─ zones: Json
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)

---

### ConnectedDevice (Wearables)
```
ConnectedDevice
├─ id: String (PK)
├─ userId: String (FK → User)
├─ provider: DeviceProvider (ENUM: 8 tipos)
├─ externalId: String?
├─ accessToken: String? ⚠️ PLAINTEXT
├─ refreshToken: String? ⚠️ PLAINTEXT
├─ connectedAt: DateTime
├─ lastSyncAt: DateTime?
└─ @@unique([userId, provider])
    @@index([userId])
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 1 (userId)
**Indexes:** @@index([userId])
**Concerns:** ⚠️ Tokens in plaintext

---

## 2.5 Commerce & Subscriptions (9 entities)

### Subscription (User Sub)
```
Subscription
├─ id: String (PK)
├─ userId: String (FK → User)
├─ plan: SubscriptionPlan (ENUM: FREE, ATHLETE, COACH, TEAM)
├─ status: SubscriptionStatus (ENUM: TRIAL, ACTIVE, PAST_DUE, CANCELED)
├─ startedAt: DateTime
├─ renewsAt: DateTime?
├─ canceledAt: DateTime?
└─ payments: Payment[]
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 1 (userId)
**Outgoing:** 1 (payments)
**Indexes:** ⚠️ MISSING @@index([userId]), @@index([status])

---

### Payment
```
Payment
├─ id: String (PK)
├─ userId: String (FK → User)
├─ subscriptionId: String? (FK → Subscription)
├─ amountCents: Int
├─ currency: String (DEFAULT: BRL)
├─ status: PaymentStatus (ENUM: PENDING, PAID, FAILED, REFUNDED)
├─ method: String? (pix, cartao, boleto)
├─ paidAt: DateTime?
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (User, Subscription)
**ForeignKeys:** 2 (userId, subscriptionId)
**Indexes:** ⚠️ MISSING @@index([userId]), @@index([status])

---

### CoachPlan (Assessoria Plans)
```
CoachPlan
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ description: String?
├─ priceCents: Int
├─ period: PlanPeriod (ENUM: MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL)
├─ features: String[]
├─ active: Boolean
├─ highlight: Boolean
├─ maxSlots: Int? ⚠️ CACHE (usedSlots)
├─ usedSlots: Int ⚠️ DESINCRONIZÁVEL
├─ sortOrder: Int
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)
**Indexes:** ⚠️ MISSING @@index([coachId]), @@index([active])
**Concerns:** ⚠️ Counter field (usedSlots) can desync

---

### PlanProduct (Marketplace)
```
PlanProduct
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ title: String
├─ slug: String (UNIQUE)
├─ description: String
├─ sport: String
├─ level: String
├─ durationWeeks: Int
├─ weeklyHoursMin: Float?
├─ weeklyHoursMax: Float?
├─ goal: String
├─ priceCents: Int
├─ currency: String
├─ coverUrl: String?
├─ published: Boolean
├─ featured: Boolean
├─ purchases: Int ⚠️ CACHE
├─ rating: Float?
├─ ratingCount: Int ⚠️ CACHE
├─ included: String[]
├─ planContent: Json?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)
**Outgoing:** 1 (planPurchases)
**Indexes:** @@index([coachId])
**Concerns:** ⚠️ Cache fields (purchases, rating, ratingCount)

---

### PlanPurchase (Checkout)
```
PlanPurchase
├─ id: String (PK)
├─ productId: String (FK → PlanProduct)
├─ athleteId: String (FK → Athlete)
├─ pricePaidCents: Int
├─ currency: String
├─ status: String (pending, paid, refunded)
├─ stripeSessionId: String?
├─ createdAt: DateTime
└─ @@unique([productId, athleteId])
```

**Cascades:** onDelete: Cascade (PlanProduct, Athlete)
**ForeignKeys:** 2 (productId, athleteId)
**Constraints:** Unique per product+athlete

---

### Voucher (Discount)
```
Voucher
├─ id: String (PK)
├─ code: String (UNIQUE)
├─ type: VoucherType (ENUM: PERCENT, FREE_MONTHS)
├─ value: Int
├─ audience: VoucherAudience (ENUM: B2C, B2B, ALL)
├─ maxUses: Int?
├─ usedCount: Int ⚠️ CACHE + RACE CONDITION
├─ expiresAt: DateTime?
├─ active: Boolean
├─ note: String?
├─ createdById: String (FK → User)
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** None (User FK should have ON DELETE SET NULL)
**ForeignKeys:** 1 (createdById)
**Indexes:** ⚠️ MISSING @@index([active]), @@index([active, expiresAt])
**Concerns:** ⚠️ Counter field (usedCount) with race condition risk

---

### Lead (CRM)
```
Lead
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ email: String?
├─ phone: String?
├─ source: String (quiz, instagram, indicacao, etc.)
├─ stage: String (novo, contato, proposta, negociacao, ganho, perdido)
├─ notes: String?
├─ monthlyFeeCents: Int?
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)
**Indexes:** @@index([coachId, stage])
**Concerns:** ⚠️ String fields should be ENUMs

---

### Expense (Financeiro)
```
Expense
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ description: String
├─ amountCents: Int
├─ category: String (DEFAULT: outros)
├─ supplier: String?
├─ date: DateTime
├─ recurring: Boolean
├─ notes: String?
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)

---

## 2.6 Templates & Configuration (5 entities)

### SharedWorkoutTemplate
```
SharedWorkoutTemplate
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ description: String?
├─ category: TemplateCategory (ENUM: 4 tipos)
├─ workoutType: WorkoutType?
├─ scope: TemplateScope (ENUM: PERSONAL, TEAM)
├─ tags: String[]
├─ objective: String?
├─ warmup: String?
├─ mainSet: String?
├─ cooldown: String?
├─ notes: String?
├─ structured: Boolean
├─ blocks: Json?
├─ targetPaceSecPerKm: Int?
├─ targetHrZone: String?
├─ targetRpe: Int?
├─ targetDistanceKm: Float?
├─ targetDurationMin: Int?
├─ usedCount: Int ⚠️ CACHE
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)
**Indexes:** @@index([coachId]), @@index([scope])
**Concerns:** ⚠️ Counter field (usedCount) can desync

---

### CoachStrengthTemplate
```
CoachStrengthTemplate
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ description: String?
├─ division: String?
├─ targetLevel: String
├─ focus: String
├─ sessions: Json
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)

---

### CoachRunTemplate
```
CoachRunTemplate
├─ id: String (PK)
├─ coachId: String (FK → Coach)
├─ name: String
├─ description: String?
├─ targetLevel: String
├─ weeklyKm: Float
├─ sessionsPerWeek: Int
├─ focus: String
├─ sessions: Json
├─ createdAt: DateTime
└─ updatedAt: DateTime
```

**Cascades:** onDelete: Cascade (Coach)
**ForeignKeys:** 1 (coachId)

---

## 2.7 Social & Community (4 entities)

### FeedPost
```
FeedPost
├─ id: String (PK)
├─ authorId: String (FK → User)
├─ content: String
├─ imageUrl: String?
├─ workoutSummary: Json?
├─ createdAt: DateTime
└─ comments: FeedComment[]
    likes: FeedLike[]
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 1 (authorId)
**Outgoing:** 2 (comments, likes)
**Indexes:** ⚠️ MISSING @@index([authorId]), @@index([createdAt])

---

### FeedComment
```
FeedComment
├─ id: String (PK)
├─ postId: String (FK → FeedPost)
├─ authorId: String (FK → User)
├─ content: String
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (FeedPost, User)
**ForeignKeys:** 2 (postId, authorId)
**Indexes:** ⚠️ MISSING @@index([postId]), @@index([postId, createdAt])

---

### FeedLike
```
FeedLike
├─ id: String (PK)
├─ postId: String (FK → FeedPost)
├─ userId: String (FK → User)
├─ createdAt: DateTime
└─ @@unique([postId, userId])
```

**Cascades:** onDelete: Cascade (FeedPost, User)
**ForeignKeys:** 2 (postId, userId)
**Constraints:** Unique per post+user

---

### Notification
```
Notification
├─ id: String (PK)
├─ userId: String (FK → User)
├─ title: String
├─ body: String
├─ read: Boolean
└─ createdAt: DateTime
```

**Cascades:** onDelete: Cascade (User)
**ForeignKeys:** 1 (userId)
**Indexes:** ⚠️ MISSING @@index([userId]), @@index([read])
**Concerns:** ⚠️ No cleanup strategy (grows indefinitely)

---

# 3. Cardinalidade Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                 CARDINALIDADE SUMMARY                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1:1 Relationships (15)                                          │
│ ├─ User → Athlete                                              │
│ ├─ User → Coach                                                │
│ ├─ User → BillingSettings                                      │
│ ├─ Athlete → AthleteLoadParams                                 │
│ ├─ Workout → StrengthWorkout                                   │
│ ├─ User → Session (mostly)                                     │
│ ├─ Team ← → Coach                                              │
│ ├─ TrainingPlan ← → Athlete (mostly)                           │
│ ├─ CoachPlan ← → Coach                                         │
│ ├─ PlanProduct ← → Coach                                       │
│ ├─ Voucher ← → User (creator)                                  │
│ ├─ ConnectedDevice ← → User (one per provider)                 │
│ ├─ CoachZoneModel ← → Coach                                    │
│ └─ (more implicit)                                             │
│                                                                  │
│ 1:N Relationships (78)                                          │
│ ├─ User → (10 entities)                                        │
│ │  ├─ Account, Session, Notification                          │
│ │  ├─ Subscription, Payment, ConnectedDevice                  │
│ │  ├─ FeedPost, FeedComment, FeedLike                          │
│ │  └─ WorkoutLogComment, Voucher (created)                    │
│ │                                                               │
│ ├─ Athlete → (11 entities)                                     │
│ │  ├─ Metric, CheckIn, PerformanceTest                        │
│ │  ├─ TrainingPlan, WorkoutLog                                │
│ │  ├─ Race, Achievement, TeamMember                           │
│ │  ├─ PlanPurchase, RecoveryLog                               │
│ │  └─ AthleteLoadParams (1:1)                                 │
│ │                                                               │
│ ├─ Coach → (11 entities)                                       │
│ │  ├─ Athlete, Team, CoachPlan                                │
│ │  ├─ TrainingPlan, Exercise                                  │
│ │  ├─ CoachStrengthTemplate, CoachRunTemplate                 │
│ │  ├─ Lead, Expense, CoachZoneModel                           │
│ │  ├─ PlanProduct, SharedWorkoutTemplate                      │
│ │  └─ (more)                                                  │
│ │                                                               │
│ ├─ TrainingPlan → (1 entity)                                   │
│ │  └─ TrainingWeek                                            │
│ │                                                               │
│ ├─ TrainingWeek → (1 entity)                                   │
│ │  └─ Workout                                                 │
│ │                                                               │
│ ├─ Workout → (2 entities)                                      │
│ │  ├─ WorkoutLog, StrengthWorkout                             │
│ │  └─ (relationship varies)                                   │
│ │                                                               │
│ ├─ WorkoutLog → (1 entity)                                     │
│ │  └─ WorkoutLogComment                                       │
│ │                                                               │
│ ├─ StrengthWorkout → (1 entity)                                │
│ │  └─ StrengthBlock                                           │
│ │                                                               │
│ ├─ Exercise → (2 entities)                                     │
│ │  ├─ ExerciseVideo, StrengthBlock                            │
│ │  └─ (relationship varies)                                   │
│ │                                                               │
│ ├─ PlanProduct → (1 entity)                                    │
│ │  └─ PlanPurchase                                            │
│ │                                                               │
│ ├─ Team → (1 entity)                                           │
│ │  └─ TeamMember                                              │
│ │                                                               │
│ ├─ Subscription → (1 entity)                                   │
│ │  └─ Payment                                                 │
│ │                                                               │
│ ├─ FeedPost → (2 entities)                                     │
│ │  ├─ FeedComment, FeedLike                                   │
│ │  └─ (relationship varies)                                   │
│ │                                                               │
│ └─ (total: 78 relationships)                                   │
│                                                                  │
│ M:N Relationships (2)                                           │
│ ├─ Team ↔ Athlete (via TeamMember)                             │
│ └─ Exercise ↔ StrengthWorkout (via StrengthBlock)             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

# 4. Dependência Grafo — Cascata & Soft Delete

## 4.1 Cascade Delete Chains

```
User (Root)
├─ → Athlete
│   ├─ → Metric
│   ├─ → CheckIn
│   ├─ → PerformanceTest
│   ├─ → TrainingPlan
│   │   └─ → TrainingWeek
│   │       └─ → Workout
│   │           ├─ → WorkoutLog
│   │           │   └─ → WorkoutLogComment
│   │           └─ → StrengthWorkout
│   │               └─ → StrengthBlock
│   ├─ → WorkoutLog
│   │   └─ → WorkoutLogComment
│   ├─ → Race
│   ├─ → Achievement
│   ├─ → TeamMember
│   ├─ → PlanPurchase
│   └─ → RecoveryLog
├─ → Coach
│   ├─ → Athlete (coach assignment)
│   ├─ → Team
│   │   └─ → TeamMember
│   ├─ → CoachPlan
│   ├─ → TrainingPlan
│   ├─ → Exercise
│   │   ├─ → ExerciseVideo
│   │   └─ → StrengthBlock
│   ├─ → CoachStrengthTemplate
│   ├─ → CoachRunTemplate
│   ├─ → Lead
│   ├─ → Expense
│   ├─ → CoachZoneModel
│   ├─ → PlanProduct
│   │   └─ → PlanPurchase
│   └─ → SharedWorkoutTemplate
├─ → Account
├─ → Session
├─ → Notification
├─ → Subscription
│   └─ → Payment
├─ → Payment
├─ → ConnectedDevice
├─ → FeedPost
│   ├─ → FeedComment
│   └─ → FeedLike
├─ → FeedComment
├─ → FeedLike
├─ → WorkoutLogComment
├─ → BillingSettings
└─ → Voucher (FK userId)
    └─ ⚠️ SHOULD HAVE ON DELETE SET NULL
```

---

## 4.2 Orphaned Records Risk

```
⚠️ HIGH RISK — Orphaned Records Possible:

1. WorkoutLog.workoutId [SetNull]
   └─ Orphaned wenn Workout deleted (OK, aber archivieren sollte)

2. Voucher.createdById [FK → User]
   └─ ⚠️ CASCADE DELETE: Voucher deleted wenn User deleted
      → Should be ON DELETE SET NULL (preserve audit trail)

3. VerificationToken
   └─ ⚠️ Expired tokens accumulate (no cleanup)

4. Notification
   └─ ⚠️ Grows indefinitely, no TTL or soft delete
```

---

# 5. Índices — Completo vs Faltando

## 5.1 Existing Indexes (25+)

```
✅ IMPLEMENTADOS:
├─ training_weeks(planId, weekNumber) — UNIQUE + INDEX
├─ workout_logs(athleteId, startedAt)
├─ workout_logs(workoutId)
├─ performance_tests(athleteId, date)
├─ checkins(athleteId, date)
├─ metrics(athleteId, date)
├─ recovery_logs(athleteId, date)
├─ connected_devices(userId) + UNIQUE
├─ shared_workout_templates(coachId)
├─ shared_workout_templates(scope)
├─ leads(coachId, stage)
├─ plan_products(coachId)
├─ plan_purchases(productId, athleteId) — UNIQUE
├─ feed_posts (implicit from PK)
├─ feed_comments (implicit from PK)
├─ feed_likes(postId, userId) — UNIQUE
├─ accounts(provider, providerAccountId) — UNIQUE
├─ sessions(sessionToken) — UNIQUE
└─ (+ all implicit PK indexes)
```

---

## 5.2 Missing Indexes (18+)

```
🔴 FALTANDO:

FK Indexes (Critical):
├─ accounts(userId)
├─ sessions(userId)
├─ notifications(userId)
├─ payments(userId)
├─ subscriptions(userId)
├─ feed_posts(authorId)
├─ feed_comments(postId)
├─ feed_comments(authorId)
├─ workoutlogcomments(workoutLogId)
├─ workout_log_comments(userId)
├─ coach_plans(coachId)
└─ (8 total missing FK indexes)

Filter Indexes:
├─ athletes(status)
├─ athletes(coachId)
├─ workouts(type)
├─ workouts(status)
├─ workout_logs(source)
├─ payments(status)
├─ subscriptions(status)
├─ vouchers(active)
├─ vouchers(active, expiresAt)
├─ coach_plans(active)
├─ notification(read)
└─ races(athleteId, date)

Ordering Indexes:
├─ feed_posts(createdAt)
├─ feed_comments(createdAt)
├─ race(date)
└─ (3 total missing)

GIN Indexes (JSON):
├─ workouts(blocks) — GIN
├─ workout_logs(gpsTrack) — GIN
├─ workout_logs(splits) — GIN
├─ plan_products(planContent) — GIN
├─ coach_zone_models(zones) — GIN
├─ shared_workout_templates(blocks) — GIN
├─ coach_strength_templates(sessions) — GIN
├─ coach_run_templates(sessions) — GIN
└─ feed_posts(workoutSummary) — GIN

Cleanup Indexes:
└─ verification_tokens(expires)
```

---

# 6. Foreign Key Constraints

## 6.1 FK Summary Table

```
┌─────────────────┬──────────────────┬───────────────┬──────────────┐
│ Child Table     │ FK Column        │ Parent Table  │ Cascade      │
├─────────────────┼──────────────────┼───────────────┼──────────────┤
│ Account         │ userId           │ User          │ CASCADE ✅   │
│ Session         │ userId           │ User          │ CASCADE ✅   │
│ Athlete         │ userId           │ User          │ CASCADE ✅   │
│ Athlete         │ coachId          │ Coach         │ (no rule)    │
│ Coach           │ userId           │ User          │ CASCADE ✅   │
│ Team            │ coachId          │ Coach         │ (no rule)    │
│ TeamMember      │ teamId           │ Team          │ CASCADE ✅   │
│ TeamMember      │ athleteId        │ Athlete       │ CASCADE ✅   │
│ TrainingPlan    │ athleteId        │ Athlete       │ CASCADE ✅   │
│ TrainingPlan    │ coachId          │ Coach         │ (no rule)    │
│ TrainingWeek    │ planId           │ TrainingPlan  │ CASCADE ✅   │
│ Workout         │ weekId           │ TrainingWeek  │ CASCADE ✅   │
│ WorkoutLog      │ workoutId        │ Workout       │ SETNULL ✅   │
│ WorkoutLog      │ athleteId        │ Athlete       │ CASCADE ✅   │
│ WorkoutLogComment│ workoutLogId     │ WorkoutLog    │ CASCADE ✅   │
│ WorkoutLogComment│ userId           │ User          │ CASCADE ✅   │
│ StrengthWorkout │ workoutId        │ Workout       │ CASCADE ✅   │
│ StrengthBlock   │ strengthWorkoutId│ StrengthWorkout│ CASCADE ✅  │
│ StrengthBlock   │ exerciseId       │ Exercise      │ (no rule)    │
│ Exercise        │ coachId          │ Coach         │ (no rule)    │
│ ExerciseVideo   │ exerciseId       │ Exercise      │ CASCADE ✅   │
│ PerformanceTest │ athleteId        │ Athlete       │ CASCADE ✅   │
│ CheckIn         │ athleteId        │ Athlete       │ CASCADE ✅   │
│ Metric          │ athleteId        │ Athlete       │ CASCADE ✅   │
│ Race            │ athleteId        │ Athlete       │ CASCADE ✅   │
│ Achievement     │ athleteId        │ Athlete       │ CASCADE ✅   │
│ RecoveryLog     │ athleteId        │ Athlete       │ CASCADE ✅   │
│ AthleteLoadParams│ athleteId        │ Athlete       │ CASCADE ✅   │
│ FeedPost        │ authorId         │ User          │ CASCADE ✅   │
│ FeedComment     │ postId           │ FeedPost      │ CASCADE ✅   │
│ FeedComment     │ authorId         │ User          │ CASCADE ✅   │
│ FeedLike        │ postId           │ FeedPost      │ CASCADE ✅   │
│ FeedLike        │ userId           │ User          │ CASCADE ✅   │
│ Notification    │ userId           │ User          │ CASCADE ✅   │
│ ConnectedDevice │ userId           │ User          │ CASCADE ✅   │
│ Subscription    │ userId           │ User          │ CASCADE ✅   │
│ Payment         │ userId           │ User          │ CASCADE ✅   │
│ Payment         │ subscriptionId    │ Subscription  │ (no rule)    │
│ CoachPlan       │ coachId          │ Coach         │ CASCADE ✅   │
│ PlanProduct     │ coachId          │ Coach         │ CASCADE ✅   │
│ PlanPurchase    │ productId        │ PlanProduct   │ CASCADE ✅   │
│ PlanPurchase    │ athleteId        │ Athlete       │ CASCADE ✅   │
│ Voucher         │ createdById      │ User          │ CASCADE ⚠️   │
│ Lead            │ coachId          │ Coach         │ CASCADE ✅   │
│ Expense         │ coachId          │ Coach         │ CASCADE ✅   │
│ BillingSettings │ userId           │ User          │ CASCADE ✅   │
│ CoachStrengthTempl│ coachId         │ Coach         │ CASCADE ✅   │
│ CoachRunTemplate│ coachId          │ Coach         │ CASCADE ✅   │
│ CoachZoneModel  │ coachId          │ Coach         │ CASCADE ✅   │
│ SharedWorkoutTempl│ coachId         │ Coach         │ CASCADE ✅   │
└─────────────────┴──────────────────┴───────────────┴──────────────┘
```

---

# 7. Entidades por Modelo de Relacionamento

## 7.1 Hierarchical Trees

```
USER (Root)
│
├─ ATHLETE (1:1)
│  └─ Athlete Dependents (1:N)
│     ├─ Metric (time series)
│     ├─ CheckIn (daily wellness)
│     ├─ PerformanceTest (assessments)
│     ├─ TrainingPlan (parent of week)
│     │  └─ TrainingWeek
│     │     └─ Workout
│     │        ├─ WorkoutLog (execution)
│     │        │  └─ WorkoutLogComment (feedback)
│     │        └─ StrengthWorkout
│     │           └─ StrengthBlock
│     ├─ WorkoutLog (direct)
│     │  └─ WorkoutLogComment
│     ├─ Race (competitions)
│     ├─ Achievement (badges)
│     ├─ RecoveryLog (time series)
│     ├─ AthleteLoadParams (config)
│     ├─ TeamMember (group)
│     └─ PlanPurchase (purchases)
│
├─ COACH (1:1)
│  └─ Coach Dependents (1:N)
│     ├─ Athlete (coaching)
│     ├─ Team (group)
│     │  └─ TeamMember
│     ├─ CoachPlan (subscription)
│     ├─ TrainingPlan (prescribed)
│     ├─ Exercise (library)
│     │  ├─ ExerciseVideo (media)
│     │  └─ StrengthBlock (usage)
│     ├─ CoachStrengthTemplate (template)
│     ├─ CoachRunTemplate (template)
│     ├─ Lead (CRM)
│     ├─ Expense (financeiro)
│     ├─ CoachZoneModel (config)
│     ├─ PlanProduct (marketplace)
│     │  └─ PlanPurchase
│     └─ SharedWorkoutTemplate (library)
│
├─ Account, Session (OAuth)
├─ Notification (alerts)
├─ Subscription → Payment (billing)
├─ ConnectedDevice (wearables)
├─ FeedPost → (FeedComment, FeedLike) (social)
├─ WorkoutLogComment (feedback)
├─ BillingSettings (payment config)
└─ Voucher (discount) ← created
```

---

## 7.2 Artifact Tables

```
Most Impactful Deletions (User Cascades):

DELETE User
  CASCADE 1 Athlete
    CASCADE 11 entities
      CASCADE 20 sub-entities
        Total potential cascade: 50+ records
  CASCADE 1 Coach
    CASCADE 11 entities
      CASCADE 20 sub-entities
        Total potential cascade: 50+ records

Risk: MASSIVE DATA LOSS on accidental User delete
Solution: Soft delete User, restrict hard delete to admin with audit
```

---

# 8. Constraints & Business Rules

## 8.1 Unique Constraints

```
✅ IMPLEMENTADOS:

├─ User(email) — UNIQUE
├─ Coach(userId) — UNIQUE (1:1)
├─ Athlete(userId) — UNIQUE (1:1)
├─ Coach(slug) — UNIQUE (public URL)
├─ Account(provider, providerAccountId) — UNIQUE
├─ Session(sessionToken) — UNIQUE
├─ ConnectedDevice(userId, provider) — UNIQUE
├─ VerificationToken(token) — UNIQUE
├─ VerificationToken(identifier, token) — UNIQUE
├─ TrainingWeek(planId, weekNumber) — UNIQUE
├─ WorkoutLog(stravaActivityId) — UNIQUE
├─ Voucher(code) — UNIQUE
├─ PlanProduct(slug) — UNIQUE
├─ PlanPurchase(productId, athleteId) — UNIQUE
├─ FeedLike(postId, userId) — UNIQUE (like once per post)
├─ BillingSettings(userId) — UNIQUE (1:1)
├─ TeamMember(teamId, athleteId) — UNIQUE
└─ AthleteLoadParams(athleteId) — UNIQUE (1:1)
```

---

## 8.2 Business Rules

```
APPLIED:

├─ Athlete.coachId is optional (coach can be unassigned)
├─ Athlete.status is string (should be ENUM)
├─ Workout.status default AGENDADO (not yet released)
├─ Payment.status default PENDING
├─ Voucher.active default true
├─ CoachPlan.active default true
├─ Subscription.status default TRIAL
├─ User.role default ATHLETE
├─ Athlete.level default INICIANTE
└─ ConnectedDevice is unique per provider (one Garmin per user)

NOT APPLIED:

├─ ⚠️ Soft delete (User, Athlete, Coach)
├─ ⚠️ Audit trail (who changed what when)
├─ ⚠️ Data encryption at rest (sensitive fields)
├─ ⚠️ TTL on VerificationToken
├─ ⚠️ TTL on Notification
├─ ⚠️ Constraint on Payment.amount > 0
├─ ⚠️ Constraint on Voucher usage (usedCount validation)
├─ ⚠️ Constraint on CoachPlan.maxSlots vs usedSlots
└─ ⚠️ Trigger to update counter fields atomically
```

---

# 9. Data Integrity Issues

## 9.1 Redundancy Risks

```
🔴 HIGH RISK:

1. Athlete.coachId vs TrainingPlan.coachId
   └─ Can diverge: athlete with coach A, plan from coach B

2. Athlete.raceDate vs Race.date
   └─ Cache field: Race.date is source of truth

3. Athlete.recoveryScore vs RecoveryLog.score
   └─ Cache field: RecoveryLog is source of truth

4. CoachPlan.usedSlots vs COUNT(Athlete WHERE coachId = ?)
   └─ Counter field: can desync with actual data

5. PlanProduct.purchases vs COUNT(PlanPurchase WHERE productId = ?)
   └─ Counter field: can desync

6. PlanProduct.ratingCount vs COUNT(Rating WHERE productId = ?)
   └─ Counter field: no Rating model exists yet

7. SharedWorkoutTemplate.usedCount vs COUNT(?)
   └─ Counter field: no usage tracking exists

8. Voucher.usedCount vs COUNT(Payment WHERE voucherId = ?)
   └─ Counter field: race condition on concurrent usage
```

---

## 9.2 Missing Constraints

```
⚠️ DADOS DESPROTEGIDOS:

├─ No constraint: Payment.amountCents > 0
├─ No constraint: PerformanceTest.distanceM > 0
├─ No constraint: Workout.targetDistanceKm > 0
├─ No constraint: CoachPlan.priceCents >= 0
├─ No constraint: PlanProduct.priceCents >= 0
├─ No constraint: Voucher.value > 0
├─ No constraint: CheckIn values 0-10
├─ No constraint: Metric values reasonable ranges
├─ No constraint: Athlete.adherenceRate 0-1
├─ No constraint: Athlete.recoveryScore 0-1
└─ No constraint: RecoveryLog.score 0-1
```

---

# 10. Enumerations (13 Total)

```
UserRole (3)
├─ ADMIN
├─ COACH
└─ ATHLETE

Sex (3)
├─ MASCULINO
├─ FEMININO
└─ OUTRO

Goal (8)
├─ CINCO_KM
├─ DEZ_KM
├─ VINTE_E_UM_KM
├─ QUARENTA_E_DOIS_KM
├─ ULTRAMARATONA
├─ EMAGRECIMENTO
├─ PERFORMANCE
└─ RETORNO_AS_CORRIDAS

ExperienceLevel (4)
├─ INICIANTE
├─ INTERMEDIARIO
├─ AVANCADO
└─ PRO

CyclePhase (6)
├─ BASE
├─ CONSTRUCAO
├─ ESPECIFICO
├─ POLIMENTO
├─ COMPETICAO
└─ RECUPERACAO

WorkoutType (15)
├─ RODAGEM_LEVE, INTERVALADO_CURTO, INTERVALADO_LONGO
├─ TEMPO_RUN, FARTLEK, PROGRESSIVO, LONGAO
├─ REGENERATIVO, SUBIDA, TECNICA, PROVA
├─ FORCA, FUNCIONAL, MOBILIDADE, RECUPERACAO

WorkoutStatus (5)
├─ AGENDADO
├─ LIBERADO
├─ CONCLUIDO
├─ PERDIDO
└─ AJUSTADO

StrengthSplit (7)
├─ AB, ABC, ABCD, ABCDE, FULL_BODY, UPPER_LOWER, PERSONALIZADA

ExerciseCategory (10)
├─ FORCA, HIPERTROFIA, CORE, MOBILIDADE, PLIOMETRIA
├─ PREVENCAO, GLUTEOS, PANTURRILHAS, JOELHO, QUADRIL, TORNOZELO

TestType (7)
├─ COOPER, CINCO_MINUTOS, TRES_KM
├─ DOIS_MIL_E_QUATROCENTOS_M, VAM, RAST, LIMIAR

DeviceProvider (8)
├─ GARMIN, COROS, POLAR, SUUNTO, APPLE_WATCH
├─ GOOGLE_FIT, STRAVA, HEALTHKIT

SubscriptionPlan (4)
├─ FREE, ATHLETE, COACH, TEAM

SubscriptionStatus (4)
├─ TRIAL, ACTIVE, PAST_DUE, CANCELED

PaymentStatus (4)
├─ PENDING, PAID, FAILED, REFUNDED

VoucherType (2)
├─ PERCENT, FREE_MONTHS

VoucherAudience (3)
├─ B2C, B2B, ALL

PlanPeriod (4)
├─ MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL

ReceivingMethod (4)
├─ PIX, PAGBANK, MERCADOPAGO, STRIPE

TemplateScope (2)
├─ PERSONAL, TEAM

TemplateCategory (4)
├─ CORRIDA, FORCA, MOBILIDADE, FUNCIONAL
```

---

# 11. Summary Statistics

```
┌─────────────────────────────────────────────────────────┐
│            DATABASE STATISTICS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Entidades:                43                           │
│ Foreign Keys:             95+                          │
│ Índices:                  25+ (missing: 18+)           │
│ Unique Constraints:       17                           │
│ Enumerations:             13                           │
│                                                         │
│ Cascade Rules:            38 (Cascade)                 │
│ SetNull Rules:            1                            │
│                                                         │
│ 1:1 Relationships:        15                           │
│ 1:N Relationships:        78                           │
│ M:N Relationships:        2                            │
│ Total Relationships:      95+                          │
│                                                         │
│ Levels (Hierarchy):       7 layers                     │
│ Max Cascade Depth:        5-6 levels                   │
│                                                         │
│ Critical FK Indexes:      8 missing                    │
│ Filter Indexes:           10+ missing                  │
│ Ordering Indexes:         3 missing                    │
│ GIN Indexes (JSON):       8 missing                    │
│                                                         │
│ Soft Deletes:             0 (should have 5+)           │
│ Audit Trail:              0 (missing)                  │
│ Data Encryption:          0 (missing)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# 12. ERD — Text Legend

```
Symbols:
├─ "→" = Foreign Key (points to parent)
├─ "←" = Incoming relationship (child points to me)
├─ "↔" = Bidirectional (1:1)
├─ "1:N" = One-to-Many
├─ "M:N" = Many-to-Many
├─ "?" = Optional (nullable)
├─ "!" = Required (not null)
├─ "*" = Default value
├─ "⚠️" = Issue/Warning
├─ "✅" = Good/Implemented
├─ "🔴" = High Risk
├─ "🟡" = Medium Risk
└─ "(comment)" = Explanation
```

---

# 13. Próximos Passos (Recomendado)

## Immediate (P1)

- [ ] Add missing FK indexes (8+)
- [ ] Add missing filter indexes (10+)
- [ ] Converter User.role, Athlete.status para ENUMs
- [ ] Implementar soft delete para User, Athlete, Coach
- [ ] Criptografar BillingSettings fields sensíveis

## Short-term (P2)

- [ ] Remover redundância (coachId duplicado)
- [ ] Implementar cleanup para VerificationToken, Notification
- [ ] Adicionar constraints de validação (amount > 0, etc.)
- [ ] Implementar trigger para counter fields (usedSlots, usedCount)
- [ ] Adicionar GIN indexes para JSON fields

## Medium-term (P3)

- [ ] Implementar audit trail (quem/quando/o quê mudou)
- [ ] Refatorar AthleteLoadParams (sport-specific)
- [ ] Adicionar Rating model para PlanProduct
- [ ] Implementar usage tracking para SharedWorkoutTemplate
- [ ] Adicionar CoachingAssignment model (histórico)

---

**Gerado em:** 2026-07-08  
**Versão:** 0.1.0  
**Status:** ✅ Completo | 🟡 Requer Melhorias
