import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { validateRpe, sessionRpeLoad } from "@/lib/rpe";
import { z } from "zod";

const LogSchema = z.object({
  // Execution data
  distanceKm:    z.number().positive().optional(),
  durationSec:   z.number().int().positive().optional(),
  avgHr:         z.number().int().positive().optional(),
  maxHr:         z.number().int().positive().optional(),
  elevationGainM: z.number().positive().optional(),
  avgPaceSecPerKm: z.number().int().positive().optional(),
  calories:      z.number().int().positive().optional(),

  // Subjective load
  rpe:           z.number().int().min(1).max(10).optional(),
  painLevel:     z.number().int().min(0).max(10).optional(),
  fatigueLevel:  z.number().int().min(0).max(10).optional(),
  feeling:       z.string().max(20).optional(),

  // Feedback text
  athleteFeedback: z.string().max(1000).optional(),

  // When the workout happened
  startedAt:   z.string().datetime().optional(),
  finishedAt:  z.string().datetime().optional(),
});

// POST /api/workouts/[id]/log
// Athlete submits actual execution data for a planned workout.
// Sets workout status → CONCLUIDO and creates a WorkoutLog record.
// Idempotent: updates the existing log if one already exists for this workout+athlete.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workoutId } = await params;

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = LogSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Verify the workout exists and belongs to this athlete's plan
  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Perfil de atleta não encontrado" }, { status: 404 });
  }

  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      week: {
        plan: { athleteId: athlete.id },
      },
    },
    select: {
      id: true,
      status: true,
      targetDurationMin: true,
      week: { select: { plan: { select: { athleteId: true } } } },
    },
  });
  if (!workout) {
    return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });
  }

  // Compute actual load (sRPE)
  const durationMin = data.durationSec ? data.durationSec / 60 : null;
  const actualLoad = sessionRpeLoad(durationMin, data.rpe ?? null);

  // Upsert the workout log
  const existingLog = await prisma.workoutLog.findFirst({
    where: { workoutId, athleteId: athlete.id },
    select: { id: true },
  });

  const logData = {
    athleteId:      athlete.id,
    workoutId,
    source:         "manual" as const,
    distanceKm:     data.distanceKm,
    durationSec:    data.durationSec,
    avgHr:          data.avgHr,
    maxHr:          data.maxHr,
    elevationGainM: data.elevationGainM,
    avgPaceSecPerKm: data.avgPaceSecPerKm,
    calories:       data.calories,
    rpe:            validateRpe(data.rpe) ? data.rpe : undefined,
    painLevel:      data.painLevel,
    fatigueLevel:   data.fatigueLevel,
    feeling:        data.feeling,
    athleteFeedback: data.athleteFeedback,
    actualLoad:     actualLoad ?? undefined,
    startedAt:      data.startedAt ? new Date(data.startedAt) : undefined,
    finishedAt:     data.finishedAt ? new Date(data.finishedAt) : undefined,
  };

  const log = existingLog
    ? await prisma.workoutLog.update({ where: { id: existingLog.id }, data: logData })
    : await prisma.workoutLog.create({ data: logData });

  // Mark workout as completed
  await prisma.workout.update({
    where: { id: workoutId },
    data: { status: "CONCLUIDO" },
  });

  return NextResponse.json({ ok: true, logId: log.id, actualLoad });
}

// GET /api/workouts/[id]/log
// Returns the existing log entry for this workout (athlete-scoped).

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workoutId } = await params;

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ log: null });
  }

  const log = await prisma.workoutLog.findFirst({
    where: { workoutId, athleteId: athlete.id },
    select: {
      id: true,
      distanceKm: true,
      durationSec: true,
      avgHr: true,
      rpe: true,
      painLevel: true,
      fatigueLevel: true,
      feeling: true,
      athleteFeedback: true,
      coachFeedback: true,
      actualLoad: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ log });
}
