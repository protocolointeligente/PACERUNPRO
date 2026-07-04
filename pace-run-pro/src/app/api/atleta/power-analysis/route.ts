import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

const POWER_ZONES = [
  { zone: "Z1", label: "Recuperação",    min: 0,    max: 0.55, color: "#94a3b8" },
  { zone: "Z2", label: "Endurance",      min: 0.55, max: 0.75, color: "#38bdf8" },
  { zone: "Z3", label: "Tempo",          min: 0.75, max: 0.90, color: "#4ade80" },
  { zone: "Z4", label: "Limiar",         min: 0.90, max: 1.05, color: "#facc15" },
  { zone: "Z5", label: "VO₂máx",        min: 1.05, max: 1.20, color: "#fb923c" },
  { zone: "Z6", label: "Anaeróbio",     min: 1.20, max: 1.50, color: "#f87171" },
  { zone: "Z7", label: "Neuromuscular", min: 1.50, max: Infinity, color: "#c084fc" },
];

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      loadParams: { select: { ftpWatts: true } },
      sportProfiles: {
        where: { sport: "BIKE" },
        select: { ftpWatts: true },
        take: 1,
      },
    },
  });
  if (!athlete) return NextResponse.json({ hasData: false });

  const ftp = athlete.sportProfiles[0]?.ftpWatts ?? athlete.loadParams?.ftpWatts ?? null;

  const cutoff = new Date(Date.now() - 12 * 7 * 86400_000);

  const logs = await prisma.workoutLog.findMany({
    where: {
      athleteId: athlete.id,
      sport: "BIKE",
      startedAt: { gte: cutoff },
      avgWatts: { not: null },
    },
    select: {
      startedAt: true,
      avgWatts: true,
      normalizedPower: true,
      intensityFactor: true,
      tssFromPower: true,
      durationSec: true,
    },
    orderBy: { startedAt: "asc" },
  });

  if (logs.length === 0) return NextResponse.json({ hasData: false, ftp });

  // Weekly TSS (last 8 weeks)
  const weekMap = new Map<string, number>();
  for (const log of logs) {
    if (!log.startedAt) continue;
    const week = getWeekKey(log.startedAt);
    weekMap.set(week, (weekMap.get(week) ?? 0) + (log.tssFromPower ?? 0));
  }
  const weeklyTss = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, tss]) => ({ week, tss: Math.round(tss) }));

  // Aggregate stats
  const withNp = logs.filter((l) => l.normalizedPower != null);
  const avgNp = withNp.length > 0
    ? Math.round(withNp.reduce((s, l) => s + (l.normalizedPower ?? 0), 0) / withNp.length)
    : null;
  const avgIf = withNp.length > 0
    ? Math.round(withNp.reduce((s, l) => s + (l.intensityFactor ?? 0), 0) / withNp.length * 100) / 100
    : null;
  const totalTss = Math.round(logs.reduce((s, l) => s + (l.tssFromPower ?? 0), 0));

  // Power zone distribution (by NP or avgWatts vs FTP)
  let zones: { zone: string; label: string; pctFtp: string; sessions: number; color: string }[] = [];
  if (ftp && ftp > 0) {
    const zoneCount = new Map<string, number>();
    for (const log of logs) {
      const w = log.normalizedPower ?? log.avgWatts;
      if (!w) continue;
      const pct = w / ftp;
      const z = POWER_ZONES.find((z) => pct >= z.min && pct < z.max);
      if (z) zoneCount.set(z.zone, (zoneCount.get(z.zone) ?? 0) + 1);
    }
    zones = POWER_ZONES.map((z) => ({
      zone: z.zone,
      label: z.label,
      pctFtp: z.max === Infinity
        ? `>${Math.round(z.min * 100)}%`
        : `${Math.round(z.min * 100)}–${Math.round(z.max * 100)}%`,
      sessions: zoneCount.get(z.zone) ?? 0,
      color: z.color,
    }));
  }

  return NextResponse.json({
    hasData: true,
    ftp,
    totalSessions: logs.length,
    avgNp,
    avgIf,
    totalTss,
    weeklyTss,
    zones,
  });
}
