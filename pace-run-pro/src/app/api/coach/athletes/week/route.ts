import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateActualTSS, estimateTSS } from "@/lib/training-load";
import { displayWorkoutType, inferWorkoutModality } from "@/lib/workout-normalization";

export const dynamic = "force-dynamic";

function getMondayOf(dateStr?: string | null): Date {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseCalendarBoundary(date: string, endOfDay = false): Date {
  const d = new Date(`${date}T12:00:00`);
  d.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return d;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deriveAthleteStatus(adherenceRate?: number | null): "ativo" | "risco" | "inativo" {
  if (adherenceRate == null) return "ativo";
  if (adherenceRate >= 0.8) return "ativo";
  if (adherenceRate >= 0.5) return "risco";
  return "inativo";
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const weekStartParam = req.nextUrl.searchParams.get("weekStart");
  const weekStart = fromParam ? parseCalendarBoundary(fromParam) : getMondayOf(weekStartParam);
  const weekEnd = toParam ? parseCalendarBoundary(toParam, true) : new Date(weekStart);
  if (toParam) {
    weekEnd.setTime(parseCalendarBoundary(toParam, true).getTime());
  }
  if (!toParam) {
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        orderBy: [{ user: { name: "asc" } }],
        select: {
          id: true,
          goal: true,
          level: true,
          adherenceRate: true,
          user: { select: { name: true, avatarUrl: true } },
          loadParams: true,
        },
      },
    },
  });

  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const planAthletes = await prisma.trainingPlan.findMany({
    where: { coachId: coach.id },
    distinct: ["athleteId"],
    select: {
      athlete: {
        select: {
          id: true,
          goal: true,
          level: true,
          adherenceRate: true,
          user: { select: { name: true, avatarUrl: true } },
          loadParams: true,
        },
      },
    },
  });

  const athleteById = new Map(coach.athletes.map((athlete) => [athlete.id, athlete]));
  for (const row of planAthletes) {
    athleteById.set(row.athlete.id, row.athlete);
  }

  const visibleAthletes = Array.from(athleteById.values()).sort((a, b) =>
    (a.user.name ?? "").localeCompare(b.user.name ?? "", "pt-BR"),
  );
  const athleteIds = visibleAthletes.map((a) => a.id);

  const visiblePlans = await prisma.trainingPlan.findMany({
    where: {
      OR: [
        { coachId: coach.id },
        { athleteId: { in: athleteIds } },
      ],
    },
    select: { id: true, athleteId: true },
  });
  const planIds = visiblePlans.map((plan) => plan.id);
  const athleteIdByPlanId = new Map(visiblePlans.map((plan) => [plan.id, plan.athleteId]));

  const visibleWeeks = planIds.length
    ? await prisma.trainingWeek.findMany({
        where: {
          planId: { in: planIds },
          workouts: { some: { date: { gte: weekStart, lte: weekEnd } } },
        },
        select: { id: true, planId: true, released: true },
      })
    : [];
  const weekIds = visibleWeeks.map((week) => week.id);
  const weekMetaById = new Map(visibleWeeks.map((week) => [
    week.id,
    {
      athleteId: athleteIdByPlanId.get(week.planId),
      released: week.released,
    },
  ]));

  const workouts = weekIds.length ? await prisma.workout.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      weekId: { in: weekIds },
    },
    select: {
      id: true,
      weekId: true,
      date: true,
      type: true,
      title: true,
      status: true,
      objective: true,
      notes: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetPaceSecPerKm: true,
      targetRpe: true,
      logs: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          source: true,
          distanceKm: true,
          durationSec: true,
          avgPaceSecPerKm: true,
          avgHr: true,
          maxHr: true,
          rpe: true,
        },
      },
    },
  }) : [];

  const workoutsByAthlete = new Map<string, typeof workouts>();
  for (const wo of workouts) {
    const athleteId = weekMetaById.get(wo.weekId)?.athleteId;
    if (!athleteId) continue;
    if (!workoutsByAthlete.has(athleteId)) workoutsByAthlete.set(athleteId, []);
    workoutsByAthlete.get(athleteId)!.push(wo);
  }

  const loadParamsMap = new Map(visibleAthletes.map((a) => [a.id, a.loadParams]));

  const athletes = visibleAthletes.map((athlete) => {
    const athleteWorkouts = workoutsByAthlete.get(athlete.id) ?? [];
    return {
      id: athlete.id,
      name: athlete.user.name,
      avatarUrl: athlete.user.avatarUrl,
      status: deriveAthleteStatus(athlete.adherenceRate),
      goal: athlete.goal,
      level: athlete.level,
      adherence: athlete.adherenceRate,
      workouts: athleteWorkouts.map((wo) => {
        const modality = inferWorkoutModality({
          type: wo.type as string,
          title: wo.title,
          objective: wo.objective,
          notes: wo.notes,
        });
        const plannedTss = estimateTSS(
          {
            type: wo.type as string,
            targetDistanceKm: wo.targetDistanceKm,
            targetDurationMin: wo.targetDurationMin,
            targetPaceSecPerKm: wo.targetPaceSecPerKm,
            targetRpe: wo.targetRpe,
          },
          loadParamsMap.get(athlete.id),
        );
        const log = wo.logs[0] ?? null;
        const actualTss = log ? estimateActualTSS(log, loadParamsMap.get(athlete.id), wo.targetRpe ?? 6) : null;
        return {
          id: wo.id,
          date: dateKey(wo.date),
          type: displayWorkoutType(wo.type as string, modality),
          rawType: wo.type as string,
          modality,
          title: wo.title,
          status: wo.status as string,
          targetDistanceKm: wo.targetDistanceKm,
          targetDurationMin: wo.targetDurationMin,
          targetPaceSecPerKm: wo.targetPaceSecPerKm,
          targetRpe: wo.targetRpe,
          tss: actualTss ?? plannedTss,
          plannedTss,
          actualTss,
          actualSource: log?.source ?? null,
          actualDistanceKm: log?.distanceKm ?? null,
          actualDurationMin: log?.durationSec ? Math.round(log.durationSec / 60) : null,
          actualAvgPaceSecPerKm: log?.avgPaceSecPerKm ?? null,
          actualAvgHr: log?.avgHr ?? null,
          released: weekMetaById.get(wo.weekId)?.released ?? false,
        };
      }),
    };
  });

  return NextResponse.json({
    weekStart: dateKey(weekStart),
    weekEnd: dateKey(weekEnd),
    athletes,
  });
}
