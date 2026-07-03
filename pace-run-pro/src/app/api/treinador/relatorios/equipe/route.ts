import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

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
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  }
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "Últimos 30 dias";
  const { start, end } = dateRange(period);

  // Get all athletes for this coach with their user names
  const plans = await prisma.trainingPlan.findMany({
    where: { coachId: coach.id },
    select: {
      athleteId: true,
      athlete: { select: { user: { select: { name: true } } } },
    },
    distinct: ["athleteId"],
  });

  const athleteIds = plans.map((p) => p.athleteId);
  const athleteNameMap: Record<string, string> = {};
  for (const p of plans) {
    athleteNameMap[p.athleteId] = p.athlete.user.name ?? "—";
  }

  if (athleteIds.length === 0) {
    return NextResponse.json({ teamStats: null, athletes: [] });
  }

  // Fetch all workouts in period for the coach's athletes
  const workoutsRaw = await prisma.workout.findMany({
    where: {
      date: { gte: start, lte: end },
      week: { plan: { coachId: coach.id } },
    },
    select: {
      status: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
      plannedLoad: true,
      week: { select: { plan: { select: { athleteId: true } } } },
      logs: {
        select: { distanceKm: true, durationSec: true, rpe: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Fetch check-ins in period grouped by athlete
  const checkInsRaw = await prisma.checkIn.findMany({
    where: { athleteId: { in: athleteIds }, date: { gte: start, lte: end } },
    select: { athleteId: true, rpe: true },
  });

  // Aggregate per athlete
  const byAthlete: Record<string, {
    workouts: typeof workoutsRaw;
    rpeValues: number[];
  }> = {};

  for (const id of athleteIds) {
    byAthlete[id] = { workouts: [], rpeValues: [] };
  }
  for (const w of workoutsRaw) {
    const aId = w.week.plan.athleteId;
    if (byAthlete[aId]) byAthlete[aId].workouts.push(w);
  }
  for (const ci of checkInsRaw) {
    if (byAthlete[ci.athleteId] && ci.rpe != null) {
      byAthlete[ci.athleteId].rpeValues.push(ci.rpe);
    }
  }

  // Build per-athlete rows
  const athleteRows = athleteIds.map((aId) => {
    const { workouts, rpeValues } = byAthlete[aId];
    const completed = workouts.filter((w) => w.status === "CONCLUIDO");
    const scheduled = workouts.filter((w) => ["CONCLUIDO", "PERDIDO", "LIBERADO"].includes(w.status));
    const adherencePct = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;

    const totalKm = Math.round(
      completed.reduce((s, w) => {
        const log = w.logs[0];
        return s + (log?.distanceKm ?? w.targetDistanceKm ?? 0);
      }, 0) * 10,
    ) / 10;

    const totalLoad = workouts.reduce((s, w) => {
      if (w.plannedLoad != null) return s + Math.round(w.plannedLoad);
      const log = w.logs[0];
      const rpe = log?.rpe ?? w.targetRpe ?? null;
      const durationMin = log?.durationSec != null ? Math.round(log.durationSec / 60) : (w.targetDurationMin ?? null);
      return s + (rpe != null && durationMin != null ? Math.round(durationMin * rpe) : 0);
    }, 0);

    const avgRpe =
      rpeValues.length > 0
        ? Math.round((rpeValues.reduce((s, r) => s + r, 0) / rpeValues.length) * 10) / 10
        : null;

    const status =
      avgRpe != null && avgRpe > 7.5 ? "overreach"
      : adherencePct < 65 && scheduled.length >= 3 ? "abaixo"
      : "ok";

    return {
      athleteId: aId,
      name:      athleteNameMap[aId] ?? "—",
      totalKm,
      sessionsCompleted: completed.length,
      adherencePct,
      avgRpe,
      totalLoad,
      status,
    };
  });

  // Team aggregates
  const withData = athleteRows.filter((a) => a.sessionsCompleted > 0 || a.adherencePct > 0);
  const avgAdherence =
    withData.length > 0
      ? Math.round(withData.reduce((s, a) => s + a.adherencePct, 0) / withData.length)
      : 0;
  const avgVolumeKm =
    withData.length > 0
      ? Math.round((withData.reduce((s, a) => s + a.totalKm, 0) / withData.length) * 10) / 10
      : 0;
  const avgLoad =
    withData.length > 0
      ? Math.round(withData.reduce((s, a) => s + a.totalLoad, 0) / withData.length)
      : 0;
  const rpeEntries = withData.filter((a) => a.avgRpe != null);
  const avgRpe =
    rpeEntries.length > 0
      ? Math.round((rpeEntries.reduce((s, a) => s + (a.avgRpe ?? 0), 0) / rpeEntries.length) * 10) / 10
      : null;

  return NextResponse.json({
    teamStats: {
      avgAdherence,
      avgRpe,
      avgVolumeKm,
      avgLoad,
      overreachCount: athleteRows.filter((a) => a.status === "overreach").length,
      belowTargetCount: athleteRows.filter((a) => a.status === "abaixo").length,
      totalAthletes: athleteIds.length,
    },
    athletes: athleteRows,
  });
}
