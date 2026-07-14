import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";

async function findOrCreatePlanAndWeek(
  athleteId: string,
  coachId: string,
  workoutDate: Date
) {
  let plan = await prisma.trainingPlan.findFirst({
    where: { athleteId, coachId, endDate: { gte: new Date() } },
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
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
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

  const body = await req.json();
  const { sourceAthleteId, weekStart: weekStartStr, targetWeekStart: targetWeekStartStr, targetAthleteIds } = body as {
    sourceAthleteId: string;
    weekStart: string;
    targetWeekStart?: string;
    targetAthleteIds: string[];
  };

  if (!sourceAthleteId || !weekStartStr || !Array.isArray(targetAthleteIds) || targetAthleteIds.length === 0) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  if (!coachAthleteIds.has(sourceAthleteId)) {
    return NextResponse.json({ error: "Atleta fonte inválido" }, { status: 403 });
  }

  const weekStart = new Date(weekStartStr + "T00:00:00Z");
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  const targetWeekStart = new Date((targetWeekStartStr ?? weekStartStr) + "T00:00:00Z");
  const targetWeekEnd = new Date(targetWeekStart);
  targetWeekEnd.setUTCDate(targetWeekEnd.getUTCDate() + 6);
  targetWeekEnd.setUTCHours(23, 59, 59, 999);
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
    // Collect dates already occupied for this athlete in the target week
    const occupiedWorkouts = await prisma.workout.findMany({
      where: { date: { gte: targetWeekStart, lte: targetWeekEnd }, week: { plan: { athleteId, coachId: coach.id } } },
      select: { date: true },
    });
    const occupiedDates = new Set(occupiedWorkouts.map((w) => w.date.toISOString()));

    for (const wo of sourceWorkouts) {
      const targetDate = new Date(wo.date);
      targetDate.setUTCDate(targetDate.getUTCDate() + dayOffset);
      if (occupiedDates.has(targetDate.toISOString())) { skipped++; continue; }

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
