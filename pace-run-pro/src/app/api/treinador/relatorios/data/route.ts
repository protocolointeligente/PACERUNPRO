import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatPace } from "@/lib/utils";

function dateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "Últimos 7 dias": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "Mês atual": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "Ciclo completo": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    default: {
      // "Últimos 30 dias" and "Personalizado"
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  }
}

function fmtDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) {
    return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athleteId");
  const period = searchParams.get("period") ?? "Últimos 30 dias";
  const { start, end } = dateRange(period);

  // For team reports or when no athlete is specified
  const isTeam = !athleteId || athleteId === "equipe";

  // Verify athlete belongs to this coach (security check)
  if (!isTeam) {
    const plan = await prisma.trainingPlan.findFirst({
      where: { coachId: coach.id, athleteId },
    });
    if (!plan) {
      return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
    }
  }

  // Fetch workouts for the period
  const workoutsRaw = await prisma.workout.findMany({
    where: {
      date: { gte: start, lte: end },
      week: {
        plan: {
          coachId: coach.id,
          ...(isTeam ? {} : { athleteId }),
        },
      },
    },
    select: {
      date: true,
      title: true,
      targetDistanceKm: true,
      targetPaceSecPerKm: true,
      targetDurationMin: true,
      targetRpe: true,
      plannedLoad: true,
      status: true,
      week: { select: { plan: { select: { athleteId: true } } } },
      logs: {
        select: { distanceKm: true, avgPaceSecPerKm: true, durationSec: true, rpe: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Fetch check-ins for the period
  let athleteIds: string[] = [];
  if (!isTeam) {
    athleteIds = [athleteId!];
  } else {
    const plans = await prisma.trainingPlan.findMany({
      where: { coachId: coach.id },
      select: { athleteId: true },
      distinct: ["athleteId"],
    });
    athleteIds = plans.map((p) => p.athleteId);
  }

  const checkInsRaw = await prisma.checkIn.findMany({
    where: {
      athleteId: { in: athleteIds },
      date: { gte: start, lte: end },
    },
    select: { date: true, rpe: true, pain: true, sleep: true, fatigue: true, mood: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  // Build typed workout rows
  const workouts = workoutsRaw.map((w) => {
    const log = w.logs[0];
    const distKm = log?.distanceKm ?? w.targetDistanceKm ?? null;
    const paceSec = log?.avgPaceSecPerKm ?? w.targetPaceSecPerKm ?? null;
    const rpe = log?.rpe ?? w.targetRpe ?? null;
    const durationMin =
      log?.durationSec != null ? Math.round(log.durationSec / 60) : (w.targetDurationMin ?? null);
    const load =
      w.plannedLoad != null
        ? Math.round(w.plannedLoad)
        : rpe != null && durationMin != null
          ? Math.round(durationMin * rpe)
          : null;

    return {
      date: fmtDateBR(w.date),
      title: w.title,
      distanceKm: distKm != null ? Math.round(distKm * 10) / 10 : null,
      paceStr: paceSec != null ? formatPace(paceSec) : null,
      rpe,
      load,
      status: w.status,
    };
  });

  const checkIns = checkInsRaw.map((c) => ({
    date: fmtDateBR(c.date),
    rpe: c.rpe,
    pain: c.pain,
    sleep: c.sleep,
    fatigue: c.fatigue,
    mood: c.mood,
  }));

  // Compute summary
  const completed = workoutsRaw.filter((w) => w.status === "CONCLUIDO");
  const lost = workoutsRaw.filter((w) => w.status === "PERDIDO");
  const scheduled = workoutsRaw.filter((w) =>
    ["CONCLUIDO", "PERDIDO", "LIBERADO"].includes(w.status),
  );

  const totalKm =
    Math.round(
      completed.reduce((s, w) => {
        const log = w.logs[0];
        return s + (log?.distanceKm ?? w.targetDistanceKm ?? 0);
      }, 0) * 10,
    ) / 10;

  const rpeValues = checkInsRaw.map((c) => c.rpe).filter((r): r is number => r != null);
  const avgRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((s, r) => s + r, 0) / rpeValues.length) * 10) / 10
      : 0;

  const totalLoad = workouts.reduce((s, w) => s + (w.load ?? 0), 0);

  const adherencePct =
    scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;

  return NextResponse.json({
    summary: {
      totalKm,
      sessionsCompleted: completed.length,
      sessionsTotal: scheduled.length,
      adherencePct,
      avgRpe,
      totalLoad,
      sessionsLost: lost.length,
    },
    workouts: workouts.slice(0, 20),
    checkIns: checkIns.slice(0, 20),
  });
}
