import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { calculateVDOT, predictRaceTime, formatRaceTime, RACE_DISTANCES } from "@/lib/vdot";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ vdot: null, predictions: [] });

  const cutoff = new Date(Date.now() - 90 * 86400_000);

  // Best running effort in last 90 days: needs pace + distance (min 3 km)
  // OR condition covers both explicitly-tagged RUN logs and training workouts where sport is set on the Workout
  const logs = await prisma.workoutLog.findMany({
    where: {
      athleteId: athlete.id,
      distanceKm: { gte: 3 },
      avgPaceSecPerKm: { not: null, gt: 0 },
      OR: [
        { sport: "RUN" },
        { workout: { date: { gte: cutoff }, sport: "RUN" } },
      ],
    },
    select: { distanceKm: true, avgPaceSecPerKm: true },
    take: 100,
  });

  if (logs.length === 0) {
    return NextResponse.json({ vdot: null, predictions: [] });
  }

  // Highest VDOT across all qualifying runs = best current fitness estimate
  let bestVdot = 0;
  for (const log of logs) {
    if (!log.distanceKm || !log.avgPaceSecPerKm) continue;
    const timeSec = log.avgPaceSecPerKm * log.distanceKm;
    const v = calculateVDOT(log.distanceKm * 1000, timeSec);
    if (v > bestVdot) bestVdot = v;
  }

  if (bestVdot < 20) {
    return NextResponse.json({ vdot: null, predictions: [] });
  }

  const predictions = RACE_DISTANCES.map((d) => {
    const sec = predictRaceTime(bestVdot, d.meters);
    const paceSecPerKm = Math.round(sec / (d.meters / 1000));
    const paceMin = Math.floor(paceSecPerKm / 60);
    const paceSec = paceSecPerKm % 60;
    return {
      id: d.id,
      label: d.label,
      meters: d.meters,
      timeSec: sec,
      timeStr: formatRaceTime(sec),
      paceStr: `${paceMin}:${String(paceSec).padStart(2, "0")}/km`,
    };
  });

  return NextResponse.json({
    vdot: Math.round(bestVdot * 10) / 10,
    predictions,
  });
}
