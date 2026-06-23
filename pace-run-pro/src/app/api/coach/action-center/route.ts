import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function getMondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });

  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const athleteIds = coach.athletes.map((a) => a.id);
  if (athleteIds.length === 0) {
    return NextResponse.json({
      athletesTotal: 0,
      athletesWithoutWorkout: 0,
      unreleasedWorkouts: 0,
      missedWorkouts: 0,
      flaggedCheckins: 0,
      workoutsThisWeek: 0,
    });
  }

  const monday = getMondayOf(new Date());
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [workouts, flaggedCheckins] = await Promise.all([
    prisma.workout.findMany({
      where: {
        date: { gte: monday, lte: sunday },
        week: { plan: { athleteId: { in: athleteIds }, coachId: coach.id } },
      },
      select: {
        id: true,
        status: true,
        week: {
          select: {
            released: true,
            plan: { select: { athleteId: true } },
          },
        },
      },
    }),
    prisma.checkIn.count({
      where: {
        athleteId: { in: athleteIds },
        date: { gte: sevenDaysAgo },
        flagged: true,
      },
    }),
  ]);

  const athletesWithWorkout = new Set(workouts.map((w) => w.week.plan.athleteId));
  const athletesWithoutWorkout = athleteIds.length - athletesWithWorkout.size;
  const unreleasedWorkouts = workouts.filter((w) => !w.week.released).length;
  const missedWorkouts = workouts.filter((w) => w.status === "PERDIDO").length;

  return NextResponse.json({
    athletesTotal: athleteIds.length,
    athletesWithoutWorkout,
    unreleasedWorkouts,
    missedWorkouts,
    flaggedCheckins,
    workoutsThisWeek: workouts.length,
  });
}
