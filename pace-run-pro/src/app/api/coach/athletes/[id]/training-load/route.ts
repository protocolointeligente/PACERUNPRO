import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateActualTSS, estimateTSS, computeLoadSeries, detectAlerts } from "@/lib/training-load";

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

  const [loadParams, workouts] = await Promise.all([
    prisma.athleteLoadParams.findUnique({ where: { athleteId } }),
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
        logs: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            startedAt: true,
            durationSec: true,
            distanceKm: true,
            avgPaceSecPerKm: true,
            avgHr: true,
            maxHr: true,
            rpe: true,
          },
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Aggregate TSS per day
  const dailyTss = new Map<string, number>();
  for (const w of workouts) {
    const log = w.logs[0] ?? null;
    const tss = log
      ? estimateActualTSS(log, loadParams, w.targetRpe ?? 6)
      : estimateTSS(
          {
            type: w.type as string,
            targetDistanceKm: w.targetDistanceKm,
            targetDurationMin: w.targetDurationMin,
            targetPaceSecPerKm: w.targetPaceSecPerKm,
            targetRpe: w.targetRpe,
          },
          loadParams,
        );
    const day = (log?.startedAt ?? w.date).toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  const series = computeLoadSeries(dailyTss, 90);
  const alerts = detectAlerts(series);

  return NextResponse.json({ series, alerts, params: loadParams ?? null });
}
