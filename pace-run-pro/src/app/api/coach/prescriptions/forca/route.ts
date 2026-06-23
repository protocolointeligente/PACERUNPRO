import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { ExerciseCategory, StrengthSplit } from "@prisma/client";

const DAY_MAP: Record<string, number> = {
  Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6,
};

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  "Glúteos": "GLUTEOS",
  "Core": "CORE",
  "Mobilidade": "MOBILIDADE",
  "Força": "FORCA",
  "Prevenção": "PREVENCAO",
  "Panturrilhas": "PANTURRILHAS",
  "Joelho": "JOELHO",
  "Quadril": "QUADRIL",
  "Tornozelo": "TORNOZELO",
};

const SPLIT_MAP: Record<string, StrengthSplit> = {
  AB: "AB",
  ABC: "ABC",
  ABCD: "ABCD",
  ABCDE: "ABCDE",
  "Full Body": "FULL_BODY",
  "Upper/Lower": "UPPER_LOWER",
  Personalizada: "PERSONALIZADA",
};

interface PrescribedExercise {
  libraryId: string;
  name: string;
  category?: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: number;
}

interface StrengthSession {
  label: string;
  dayLabels: string[]; // multiple days: ["Seg", "Qui"] → one workout per day
  exercises: PrescribedExercise[];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { athleteId, sessions, startDate, division } = body as {
    athleteId: string;
    sessions: StrengthSession[];
    startDate: string;
    division: string;
  };

  if (!athleteId || !sessions?.length || !startDate) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const coachAthleteIds = new Set(coach.athletes.map((a) => a.id));
  if (!coachAthleteIds.has(athleteId)) {
    return NextResponse.json({ error: "Atleta não pertence a este treinador" }, { status: 403 });
  }

  const weekStart = new Date(startDate);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

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
        startDate: weekStart,
        endDate: new Date(weekStart.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Find or create training week
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

  const strengthSplit: StrengthSplit = SPLIT_MAP[division] ?? "PERSONALIZADA";
  let totalCreated = 0;

  for (const s of sessions) {
    if (s.exercises.length === 0) continue;

    // Upsert exercises once per session (not per day)
    const exerciseIds: string[] = [];
    for (const ex of s.exercises) {
      const category: ExerciseCategory = CATEGORY_MAP[ex.category ?? ""] ?? "HIPERTROFIA";
      const dbExercise = await prisma.exercise.upsert({
        where: { id: ex.libraryId },
        update: { name: ex.name },
        create: { id: ex.libraryId, name: ex.name, category, coachId: null },
      });
      exerciseIds.push(dbExercise.id);
    }

    // Create one workout per selected day
    const days = Array.isArray(s.dayLabels) && s.dayLabels.length > 0 ? s.dayLabels : ["Seg"];
    for (const dayLabel of days) {
      const dayOffset = DAY_MAP[dayLabel] ?? 1;
      const offset = dayOffset === 0 ? 6 : dayOffset - 1;
      const workoutDate = new Date(weekStart.getTime() + offset * 24 * 60 * 60 * 1000);

      // Skip if a FORCA workout already exists on this exact day
      const existing = await prisma.workout.findFirst({
        where: { weekId: week.id, date: workoutDate, type: "FORCA" },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.workout.create({
        data: {
          weekId: week.id,
          date: workoutDate,
          type: "FORCA",
          title: s.label,
          status: "LIBERADO",
          objective: `Treino de força — ${s.label}`,
          strengthWorkout: {
            create: {
              split: strengthSplit,
              label: s.label,
              blocks: {
                create: s.exercises.map((ex, idx) => ({
                  exerciseId: exerciseIds[idx],
                  order: idx + 1,
                  sets: ex.sets,
                  reps: ex.reps,
                  restSec: parseRestSec(ex.rest),
                  rpe: ex.rpe,
                })),
              },
            },
          },
        },
      });

      totalCreated++;
    }
  }

  return NextResponse.json({ success: true, created: totalCreated });
}

function parseRestSec(rest: string): number {
  if (!rest) return 60;
  const colonMatch = rest.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  return parseInt(rest.replace(/[^\d]/g, "")) || 60;
}
