import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id, week: { plan: { athleteId: athlete.id, coachId: { not: null } } } },
    include: { logs: { where: { athleteId: athlete.id }, take: 1 } },
  });

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...workout,
    date: workout.date.toISOString(),
    logs: workout.logs.map((l) => ({
      ...l,
      startedAt: l.startedAt?.toISOString() ?? null,
      finishedAt: l.finishedAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    createdAt: workout.createdAt.toISOString(),
    updatedAt: workout.updatedAt.toISOString(),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id, week: { released: true, plan: { athleteId: athlete.id, coachId: { not: null } } } },
    select: {
      id: true,
      type: true,
      targetDurationMin: true,
      week: { select: { plan: { select: { coachId: true } } } },
    },
  });

  if (!workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    rpe,
    feeling,
    distanceKm,
    durationSec,
    avgHr,
    maxHr,
    cadence,
    elevationGainM,
    calories,
    avgPaceSecPerKm,
    splits,
    gpsTrack,
    fatigue,
    recovery,
    sleepHours,
    stress,
    pain,
    painLocation,
    painIntensity,
    notes,
    source,
    raw,
  } = body as Record<string, unknown>;

  const normalizedRpe = typeof rpe === "number" ? rpe : null;
  const normalizedDurationSec = typeof durationSec === "number" ? durationSec : null;
  const plannedDurationSec = workout.targetDurationMin ? workout.targetDurationMin * 60 : null;
  const loadDurationSec = normalizedDurationSec ?? plannedDurationSec;
  const sessionRpeLoad =
    typeof loadDurationSec === "number" && typeof normalizedRpe === "number"
      ? (loadDurationSec / 60) * normalizedRpe
      : null;

  const existing = await prisma.workoutLog.findFirst({
    where: { workoutId: id, athleteId: athlete.id },
    select: { id: true },
  });

  const logPayload = {
    source: typeof source === "string" ? source : "manual",
    rpe: normalizedRpe,
    feeling: typeof feeling === "string" ? feeling : null,
    distanceKm: typeof distanceKm === "number" ? distanceKm : null,
    durationSec: normalizedDurationSec,
    avgHr: typeof avgHr === "number" ? avgHr : null,
    maxHr: typeof maxHr === "number" ? maxHr : null,
    cadence: typeof cadence === "number" ? cadence : null,
    elevationGainM: typeof elevationGainM === "number" ? elevationGainM : null,
    calories: typeof calories === "number" ? calories : null,
    avgPaceSecPerKm: typeof avgPaceSecPerKm === "number" ? avgPaceSecPerKm : null,
    splits: splits ?? undefined,
    gpsTrack: gpsTrack ?? undefined,
    finishedAt: new Date(),
  };

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.workoutLog.update({
        where: { id: existing.id },
        data: logPayload,
      });
    } else {
      await tx.workoutLog.create({
        data: {
          workoutId: id,
          athleteId: athlete.id,
          ...logPayload,
        },
      });
    }

    await tx.workoutFeedback.upsert({
      where: { workoutId_athleteId: { workoutId: id, athleteId: athlete.id } },
      update: {
        status: "realizado",
        source: typeof source === "string" ? source : "manual",
        durationSec: normalizedDurationSec,
        distanceKm: typeof distanceKm === "number" ? distanceKm : null,
        avgHr: typeof avgHr === "number" ? avgHr : null,
        maxHr: typeof maxHr === "number" ? maxHr : null,
        rpe: normalizedRpe,
        sessionRpeLoad,
        feeling: typeof feeling === "string" ? feeling : null,
        fatigue: typeof fatigue === "number" ? fatigue : null,
        recovery: typeof recovery === "number" ? recovery : null,
        sleepHours: typeof sleepHours === "number" ? sleepHours : null,
        stress: typeof stress === "number" ? stress : null,
        pain: typeof pain === "boolean" ? pain : false,
        painLocation: typeof painLocation === "string" ? painLocation : null,
        painIntensity: typeof painIntensity === "number" ? painIntensity : null,
        notes: typeof notes === "string" ? notes : null,
        raw: raw ?? body,
      },
      create: {
        workoutId: id,
        athleteId: athlete.id,
        status: "realizado",
        source: typeof source === "string" ? source : "manual",
        durationSec: normalizedDurationSec,
        distanceKm: typeof distanceKm === "number" ? distanceKm : null,
        avgHr: typeof avgHr === "number" ? avgHr : null,
        maxHr: typeof maxHr === "number" ? maxHr : null,
        rpe: normalizedRpe,
        sessionRpeLoad,
        feeling: typeof feeling === "string" ? feeling : null,
        fatigue: typeof fatigue === "number" ? fatigue : null,
        recovery: typeof recovery === "number" ? recovery : null,
        sleepHours: typeof sleepHours === "number" ? sleepHours : null,
        stress: typeof stress === "number" ? stress : null,
        pain: typeof pain === "boolean" ? pain : false,
        painLocation: typeof painLocation === "string" ? painLocation : null,
        painIntensity: typeof painIntensity === "number" ? painIntensity : null,
        notes: typeof notes === "string" ? notes : null,
        raw: raw ?? body,
      },
    });

    await tx.workout.update({
      where: { id },
      data: { status: "CONCLUIDO" },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        coachId: workout.week.plan.coachId,
        athleteId: athlete.id,
        action: "UPDATE",
        entity: "Workout",
        entityId: id,
        message: "Atleta registrou execução/feedback do treino.",
        after: {
          type: workout.type,
          durationSec: normalizedDurationSec,
          distanceKm: typeof distanceKm === "number" ? distanceKm : null,
          rpe: normalizedRpe,
          source: typeof source === "string" ? source : "manual",
        },
      },
    });
  });

  return NextResponse.json({ success: true });
}
