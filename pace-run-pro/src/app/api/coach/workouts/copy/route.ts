import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";

export const dynamic = "force-dynamic";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function findOrCreatePlanAndWeek(
  athleteId: string,
  coachId: string,
  workoutDate: Date
) {
  let plan = await prisma.trainingPlan.findFirst({
    where: {
      athleteId,
      coachId,
      startDate: { lte: workoutDate },
      endDate: { gte: workoutDate },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!plan) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { goal: true },
    });
    plan = await prisma.trainingPlan.create({
      data: {
        athleteId,
        coachId,
        name: "Plano de Treinamento",
        goal: athlete?.goal ?? "PERFORMANCE",
        phase: "BASE",
        startDate: workoutDate,
        endDate: new Date(workoutDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const dow = workoutDate.getDay();
  const diffToMon = (dow + 6) % 7;
  const weekStart = new Date(workoutDate);
  weekStart.setDate(workoutDate.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

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

  return week;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: { select: { id: true } },
      trainingPlans: { distinct: ["athleteId"], select: { athleteId: true } },
    },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const coachAthleteIds = new Set([
    ...coach.athletes.map((a) => a.id),
    ...coach.trainingPlans.map((plan) => plan.athleteId),
  ]);

  const body = await req.json();
  const { workoutId, targetAthleteIds } = body as {
    workoutId: string;
    targetAthleteIds: string[];
  };

  if (!workoutId || !Array.isArray(targetAthleteIds) || targetAthleteIds.length === 0) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Find source workout (must belong to one of coach's athletes)
  const source = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      week: { plan: { coachId: coach.id } },
    },
    select: {
      date: true,
      type: true,
      title: true,
      objective: true,
      warmup: true,
      mainSet: true,
      cooldown: true,
      notes: true,
      structured: true,
      blocks: true,
      targetPaceSecPerKm: true,
      targetHrZone: true,
      targetRpe: true,
      targetDistanceKm: true,
      targetDurationMin: true,
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });
  }

  const validTargets = targetAthleteIds.filter((id) => coachAthleteIds.has(id));
  if (validTargets.length === 0) {
    return NextResponse.json({ error: "Nenhum atleta válido" }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  for (const athleteId of validTargets) {
    // Skip if this athlete already has a workout on the same date
    const sourceDay = dateKey(source.date);
    const existing = await prisma.workout.findFirst({
      where: {
        date: {
          gte: new Date(`${sourceDay}T00:00:00`),
          lte: new Date(`${sourceDay}T23:59:59`),
        },
        type: source.type,
        title: source.title,
        week: { plan: { athleteId, coachId: coach.id } },
      },
      select: { id: true },
    });
    if (existing) { skipped++; continue; }

    const week = await findOrCreatePlanAndWeek(athleteId, coach.id, source.date);
    await prisma.workout.create({
      data: {
        weekId: week.id,
        date: source.date,
        type: source.type as WorkoutType,
        title: source.title,
        status: "LIBERADO",
        objective: source.objective ?? "",
        warmup: source.warmup,
        mainSet: source.mainSet,
        cooldown: source.cooldown,
        notes: source.notes,
        structured: source.structured,
        ...(source.blocks ? { blocks: source.blocks } : {}),
        ...(source.targetPaceSecPerKm != null ? { targetPaceSecPerKm: source.targetPaceSecPerKm } : {}),
        ...(source.targetHrZone != null ? { targetHrZone: source.targetHrZone } : {}),
        ...(source.targetRpe != null ? { targetRpe: source.targetRpe } : {}),
        ...(source.targetDistanceKm != null ? { targetDistanceKm: source.targetDistanceKm } : {}),
        ...(source.targetDurationMin != null ? { targetDurationMin: source.targetDurationMin } : {}),
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped });
}
