import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS } from "@/lib/training-load";

function getMondayOf(dateStr?: string | null): Date {
  const d = dateStr ? new Date(dateStr + "T12:00:00Z") : new Date();
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const weekStartParam = req.nextUrl.searchParams.get("weekStart");
  const weekStart = getMondayOf(weekStartParam);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        orderBy: [{ user: { name: "asc" } }],
        select: {
          id: true,
          status: true,
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

  const athleteIds = coach.athletes.map((a) => a.id);

  const workouts = await prisma.workout.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      week: { plan: { athleteId: { in: athleteIds } } },
    },
    select: {
      id: true,
      date: true,
      type: true,
      title: true,
      status: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetPaceSecPerKm: true,
      targetRpe: true,
      week: {
        select: {
          released: true,
          plan: { select: { athleteId: true } },
        },
      },
    },
  });

  const workoutsByAthlete = new Map<string, typeof workouts>();
  for (const wo of workouts) {
    const athleteId = wo.week.plan.athleteId;
    if (!workoutsByAthlete.has(athleteId)) workoutsByAthlete.set(athleteId, []);
    workoutsByAthlete.get(athleteId)!.push(wo);
  }

  const loadParamsMap = new Map(coach.athletes.map((a) => [a.id, a.loadParams]));

  const athletes = coach.athletes.map((athlete) => {
    const athleteWorkouts = workoutsByAthlete.get(athlete.id) ?? [];
    return {
      id: athlete.id,
      name: athlete.user.name,
      avatarUrl: athlete.user.avatarUrl,
      status: athlete.status,
      goal: athlete.goal,
      level: athlete.level,
      adherence: athlete.adherenceRate,
      workouts: athleteWorkouts.map((wo) => ({
        id: wo.id,
        date: wo.date.toISOString().slice(0, 10),
        type: wo.type as string,
        title: wo.title,
        status: wo.status as string,
        targetDistanceKm: wo.targetDistanceKm,
        targetDurationMin: wo.targetDurationMin,
        targetPaceSecPerKm: wo.targetPaceSecPerKm,
        targetRpe: wo.targetRpe,
        tss: estimateTSS(
          {
            type: wo.type as string,
            targetDistanceKm: wo.targetDistanceKm,
            targetDurationMin: wo.targetDurationMin,
            targetPaceSecPerKm: wo.targetPaceSecPerKm,
            targetRpe: wo.targetRpe,
          },
          loadParamsMap.get(athlete.id),
        ),
        released: wo.week.released,
      })),
    };
  });

  return NextResponse.json({
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    athletes,
  });
}
