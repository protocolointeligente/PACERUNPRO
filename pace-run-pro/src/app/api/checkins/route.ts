import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json([]);

  const rows = await prisma.checkIn.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "desc" },
    take: 10,
    select: { date: true, rpe: true, pain: true, sleep: true, fatigue: true, mood: true },
  });

  // Fetch targetRpe from scheduled workouts for each check-in date
  const rpeByDate = new Map<string, number | null>();
  if (rows.length > 0) {
    const dates = rows.map((r) => r.date);
    const minDate = dates.reduce((a, b) => (a < b ? a : b));
    const maxDate = dates.reduce((a, b) => (a > b ? a : b));
    const workouts = await prisma.workout.findMany({
      where: {
        week: { plan: { athleteId: athlete.id } },
        date: { gte: minDate, lte: new Date(maxDate.getTime() + 86_400_000) },
      },
      select: { date: true, targetRpe: true },
    });
    for (const w of workouts) {
      const d = w.date.toISOString().slice(0, 10);
      if (!rpeByDate.has(d)) rpeByDate.set(d, w.targetRpe ?? null);
    }
  }

  return NextResponse.json(
    rows.map((c) => ({
      date: c.date.toISOString().slice(0, 10),
      rpe: c.rpe ?? 0,
      pain: c.pain ?? 0,
      sleep: c.sleep ?? 0,
      fatigue: c.fatigue ?? 0,
      mood: c.mood ?? 0,
      plannedRpe: rpeByDate.get(c.date.toISOString().slice(0, 10)) ?? null,
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const body = await req.json() as {
    rpe?: number;
    pain?: number;
    sleep?: number;
    fatigue?: number;
    mood?: number;
    notes?: string;
    workoutLogId?: string;
  };

  const { rpe, pain, sleep, fatigue, mood, notes } = body;

  // Sinaliza risco ao treinador: dor >= 6, fadiga >= 8 ou RPE >= 9
  const flagged =
    (pain != null && pain >= 6) ||
    (fatigue != null && fatigue >= 8) ||
    (rpe != null && rpe >= 9);

  const flagReason = flagged
    ? [
        pain != null && pain >= 8 ? `dor intensa ${pain}/10 — encaminhamento médico recomendado` : pain != null && pain >= 6 ? `dor ${pain}/10` : null,
        fatigue != null && fatigue >= 8 ? `fadiga ${fatigue}/10` : null,
        rpe != null && rpe >= 9 ? `RPE ${rpe}/10` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  const checkIn = await prisma.checkIn.create({
    data: {
      athleteId: athlete.id,
      rpe: rpe ?? null,
      pain: pain ?? null,
      sleep: sleep ?? null,
      fatigue: fatigue ?? null,
      mood: mood ?? null,
      notes: notes ?? null,
      flagged,
      flagReason: flagReason ?? null,
    },
  });

  // Recalcula recoveryScore do atleta
  const sleepVal = sleep ?? 5;
  const fatigueVal = fatigue ?? 5;
  const painVal = pain ?? 0;
  const moodVal = mood ?? 5;
  const recoveryScore = Math.min(
    1,
    Math.max(0, (sleepVal + (10 - fatigueVal) + (10 - painVal) + moodVal) / 40)
  );

  await prisma.athlete.update({
    where: { id: athlete.id },
    data: { recoveryScore },
  });

  return NextResponse.json({ checkIn, flagged, recoveryScore });
}
