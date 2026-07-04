import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS, computeLoadSeries } from "@/lib/training-load";
import { acwrRisk, ACWR_RISK_LABELS } from "@/lib/sports-science/acwr";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ athletes: [] });

  // All athletes directly assigned to this coach
  const athletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: {
      id: true,
      loadParams: true,
      injuryHistory: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (athletes.length === 0) return NextResponse.json({ athletes: [] });

  const athleteIds = athletes.map((a) => a.id);
  const cutoff = new Date(Date.now() - 35 * 86400_000);

  // Batch-fetch logs for all athletes in one query
  const allLogs = await prisma.workoutLog.findMany({
    where: {
      athleteId: { in: athleteIds },
      workout: { date: { gte: cutoff } },
    },
    select: {
      athleteId: true,
      distanceKm: true,
      durationSec: true,
      avgPaceSecPerKm: true,
      rpe: true,
      workout: { select: { type: true, date: true } },
    },
  });

  // Group logs by athleteId
  const logsByAthlete = new Map<string, typeof allLogs>();
  for (const log of allLogs) {
    if (!logsByAthlete.has(log.athleteId)) logsByAthlete.set(log.athleteId, []);
    logsByAthlete.get(log.athleteId)!.push(log);
  }

  const result = athletes.map((athlete) => {
    const logs = logsByAthlete.get(athlete.id) ?? [];
    const dailyTss = new Map<string, number>();

    for (const log of logs) {
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

    const series = computeLoadSeries(dailyTss, 35);
    const latest = series[series.length - 1];
    const acwr = latest && latest.ctl > 0 ? Math.round((latest.atl / latest.ctl) * 100) / 100 : 1.0;
    const risk = acwrRisk(acwr);
    const riskInfo = ACWR_RISK_LABELS[risk];

    return {
      id: athlete.id,
      name: athlete.user.name ?? athlete.user.email,
      hasInjuryHistory: !!athlete.injuryHistory?.trim(),
      acwr,
      ctl: latest ? Math.round(latest.ctl * 10) / 10 : 0,
      atl: latest ? Math.round(latest.atl * 10) / 10 : 0,
      tsb: latest ? Math.round(latest.tsb * 10) / 10 : 0,
      risk,
      riskLabel: riskInfo.label,
      riskColor: riskInfo.color,
      recommendation: riskInfo.recommendation,
    };
  });

  // Sort: danger first, then caution, then others
  const riskOrder: Record<string, number> = { danger: 0, caution: 1, optimal: 2, undertrained: 3 };
  result.sort((a, b) => (riskOrder[a.risk] ?? 9) - (riskOrder[b.risk] ?? 9));

  return NextResponse.json({ athletes: result });
}
