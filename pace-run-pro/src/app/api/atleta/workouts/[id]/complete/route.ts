import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const workout = await prisma.workout.findFirst({
    where: { id, week: { plan: { athleteId: athlete.id } } },
    select: { id: true, targetDurationMin: true },
  });
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    durationSec?: number;
    completedSteps?: number;
    totalSteps?: number;
    rpe?: number;
    feeling?: string;
    notes?: string;
    distanceMeters?: number;
    avgPaceSecPerKm?: number;
  };

  const { durationSec, rpe, feeling, notes, distanceMeters, avgPaceSecPerKm } = body;

  const existing = await prisma.workoutLog.findFirst({
    where: { workoutId: id, athleteId: athlete.id },
    select: { id: true },
  });

  const durationMin = durationSec ? durationSec / 60 : null;
  const actualLoad = durationMin && rpe ? durationMin * rpe : null;

  if (existing) {
    await prisma.workoutLog.update({
      where: { id: existing.id },
      data: {
        rpe: rpe ?? undefined,
        feeling: feeling ?? undefined,
        durationSec: durationSec ?? undefined,
        distanceKm: distanceMeters ? distanceMeters / 1000 : undefined,
        avgPaceSecPerKm: avgPaceSecPerKm ?? undefined,
        actualLoad: actualLoad ?? undefined,
        finishedAt: new Date(),
      },
    });
  } else {
    await prisma.workoutLog.create({
      data: {
        workoutId: id,
        athleteId: athlete.id,
        rpe: rpe ?? null,
        feeling: feeling ?? null,
        durationSec: durationSec ?? null,
        distanceKm: distanceMeters ? distanceMeters / 1000 : null,
        avgPaceSecPerKm: avgPaceSecPerKm ?? null,
        actualLoad: actualLoad ?? null,
        finishedAt: new Date(),
        source: "manual",
      },
    });
  }

  if (notes) {
    await prisma.workout.update({
      where: { id },
      data: { status: "CONCLUIDO", notes: notes || undefined },
    });
  } else {
    await prisma.workout.update({
      where: { id },
      data: { status: "CONCLUIDO" },
    });
  }

  return NextResponse.json({ success: true });
}
