import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
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

  // Sinaliza risco automaticamente
  const flagged =
    (pain != null && pain >= 7) ||
    (fatigue != null && fatigue >= 8) ||
    (rpe != null && rpe >= 9);

  const flagReason = flagged
    ? [
        pain != null && pain >= 7 ? `dor ${pain}/10` : null,
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
