import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id, week: { plan: { athleteId: athlete.id } } },
    include: { logs: { where: { athleteId: athlete.id }, take: 1 } },
  });

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...workout,
    date: workout.date.toISOString(),
    logs: workout.logs.map((l) => ({
      ...l,
      startedAt: l.startedAt?.toISOString() ?? null,
      finishedAt: l.finishedAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    createdAt: workout.createdAt.toISOString(),
    updatedAt: workout.updatedAt.toISOString(),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  // Verify workout belongs to this athlete
  const workout = await prisma.workout.findFirst({
    where: { id, week: { plan: { athleteId: athlete.id } } },
    select: { id: true },
  });

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { rpe, feeling, distanceKm, durationSec } = await req.json();

  await prisma.workoutLog.create({
    data: {
      workoutId: id,
      athleteId: athlete.id,
      rpe: rpe ?? null,
      feeling: feeling ?? null,
      distanceKm: distanceKm ?? null,
      durationSec: durationSec ?? null,
      finishedAt: new Date(),
    },
  });

  await prisma.workout.update({
    where: { id },
    data: { status: "CONCLUIDO" },
  });

  return NextResponse.json({ success: true });
}
