/**
 * Training Load Service
 * Encapsulates CTL/ATL/TSB computation and recovery score logging.
 * Extracted from API route layer to enable reuse across endpoints.
 */
import { prisma } from "@/lib/prisma";
import { estimateTSS, computeLoadSeries, detectAlerts, type LoadDay, type LoadAlert } from "@/lib/training-load";

export interface AthleteLoadResult {
  series: LoadDay[];
  alerts: LoadAlert[];
  latest: LoadDay | null;
}

export async function computeAthleteLoad(athleteId: string): Promise<AthleteLoadResult> {
  const [athlete, workouts] = await Promise.all([
    prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { loadParams: true },
    }),
    prisma.workout.findMany({
      where: {
        week: { plan: { athleteId } },
        date: { gte: new Date(Date.now() - 120 * 86400_000) },
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
  for (const w of workouts) {
    const tss = estimateTSS(
      {
        type: w.type as string,
        targetDistanceKm: w.targetDistanceKm,
        targetDurationMin: w.targetDurationMin,
        targetPaceSecPerKm: w.targetPaceSecPerKm,
        targetRpe: w.targetRpe,
      },
      athlete?.loadParams ?? null,
    );
    const day = w.date.toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  const series = computeLoadSeries(dailyTss, 30);
  const alerts = detectAlerts(series);
  const latest = series[series.length - 1] ?? null;

  return { series, alerts, latest };
}

/**
 * Records the athlete's current recovery score in RecoveryLog
 * alongside the current CTL/ATL/TSB snapshot.
 * Call after a check-in is saved.
 *
 * Requires: `prisma migrate dev` after adding RecoveryLog to schema.prisma.
 */
export async function logRecoveryScore(
  athleteId: string,
  score: number,
  load?: { ctl: number; atl: number; tsb: number } | null,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).recoveryLog.create({
    data: {
      athleteId,
      score,
      ctl: load?.ctl ?? null,
      atl: load?.atl ?? null,
      tsb: load?.tsb ?? null,
    },
  });
}
