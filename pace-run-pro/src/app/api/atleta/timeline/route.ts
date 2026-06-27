import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const SINCE = 90; // days

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ events: [] });

  const since = new Date();
  since.setDate(since.getDate() - SINCE);

  const [logs, tests, checkins] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId: athlete.id, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 60,
      select: {
        id: true, startedAt: true, distanceKm: true,
        durationSec: true, rpe: true,
        workout: { select: { title: true, type: true } },
      },
    }),
    prisma.performanceTest.findMany({
      where: { athleteId: athlete.id, date: { gte: since } },
      orderBy: { date: "desc" },
      take: 10,
      select: { id: true, date: true, type: true, vo2max: true, vamKmh: true, notes: true },
    }),
    prisma.checkIn.findMany({
      where: { athleteId: athlete.id, date: { gte: since } },
      orderBy: { date: "desc" },
      take: 30,
      select: { id: true, date: true, mood: true, fatigue: true, notes: true },
    }),
  ]);

  type TimelineEvent = {
    id: string; date: string; type: string; title: string;
    subtitle?: string; detail?: string; badge?: string; highlight?: boolean;
  };

  const events: TimelineEvent[] = [];

  for (const log of logs) {
    if (!log.startedAt) continue;
    const km = log.distanceKm ? log.distanceKm.toFixed(1) : null;
    const dur = log.durationSec ? `${Math.round(log.durationSec / 60)} min` : null;
    events.push({
      id: log.id,
      date: log.startedAt.toISOString().split("T")[0],
      type: "treino",
      title: log.workout?.title ?? (log.workout?.type ?? "Treino"),
      subtitle: [km ? `${km} km` : null, dur].filter(Boolean).join(" · ") || undefined,
      badge: log.rpe ? `RPE ${log.rpe}` : undefined,
    });
  }

  for (const test of tests) {
    events.push({
      id: test.id,
      date: test.date.toISOString().split("T")[0],
      type: "teste",
      title: `Teste de performance — ${test.type ?? "Geral"}`,
      subtitle: test.vamKmh
        ? `VAM ${test.vamKmh.toFixed(1)} km/h`
        : test.vo2max
        ? `VO₂máx ${test.vo2max.toFixed(1)}`
        : undefined,
      detail: test.notes ?? undefined,
      highlight: true,
    });
  }

  for (const ci of checkins) {
    if (ci.mood || ci.fatigue) {
      events.push({
        id: ci.id,
        date: ci.date.toISOString().split("T")[0],
        type: "checkin",
        title: "Check-in diário",
        subtitle: [
          ci.mood ? `Humor ${ci.mood}/10` : null,
          ci.fatigue ? `Fadiga ${ci.fatigue}/10` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
        detail: ci.notes ?? undefined,
      });
    }
  }

  events.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ events });
}
