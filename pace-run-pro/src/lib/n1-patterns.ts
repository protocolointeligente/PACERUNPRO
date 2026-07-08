/**
 * Padrões comuns de N+1 e suas refactorações para Prisma
 * 
 * Uso: Documentação + exemplos de como corrigir padrões N+1 comuns
 */

// ============================================================================
// PADRÃO 1: Fetch lista + loop para buscar dados relacionados
// ============================================================================

// ❌ ANTES (N+1):
/*
const athletes = await prisma.athlete.findMany({ where: { coachId } });
const result = [];
for (const athlete of athletes) {
  const workouts = await prisma.workout.findMany({
    where: { week: { plan: { athleteId: athlete.id } } }
  });
  result.push({ ...athlete, workoutCount: workouts.length });
}
*/

// ✅ DEPOIS (Otimizado):
/*
const athletes = await prisma.athlete.findMany({
  where: { coachId },
  include: {
    trainingPlans: {
      include: {
        weeks: {
          include: {
            workouts: { select: { id: true } }
          }
        }
      }
    }
  }
});
// Processar dados em memória (sem queries adicionais)
const result = athletes.map(a => ({
  ...a,
  workoutCount: a.trainingPlans.reduce(
    (sum, p) => sum + p.weeks.reduce((w, k) => w + k.workouts.length, 0),
    0
  )
}));
*/

// ============================================================================
// PADRÃO 2: Múltiplas findUnique em sequência
// ============================================================================

// ❌ ANTES (N+1):
/*
const ids = [id1, id2, id3, ..., idN];
const results = [];
for (const id of ids) {
  const item = await prisma.user.findUnique({ where: { id } });
  results.push(item);
}
*/

// ✅ DEPOIS (Uma query):
/*
const results = await prisma.user.findMany({
  where: { id: { in: ids } },
  orderBy: { createdAt: 'desc' }
});
*/

// ============================================================================
// PADRÃO 3: Count em loop
// ============================================================================

// ❌ ANTES (N+1):
/*
const athletes = await prisma.athlete.findMany({ where: { coachId } });
for (const athlete of athletes) {
  athlete.workoutCount = await prisma.workout.count({
    where: { week: { plan: { athleteId: athlete.id } } }
  });
}
*/

// ✅ DEPOIS (Include):
/*
const athletesWithCounts = await prisma.athlete.findMany({
  where: { coachId },
  include: {
    trainingPlans: {
      select: {
        weeks: {
          select: {
            _count: { select: { workouts: true } }
          }
        }
      }
    }
  }
});
*/

// ============================================================================
// PADRÃO 4: Select eficiente (apenas campos necessários)
// ============================================================================

// ❌ ANTES (Busca dados desnecessários):
/*
const coaches = await prisma.coach.findMany({
  include: {
    user: true,
    athletes: true,
    trainingPlans: true,
    exercises: true,
    // ... todo o resto do schema
  }
});
// Usa 50% dos dados retornados
*/

// ✅ DEPOIS (Apenas o necessário):
/*
const coaches = await prisma.coach.findMany({
  select: {
    id: true,
    user: { select: { name: true, email: true } },
    athletes: {
      select: { id: true, user: { select: { name: true } } },
      take: 5 // Apenas os primeiros 5
    }
  }
});
*/

// ============================================================================
// PADRÃO 5: Corrigir relacionamentos na API (Coach + Athletes)
// ============================================================================

// ✅ EXEMPLO REFATORIZADO - /api/coach/athletes/week
export const n1ExampleRefactor = {
  description: 'Fetch semana de treinos com todos os atletas',
  
  // ❌ Antes: Múltiplas queries
  beforePattern: `
    const coach = await prisma.coach.findUnique({ where: { userId } });
    const athletes = coach.athletes.map(a => a.id);
    const workouts = await prisma.workout.findMany({ where: { athleteId: { in: athletes } } });
    // + N queries para carregar dados de cada workout/athlete
  `,
  
  // ✅ Depois: Uma query otimizada
  afterPattern: `
    const coach = await prisma.coach.findUnique({
      where: { userId },
      select: {
        id: true,
        athletes: {
          select: {
            id: true,
            user: { select: { name: true, avatarUrl: true } },
            loadParams: true,
            trainingPlans: {
              where: { startDate: { lte: weekEnd }, endDate: { gte: weekStart } },
              include: {
                weeks: {
                  where: { startDate: { gte: weekStart, lte: weekEnd } },
                  include: {
                    workouts: {
                      select: {
                        id: true,
                        date: true,
                        type: true,
                        status: true,
                        targetDistanceKm: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    // Tudo em uma query!
  `
};

// ============================================================================
// RESUMO: Checklist para evitar N+1
// ============================================================================

export const n1PreventionChecklist = [
  '❌ Nunca use queries dentro de loops',
  '❌ Não fetch dados que você já tem em memória',
  '✅ Use include/select para carregar relacionamentos',
  '✅ Use Promise.all para queries independentes em paralelo',
  '✅ Use { in: [...] } com findMany ao invés de loop de findUnique',
  '✅ Select apenas campos necessários (reduz payload)',
  '✅ Use aggregations (count, sum) em queries ao invés de em app code',
  '✅ Monitore queries com QueryAnalyzer de P1.6'
];
