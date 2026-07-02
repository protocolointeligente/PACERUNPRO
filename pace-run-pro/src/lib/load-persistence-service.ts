/**
 * Serviço de persistência de carga de treinamento.
 * Lê WorkoutLog do banco, computa CTL/ATL/TSB, EWMA, ACWR, rolling loads,
 * tendência e form, e persiste em DailyLoad.
 * Chamado pelo scheduler diário (/api/cron/training-load).
 */

import { prisma } from "@/lib/prisma";
import { estimateTSS } from "@/lib/training-load";
import { computeLoadSeries, formStatus } from "@/lib/sports-science/load-series";
import { computeEWMASeries } from "@/lib/sports-science/ewma";
import { computeACWR } from "@/lib/sports-science/acwr";
import { weeklyLoad, monthlyLoad } from "@/lib/sports-science/rolling-load";
import { computeTendency } from "@/lib/sports-science/tendency";

/** Processa e persiste a carga diária de um único atleta. */
export async function persistAthleteLoad(athleteId: string): Promise<void> {
  const loadParams = await prisma.athleteLoadParams.findUnique({
    where: { athleteId },
    select: { thresholdPaceSecPerKm: true, ftpWatts: true, hrMax: true, hrRest: true },
  });

  // Fetch the last 180 days of workout logs
  const since = new Date();
  since.setDate(since.getDate() - 180);

  const logs = await prisma.workoutLog.findMany({
    where: { athleteId, startedAt: { gte: since } },
    select: {
      startedAt: true,
      workout: {
        select: {
          type: true,
          targetDistanceKm: true,
          targetDurationMin: true,
          targetPaceSecPerKm: true,
          targetRpe: true,
        },
      },
      durationSec: true,
      avgPaceSecPerKm: true,
      avgHr: true,
      rpe: true,
    },
    orderBy: { startedAt: "asc" },
  });

  // Build dailyTss map: YYYY-MM-DD → total TSS
  const dailyTss = new Map<string, number>();
  for (const log of logs) {
    if (!log.startedAt || !log.workout) continue;
    const dateStr = log.startedAt.toISOString().slice(0, 10);
    const tss = estimateTSS(
      {
        type: log.workout.type,
        targetDistanceKm: log.workout.targetDistanceKm,
        targetDurationMin: log.workout.targetDurationMin ?? (log.durationSec ? log.durationSec / 60 : undefined),
        targetPaceSecPerKm: log.avgPaceSecPerKm ?? log.workout.targetPaceSecPerKm,
        targetRpe: log.rpe ?? log.workout.targetRpe,
      },
      loadParams,
    );
    dailyTss.set(dateStr, (dailyTss.get(dateStr) ?? 0) + tss);
  }

  if (dailyTss.size === 0) return;

  // Compute all series
  const loadSeries = computeLoadSeries(dailyTss, 90);
  const ewmaSeries = computeEWMASeries(dailyTss, undefined, undefined, 90);
  const acwr = computeACWR(dailyTss);

  // Build EWMA lookup map
  const ewmaByDate = new Map(ewmaSeries.map((d) => [d.date, d]));

  // Determine trend from the last 14 days of CTL
  const tendency = computeTendency(loadSeries, 14);

  // Last day date string for form computation
  const lastLoad = loadSeries[loadSeries.length - 1];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Upsert one row per day in the series (last 90 days)
  const ops = loadSeries.map((day) => {
    const ewmaDay = ewmaByDate.get(day.date);
    const dayDate = new Date(day.date + "T00:00:00.000Z");
    const isToday = day.date === todayStr;

    return prisma.dailyLoad.upsert({
      where: { athleteId_date: { athleteId, date: dayDate } },
      create: {
        athleteId,
        date: dayDate,
        tss: day.tss,
        ctl: day.ctl,
        atl: day.atl,
        tsb: day.tsb,
        ewmaAcute: ewmaDay?.ewmaAcute ?? 0,
        ewmaChronic: ewmaDay?.ewmaChronic ?? 0,
        ewmaRatio: ewmaDay?.ewmaRatio ?? 1,
        weeklyLoad: isToday ? weeklyLoad(dailyTss) : 0,
        monthlyLoad: isToday ? monthlyLoad(dailyTss) : 0,
        acwr: isToday ? acwr.ratio : null,
        trend: isToday ? tendency.trend : null,
        form: day.date === lastLoad?.date ? formStatus(day.tsb) : null,
      },
      update: {
        tss: day.tss,
        ctl: day.ctl,
        atl: day.atl,
        tsb: day.tsb,
        ewmaAcute: ewmaDay?.ewmaAcute ?? 0,
        ewmaChronic: ewmaDay?.ewmaChronic ?? 0,
        ewmaRatio: ewmaDay?.ewmaRatio ?? 1,
        weeklyLoad: isToday ? weeklyLoad(dailyTss) : undefined,
        monthlyLoad: isToday ? monthlyLoad(dailyTss) : undefined,
        acwr: isToday ? acwr.ratio : undefined,
        trend: isToday ? tendency.trend : undefined,
        form: day.date === lastLoad?.date ? formStatus(day.tsb) : undefined,
        computedAt: new Date(),
      },
    });
  });

  // Execute in batches of 50 to avoid query size limits
  for (let i = 0; i < ops.length; i += 50) {
    await prisma.$transaction(ops.slice(i, i + 50));
  }
}

/** Processa todos os atletas ativos. Invocado pelo cron job. */
export async function persistAllAthletesLoad(): Promise<{
  processed: number;
  errors: { athleteId: string; error: string }[];
}> {
  const athletes = await prisma.athlete.findMany({
    where: { status: "ativo" },
    select: { id: true },
  });

  let processed = 0;
  const errors: { athleteId: string; error: string }[] = [];

  for (const athlete of athletes) {
    try {
      await persistAthleteLoad(athlete.id);
      processed++;
    } catch (err) {
      errors.push({
        athleteId: athlete.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { processed, errors };
}
