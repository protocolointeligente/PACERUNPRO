import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateTSS } from "@/lib/training-load";
import { inferWorkoutModality } from "@/lib/workout-normalization";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function avg(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const athlete = await prisma.athlete.findFirst({
    where: { id, coachId: coach.id },
    select: { id: true, user: { select: { name: true, avatarUrl: true } } },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const url = new URL(req.url);
  const weeks = Math.min(12, Math.max(1, Number(url.searchParams.get("weeks") ?? 4)));
  const periodEnd = endOfDay(new Date());
  const periodStart = startOfWeek(new Date(periodEnd.getTime() - (weeks - 1) * 7 * 86400_000));

  const plans = await prisma.trainingPlan.findMany({
    where: {
      athleteId: athlete.id,
      coachId: coach.id,
      weeks: { some: { workouts: { some: { date: { gte: periodStart, lte: periodEnd } } } } },
    },
    select: {
      weeks: {
        where: { workouts: { some: { date: { gte: periodStart, lte: periodEnd } } } },
        select: {
          weekNumber: true,
          startDate: true,
          endDate: true,
          workouts: {
            where: { date: { gte: periodStart, lte: periodEnd } },
            select: {
              id: true,
              date: true,
              title: true,
              type: true,
              modality: true,
              objective: true,
              notes: true,
              status: true,
              targetDurationMin: true,
              targetDistanceKm: true,
              targetRpe: true,
              logs: {
                select: {
                  durationSec: true,
                  distanceKm: true,
                  avgHr: true,
                  maxHr: true,
                  rpe: true,
                  source: true,
                  startedAt: true,
                },
              },
              feedbacks: {
                select: {
                  status: true,
                  rpe: true,
                  sessionRpeLoad: true,
                  fatigue: true,
                  recovery: true,
                  sleepHours: true,
                  stress: true,
                  pain: true,
                  painLocation: true,
                  painIntensity: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const workouts = plans.flatMap((plan) => plan.weeks.flatMap((week) => week.workouts));
  const workoutIds = new Set(workouts.map((workout) => workout.id));
  const logs = workouts.flatMap((workout) => workout.logs.map((log) => ({ ...log, workoutId: workout.id })));
  const feedbacks = workouts.flatMap((workout) => workout.feedbacks.map((feedback) => ({ ...feedback, workoutId: workout.id })));
  const completedWorkoutIds = new Set([
    ...logs.map((log) => log.workoutId),
    ...feedbacks.filter((feedback) => feedback.status !== "nao_realizado").map((feedback) => feedback.workoutId),
  ]);

  const plannedDurationMin = workouts.reduce((sum, workout) => sum + (workout.targetDurationMin ?? 0), 0);
  const plannedDistanceKm = workouts.reduce((sum, workout) => sum + (workout.targetDistanceKm ?? 0), 0);
  const plannedTss = workouts.reduce((sum, workout) => sum + estimateTSS({
    targetDurationMin: workout.targetDurationMin,
    targetRpe: workout.targetRpe,
    type: workout.type,
  }), 0);
  const actualDurationMin = logs.reduce((sum, log) => sum + Math.round((log.durationSec ?? 0) / 60), 0);
  const actualDistanceKm = logs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
  const actualSrpeLoad = feedbacks.reduce((sum, feedback) => {
    if (feedback.sessionRpeLoad != null) return sum + feedback.sessionRpeLoad;
    const workout = workouts.find((item) => item.id === feedback.workoutId);
    return sum + Math.round(((workout?.targetDurationMin ?? 0) * (feedback.rpe ?? workout?.targetRpe ?? 5)) / 10);
  }, 0);

  const modalityDistribution = workouts.reduce<Record<string, { planned: number; completed: number; durationMin: number; distanceKm: number }>>((acc, workout) => {
    const modality = workout.modality ?? inferWorkoutModality({
      type: workout.type,
      title: workout.title,
      objective: workout.objective,
      notes: workout.notes,
    });
    acc[modality] ??= { planned: 0, completed: 0, durationMin: 0, distanceKm: 0 };
    acc[modality].planned += 1;
    acc[modality].durationMin += workout.targetDurationMin ?? 0;
    acc[modality].distanceKm += workout.targetDistanceKm ?? 0;
    if (completedWorkoutIds.has(workout.id)) acc[modality].completed += 1;
    return acc;
  }, {});

  const painFeedbacks = feedbacks.filter((feedback) => feedback.pain);
  const checkins = await prisma.checkIn.findMany({
    where: { athleteId: athlete.id, date: { gte: periodStart, lte: periodEnd } },
    select: { sleep: true, stress: true, fatigue: true, pain: true, mood: true, flagged: true },
  });

  const adherence = workoutIds.size ? completedWorkoutIds.size / workoutIds.size : 0;
  const riskFlags = [
    adherence < 0.6 ? "Aderência baixa no período." : null,
    painFeedbacks.length > 0 ? `${painFeedbacks.length} feedback(s) com dor.` : null,
    avg(feedbacks.map((item) => item.fatigue)) != null && (avg(feedbacks.map((item) => item.fatigue)) ?? 0) >= 7 ? "Fadiga percebida elevada." : null,
    avg(checkins.map((item) => item.sleep)) != null && (avg(checkins.map((item) => item.sleep)) ?? 0) < 6 ? "Sono médio baixo nos check-ins." : null,
  ].filter(Boolean);

  return NextResponse.json({
    athlete,
    period: { start: periodStart.toISOString(), end: periodEnd.toISOString(), weeks },
    adherence: {
      planned: workoutIds.size,
      completed: completedWorkoutIds.size,
      rate: adherence,
    },
    load: {
      plannedTss: Math.round(plannedTss),
      actualSrpeLoad: Math.round(actualSrpeLoad),
      plannedDurationMin,
      actualDurationMin,
      plannedDistanceKm: Math.round(plannedDistanceKm * 10) / 10,
      actualDistanceKm: Math.round(actualDistanceKm * 10) / 10,
    },
    recovery: {
      avgRpe: avg(feedbacks.map((item) => item.rpe)),
      avgFatigue: avg(feedbacks.map((item) => item.fatigue)) ?? avg(checkins.map((item) => item.fatigue)),
      avgRecovery: avg(feedbacks.map((item) => item.recovery)),
      avgSleepHours: avg(feedbacks.map((item) => item.sleepHours)) ?? avg(checkins.map((item) => item.sleep)),
      avgStress: avg(feedbacks.map((item) => item.stress)) ?? avg(checkins.map((item) => item.stress)),
      painCount: painFeedbacks.length + checkins.filter((item) => (item.pain ?? 0) > 0).length,
    },
    modalityDistribution,
    riskFlags,
    dataQuality: {
      workouts: workouts.length,
      logs: logs.length,
      feedbacks: feedbacks.length,
      checkins: checkins.length,
      confidence: feedbacks.length || logs.length ? "moderada" : "baixa",
    },
  });
}
