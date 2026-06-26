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

  const result = { series, alerts, latest: latest ?? null };
  cache.set(athlete.id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json(result);
}
