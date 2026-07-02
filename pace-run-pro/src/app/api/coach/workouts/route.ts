import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";
import { computeWeekBounds, findOrCreateActivePlan, findOrCreateWeek } from "@/lib/prescription-service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json();
  const {
    athleteId,
    date,
    title,
    type,
    structured = false,
    blocks,
    targetDistanceKm,
    targetDurationMin,
    targetPaceSecPerKm,
    targetRpe,
    objective,
  } = body as {
    athleteId: string;
    date: string;
    title: string;
    type: string;
    structured?: boolean;
    blocks?: unknown;
    targetDistanceKm?: number;
    targetDurationMin?: number;
    targetPaceSecPerKm?: number;
    targetRpe?: number;
    objective?: string;
  };

  if (!athleteId || !date || !title || !type) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const coachAthleteIds = new Set(coach.athletes.map((a) => a.id));
  if (!coachAthleteIds.has(athleteId)) {
    return NextResponse.json({ error: "Atleta inválido" }, { status: 403 });
  }

  const workoutDate = new Date(date);
  if (isNaN(workoutDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const workoutType = type as WorkoutType;

  const plan = await findOrCreateActivePlan(athleteId, coach.id, new Date());
  const { weekStart, weekEnd } = computeWeekBounds(workoutDate);
  const week = await findOrCreateWeek(plan.id, plan.phase, weekStart, weekEnd);

  const workout = await prisma.workout.create({
    data: {
      weekId: week.id,
      date: workoutDate,
      type: workoutType,
      title,
      status: "LIBERADO",
      objective: objective ?? "",
      structured,
      ...(blocks ? { blocks } : {}),
      ...(targetDistanceKm != null ? { targetDistanceKm } : {}),
      ...(targetDurationMin != null ? { targetDurationMin } : {}),
      ...(targetPaceSecPerKm != null ? { targetPaceSecPerKm } : {}),
      ...(targetRpe != null ? { targetRpe } : {}),
    },
    select: { id: true, date: true, title: true, type: true, status: true, structured: true },
  });

  return NextResponse.json(workout, { status: 201 });
}
