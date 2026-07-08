/**
 * Utilidades para refatorar queries de Coach
 * Eliminam padrões N+1 comuns usando include/select otimizados
 */

import { prisma } from './prisma';

/**
 * Refactorizado: Buscar atletas de um coach com todas as informações necessárias
 * ✅ Uma query ao invés de múltiplas
 * @param coachUserId - ID do usuário coach
 * @returns Athletes com user data, status, goals, e check-in recente
 */
export async function getCoachAthletesOptimized(coachUserId: string) {
  return await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: {
      athletes: {
        orderBy: { user: { name: 'asc' } },
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          goal: true,
          level: true,
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          // Último check-in (sem N+1)
          checkins: {
            orderBy: { date: 'desc' },
            take: 1,
            select: {
              date: true,
              rpe: true,
              pain: true,
              sleep: true,
              fatigue: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Refactorizado: Buscar plans de um coach
 * ✅ Uma query simples e eficiente
 * @param coachUserId - ID do usuário coach
 */
export async function getCoachPlansOptimized(coachUserId: string) {
  return await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: {
      plans: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          period: true,
          active: true,
          highlight: true,
          features: true,
          maxSlots: true,
          usedSlots: true,
        },
      },
    },
  });
}

/**
 * Refactorizado: Buscar dados da semana de treinos para dashboard
 * ✅ Uma query com todas as relações necessárias
 * Evita: N queries para carregar workouts de cada atleta
 * @param coachUserId - ID do usuário coach
 * @param weekStart - Data de início da semana
 * @param weekEnd - Data de fim da semana
 */
export async function getCoachWeeklyDataOptimized(
  coachUserId: string,
  weekStart: Date,
  weekEnd: Date
) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: {
      id: true,
      athletes: {
        orderBy: { user: { name: 'asc' } },
        select: {
          id: true,
          status: true,
          goal: true,
          level: true,
          adherenceRate: true,
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          loadParams: true,
          // Treinos desta semana
          trainingPlans: {
            where: {
              startDate: { lte: weekEnd },
              endDate: { gte: weekStart },
            },
            select: {
              weeks: {
                where: {
                  startDate: { gte: weekStart },
                  endDate: { lte: weekEnd },
                },
                select: {
                  released: true,
                  workouts: {
                    select: {
                      id: true,
                      date: true,
                      type: true,
                      title: true,
                      status: true,
                      targetDistanceKm: true,
                      targetDurationMin: true,
                      targetPaceSecPerKm: true,
                      targetRpe: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return coach;
}

/**
 * Refactorizado: Action Center - estatísticas de atletas
 * ✅ Agrupa queries de forma eficiente
 * @param coachUserId - ID do usuário coach
 */
export async function getCoachActionCenterOptimized(coachUserId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: {
      id: true,
      athletes: {
        select: { id: true },
      },
    },
  });

  if (!coach || coach.athletes.length === 0) {
    return {
      athletesTotal: 0,
      athletesWithoutWorkout: 0,
      unreleasedWorkouts: 0,
      missedWorkouts: 0,
      flaggedCheckins: 0,
      workoutsThisWeek: 0,
    };
  }

  const athleteIds = coach.athletes.map(a => a.id);
  const monday = new Date();
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch em paralelo (sem N+1)
  const [workouts, flaggedCheckinsCount] = await Promise.all([
    prisma.workout.findMany({
      where: {
        date: { gte: monday, lte: sunday },
        week: {
          plan: {
            athleteId: { in: athleteIds },
            coachId: coach.id,
          },
        },
      },
      select: {
        id: true,
        status: true,
        week: {
          select: {
            released: true,
            plan: { select: { athleteId: true } },
          },
        },
      },
    }),
    prisma.checkIn.count({
      where: {
        athleteId: { in: athleteIds },
        date: { gte: sevenDaysAgo },
        flagged: true,
      },
    }),
  ]);

  const athletesWithWorkout = new Set(workouts.map(w => w.week.plan.athleteId));
  const athletesWithoutWorkout = athleteIds.length - athletesWithWorkout.size;
  const unreleasedWorkouts = workouts.filter(w => !w.week.released).length;
  const missedWorkouts = workouts.filter(w => w.status === 'PERDIDO').length;

  return {
    athletesTotal: athleteIds.length,
    athletesWithoutWorkout,
    unreleasedWorkouts,
    missedWorkouts,
    flaggedCheckins: flaggedCheckinsCount,
    workoutsThisWeek: workouts.length,
  };
}

/**
 * Refactorizado: Fetch groups com members e athletes
 * ✅ Include otimizado evita N+1
 * @param coachUserId - ID do usuário coach
 */
export async function getCoachGroupsOptimized(coachUserId: string) {
  return await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: {
      teams: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              athlete: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Refactorizado: Leads com filtro por stage
 * ✅ Simples select sem N+1
 * @param coachUserId - ID do usuário coach
 * @param stage - Stage opcional para filtrar
 */
export async function getCoachLeadsOptimized(
  coachUserId: string,
  stage?: string
) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: { id: true },
  });

  if (!coach) return [];

  return await prisma.lead.findMany({
    where: {
      coachId: coach.id,
      ...(stage && { stage }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      stage: true,
      notes: true,
      monthlyFeeCents: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
