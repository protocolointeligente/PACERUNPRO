import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";
import { computeWeekBounds, findOrCreateActivePlan, findOrCreateWeek } from "@/lib/prescription-service";

interface StrengthExerciseInput {
  sourceId?: string;
  name: string;
  imageUrl?: string;
  sets: number;
  reps: string;
  rest: string;
}

function parseRestSec(rest: string): number {
  if (!rest) return 60;
  const colonMatch = rest.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  return parseInt(rest.replace(/[^\d]/g, "")) || 60;
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
    targetPacePer100m,
    targetPowerWatts,
    targetRpe,
    objective,
    warmup,
    mainSet,
    cooldown,
    notes,
    strengthExercises,
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
    targetPacePer100m?: number;
    targetPowerWatts?: number;
    targetRpe?: number;
    objective?: string;
    warmup?: string;
    mainSet?: string;
    cooldown?: string;
    notes?: string;
    strengthExercises?: StrengthExerciseInput[];
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

  try {
    const plan = await findOrCreateActivePlan(athleteId, coach.id, new Date());
    const { weekStart, weekEnd } = computeWeekBounds(workoutDate);
    const week = await findOrCreateWeek(plan.id, plan.phase, weekStart, weekEnd);

    // Build strength workout data if exercises provided
    let strengthWorkoutCreate: Record<string, unknown> | undefined;
    if (workoutType === "FORCA" && Array.isArray(strengthExercises) && strengthExercises.length > 0) {
      const exerciseRecords = await Promise.all(
        strengthExercises.map(async (ex) => {
          const dbId = ex.sourceId ?? `cal-${ex.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const dbEx = await prisma.exercise.upsert({
            where: { id: dbId },
            update: { name: ex.name, ...(ex.imageUrl ? { imageUrl: ex.imageUrl } : {}) },
            create: { id: dbId, name: ex.name, category: "FORCA", coachId: null, imageUrl: ex.imageUrl ?? null },
          });
          return { id: dbEx.id, sets: ex.sets, reps: ex.reps, restSec: parseRestSec(ex.rest) };
        })
      );
      strengthWorkoutCreate = {
        create: {
          split: "PERSONALIZADA",
          blocks: {
            create: exerciseRecords.map((e, idx) => ({
              exerciseId: e.id,
              order: idx + 1,
              sets: e.sets,
              reps: e.reps,
              restSec: e.restSec,
            })),
          },
        },
      };
    }

    const workout = await prisma.workout.create({
      data: {
        weekId: week.id,
        date: workoutDate,
        type: workoutType,
        title,
        status: "LIBERADO",
        objective: objective ?? "",
        warmup: warmup ?? null,
        mainSet: mainSet ?? null,
        cooldown: cooldown ?? null,
        notes: notes ?? null,
        structured,
        ...(blocks ? { blocks } : {}),
        ...(targetDistanceKm != null ? { targetDistanceKm } : {}),
        ...(targetDurationMin != null ? { targetDurationMin } : {}),
        ...(targetPaceSecPerKm != null ? { targetPaceSecPerKm } : {}),
        ...(targetPacePer100m != null ? { targetPacePer100m } : {}),
        ...(targetPowerWatts != null ? { targetPowerWatts } : {}),
        ...(targetRpe != null ? { targetRpe } : {}),
        ...(strengthWorkoutCreate ? { strengthWorkout: strengthWorkoutCreate } : {}),
      },
      select: { id: true, date: true, title: true, type: true, status: true, structured: true },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/coach/workouts]", err);
    const msg = err instanceof Error ? err.message : "Erro interno ao criar treino";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
