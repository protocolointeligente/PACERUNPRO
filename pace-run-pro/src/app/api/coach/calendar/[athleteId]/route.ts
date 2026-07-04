import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { athleteId } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parâmetros from/to obrigatórios" }, { status: 400 });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, coachId: coach.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const workouts = await prisma.workout.findMany({
    where: {
      week: { plan: { athleteId, coachId: coach.id } },
      date: { gte: fromDate, lte: toDate },
    },
    select: {
      id: true,
      date: true,
      type: true,
      title: true,
      status: true,
      objective: true,
      warmup: true,
      mainSet: true,
      cooldown: true,
      notes: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetPaceSecPerKm: true,
      targetPacePer100m: true,
      targetPowerWatts: true,
      targetRpe: true,
      structured: true,
    },
    orderBy: { date: "asc" },
  });

  const workoutIds = workouts.map((w) => w.id);
  const logs = workoutIds.length > 0
    ? await prisma.workoutLog.findMany({
        where: { workoutId: { in: workoutIds }, athleteId },
        select: {
          id: true,
          workoutId: true,
          distanceKm: true,
          durationSec: true,
          avgPaceSecPerKm: true,
          avgWatts: true,
          avgPacePer100m: true,
          rpe: true,
          actualLoad: true,
          tss: true,
          feeling: true,
        },
      })
    : [];

  return NextResponse.json({ workouts, logs });
}
