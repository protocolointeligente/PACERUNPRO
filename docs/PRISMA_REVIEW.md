# PRISMA SCHEMA REVIEW — PACERUNPRO

**Data:** 2026-07-08  
**Status:** Análise Crítica Detalhada  
**Versão:** 0.1.0  
**Total de Modelos:** 43

---

# Executive Summary

O schema Prisma está **bem estruturado globalmente**, mas apresenta **14 riscos críticos** em relação a performance, integridade e redundância. Principais achados:

| Categoria | Severidade | Qtd | Status |
|-----------|-----------|-----|--------|
| Índices Ausentes | 🔴 Alta | 18 | Requer ação |
| Redundância de Dados | 🟡 Média | 7 | Monitorar |
| Campos Subutilizados | 🟡 Média | 6 | Revisar |
| Validação Frágil | 🟡 Média | 5 | Migrar para Enum |
| Riscos de Integridade | 🔴 Alta | 4 | Requer ação |
| Json Fields sem Índice | 🟡 Média | 9 | Considerar GIN |

---

# 1. Relações Incorretas ou Problemáticas

## 1.1 🔴 Redundância: User.image vs User.avatarUrl vs User.bannerUrl

**Problema:**
```prisma
model User {
  image         String?       // ← OAuth provider photo
  avatarUrl     String?       // ← User upload
  bannerUrl     String?       // ← User upload
  ...
}
```

**Impacto:**
- Confusão sobre qual campo usar
- Potencial sincronização duplicada de avatares
- Lógica de "qual imagem mostrar" espalha-se pelo codebase

**Recomendação:**
```prisma
// Opção 1: Consolidar em um único campo
model User {
  avatarUrl     String?       // Única fonte de verdade
  // Remover: image, bannerUrl
}

// Opção 2: Ser explícito sobre proveniência
model User {
  avatarUrl     String?       // Sempre user-provided
  oauthImage    String?       // Fallback from OAuth
  bannerUrl     String?       // User banner
}
```

**Prioridade:** P2 (2-4 semanas)

---

## 1.2 🔴 Redundância: Athlete.coachId + TrainingPlan.coachId

**Problema:**
```prisma
model Athlete {
  coachId  String?     // Coach atribuído
  coach    Coach? @relation(...)
}

model TrainingPlan {
  athleteId  String
  athlete    Athlete @relation(...)
  coachId    String?    // Duplica Athlete.coachId
  coach      Coach? @relation(...)
}
```

**Impacto:**
- TrainingPlan.coachId pode divergir de Athlete.coachId
- Possível inconsistência: atleta com coach A, mas plano criado por coach B
- Queries mais complexas para validar integridade

**Recomendação:**
```prisma
model TrainingPlan {
  athleteId  String
  athlete    Athlete @relation(...)
  // coachId pode ser derivado ou cache invalidado

  // OU se realmente podem ser diferentes:
  createdByCoachId  String?   // Quem criou o plano
  coach           Coach? @relation(...)
}
```

**Questão para Product:** Um atleta pode ter planos de coaches diferentes? Se não, remover `coachId`.

**Prioridade:** P1 (imediato)

---

## 1.3 🟡 Relação Fraca: Athlete.coachId (0..1)

**Problema:**
```prisma
model Athlete {
  coachId   String?      // Opcional, sem histórico
}
```

**Impacto:**
- Sem rastreamento de histórico de coaches
- Sem datas de quando o coaching iniciou/terminou
- Sem suporte a "coaching relationships"

**Recomendação:**
```prisma
model CoachingAssignment {
  id         String @id @default(cuid())
  coachId    String
  coach      Coach @relation(fields: [coachId], references: [id])
  athleteId  String
  athlete    Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  
  assignedAt DateTime @default(now())
  unassignedAt DateTime?
  reason     String?
  
  @@unique([coachId, athleteId])  // Um coach por atleta por vez
  @@index([athleteId])
  @@index([coachId])
}

// Remover Athlete.coachId
model Athlete {
  // coachId  String? ← REMOVER
  // coach    Coach? ← REMOVER
  
  // Em vez disso:
  coachingAssignments CoachingAssignment[]
}
```

**Prioridade:** P2 (refactoring futuro)

---

# 2. Redundâncias e Data Desincronização

## 2.1 🔴 Cache Counters Propensos a Desincronização

Existem 4 campos **counter** que podem divergir da realidade:

### CoachPlan.usedSlots
```prisma
model CoachPlan {
  maxSlots   Int?    // null = ilimitado
  usedSlots  Int @default(0)  // ← PODE DESINCRONIZAR
}
```

**Risco:** Se Athlete.coachId atualizar, usedSlots não é decrementado.

**Recomendação:**
```prisma
// Option 1: Remover counter, usar COUNT query
// Quando precisar: SELECT COUNT(*) FROM athletes WHERE coachId = ?

// Option 2: Usar trigger PostgreSQL
CREATE TRIGGER update_coach_plan_slots
AFTER INSERT/DELETE ON athletes
FOR EACH ROW
EXECUTE FUNCTION update_coach_plan_slots_fn();
```

### PlanProduct.purchases
```prisma
model PlanProduct {
  purchases  Int @default(0)  // ← PODE DESINCRONIZAR
}
```

**Risco:** Cada PlanPurchase criada deve incrementar, mas pode falhar.

### Voucher.usedCount
```prisma
model Voucher {
  usedCount  Int @default(0)  // ← PODE DESINCRONIZAR
}
```

**Risco:** Contador sem transação atômica = race condition.

### SharedWorkoutTemplate.usedCount
```prisma
model SharedWorkoutTemplate {
  usedCount  Int @default(0)  // ← PODE DESINCRONIZAR
}
```

**Recomendação:** Remover todos os counters, usar `COUNT()` em queries.

**Prioridade:** P1 (Alto risco de inconsistência)

---

## 2.2 🟡 Athlete.recoveryScore — Cache sem TTL

```prisma
model Athlete {
  recoveryScore Float @default(0)  // ← Cache?
  recoveryLogs  RecoveryLog[]      // ← Fonte de verdade?
}
```

**Problema:**
- Qual é a fonte de verdade? RecoveryLog.score ou Athlete.recoveryScore?
- Score não tem timestamp, pode estar desatualizado

**Recomendação:**
```prisma
// Remover Athlete.recoveryScore
// Derivar via VIEW ou app-level cache:

// View PostgreSQL:
CREATE VIEW athlete_latest_recovery AS
SELECT athleteId, score, date
FROM recovery_logs
WHERE date = (
  SELECT MAX(date) FROM recovery_logs rl2 
  WHERE rl2.athleteId = recovery_logs.athleteId
);

// App-level (Prisma):
const latest = await prisma.recoveryLog.findFirst({
  where: { athleteId },
  orderBy: { date: 'desc' }
});
```

**Prioridade:** P2 (2-4 semanas)

---

## 2.3 🟡 PlanProduct.ratingCount Redundante

```prisma
model PlanProduct {
  rating      Float?
  ratingCount Int @default(0)  // ← Derivável
}
```

**Problema:** Sem modelo de `Review` ou `Rating`, como ratingCount é gerenciado?

**Recomendação:**
- Se não existe modelo de avaliação, remover estes campos
- Se existe (comentários em WorkoutLogComment?), criar modelo explícito:

```prisma
model PlanProductReview {
  id         String @id @default(cuid())
  productId  String
  product    PlanProduct @relation(...)
  athleteId  String
  athlete    Athlete @relation(...)
  
  rating     Int  // 1-5
  comment    String?
  createdAt  DateTime @default(now())
  
  @@unique([productId, athleteId])
  @@index([productId])
}
```

**Prioridade:** P2 (refactoring)

---

## 2.4 🟡 AthleteLoadParams — Muitos Campos Opcionais

```prisma
model AthleteLoadParams {
  thresholdPaceSecPerKm   Int?      // Corrida
  ftpWatts                Int?      // Ciclismo
  swimThresholdSecPer100m Int?      // Natação
  hrMax                   Int?      // FC
  hrRest                  Int?      // FC
}
```

**Problema:**
- Modelo muito genérico, tudo opcional
- Difícil saber quais campos são realmente utilizados
- Sem versioning de mudança de parâmetros

**Recomendação:**
```prisma
// Separar por sport:
model AthleteRunLoadParams {
  athleteId              String @unique
  athlete                Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  thresholdPaceSecPerKm  Int?
  hrMax                  Int?
  hrRest                 Int?
  updatedAt              DateTime @updatedAt
}

model AthleteSwimLoadParams {
  athleteId              String @unique
  athlete                Athlete @relation(...)
  swimThresholdSecPer100m Int?
  updatedAt              DateTime @updatedAt
}

// Com versionamento:
model AthleteLoadParamHistory {
  id                     String @id @default(cuid())
  athleteId              String
  athlete                Athlete @relation(...)
  sport                  String  // CORRIDA | CICLISMO | NATACAO
  key                    String  // thresholdPaceSecPerKm, ftpWatts, etc.
  valueOld               String?
  valueNew               String?
  changedAt              DateTime @default(now())
  
  @@index([athleteId, sport])
}
```

**Prioridade:** P2

---

# 3. Campos Nunca Utilizados

## 3.1 🟡 Identificação Suspeitosa de Campos Ociosos

Baseado no audit anterior, os seguintes campos podem estar subutilizados:

| Campo | Modelo | Risco | Ação |
|-------|--------|-------|------|
| `User.bannerUrl` | User | 🟡 Uso baixo | Verificar uso no frontend |
| `Coach.logoUrl` | Coach | 🟡 Redundante com User.image? | Consolidar |
| `Athlete.recentBestTime` | Athlete | 🟡 String frágil | Usar Race.resultTime |
| `Athlete.raceDate` | Athlete | 🟡 Duplica Race.date | Remover |
| `Exercise.commonMistakes` | Exercise | 🟡 Complexo | Verificar UI |
| `Notification` (inteira) | Notification | 🟡 Muito genérica | Adicionar type, actionUrl |

**Recomendação:**

```bash
# Verificar uso no codebase:
grep -r "bannerUrl" src/
grep -r "logoUrl" src/
grep -r "commonMistakes" src/
grep -r "recentBestTime" src/
```

**Prioridade:** P3 (antes da produção, audit de uso)

---

## 3.2 🟡 Athlete.raceDate vs Race.date

```prisma
model Athlete {
  raceDate DateTime?  // Próxima prova?
}

model Race {
  date DateTime
}
```

**Problema:**
- Athlete.raceDate é cache de Race mais próxima?
- Pode desincronizar

**Recomendação:**
```prisma
// View para prova mais próxima:
CREATE VIEW next_athlete_race AS
SELECT athleteId, date, name
FROM races
WHERE date > NOW()
ORDER BY date ASC
LIMIT 1;

// No Prisma:
const nextRace = await prisma.race.findFirst({
  where: { athleteId, date: { gt: new Date() } },
  orderBy: { date: 'asc' }
});
```

**Prioridade:** P2

---

# 4. Índices Ausentes — 18 Problemas Identificados

## 4.1 🔴 CRÍTICO: Foreign Keys sem Índices

PostgreSQL cria índice automaticamente em UNIQUE constraints e PRIMARY KEYS, mas não em FKs normais.

### User Relations — Sem índice em relacionamentos

```prisma
model Notification {
  userId String
  user   User @relation(...)
  // ❌ Sem índice em userId
  // Query problema: SELECT * FROM notifications WHERE userId = ?
}

model Payment {
  userId String
  user   User @relation(...)
  // ❌ Sem índice em userId
}

model ConnectedDevice {
  userId String  // ✅ Tem @@index([userId])
  // ✅ OK
}

model Subscription {
  userId String
  user   User @relation(...)
  // ❌ Sem índice em userId
}
```

**Fix:**
```prisma
model Notification {
  id      String @id
  userId  String
  user    User @relation(...) 
  
  @@index([userId])
}

model Payment {
  id      String @id
  userId  String
  user    User @relation(...)
  
  @@index([userId])
}

model Subscription {
  id      String @id
  userId  String
  user    User @relation(...)
  
  @@index([userId])
}
```

---

### Coach Relations — Sem Índices Estratégicos

```prisma
model CoachPlan {
  coachId String
  coach   Coach @relation(...)
  // ❌ Sem índice
  // Query: SELECT * FROM coach_plans WHERE coachId = ?
  
  active  Boolean @default(true)
  // ❌ Sem índice em active
  // Query: SELECT * FROM coach_plans WHERE coachId = ? AND active = true
}

model Lead {
  coachId String
  coach   Coach @relation(...)
  
  // ✅ Tem @@index([coachId, stage])
  // Bom! Mas falta criatedAt para ordenação
}
```

**Fix:**
```prisma
model CoachPlan {
  coachId String
  coach   Coach @relation(...)
  active  Boolean @default(true)
  
  @@index([coachId])
  @@index([coachId, active])
  @@index([active])
}

model Lead {
  coachId String
  coach   Coach @relation(...)
  stage   String
  createdAt DateTime @default(now())
  
  @@index([coachId, stage])
  @@index([coachId, createdAt])  // ← Adicionar
}
```

---

## 4.2 🟡 ATENÇÃO: Índices em Colunas de Filtro Frequente

### Athlete — Status, Coaching Status

```prisma
model Athlete {
  status  String @default("ativo")  // ativo | risco | inativo
  coachId String?
  createdAt DateTime @default(now())
  
  // ❌ Sem índice
  // Queries frequentes:
  //   - SELECT COUNT(*) FROM athletes WHERE status = 'risco'
  //   - SELECT * FROM athletes WHERE coachId = ? AND status = 'ativo'
}
```

**Fix:**
```prisma
model Athlete {
  userId String @unique
  coachId String?
  status String @default("ativo")
  createdAt DateTime @default(now())
  
  @@index([coachId])
  @@index([status])
  @@index([coachId, status])
  @@index([createdAt])
}
```

---

### Workout — Type, Status

```prisma
model Workout {
  weekId String
  type   WorkoutType
  status WorkoutStatus @default(AGENDADO)
  date   DateTime
  
  // ✅ Tem @@index([weekId, date])
  // ❌ Falta índice em type, status
  // Queries frequentes:
  //   - SELECT * FROM workouts WHERE type = 'FORCA' AND weekId = ?
  //   - SELECT * FROM workouts WHERE status = 'LIBERADO'
}
```

**Fix:**
```prisma
model Workout {
  weekId String
  type   WorkoutType
  status WorkoutStatus @default(AGENDADO)
  date   DateTime
  
  @@index([weekId, date])
  @@index([type])
  @@index([status])
  @@index([weekId, status])
}
```

---

### WorkoutLog — Source, Status

```prisma
model WorkoutLog {
  source String @default("manual")  // manual | strava | garmin | ...
  // ❌ Sem índice
  // Queries frequentes:
  //   - SELECT * FROM workout_logs WHERE source = 'strava'
  //   - SELECT * FROM workout_logs WHERE source = 'strava' AND athleteId = ?
}
```

**Fix:**
```prisma
model WorkoutLog {
  athleteId String
  source String @default("manual")
  startedAt DateTime?
  
  @@index([athleteId, startedAt])
  @@index([source])
  @@index([source, athleteId])
}
```

---

### FeedPost, FeedComment — Sem Índices de Ordenação

```prisma
model FeedPost {
  authorId String
  createdAt DateTime @default(now())
  
  // ❌ Sem índices
  // Queries frequentes:
  //   - SELECT * FROM feed_posts ORDER BY createdAt DESC
  //   - SELECT * FROM feed_posts WHERE authorId = ?
}

model FeedComment {
  postId String
  authorId String
  createdAt DateTime @default(now())
  
  // ❌ Sem índices
  // Query: SELECT * FROM feed_comments WHERE postId = ? ORDER BY createdAt
}
```

**Fix:**
```prisma
model FeedPost {
  authorId String
  createdAt DateTime @default(now())
  
  @@index([authorId])
  @@index([createdAt])
}

model FeedComment {
  postId String
  authorId String
  createdAt DateTime @default(now())
  
  @@index([postId])
  @@index([authorId])
  @@index([postId, createdAt])
}
```

---

### Account — userId Sem Índice

```prisma
model Account {
  userId String
  user   User @relation(...)
  
  // ❌ Sem índice em userId
  // ✅ Tem @@unique([provider, providerAccountId])
  // Mas query "SELECT * FROM accounts WHERE userId = ?" será lenta
}
```

**Fix:**
```prisma
model Account {
  userId String
  
  @@index([userId])
  @@unique([provider, providerAccountId])
}
```

---

### Voucher — active e expiresAt

```prisma
model Voucher {
  code      String @unique
  active    Boolean @default(true)
  expiresAt DateTime?
  
  // ❌ Sem índice
  // Queries frequentes:
  //   - SELECT * FROM vouchers WHERE code = ? AND active = true AND expiresAt > NOW()
}
```

**Fix:**
```prisma
model Voucher {
  code      String @unique
  active    Boolean @default(true)
  expiresAt DateTime?
  
  @@index([active])
  @@index([active, expiresAt])
}
```

---

### Race — Data sem Índice

```prisma
model Race {
  athleteId String
  date      DateTime
  
  // ❌ Sem índices
  // Queries frequentes:
  //   - SELECT * FROM races WHERE athleteId = ? AND date > NOW()
}
```

**Fix:**
```prisma
model Race {
  athleteId String
  date      DateTime
  
  @@index([athleteId])
  @@index([athleteId, date])
}
```

---

## 4.3 Resumo de Índices Faltando

| Modelo | Campo(s) | Recomendação | Prioridade |
|--------|----------|--------------|-----------|
| **Notification** | userId | @@index([userId]) | 🔴 Alto |
| **Payment** | userId, status | @@index([userId]), @@index([status]) | 🔴 Alto |
| **Subscription** | userId, status | @@index([userId]), @@index([status]) | 🔴 Alto |
| **Account** | userId | @@index([userId]) | 🔴 Alto |
| **CoachPlan** | coachId, active | @@index([coachId]), @@index([active]) | 🟡 Médio |
| **Athlete** | status, coachId | @@index([status]), @@index([coachId]) | 🟡 Médio |
| **Workout** | type, status | @@index([type]), @@index([status]) | 🟡 Médio |
| **WorkoutLog** | source | @@index([source]) | 🟡 Médio |
| **FeedPost** | createdAt, authorId | @@index([createdAt]), @@index([authorId]) | 🟡 Médio |
| **FeedComment** | postId, createdAt | @@index([postId, createdAt]) | 🟡 Médio |
| **Voucher** | active, expiresAt | @@index([active, expiresAt]) | 🟡 Médio |
| **Race** | athleteId, date | @@index([athleteId, date]) | 🟡 Médio |
| **Lead** | createdAt | Adicionar ao índice existente | 🟡 Médio |
| **ConnectedDevice** | provider | @@index([provider]) | 🟡 Médio |

**Prioridade Global:** 🔴 P1 (imediato)

---

# 5. Riscos de Integridade

## 5.1 🔴 Hard Delete com Cascata — Perda de Dados

```prisma
model User {
  athlete       Athlete? @relation(..., onDelete: Cascade)  // ❌ Risco
  coach         Coach? @relation(..., onDelete: Cascade)    // ❌ Risco
  subscriptions Subscription[] @relation(..., onDelete: Cascade)  // ❌ Risco
}
```

**Impacto:**
- Deletar User deleta Athlete, Coach, Subscriptions, Payments, etc.
- Sem auditoria, sem recuperação
- LGPD compliance: dados deletados sem rastreamento

**Recomendação:**

```prisma
// Implementar Soft Delete:
model User {
  id        String @id @default(cuid())
  deletedAt DateTime?  // ← Soft delete flag
  
  athlete   Athlete?
  coach     Coach?
  ...
}

// Queries sempre filtram:
const users = await prisma.user.findMany({
  where: { deletedAt: null }
});

// Hard delete só após retenção (ex: 90 dias):
const expiredUsers = await prisma.user.findMany({
  where: {
    deletedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }
});
```

**Prioridade:** 🔴 P1 (LGPD compliance)

---

## 5.2 🟡 VerificationToken — Sem Limpeza Automática

```prisma
model VerificationToken {
  identifier String
  token      String @unique
  expires    DateTime
  
  // ❌ Sem índice em expires
  // ❌ Sem trigger para limpar expirados
}
```

**Problema:**
- Tokens expirados acumulam
- Queries lentas se muitos expirados

**Recomendação:**
```prisma
model VerificationToken {
  identifier String
  token      String @unique
  expires    DateTime
  createdAt  DateTime @default(now())
  
  @@index([expires])
  @@index([token, expires])
}

// PostgreSQL trigger:
CREATE FUNCTION cleanup_verification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens WHERE expires < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_verification_tokens_trigger
AFTER INSERT ON verification_tokens
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_verification_tokens();

-- Ou via Prisma job (scheduler):
// cron job a cada 1 hora
await prisma.verificationToken.deleteMany({
  where: { expires: { lt: new Date() } }
});
```

**Prioridade:** P2

---

## 5.3 🟡 Notification — Sem Limpeza

```prisma
model Notification {
  id        String @id @default(cuid())
  userId    String
  title     String
  body      String
  read      Boolean @default(false)
  createdAt DateTime @default(now())
  
  // ❌ Sem índice em read
  // ❌ Sem soft delete ou TTL
  // ❌ Acumula infinitamente
}
```

**Problema:**
- Table cresce indefinidamente
- Queries lentas com milhões de notificações

**Recomendação:**
```prisma
model Notification {
  id        String @id @default(cuid())
  userId    String
  title     String
  body      String
  read      Boolean @default(false)
  createdAt DateTime @default(now())
  deletedAt DateTime?  // Soft delete
  
  @@index([userId, read])
  @@index([createdAt])
  
  // TTL: Remover após 90 dias ou quando deletedAt + 7 dias
}

// Cleanup job:
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
await prisma.notification.deleteMany({
  where: { createdAt: { lt: ninetyDaysAgo }, read: true }
});
```

**Prioridade:** P2

---

## 5.4 🟡 BillingSettings — Tokens em Plaintext

```prisma
model BillingSettings {
  pixKey          String?  // ❌ Plaintext
  bankAccount     String?  // ❌ Plaintext
  bankAgency      String?  // ❌ Plaintext
}

// ConnectedDevice:
model ConnectedDevice {
  accessToken  String?    // ❌ Plaintext
  refreshToken String?    // ❌ Plaintext
}
```

**Problema:**
- Dados sensíveis em plaintext no banco
- Não criptografados em repouso
- LGPD & PCI compliance risk

**Recomendação:**
```prisma
// Adicionar criptografia de app-level:
// - Use @prisma/client middleware para encrypt/decrypt
// - Ou use PostgreSQL pgcrypto extension

// Model:
model BillingSettings {
  id              String @id @default(cuid())
  userId          String @unique
  
  pixKeyEncrypted       String?  // @encrypted
  bankAccountEncrypted  String?  // @encrypted
  bankAgencyEncrypted   String?  // @encrypted
}

// Middleware Prisma:
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === 'BillingSettings' && params.action === 'create') {
    params.args.data = encrypt(params.args.data);
  }
  const result = await next(params);
  if (params.model === 'BillingSettings' && params.action === 'findUnique') {
    result = decrypt(result);
  }
  return result;
});
```

**Prioridade:** 🔴 P1 (security)

---

# 6. Problemas de Performance

## 6.1 🟡 Json Fields sem Índice GIN

Existem **9 campos Json** sem índices GIN:

| Modelo | Campo | Uso |
|--------|-------|-----|
| Workout | blocks | Estrutura de blocos de treino |
| WorkoutLog | gpsTrack | Track GPS |
| WorkoutLog | splits | Splits do treino |
| FeedPost | workoutSummary | Resumo |
| CoachStrengthTemplate | sessions | Sessões |
| CoachRunTemplate | sessions | Sessões |
| SharedWorkoutTemplate | blocks | Blocos |
| PlanProduct | planContent | Conteúdo do plano |
| CoachZoneModel | zones | Definição de zonas |

**Problema:**
- Se fizer queries como `WHERE blocks->>'name' = 'A'`, vai dar full table scan
- Sem índice GIN, pesquisa dentro de JSON é lenta

**Recomendação:**
```prisma
model Workout {
  blocks Json?
  
  // Adicionar índice GIN:
  @@index([blocks], type: Gin)  // PostgreSQL specific
}

// Na migration:
CREATE INDEX idx_workout_blocks ON workouts USING GIN (blocks);

// Ou em Prisma 5+:
// Verificar documentação de índices customizados
```

**Nota:** Prisma não suporta GIN natively, precisará de raw SQL em migration.

**Prioridade:** P2 (otimização)

---

## 6.2 🟡 Text Fields sem Limite

Muitos campos `String?` sem @db.VarChar(N):

```prisma
model Coach {
  bio         String?        // Sem limite → potencial gigante
  publicBio   String?        // Sem limite
  credential  String?        // Sem limite
}

model Lead {
  notes       String?        // Sem limite
}

model Athlete {
  injuryHistory String?      // Sem limite
}

model Workout {
  objective   String?        // Sem limite
  warmup      String?        // Sem limite
  mainSet     String?        // Sem limite
  cooldown    String?        // Sem limite
  notes       String?        // Sem limite
}
```

**Recomendação:**
```prisma
model Coach {
  bio         String?  @db.VarChar(1000)    // Limite 1KB
  publicBio   String?  @db.VarChar(2000)    // Limite 2KB
}

model Workout {
  objective   String?  @db.VarChar(500)
  warmup      String?  @db.VarChar(1000)
  mainSet     String?  @db.VarChar(2000)    // Main set pode ser longo
  cooldown    String?  @db.VarChar(1000)
  notes       String?  @db.Text              // Notas podem ser longas
}
```

**Prioridade:** P3 (otimização)

---

## 6.3 🟡 N+1 Queries Risk

Relações que podem gerar N+1:

```prisma
// ❌ N+1:
const athletes = await prisma.athlete.findMany();
for (const athlete of athletes) {
  const coach = await prisma.coach.findUnique({ where: { id: athlete.coachId } });
}

// ✅ Correto:
const athletes = await prisma.athlete.findMany({
  include: { coach: true }  // Eager loading
});

// ❌ N+1:
const plans = await prisma.trainingPlan.findMany();
for (const plan of plans) {
  const weeks = await prisma.trainingWeek.findMany({
    where: { planId: plan.id }
  });
}

// ✅ Correto:
const plans = await prisma.trainingPlan.findMany({
  include: { weeks: true }
});
```

**Recomendação:**
- Usar Prisma select/include pattern
- Implementar data loader para resolver N+1 em GraphQL
- Usar pagination para grandes relacionamentos

**Prioridade:** P2 (revisão de queries)

---

## 6.4 🟡 Sem Paginação Nativa

Modelos sem suporte a paginação explícita:

```prisma
// ❌ Risco: retorna TODOS
const allWorkoutLogs = await prisma.workoutLog.findMany({
  where: { athleteId }
});

// ✅ Com paginação:
const workoutLogs = await prisma.workoutLog.findMany({
  where: { athleteId },
  take: 20,        // Limit
  skip: 0,         // Offset
  orderBy: { startedAt: 'desc' }
});

// Contar total:
const total = await prisma.workoutLog.count({ where: { athleteId } });
```

**Recomendação:**
- Todas as queries de lista devem ter `take` and `skip`
- Implementar cursor-based pagination para grande volumes

**Prioridade:** P2

---

# 7. Validação Frágil — Strings sem Enum

Existem **5 campos string** que deveriam ser enums:

| Campo | Modelo | Valores Esperados | Risco |
|-------|--------|-------------------|-------|
| `status` | Athlete | ativo, risco, inativo | ❌ Typos |
| `status` | Lead | novo, contato, proposta, negociacao, ganho, perdido | ❌ Typos |
| `source` | WorkoutLog | manual, strava, garmin, polar, coros, apple | ❌ Typos |
| `method` | Payment | pix, cartao, boleto | ❌ Typos |
| `category` | Expense | software, marketing, pessoal, equipamento, fornecedor, outros | ❌ Typos |

**Recomendação:**
```prisma
// Adicionar enums:
enum AthleteStatus {
  ATIVO
  RISCO
  INATIVO
}

enum LeadStage {
  NOVO
  CONTATO
  PROPOSTA
  NEGOCIACAO
  GANHO
  PERDIDO
}

enum WorkoutLogSource {
  MANUAL
  STRAVA
  GARMIN
  POLAR
  COROS
  APPLE
}

enum PaymentMethod {
  PIX
  CARTAO
  BOLETO
}

enum ExpenseCategory {
  SOFTWARE
  MARKETING
  PESSOAL
  EQUIPAMENTO
  FORNECEDOR
  OUTROS
}

// Usar nos modelos:
model Athlete {
  status AthleteStatus @default(ATIVO)
}

model WorkoutLog {
  source WorkoutLogSource @default(MANUAL)
}
```

**Prioridade:** P1 (antes de produção)

---

# 8. Campos Desorganizados

## 8.1 🟡 Workout — Campo `blocks` Estruturado mas sem Tipagem

```prisma
model Workout {
  blocks Json?  // WorkoutBlock[] — referência a lib/workout-blocks.ts
}
```

**Problema:**
- Documentação em comentário não é validação
- Schema não documenta estrutura

**Recomendação:**
- Criar Migration para documentar schema JSON:
```sql
-- sql/workouts_blocks_schema.sql
COMMENT ON COLUMN workouts.blocks IS 
'Array de WorkoutBlock. Schema:
{
  "blocks": [
    {
      "type": "warmup | mainset | cooldown",
      "duration_sec": 300,
      "distance_km": 1.5,
      "pace_sec_per_km": 300,
      "hr_zone": "Z2",
      "rpe": 5,
      "description": "string"
    }
  ]
}';
```

**Prioridade:** P3 (documentation)

---

# 9. Relações Bidirecionais Faltando

Verificar se todas as relações têm backref:

```prisma
// ✅ OK — ambos lados mapeados
model Coach {
  athletes Athlete[]
}

model Athlete {
  coach Coach? @relation(fields: [coachId], references: [id])
}

// ❌ Verificar — Coach.leads
model Coach {
  leads Lead[]
}

model Lead {
  coach Coach @relation(fields: [coachId], references: [id])
}
// ✅ OK

// ❌ Verificar — Expense
model Expense {
  coach Coach @relation(fields: [coachId], references: [id])
}

model Coach {
  // ❌ Falta:
  // expenses Expense[]
}
```

**Prioridade:** P2

---

# 10. Checklist de Ações Recomendadas

## 🔴 P1 — IMEDIATO (Next Sprint)

- [ ] Adicionar índices em Foreign Keys críticas (userId, coachId, athleteId)
- [ ] Converter strings em enums (AthleteStatus, LeadStage, WorkoutLogSource, etc.)
- [ ] Implementar soft delete para User (LGPD compliance)
- [ ] Criptografar tokens e dados sensíveis (BillingSettings, ConnectedDevice)
- [ ] Remover counters (CoachPlan.usedSlots, Voucher.usedCount, etc.) ou implementar triggers
- [ ] Resolver redundância Athlete.coachId vs TrainingPlan.coachId
- [ ] Adicionar @@index([userId]) a Notification, Payment, Subscription, Account

## 🟡 P2 — PRÓXIMAS 2-4 SEMANAS

- [ ] Adicionar índices em filtros frequentes (status, type, active, etc.)
- [ ] Consolidar User.image / avatarUrl / bannerUrl
- [ ] Remover cache fields (Athlete.recoveryScore, PlanProduct.ratingCount)
- [ ] Implementar VerificationToken cleanup
- [ ] Adicionar Notification.deletedAt para soft delete
- [ ] Implementar paginação padrão em todas as queries
- [ ] Adicionar índices em ordenação frequente (createdAt, date)
- [ ] Remover Athlete.raceDate (usar Race.date)
- [ ] Implementar CoachingAssignment model para histórico

## 🟡 P3 — LONG TERM (4+ semanas)

- [ ] Adicionar limites em String fields (@db.VarChar)
- [ ] Adicionar índices GIN para Json fields (via migration SQL)
- [ ] Implementar versionamento para AthleteLoadParams
- [ ] Refatorar AthleteLoadParams em modelos específicos por sport
- [ ] Audit de campos nunca utilizados (bannerUrl, logoUrl, commonMistakes)
- [ ] Adicionar schema validation para Json fields
- [ ] Implementar audit logging de mudanças críticas

---

# 11. SQL Migrations Template

```sql
-- migration: add_missing_indexes.sql

-- Foreign Key indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_coach_plans_coach_id ON coach_plans(coach_id);

-- Filter indexes
CREATE INDEX idx_athlete_status ON athletes(status);
CREATE INDEX idx_workout_type ON workouts(type);
CREATE INDEX idx_workout_status ON workouts(status);
CREATE INDEX idx_workout_log_source ON workout_logs(source);
CREATE INDEX idx_voucher_active ON vouchers(active);

-- Combined indexes
CREATE INDEX idx_athletes_coach_status ON athletes(coach_id, status);
CREATE INDEX idx_coach_plans_coach_active ON coach_plans(coach_id, active);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX idx_feed_comments_post_created ON feed_comments(post_id, created_at);

-- Cleanup indexes
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);

-- GIN indexes for JSON (if queries needed)
-- CREATE INDEX idx_workout_blocks_gin ON workouts USING GIN (blocks);
```

---

# 12. Conclusões

## Saúde Geral do Schema: 🟡 ACEITÁVEL COM RESSALVAS

| Aspecto | Status | Observação |
|---------|--------|-----------|
| **Estrutura** | ✅ Boa | Bem organizado, modelos lógicos |
| **Relações** | 🟡 Aceitável | Alguns problemas de redundância |
| **Performance** | 🔴 Crítica | 18 índices faltando, N+1 risks |
| **Integridade** | 🔴 Alta Risk | Hard deletes, dados sensíveis plaintext |
| **Validação** | 🟡 Frágil | Strings que deveriam ser enums |
| **Segurança** | 🔴 Crítica | Tokens em plaintext, sem criptografia |
| **Compliance** | 🔴 Risco | Sem soft delete, sem audit trail |

## Prioridades Consolidadas

```
🔴 CRITICAL (This sprint):
  - Índices em Foreign Keys
  - Enums para validação
  - Soft delete
  - Criptografia de tokens

🟡 HIGH (Next 2-4 weeks):
  - Resolver redundâncias
  - Adicionar índices de filtro
  - Implementar cleanup de dados
  - Paginação padrão

🟡 MEDIUM (Longer term):
  - Refactoring de modelos
  - Audit de campos ociosos
  - Otimizações de performance
```

---

**Gerado em:** 2026-07-08  
**Revisor:** GitHub Copilot  
**Status:** Pronto para ação

> "Um bom schema é a fundação de uma aplicação escalável. Investir em integridade e performance agora economiza débito técnico depois." — SRE Wisdom
