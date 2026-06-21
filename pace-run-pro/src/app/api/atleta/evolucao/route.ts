import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function weekLabel(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athleteRow = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athleteRow) return NextResponse.json({ weeklyVolume: [], monthlyVolume: [], avgPace: [], avgHr: [], trainingLoad: [], weightHistory: [], vo2History: [], races: [], hasData: false });

  const athleteId = athleteRow.id;
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [logs, metrics, perfTests, races, checkins] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId, workout: { date: { gte: twelveWeeksAgo } } },
      include: { workout: { select: { date: true, type: true, title: true } } },
      orderBy: { workout: { date: "asc" } },
    }),
    prisma.metric.findMany({
      where: { athleteId, date: { gte: twelveMonthsAgo } },
      orderBy: { date: "asc" },
      select: { date: true, weightKg: true, vo2max: true },
    }),
    prisma.performanceTest.findMany({
      where: { athleteId, vo2max: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, vo2max: true },
    }),
    prisma.race.findMany({
      where: { athleteId, resultTime: { not: null } },
      orderBy: { date: "desc" },
      take: 6,
      select: { date: true, distanceKm: true, resultTime: true },
    }),
    prisma.checkIn.findMany({
      where: { athleteId },
      orderBy: { date: "desc" },
      take: 10,
      select: { date: true, rpe: true, sleep: true, fatigue: true, pain: true, mood: true },
    }),
  ]);

  // ── Weekly aggregates ────────────────────────────────────────────────────
  const weekMap = new Map<string, { km: number; paces: number[]; hrs: number[]; loadUA: number }>();
  for (const log of logs) {
    const label = weekLabel(new Date(log.workout.date));
    const e = weekMap.get(label) ?? { km: 0, paces: [], hrs: [], loadUA: 0 };
    e.km += log.distanceKm ?? 0;
    if (log.avgPaceSecPerKm) e.paces.push(log.avgPaceSecPerKm);
    if (log.avgHr) e.hrs.push(log.avgHr);
    if (log.rpe && log.durationSec) e.loadUA += log.rpe * (log.durationSec / 60);
    weekMap.set(label, e);
  }

  const weeklyVolume = [...weekMap.entries()].map(([label, d]) => ({ label, km: Math.round(d.km * 10) / 10 }));
  const avgPace = [...weekMap.entries()].filter(([, d]) => d.paces.length).map(([label, d]) => ({ label, paceSec: Math.round(d.paces.reduce((a, b) => a + b, 0) / d.paces.length) }));
  const avgHr = [...weekMap.entries()].filter(([, d]) => d.hrs.length).map(([label, d]) => ({ label, hr: Math.round(d.hrs.reduce((a, b) => a + b, 0) / d.hrs.length) }));
  const trainingLoad = [...weekMap.entries()].filter(([, d]) => d.loadUA > 0).map(([label, d]) => ({ label, load: Math.round(d.loadUA) }));

  // ── Monthly ──────────────────────────────────────────────────────────────
  const monthMap = new Map<string, number>();
  for (const log of logs) {
    const label = monthLabel(new Date(log.workout.date));
    monthMap.set(label, (monthMap.get(label) ?? 0) + (log.distanceKm ?? 0));
  }
  const monthlyVolume = [...monthMap.entries()].map(([label, km]) => ({ label, km: Math.round(km * 10) / 10 }));

  // ── Weight ───────────────────────────────────────────────────────────────
  const weightHistory = metrics.filter(m => m.weightKg != null).map(m => ({
    label: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    kg: m.weightKg!,
  }));

  // ── VO2 ──────────────────────────────────────────────────────────────────
  const vo2History = [
    ...perfTests.filter(t => t.vo2max != null).map(t => ({ label: new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), vo2: Math.round(t.vo2max! * 10) / 10 })),
    ...metrics.filter(m => m.vo2max != null).map(m => ({ label: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), vo2: Math.round(m.vo2max! * 10) / 10 })),
  ];

  // ── Races ─────────────────────────────────────────────────────────────────
  const formattedRaces = races.map(r => ({
    distance: r.distanceKm >= 42 ? "Maratona" : r.distanceKm >= 21 ? "Meia maratona" : r.distanceKm >= 10 ? "10 km" : r.distanceKm >= 5 ? "5 km" : `${r.distanceKm} km`,
    date: new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    time: r.resultTime ?? "—",
    pace: "—",
  }));

  // ── Recent check-ins for coach page (also used here for summary) ─────────
  const recentCheckins = checkins.map(c => ({
    date: new Date(c.date).toISOString().split("T")[0],
    rpe: c.rpe ?? 0,
    sleep: c.sleep ?? 0,
    fatigue: c.fatigue ?? 0,
    pain: c.pain ?? 0,
    mood: c.mood ?? 0,
  }));

  const hasData = logs.length > 0 || metrics.length > 0 || perfTests.length > 0;

  return NextResponse.json({ weeklyVolume, monthlyVolume, avgPace, avgHr, trainingLoad, weightHistory, vo2History, races: formattedRaces, checkins: recentCheckins, hasData });
}
