import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutType } from "@prisma/client";

const DAY_MAP: Record<string, number> = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  Sáb: 6,
};

const ZONE_TYPE_MAP: Record<string, string> = {
  E: "RODAGEM_LEVE",
  M: "PROGRESSIVO",
  T: "TEMPO_RUN",
  I: "INTERVALADO_LONGO",
  R: "INTERVALADO_CURTO",
};

interface Session {
  dayLabel: string;
  title: string;
  type: "corrida" | "forca" | "descanso";
  zone?: string;
  distanceKm?: number;
  description?: string;
  intervals?: string;
  structured?: boolean;
  blocks?: unknown;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { athleteIds, sessions, startDate, templateName } = body as {
    athleteIds: string[];
    sessions: Session[];
    startDate: string;
    templateName: string;
  };

  if (!athleteIds?.length || !sessions?.length || !startDate) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });

  if (!coach) {
    return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
  }

  const coachAthleteIds = new Set(coach.athletes.map((a) => a.id));
  const invalidIds = athleteIds.filter((id) => !coachAthleteIds.has(id));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: "Atletas inválidos" }, { status: 403 });
  }

  const weekStart = new Date(startDate);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  let totalWorkoutsCreated = 0;

  for (const athleteId of athleteIds) {
    // Find or create training plan
    let plan = await prisma.trainingPlan.findFirst({
      where: { athleteId, coachId: coach.id, endDate: { gte: new Date() } },
    });

    if (!plan) {
      const athlete = await prisma.athlete.findUnique({
        where: { id: athleteId },
        select: { goal: true },
      });
      plan = await prisma.trainingPlan.create({
        data: {
          athleteId,
          coachId: coach.id,
          name: "Plano de Treinamento",
          goal: athlete?.goal ?? "PERFORMANCE",
          phase: "BASE",
          startDate: new Date(startDate),
          endDate: new Date(new Date(startDate).getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Find or create training week
    let week = await prisma.trainingWeek.findFirst({
      where: { planId: plan.id, startDate: weekStart },
    });

    if (!week) {
      const weekCount = await prisma.trainingWeek.count({
        where: { planId: plan.id },
      });
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

    // Create workouts for each session (skip rest days)
    for (const s of sessions) {
      if (s.type === "descanso") continue;

      const dayOffset = DAY_MAP[s.dayLabel] ?? 0;
      // startDate is Monday (day 1). Calculate offset from Monday:
      const offset = dayOffset === 0 ? 6 : dayOffset - 1; // Mon=0, Tue=1, ..., Sun=6
      const workoutDate = new Date(weekStart.getTime() + offset * 24 * 60 * 60 * 1000);

      const workoutType =
        (ZONE_TYPE_MAP[s.zone ?? "E"] ?? "RODAGEM_LEVE") as WorkoutType;

      const existing = await prisma.workout.findFirst({
        where: { weekId: week.id, date: workoutDate },
        select: { id: true },
      });

      if (!existing) {
        await prisma.workout.create({
          data: {
            weekId: week.id,
            date: workoutDate,
            type: workoutType,
            title: s.title,
            status: "LIBERADO",
            objective: s.description ?? "",
            mainSet: s.intervals ?? "",
            targetDistanceKm: s.distanceKm,
            notes: `Template: ${templateName}`,
            structured: s.structured ?? false,
            ...(s.blocks ? { blocks: s.blocks } : {}),
          },
        });
        totalWorkoutsCreated++;
      }
    }
  }

  return NextResponse.json({ success: true, created: totalWorkoutsCreated });
}
