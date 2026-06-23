import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS, computeLoadSeries, detectAlerts } from "@/lib/training-load";

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

  const workouts = await prisma.workout.findMany({
    where: {
      week: { plan: { athleteId: athlete.id } },
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
  });

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
      athlete.loadParams,
    );
    const day = w.date.toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  const series = computeLoadSeries(dailyTss, 30);
  const alerts = detectAlerts(series);
  const latest = series[series.length - 1];

  return NextResponse.json({ series, alerts, latest: latest ?? null });
}
