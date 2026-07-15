import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { modalityNote, normalizeWorkoutType } from "@/lib/workout-normalization";

export const dynamic = "force-dynamic";

async function resolveCoachWorkout(userId: string, workoutId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: {
      id: true,
      athletes: { select: { id: true } },
      trainingPlans: { distinct: ["athleteId"], select: { athleteId: true } },
    },
  });
  if (!coach) return null;

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, week: { plan: { coachId: coach.id } } },
    select: {
      id: true,
      date: true,
      week: { select: { plan: { select: { athleteId: true } } } },
    },
  });
  return workout
    ? {
        coachId: coach.id,
        workoutId: workout.id,
        athleteId: workout.week.plan.athleteId,
        date: workout.date,
        athleteIds: [
          ...coach.athletes.map((a) => a.id),
          ...coach.trainingPlans.map((plan) => plan.athleteId),
        ],
      }
    : null;
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachWorkout(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    athleteId?: string;
    date?: string;
    title?: string;
    type?: string;
    structured?: boolean;
    blocks?: unknown;
    targetDistanceKm?: number | null;
    targetDurationMin?: number | null;
    targetPaceSecPerKm?: number | null;
    targetRpe?: number | null;
    objective?: string | null;
    sport?: string | null;
  };

  const data: Prisma.WorkoutUncheckedUpdateInput = {};
  let targetDate: Date | null = null;
  if (body.date) {
    const d = new Date(`${body.date}T12:00:00`);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    data.date = d;
    targetDate = d;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.type) data.type = normalizeWorkoutType(body.type, body.sport);
  if (typeof body.structured === "boolean") data.structured = body.structured;
  if (body.blocks !== undefined) data.blocks = body.blocks as Prisma.InputJsonValue;
  if (body.objective !== undefined) data.objective = body.objective ?? "";
  if (body.sport) data.notes = [modalityNote(body.sport), body.sport ? `Esporte: ${body.sport}` : null].filter(Boolean).join("\n");
  if (body.targetDistanceKm !== undefined) data.targetDistanceKm = body.targetDistanceKm;
  if (body.targetDurationMin !== undefined) data.targetDurationMin = body.targetDurationMin;
  if (body.targetPaceSecPerKm !== undefined) data.targetPaceSecPerKm = body.targetPaceSecPerKm;
  if (body.targetRpe !== undefined) data.targetRpe = body.targetRpe;
  const targetAthleteId = body.athleteId ?? resolved.athleteId;
  if (body.athleteId || body.date) {
    if (!resolved.athleteIds.includes(targetAthleteId)) {
      return NextResponse.json({ error: "Atleta invalido" }, { status: 403 });
    }
    const moveDate = targetDate ?? resolved.date;
    const week = await findOrCreatePlanAndWeek(targetAthleteId, resolved.coachId, moveDate);
    data.weekId = week.id;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  await prisma.workout.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachWorkout(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });

  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
