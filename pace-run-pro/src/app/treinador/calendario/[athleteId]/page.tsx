import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CalendarClient from "./_calendar-client";

function dateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") redirect("/login");

  const { athleteId } = await params;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        select: { id: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!coach) redirect("/treinador/dashboard");

  const athleteIds = new Set(coach.athletes.map((a) => a.id));
  if (!athleteIds.has(athleteId)) {
    const first = coach.athletes[0];
    if (first) redirect(`/treinador/calendario/${first.id}`);
    redirect("/treinador/atletas");
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11

  // Compute grid bounds (Mon–Sun) for current month
  const firstDay = new Date(Date.UTC(year, month, 1));
  const firstDow = firstDay.getUTCDay(); // 0=Sun
  const offsetFromMonday = firstDow === 0 ? 6 : firstDow - 1;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(1 - offsetFromMonday);

  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const lastDow = lastDay.getUTCDay();
  const remainingAfterLast = lastDow === 0 ? 0 : 7 - lastDow;
  const gridEnd = new Date(lastDay);
  gridEnd.setUTCDate(lastDay.getUTCDate() + remainingAfterLast);

  const [rawWorkouts, athleteDetail] = await Promise.all([
    prisma.workout.findMany({
      where: {
        week: { plan: { athleteId, coachId: coach.id } },
        date: { gte: gridStart, lte: gridEnd },
      },
      select: {
        id: true,
        date: true,
        type: true,
        title: true,
        status: true,
        objective: true,
        warmup: true,
        mainSet: true,
        cooldown: true,
        notes: true,
        targetDistanceKm: true,
        targetDurationMin: true,
        targetPaceSecPerKm: true,
        targetPacePer100m: true,
        targetPowerWatts: true,
        targetRpe: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        adherenceRate: true,
        status: true,
        goal: true,
        level: true,
        raceDate: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    }),
  ]);

  const workoutIds = rawWorkouts.map((w) => w.id);
  const rawLogs = workoutIds.length > 0
    ? await prisma.workoutLog.findMany({
        where: { workoutId: { in: workoutIds }, athleteId },
        select: {
          id: true,
          workoutId: true,
          distanceKm: true,
          durationSec: true,
          avgPaceSecPerKm: true,
          avgWatts: true,
          avgPacePer100m: true,
          rpe: true,
          actualLoad: true,
          tss: true,
          feeling: true,
        },
      })
    : [];

  const workouts = rawWorkouts.map((w) => ({
    ...w,
    date: w.date.toISOString(),
  }));

  const athletes = coach.athletes.map((a) => ({ id: a.id, name: a.user.name }));

  return (
    <CalendarClient
      athleteId={athleteId}
      athletes={athletes}
      initialWorkouts={workouts}
      initialLogs={rawLogs}
      initialYear={year}
      initialMonth={month}
      athleteDetail={
        athleteDetail
          ? {
              name: athleteDetail.user.name,
              avatarUrl: athleteDetail.user.avatarUrl,
              adherenceRate: athleteDetail.adherenceRate,
              status: athleteDetail.status,
              goal: athleteDetail.goal,
              level: athleteDetail.level,
              raceDate: athleteDetail.raceDate?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
