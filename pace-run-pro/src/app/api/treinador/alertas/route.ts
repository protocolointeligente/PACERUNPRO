import { NextRequest, NextResponse } from "next/server";
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

const DISMISSED_TITLE = "ALERT_DISMISSED";

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

  // ── Dismissed alert IDs (persisted by PATCH handler) ─────────────────────
  const dismissedNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id, title: DISMISSED_TITLE },
    select: { link: true },
  });
  const dismissedIds = new Set(dismissedNotifications.map((n) => n.link ?? ""));

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
    // Bulk-fetch workouts, check-ins, and daily loads for all athletes
    const [recentWorkouts, recentCheckIns, dailyLoads] = await Promise.all([
      prisma.workout.findMany({
        where: {
          date: { gte: ago14 },
          week: { plan: { coachId: coach.id, athleteId: { in: athleteIds } } },
        },
        select: {
          date: true,
          status: true,
          type: true,
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
      prisma.dailyLoad.findMany({
        where: { athleteId: { in: athleteIds }, date: { gte: ago7 } },
        select: { athleteId: true, date: true, acwr: true },
        orderBy: { date: "desc" },
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

    // Build map of latest DailyLoad per athlete (results already ordered desc)
    type DailyLoadRow = (typeof dailyLoads)[number];
    const latestDailyLoadByAthlete = new Map<string, DailyLoadRow>();
    for (const dl of dailyLoads) {
      if (!latestDailyLoadByAthlete.has(dl.athleteId)) {
        latestDailyLoadByAthlete.set(dl.athleteId, dl);
      }
    }

    for (const athleteId of athleteIds) {
      const athleteName = athleteNameMap.get(athleteId) ?? "Atleta";
      const workouts = workoutsByAthlete.get(athleteId) ?? [];
      const checkIns = checkInsByAthlete.get(athleteId) ?? [];

      // 1. Absence — no CONCLUIDO workout for 5+ days while LIBERADO workouts exist
      const completedWorkouts = workouts.filter((w) => w.status === "CONCLUIDO");
      const overdueReleased = workouts.filter((w) => w.status === "LIBERADO" && w.date <= now);

      if (overdueReleased.length > 0) {
        if (completedWorkouts.length === 0) {
          const alertId = `absence-never-${athleteId}`;
          alerts.push({
            id: alertId,
            athleteId,
            athleteName,
            severity: "critico",
            category: "ausencia",
            title: "Atleta não iniciou os treinos",
            description: `${athleteName} tem treinos liberados mas ainda não concluiu nenhuma sessão no período.`,
            recommendation:
              "Verifique se o atleta consegue acessar a plataforma e como registrar as sessões concluídas.",
            daysAgo: 0,
            read: dismissedIds.has(alertId),
          });
        } else {
          const lastDate = completedWorkouts[completedWorkouts.length - 1].date;
          const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / 86_400_000);
          if (daysSince > 5) {
            const alertId = `absence-${athleteId}`;
            alerts.push({
              id: alertId,
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
              read: dismissedIds.has(alertId),
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
        const alertId = `pain-${athleteId}`;
        alerts.push({
          id: alertId,
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
          read: dismissedIds.has(alertId),
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
        const alertId = `adherence-${athleteId}`;
        alerts.push({
          id: alertId,
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
          read: dismissedIds.has(alertId),
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
        const alertId = `overtraining-${athleteId}`;
        alerts.push({
          id: alertId,
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
          read: dismissedIds.has(alertId),
        });
      }

      // 5. ACWR — overtraining
      const latestLoad = latestDailyLoadByAthlete.get(athleteId);
      if (latestLoad && latestLoad.acwr !== null) {
        const acwr = latestLoad.acwr as number;
        const daysAgoLoad = Math.floor(
          (now.getTime() - latestLoad.date.getTime()) / 86_400_000,
        );
        if (acwr > 1.5) {
          const alertId = `acwr-critico-${athleteId}`;
          alerts.push({
            id: alertId,
            athleteId,
            athleteName,
            severity: "critico",
            category: "overtraining",
            title: "ACWR elevado — risco de overtraining",
            description: `${athleteName} apresenta ACWR de ${acwr.toFixed(2)}, indicando carga aguda muito acima da base crônica. Risco elevado de lesão ou overtraining.`,
            metric: `ACWR: ${acwr.toFixed(2)} (limite crítico: > 1.5)`,
            recommendation:
              "Reduza a carga de treino imediatamente. Priorize sessões regenerativas e monitore sinais de fadiga, dor e queda de desempenho.",
            daysAgo: daysAgoLoad,
            read: dismissedIds.has(alertId),
          });
        } else if (acwr < 0.8) {
          const alertId = `acwr-info-${athleteId}`;
          alerts.push({
            id: alertId,
            athleteId,
            athleteName,
            severity: "info",
            category: "volume",
            title: "ACWR baixo — possível destreino",
            description: `${athleteName} apresenta ACWR de ${acwr.toFixed(2)}, sugerindo que a carga aguda está abaixo da base crônica. Pode indicar destreino ou período de tapering.`,
            metric: `ACWR: ${acwr.toFixed(2)} (limite mínimo: < 0.8)`,
            recommendation:
              "Aumente progressivamente a carga de treino para evitar perda de forma. Eleve o volume de forma gradual (≤ 10% por semana).",
            daysAgo: daysAgoLoad,
            read: dismissedIds.has(alertId),
          });
        }
      }

      // 6. Strength vs. high-intensity run conflict
      const STRENGTH_TYPES = ["FORCA", "FUNCIONAL"];
      const HIGH_INTENSITY_RUN_TYPES = [
        "INTERVALADO_CURTO",
        "INTERVALADO_LONGO",
        "TEMPO_RUN",
        "FARTLEK",
        "PROGRESSIVO",
        "SUBIDA",
        "PROVA",
      ];

      type WorkoutTypeRow = { type: string | null; date: Date };
      const workoutsByDate = new Map<string, WorkoutTypeRow[]>();
      for (const w of workouts) {
        const dateKey = w.date.toISOString().slice(0, 10);
        if (!workoutsByDate.has(dateKey)) workoutsByDate.set(dateKey, []);
        workoutsByDate.get(dateKey)!.push(w);
      }

      let conflictAlertPushed = false;
      for (const [dateKey, dayWorkouts] of workoutsByDate.entries()) {
        if (conflictAlertPushed) break;

        const strengthInDay = dayWorkouts.filter(
          (w) => w.type !== null && STRENGTH_TYPES.includes(w.type as string),
        );
        if (strengthInDay.length === 0) continue;

        const baseDate = new Date(dateKey);
        const adjacentKeys = [
          new Date(baseDate.getTime() - 86_400_000).toISOString().slice(0, 10),
          dateKey,
          new Date(baseDate.getTime() + 86_400_000).toISOString().slice(0, 10),
        ];

        const conflictingRuns: { type: string; date: string }[] = [];
        for (const adjKey of adjacentKeys) {
          for (const w of workoutsByDate.get(adjKey) ?? []) {
            if (w.type !== null && HIGH_INTENSITY_RUN_TYPES.includes(w.type as string)) {
              conflictingRuns.push({ type: w.type as string, date: adjKey });
            }
          }
        }

        if (conflictingRuns.length > 0) {
          const strengthLabels = strengthInDay.map((w) => w.type as string).join(", ");
          const runLabels = conflictingRuns.map((r) => `${r.type} (${r.date})`).join("; ");
          const alertId = `conflict-strength-run-${athleteId}-${dateKey}`;
          alerts.push({
            id: alertId,
            athleteId,
            athleteName,
            severity: "atencao",
            category: "fadiga",
            title: "Conflito treino de força + corrida intensa",
            description: `${athleteName} tem treino de força (${strengthLabels}) em ${dateKey} e corrida de alta intensidade (${runLabels}) em datas próximas.`,
            recommendation:
              "Separe as sessões de força e corrida intensa por pelo menos 24h ou reduza a intensidade de uma das sessões para evitar acúmulo de fadiga.",
            daysAgo: Math.floor(
              (now.getTime() - new Date(dateKey).getTime()) / 86_400_000,
            ),
            read: dismissedIds.has(alertId),
          });
          conflictAlertPushed = true;
        }
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

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json() as { ids: string[] };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids obrigatório" }, { status: 400 });
  }

  // Fetch already-dismissed IDs to avoid duplicates
  const existing = await prisma.notification.findMany({
    where: { userId: session.user.id, title: DISMISSED_TITLE, link: { in: body.ids } },
    select: { link: true },
  });
  const alreadyDismissed = new Set(existing.map((n) => n.link ?? ""));
  const newIds = body.ids.filter((id) => !alreadyDismissed.has(id));

  if (newIds.length > 0) {
    await prisma.notification.createMany({
      data: newIds.map((alertId) => ({
        userId: session!.user!.id as string,
        title: DISMISSED_TITLE,
        body: "Alerta marcado como lido pelo treinador",
        link: alertId,
        read: true,
      })),
    });
  }

  return NextResponse.json({ ok: true, dismissed: body.ids.length });
}
