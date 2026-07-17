import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { displayWorkoutType, inferWorkoutModality, modalityNote, normalizeWorkoutType } from "@/lib/workout-normalization";

export const dynamic = "force-dynamic";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
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
    sport,
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
    sport?: string;
  };

  if (!athleteId || !date || !title || !type) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findFirst({
    where: {
      id: athleteId,
      OR: [
        { coachId: coach.id },
        { trainingPlans: { some: { coachId: coach.id } } },
      ],
    },
    select: { goal: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta inválido" }, { status: 403 });
  }

  const workoutDate = new Date(`${date}T12:00:00`);
  if (isNaN(workoutDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const workoutType = normalizeWorkoutType(type, sport);
  const modality = inferWorkoutModality({ sport, type, title, objective });
  const note = modalityNote(sport);

  const dow = workoutDate.getDay();
  const diffToMon = (dow + 6) % 7;
  const weekStart = new Date(workoutDate);
  weekStart.setDate(workoutDate.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Find or create active plan
  let plan = await prisma.trainingPlan.findFirst({
    where: {
      athleteId,
      coachId: coach.id,
      startDate: { lte: weekEnd },
      endDate: { gte: workoutDate },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!plan) {
    plan = await prisma.trainingPlan.create({
      data: {
        athleteId,
        coachId: coach.id,
        name: "Plano de Treinamento",
        goal: athlete?.goal ?? "PERFORMANCE",
        phase: "BASE",
        startDate: weekStart,
        endDate: new Date(weekStart.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Week boundaries (Mon–Sun) for the workout date
  let week = await prisma.trainingWeek.findFirst({
    where: {
      planId: plan.id,
      startDate: { lte: workoutDate },
      endDate: { gte: workoutDate },
    },
  });
  if (!week) {
    const weekCount = await prisma.trainingWeek.count({ where: { planId: plan.id } });
    week = await prisma.trainingWeek.create({
      data: {
        planId: plan.id,
        weekNumber: weekCount + 1,
        phase: plan.phase,
        startDate: weekStart,
        endDate: weekEnd,
        released: true,
      },
    });
  }

  const workout = await prisma.workout.create({
    data: {
      weekId: week.id,
      date: workoutDate,
      type: workoutType,
      title,
      status: "LIBERADO",
      modality,
      source: "manual",
      objective: objective ?? "",
      notes: note ?? undefined,
      structured,
      ...(blocks ? { blocks } : {}),
      ...(targetDistanceKm != null ? { targetDistanceKm } : {}),
      ...(targetDurationMin != null ? { targetDurationMin } : {}),
      ...(targetPaceSecPerKm != null ? { targetPaceSecPerKm } : {}),
      ...(targetRpe != null ? { targetRpe } : {}),
    },
    select: {
      id: true,
      date: true,
      title: true,
      type: true,
      status: true,
      structured: true,
      objective: true,
      notes: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetPaceSecPerKm: true,
      targetRpe: true,
    },
  });

  return NextResponse.json({
    id: workout.id,
    date: dateKey(workout.date),
    type: displayWorkoutType(workout.type as string, modality),
    rawType: workout.type,
    modality,
    title: workout.title,
    status: workout.status,
    structured: workout.structured,
    objective: workout.objective,
    notes: workout.notes,
    targetDistanceKm: workout.targetDistanceKm,
    targetDurationMin: workout.targetDurationMin,
    targetPaceSecPerKm: workout.targetPaceSecPerKm,
    targetRpe: workout.targetRpe,
    tss: 0,
    plannedTss: 0,
    actualTss: null,
    released: true,
  }, { status: 201 });
}
