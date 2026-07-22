import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";
import { copyWeekSchema, validationError } from "@/lib/api-validation";

export const dynamic = "force-dynamic";

function parseCalendarDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

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
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const planAthletes = await prisma.trainingPlan.findMany({
    where: { coachId: coach.id },
    distinct: ["athleteId"],
    select: { athleteId: true },
  });
  const coachAthleteIds = new Set([
    ...coach.athletes.map((a) => a.id),
    ...planAthletes.map((plan) => plan.athleteId),
  ]);

  const parsed = copyWeekSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const { sourceAthleteId, weekStart: weekStartStr, targetWeekStart: targetWeekStartStr, targetAthleteIds } = parsed.data;

  if (!coachAthleteIds.has(sourceAthleteId)) {
    return NextResponse.json({ error: "Atleta fonte inválido" }, { status: 403 });
  }

  const weekStart = parseCalendarDate(weekStartStr);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const targetWeekStart = parseCalendarDate(targetWeekStartStr ?? weekStartStr);
  targetWeekStart.setHours(0, 0, 0, 0);
  const targetWeekEnd = new Date(targetWeekStart);
  targetWeekEnd.setDate(targetWeekEnd.getDate() + 6);
  targetWeekEnd.setHours(23, 59, 59, 999);
  const dayOffset = Math.round((targetWeekStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));

  const sourceWorkouts = await prisma.workout.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      week: { plan: { athleteId: sourceAthleteId, coachId: coach.id } },
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

  if (sourceWorkouts.length === 0) {
    return NextResponse.json({ error: "Nenhum treino na semana do atleta fonte" }, { status: 400 });
  }

  const validTargets = targetAthleteIds.filter((id) => {
    if (!coachAthleteIds.has(id)) return false;
    return id !== sourceAthleteId || targetWeekStart.toISOString() !== weekStart.toISOString();
  });
  if (validTargets.length === 0) {
    return NextResponse.json({ error: "Nenhum atleta-alvo válido" }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  for (const athleteId of validTargets) {
    const occupiedWorkouts = await prisma.workout.findMany({
      where: { date: { gte: targetWeekStart, lte: targetWeekEnd }, week: { plan: { athleteId, coachId: coach.id } } },
      select: { date: true, title: true, type: true },
    });
    const occupiedKeys = new Set(
      occupiedWorkouts.map((w) => `${dateKey(w.date)}|${w.type}|${w.title.toLowerCase()}`),
    );

    for (const wo of sourceWorkouts) {
      const targetDate = new Date(wo.date);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const duplicateKey = `${dateKey(targetDate)}|${wo.type}|${wo.title.toLowerCase()}`;
      if (occupiedKeys.has(duplicateKey)) { skipped++; continue; }

      const week = await findOrCreatePlanAndWeek(athleteId, coach.id, targetDate);
      await prisma.workout.create({
        data: {
          weekId: week.id,
          date: targetDate,
          type: wo.type as WorkoutType,
          title: wo.title,
          status: "LIBERADO",
          objective: wo.objective ?? "",
          warmup: wo.warmup,
          mainSet: wo.mainSet,
          cooldown: wo.cooldown,
          notes: wo.notes,
          structured: wo.structured,
          ...(wo.blocks ? { blocks: wo.blocks } : {}),
          ...(wo.targetPaceSecPerKm != null ? { targetPaceSecPerKm: wo.targetPaceSecPerKm } : {}),
          ...(wo.targetHrZone != null ? { targetHrZone: wo.targetHrZone } : {}),
          ...(wo.targetRpe != null ? { targetRpe: wo.targetRpe } : {}),
          ...(wo.targetDistanceKm != null ? { targetDistanceKm: wo.targetDistanceKm } : {}),
          ...(wo.targetDurationMin != null ? { targetDurationMin: wo.targetDurationMin } : {}),
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, skipped, workouts: sourceWorkouts.length, athletes: validTargets.length });
}
