import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type AlertSeverity = "critico" | "atencao" | "info";
type AlertCategory =
  | "ausencia"
  | "overtraining"
  | "dor"
  | "fadiga"
  | "adesao"
  | "volume"
  | "fc"
  | "desempenho";

interface SmartAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
  daysAgo: number;
  read: boolean;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critico: 0, atencao: 1, info: 2 };

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) {
    return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });
  }

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const ago7 = new Date(now);
  ago7.setDate(ago7.getDate() - 7);
  const ago14 = new Date(now);
  ago14.setDate(ago14.getDate() - 14);

  // ── Plans expiring within 7 days ─────────────────────────────────────────
  const expiringPlans = await prisma.trainingPlan.findMany({
    where: { coachId: coach.id, endDate: { gte: now, lte: in7Days } },
    select: {
      id: true,
      endDate: true,
      athlete: { select: { id: true, user: { select: { name: true } } } },
    },
    orderBy: { endDate: "asc" },
  });

  // ── Auto-release overdue training weeks ──────────────────────────────────
  const unreleasedWeeks = await prisma.trainingWeek.findMany({
    where: { released: false, startDate: { lte: now }, plan: { coachId: coach.id } },
    select: {
      id: true,
      weekNumber: true,
      plan: { select: { athlete: { select: { id: true, user: { select: { name: true } } } } } },
    },
    take: 20,
  });

  if (unreleasedWeeks.length > 0) {
    const ids = unreleasedWeeks.map((w) => w.id);
    await prisma.trainingWeek.updateMany({
      where: { id: { in: ids } },
      data: { released: true, releasedAt: now },
    });
    await prisma.workout.updateMany({
      where: { weekId: { in: ids } },
      data: { status: "LIBERADO" },
    });
  }

  // ── Smart Alerts ─────────────────────────────────────────────────────────

  // Active athletes (plans not yet expired)
  const activePlans = await prisma.trainingPlan.findMany({
    where: { coachId: coach.id, endDate: { gte: now } },
    select: {
      athleteId: true,
      athlete: { select: { id: true, user: { select: { name: true } } } },
    },
    distinct: ["athleteId"],
  });

  const athleteIds = activePlans.map((p) => p.athleteId);
  const athleteNameMap = new Map(
    activePlans.map((p) => [p.athleteId, p.athlete.user.name ?? "Atleta"]),
  );

  const alerts: SmartAlert[] = [];

  if (athleteIds.length > 0) {
    // Bulk-fetch workouts and check-ins for all athletes (last 14 days)
    const [recentWorkouts, recentCheckIns] = await Promise.all([
      prisma.workout.findMany({
        where: {
          date: { gte: ago14 },
          week: { plan: { coachId: coach.id, athleteId: { in: athleteIds } } },
        },
        select: {
          date: true,
          status: true,
          targetDurationMin: true,
          week: { select: { plan: { select: { athleteId: true } } } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.checkIn.findMany({
        where: { athleteId: { in: athleteIds }, date: { gte: ago14 } },
        select: { athleteId: true, date: true, pain: true },
        orderBy: { date: "asc" },
      }),
    ]);

    // Group by athlete
    type WorkoutRow = (typeof recentWorkouts)[number];
    type CheckInRow = (typeof recentCheckIns)[number];

    const workoutsByAthlete = new Map<string, WorkoutRow[]>();
    const checkInsByAthlete = new Map<string, CheckInRow[]>();

    for (const w of recentWorkouts) {
      const aid = w.week.plan.athleteId;
      if (!workoutsByAthlete.has(aid)) workoutsByAthlete.set(aid, []);
      workoutsByAthlete.get(aid)!.push(w);
    }
    for (const c of recentCheckIns) {
      if (!checkInsByAthlete.has(c.athleteId)) checkInsByAthlete.set(c.athleteId, []);
      checkInsByAthlete.get(c.athleteId)!.push(c);
    }

    let counter = 0;

    for (const athleteId of athleteIds) {
      const athleteName = athleteNameMap.get(athleteId) ?? "Atleta";
      const workouts = workoutsByAthlete.get(athleteId) ?? [];
      const checkIns = checkInsByAthlete.get(athleteId) ?? [];

      // 1. Absence — no CONCLUIDO workout for 5+ days while LIBERADO workouts exist
      const completedWorkouts = workouts.filter((w) => w.status === "CONCLUIDO");
      const overdueReleased = workouts.filter((w) => w.status === "LIBERADO" && w.date <= now);

      if (overdueReleased.length > 0) {
        if (completedWorkouts.length === 0) {
          alerts.push({
            id: `absence-never-${athleteId}-${++counter}`,
            athleteId,
            athleteName,
            severity: "critico",
            category: "ausencia",
            title: "Atleta não iniciou os treinos",
            description: `${athleteName} tem treinos liberados mas ainda não concluiu nenhuma sessão no período.`,
            recommendation:
              "Verifique se o atleta consegue acessar a plataforma e como registrar as sessões concluídas.",
            daysAgo: 0,
            read: false,
          });
        } else {
          const lastDate = completedWorkouts[completedWorkouts.length - 1].date;
          const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / 86_400_000);
          if (daysSince > 5) {
            alerts.push({
              id: `absence-${athleteId}-${++counter}`,
              athleteId,
              athleteName,
              severity: "critico",
              category: "ausencia",
              title: "Ausência prolongada de treinos",
              description: `${athleteName} não conclui um treino há ${daysSince} dias, apesar de ter sessões liberadas na periodização.`,
              metric: `${daysSince} dias sem treino`,
              recommendation:
                "Entre em contato com o atleta para entender o motivo da ausência e, se necessário, ajuste a carga ou reagende as sessões.",
              daysAgo: 0,
              read: false,
            });
          }
        }
      }

      // 2. Pain — pain ≥ 7 in 3+ consecutive check-ins
      let painStreak = 0;
      let peakPain = 0;

      for (const ci of checkIns) {
        if ((ci.pain ?? 0) >= 7) {
          painStreak++;
          peakPain = Math.max(peakPain, ci.pain ?? 0);
          if (painStreak >= 3) break;
        } else {
          painStreak = 0;
          peakPain = 0;
        }
      }

      if (painStreak >= 3) {
        alerts.push({
          id: `pain-${athleteId}-${++counter}`,
          athleteId,
          athleteName,
          severity: "critico",
          category: "dor",
          title: "Dor elevada por múltiplos dias",
          description: `${athleteName} reportou dor ≥ 7 em ${painStreak} check-ins consecutivos. Risco de lesão ou síndrome de overtraining.`,
          metric: `Dor pico: ${peakPain}/10 por ${painStreak} dias consecutivos`,
          recommendation:
            "Reduza imediatamente a carga de treino. Considere encaminhar para avaliação médica ou fisioterapêutica antes da próxima sessão intensa.",
          daysAgo: 0,
          read: false,
        });
      }

      // 3. Adherence — < 65% completion in the last 7 days
      const lastWeekWorkouts = workouts.filter((w) => w.date >= ago7 && w.date <= now);
      const lastWeekCompleted = lastWeekWorkouts.filter((w) => w.status === "CONCLUIDO").length;
      const lastWeekScheduled = lastWeekWorkouts.filter((w) =>
        ["CONCLUIDO", "PERDIDO", "LIBERADO"].includes(w.status),
      ).length;

      if (lastWeekScheduled >= 3 && lastWeekCompleted / lastWeekScheduled < 0.65) {
        const pct = Math.round((lastWeekCompleted / lastWeekScheduled) * 100);
        alerts.push({
          id: `adherence-${athleteId}-${++counter}`,
          athleteId,
          athleteName,
          severity: "atencao",
          category: "adesao",
          title: "Baixa adesão semanal",
          description: `${athleteName} completou apenas ${lastWeekCompleted} de ${lastWeekScheduled} treinos programados nos últimos 7 dias.`,
          metric: `Adesão: ${pct}% (meta: ≥ 65%)`,
          recommendation:
            "Revise o volume e intensidade do plano. Converse com o atleta sobre possíveis impedimentos externos.",
          daysAgo: 0,
          read: false,
        });
      }

      // 4. Load spike — this week's completed load > 130% of last week's
      const thisWeekLoad = workouts
        .filter((w) => w.date >= ago7 && w.date <= now && w.status === "CONCLUIDO")
        .reduce((s, w) => s + (w.targetDurationMin ?? 0), 0);

      const prevWeekLoad = workouts
        .filter((w) => w.date >= ago14 && w.date < ago7 && w.status === "CONCLUIDO")
        .reduce((s, w) => s + (w.targetDurationMin ?? 0), 0);

      if (prevWeekLoad > 0 && thisWeekLoad > prevWeekLoad * 1.3) {
        const spikePct = Math.round((thisWeekLoad / prevWeekLoad - 1) * 100);
        alerts.push({
          id: `overtraining-${athleteId}-${++counter}`,
          athleteId,
          athleteName,
          severity: "atencao",
          category: "overtraining",
          title: "Pico de carga semanal detectado",
          description: `A carga semanal de ${athleteName} aumentou ${spikePct}% em relação à semana anterior. Risco de overtraining.`,
          metric: `Esta semana: ${thisWeekLoad} min vs semana anterior: ${prevWeekLoad} min (+${spikePct}%)`,
          recommendation:
            "Monitore sinais de fadiga e dor nos próximos check-ins. Considere reduzir volume ou intensidade na próxima sessão.",
          daysAgo: 0,
          read: false,
        });
      }
    }
  }

  alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return NextResponse.json({
    expiringPlans: expiringPlans.map((p) => ({
      planId: p.id,
      athleteId: p.athlete.id,
      athleteName: p.athlete.user.name,
      endDate: p.endDate,
      daysLeft: Math.ceil((p.endDate.getTime() - now.getTime()) / 86_400_000),
    })),
    autoReleased: unreleasedWeeks.map((w) => ({
      weekId: w.id,
      weekNumber: w.weekNumber,
      athleteName: w.plan.athlete.user.name,
    })),
    alerts,
  });
}
