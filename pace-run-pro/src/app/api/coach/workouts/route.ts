import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";

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

  // Find or create active plan
  let plan = await prisma.trainingPlan.findFirst({
    where: { athleteId, coachId: coach.id, endDate: { gte: new Date() } },
  });
  if (!plan) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { goal: true },
    });
    plan = await prisma.trainingPlan.create({
      data: {
        athleteId,
        coachId: coach.id,
        name: "Plano de Treinamento",
        goal: athlete?.goal ?? "PERFORMANCE",
        phase: "BASE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Week boundaries (Mon–Sun) for the workout date
  const dow = workoutDate.getDay(); // 0=Sun
  const diffToMon = (dow + 6) % 7;
  const weekStart = new Date(workoutDate);
  weekStart.setDate(workoutDate.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  let week = await prisma.trainingWeek.findFirst({
    where: { planId: plan.id, startDate: weekStart },
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
