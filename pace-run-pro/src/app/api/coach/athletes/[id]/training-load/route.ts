import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS, computeLoadSeries, detectAlerts } from "@/lib/training-load";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: athleteId } = await params;

  // Verify coach owns this athlete
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { athletes: { select: { id: true } } },
  });
  if (!coach?.athletes.some((a) => a.id === athleteId)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today.getTime() - 120 * 86400_000);

  const [loadParams, workoutLogs, futureWorkouts] = await Promise.all([
    prisma.athleteLoadParams.findUnique({ where: { athleteId } }),
    // Actual completed workout logs (real training stimulus)
    prisma.workoutLog.findMany({
      where: {
        athleteId,
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
    // Future scheduled workouts for projection
    prisma.workout.findMany({
      where: {
        week: { plan: { athleteId } },
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

  // Actual logs drive CTL/ATL/TSB
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
      loadParams,
    );
    const day = log.workout.date.toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  // Future planned workouts for projection
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
        loadParams,
      );
      dailyTss.set(day, tss);
    }
  }

  const series = computeLoadSeries(dailyTss, 90);
  const alerts = detectAlerts(series);

  return NextResponse.json({ series, alerts, params: loadParams ?? null });
}
