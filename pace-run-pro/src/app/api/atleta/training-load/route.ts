import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS, computeLoadSeries, detectAlerts } from "@/lib/training-load";

// In-memory LRU cache: athleteId → { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true, loadParams: true },
  });
  if (!athlete) return NextResponse.json(null);

  const cached = cache.get(athlete.id);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today.getTime() - 120 * 86400_000);

  // 1. Actual logs for past workouts (source of truth for TSS)
  const [workoutLogs, futureWorkouts] = await Promise.all([
    prisma.workoutLog.findMany({
      where: {
        athleteId: athlete.id,
        workout: { date: { gte: cutoff } },
      },
      select: {
        distanceKm: true,
        durationSec: true,
        avgPaceSecPerKm: true,
        rpe: true,
        workout: { select: { type: true, date: true } },
      },
    }),
    // 2. Future/unlogged scheduled workouts for forward projection
    prisma.workout.findMany({
      where: {
        week: { plan: { athleteId: athlete.id } },
        date: { gte: today },
        status: { in: ["AGENDADO", "LIBERADO"] },
      },
      select: {
        date: true,
        type: true,
        targetDistanceKm: true,
        targetDurationMin: true,
        targetPaceSecPerKm: true,
        targetRpe: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const dailyTss = new Map<string, number>();

  // Actual logged workouts drive CTL/ATL (keyed to scheduled workout date)
  for (const log of workoutLogs) {
    if (!log.workout) continue;
    const tss = estimateTSS(
      {
        type: log.workout.type as string,
        targetDistanceKm: log.distanceKm,
        targetDurationMin: log.durationSec != null ? log.durationSec / 60 : null,
        targetPaceSecPerKm: log.avgPaceSecPerKm,
        targetRpe: log.rpe,
      },
      athlete.loadParams,
    );
    const day = log.workout.date.toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  // Future planned workouts for projection (don't overwrite actual log days)
  for (const w of futureWorkouts) {
    const day = w.date.toISOString().slice(0, 10);
    if (!dailyTss.has(day)) {
      const tss = estimateTSS(
        {
          type: w.type as string,
          targetDistanceKm: w.targetDistanceKm,
          targetDurationMin: w.targetDurationMin,
          targetPaceSecPerKm: w.targetPaceSecPerKm,
          targetRpe: w.targetRpe,
        },
        athlete.loadParams,
      );
      dailyTss.set(day, tss);
    }
  }

  // Weekly stats for the dashboard (Mon–Sun of the current week)
  const weekStart = new Date(today);
  const dow = today.getDay();
  weekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400_000);

  const [weekLogs, weekScheduledCount] = await Promise.all([
    prisma.workoutLog.findMany({
      where: {
        athleteId: athlete.id,
        workout: { date: { gte: weekStart, lt: weekEnd } },
      },
      select: { distanceKm: true },
    }),
    prisma.workout.count({
      where: {
        week: { plan: { athleteId: athlete.id }, released: true },
        date: { gte: weekStart, lt: weekEnd },
        status: { not: "PERDIDO" },
      },
    }),
  ]);

  const totalKm = Math.round(weekLogs.reduce((acc, l) => acc + (l.distanceKm ?? 0), 0) * 10) / 10;
  const adherencePct = weekScheduledCount > 0
    ? Math.min(100, Math.round((weekLogs.length / weekScheduledCount) * 100))
    : null;

  const series = computeLoadSeries(dailyTss, 90);
  const alerts = detectAlerts(series);
  const latest = series[series.length - 1];

  const result = {
    series,
    alerts,
    latest: latest ?? null,
    weeklyStats: { totalKm, adherencePct },
  };
  cache.set(athlete.id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json(result);
}
