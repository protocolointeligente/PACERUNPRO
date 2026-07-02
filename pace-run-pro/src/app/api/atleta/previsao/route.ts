import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function parseResultTime(s: string | null): number | null {
  if (!s) return null;
  const parts = s.split(":").map(Number);
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [recentLogs, latestTest, latestRace] = await Promise.all([
    prisma.workoutLog.findMany({
      where: {
        athleteId: athlete.id,
        startedAt: { gte: since90d },
        avgPaceSecPerKm: { not: null },
        distanceKm: { gte: 3 },
      },
      select: { distanceKm: true, durationSec: true, avgPaceSecPerKm: true, startedAt: true },
      orderBy: { distanceKm: "desc" },
      take: 20,
    }),
    prisma.performanceTest.findFirst({
      where: { athleteId: athlete.id },
      select: { vo2max: true, vamKmh: true, thresholdPaceSecPerKm: true, date: true, type: true },
      orderBy: { date: "desc" },
    }),
    prisma.race.findFirst({
      where: { athleteId: athlete.id, resultTime: { not: null } },
      select: { name: true, distanceKm: true, resultTime: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const bestEffort = recentLogs.length > 0 ? recentLogs[0] : null;
  const raceTimeSec = latestRace ? parseResultTime(latestRace.resultTime) : null;

  return NextResponse.json({
    bestEffort: bestEffort
      ? {
          distanceKm: bestEffort.distanceKm,
          durationSec: bestEffort.durationSec,
          avgPaceSecPerKm: bestEffort.avgPaceSecPerKm,
          date: bestEffort.startedAt,
          source: "workout_log",
        }
      : null,
    latestTest: latestTest
      ? {
          vo2max: latestTest.vo2max,
          vamKmh: latestTest.vamKmh,
          thresholdPaceSecPerKm: latestTest.thresholdPaceSecPerKm,
          date: latestTest.date,
          testType: latestTest.type,
        }
      : null,
    latestRace: latestRace && raceTimeSec
      ? {
          name: latestRace.name,
          distanceKm: latestRace.distanceKm,
          timeSeconds: raceTimeSec,
          date: latestRace.date,
        }
      : null,
  });
}
