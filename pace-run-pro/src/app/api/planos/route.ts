import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { CyclePhase, Goal, WorkoutType } from "@prisma/client";

export const dynamic = "force-dynamic";

const GOAL_MAP: Record<string, Goal> = {
  "5k": "CINCO_KM",
  "10k": "DEZ_KM",
  "Meia-maratona": "VINTE_E_UM_KM",
  "Maratona": "QUARENTA_E_DOIS_KM",
  "Trail": "ULTRAMARATONA",
  "Personalizado": "PERFORMANCE",
};

const PHASE_MAP: Record<string, CyclePhase> = {
  "Base": "BASE",
  "Construção": "CONSTRUCAO",
  "Específico": "ESPECIFICO",
  "Taper": "POLIMENTO",
};

const SUBTYPE_MAP: Record<string, WorkoutType> = {
  "Rodagem leve": "RODAGEM_LEVE",
  "Intervalado curto": "INTERVALADO_CURTO",
  "Intervalado longo": "INTERVALADO_LONGO",
  "Tempo Run": "TEMPO_RUN",
  "Fartlek": "FARTLEK",
  "Progressivo": "PROGRESSIVO",
  "Longão": "LONGAO",
  "Regenerativo": "REGENERATIVO",
  "Força": "FORCA",
  "Forca": "FORCA",
  "Funcional": "FUNCIONAL",
  "Mobilidade": "MOBILIDADE",
  "Recuperação": "RECUPERACAO",
  "Recuperacao": "RECUPERACAO",
};

// Maps full Portuguese day names → 0 (Sun) … 6 (Sat)
const FULL_DAY_MAP: Record<string, number> = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) {
    return NextResponse.json({ error: "Coach nao encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athleteId") ?? undefined;

  if (athleteId) {
    const athlete = await prisma.athlete.findFirst({
      where: { id: athleteId, coachId: coach.id },
      select: { id: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Atleta nao encontrado" }, { status: 404 });
    }
  }

  const plans = await prisma.trainingPlan.findMany({
    where: {
      coachId: coach.id,
      ...(athleteId ? { athleteId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      name: true,
      goal: true,
      macrocycle: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      athlete: {
        select: {
          id: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
      weeks: {
        orderBy: { weekNumber: "asc" },
        select: {
          id: true,
          weekNumber: true,
          mesocycle: true,
          phase: true,
          startDate: true,
          endDate: true,
          released: true,
          targetVolumeKm: true,
          workouts: {
            orderBy: { date: "asc" },
            select: {
              id: true,
              title: true,
              date: true,
              type: true,
              status: true,
              objective: true,
              warmup: true,
              mainSet: true,
              cooldown: true,
              notes: true,
              targetPaceSecPerKm: true,
              targetDurationMin: true,
              targetDistanceKm: true,
              targetRpe: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    plans: plans.map((plan) => ({
      ...plan,
      weeksCount: plan.weeks.length,
      workoutsCount: plan.weeks.reduce((sum, week) => sum + week.workouts.length, 0),
      releasedWeeksCount: plan.weeks.filter((week) => week.released).length,
    })),
  });
}

function nextMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // getDay(): 0=Sun, 1=Mon, ...
  const dow = d.getDay();
  // Days to add to reach Monday (0 if already Monday)
  const add = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + add);
  return d;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json() as {
    athleteId: string;
    periodizationName?: string;
    startDate?: string;
    endDate?: string;
    goal: string;
    level: string;
    totalWeeks: number;
    trainingDays: string[];
    periodizationSettings?: {
      modality?: string;
      loadMethod?: string;
      buildMode?: string;
      includeStrength?: boolean;
    };
    liberar: boolean;
    weeks: Array<{
      week: number;
      phase: string;
      mesocycle: number;
      isDeload: boolean;
      volume: number;
      intensity: number;
      notes: string;
      km: number;
      sessions: number;
    }>;
    workoutsMap: Record<string, Array<{
      sessionIndex: number;
      dayLabel: string;
      sport?: string;
      subtype: string;
      title: string;
      distanceKm: number;
      durationMin: number;
      targetPaceSecPerKm: number;
      targetRpe: number;
      objective: string;
      warmup: string;
      mainSet: string;
      cooldown: string;
    }>>;
  };

  const { athleteId, goal, liberar, weeks, workoutsMap } = body;

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) {
    return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
  }

  const athlete = await prisma.athlete.findFirst({
    where: {
      id: athleteId,
      OR: [
        { coachId: coach.id },
        { trainingPlans: { some: { coachId: coach.id } } },
      ],
    },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const parsedStartDate = body.startDate ? new Date(`${body.startDate}T00:00:00`) : null;
  const startDate =
    parsedStartDate && !Number.isNaN(parsedStartDate.getTime())
      ? parsedStartDate
      : nextMonday();
  startDate.setHours(0, 0, 0, 0);

  const parsedEndDate = body.endDate ? new Date(`${body.endDate}T23:59:59`) : null;
  const endDate =
    parsedEndDate && !Number.isNaN(parsedEndDate.getTime())
      ? parsedEndDate
      : new Date(startDate);
  if (!body.endDate || Number.isNaN(endDate.getTime())) {
    endDate.setDate(startDate.getDate() + body.totalWeeks * 7);
  }

  const goalEnum = GOAL_MAP[goal] ?? "PERFORMANCE";
  const now = new Date();

  const selectedModality = body.periodizationSettings?.modality ?? "corrida";
  const source = "periodization";
  const batchStatus = liberar ? "published" : "draft";

  const plan = await prisma.$transaction(async (tx) => {
    const generationBatch = await tx.generationBatch.create({
      data: {
        coachId: coach.id,
        athleteId,
        source,
        modality: selectedModality,
        status: batchStatus,
        confidence: 0.72,
        rationale: "Sessões geradas a partir da periodização, modalidade escolhida, frequência semanal, fase do ciclo e volume planejado.",
        payload: {
          goal,
          level: body.level,
          totalWeeks: body.totalWeeks,
          trainingDays: body.trainingDays,
          settings: body.periodizationSettings ?? null,
        },
        acceptedAt: liberar ? now : undefined,
        publishedAt: liberar ? now : undefined,
      },
    });

    const createdPlan = await tx.trainingPlan.create({
    data: {
      athleteId,
      coachId: coach.id,
      name: `${body.periodizationName?.trim() || goal} — ${body.totalWeeks} semanas`,
      goal: goalEnum,
      startDate,
      endDate,
      macrocycle: goal,
      modality: selectedModality,
      source,
      weeks: {
        create: weeks.map((w) => {
          const weekStart = new Date(startDate);
          weekStart.setDate(weekStart.getDate() + (w.week - 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          // When the coach sends the plan, future weeks must be visible to the athlete too.
          const weekReleased = Boolean(liberar);

          const sessionList = workoutsMap[String(w.week)] ?? [];
          const weekDurationMin = sessionList.reduce((sum, session) => sum + (session.durationMin ?? 0), 0);
          const weekTss = sessionList.reduce((sum, session) => sum + Math.round(((session.durationMin ?? 0) * (session.targetRpe ?? 5)) / 10), 0);

          return {
            weekNumber: w.week,
            mesocycle: String(w.mesocycle),
            phase: PHASE_MAP[w.phase] ?? "BASE",
            startDate: weekStart,
            endDate: weekEnd,
            targetVolumeKm: w.km,
            targetDurationMin: weekDurationMin,
            targetTss: weekTss,
            released: weekReleased,
            releasedAt: weekReleased ? now : undefined,
            workouts: {
              create: sessionList.map((s) => {
                // Map dayLabel to its correct weekday offset from Monday
                const dayNum = FULL_DAY_MAP[s.dayLabel] ?? 1; // default Mon
                const offsetFromMonday = dayNum === 0 ? 6 : dayNum - 1;
                const workoutDate = new Date(weekStart.getTime() + offsetFromMonday * 24 * 60 * 60 * 1000);
                workoutDate.setHours(12, 0, 0, 0);
                const isStrength = s.sport === "forca";
                const isNonRunEndurance = s.sport === "natacao" || s.sport === "ciclismo";
                const workoutType = isStrength ? "FORCA" : (SUBTYPE_MAP[s.subtype] ?? "RODAGEM_LEVE");
                const modality = s.sport ?? selectedModality;
                return {
                  date: workoutDate,
                  type: workoutType,
                  title: s.title,
                  status: weekReleased ? ("LIBERADO" as const) : ("AGENDADO" as const),
                  modality,
                  source,
                  generationBatchId: generationBatch.id,
                  confidence: 0.72,
                  rationale: `Gerado pela periodização: ${goal}, fase ${w.phase}, semana ${w.week}, modalidade ${modality}.`,
                  publishedAt: weekReleased ? now : null,
                  objective: s.objective,
                  warmup: s.warmup,
                  mainSet: s.mainSet,
                  cooldown: s.cooldown,
                  targetPaceSecPerKm: isNonRunEndurance || isStrength ? null : s.targetPaceSecPerKm,
                  targetRpe: s.targetRpe,
                  targetDistanceKm: isStrength ? null : s.distanceKm,
                  targetDurationMin: s.durationMin,
                  modalityData: {
                    sport: modality,
                    subtype: s.subtype,
                    dayLabel: s.dayLabel,
                    metricUnit: modality === "natacao" ? "m" : modality === "forca" ? "min" : "km",
                  },
                  notes: [
                    modality && modality !== "corrida" ? `Modalidade: ${modality}` : null,
                    modality ? `Esporte planejado: ${modality}` : null,
                  ].filter(Boolean).join("\n") || undefined,
                };
              }),
            },
          };
        }),
      },
    },
    });

    await tx.generationBatch.update({
      where: { id: generationBatch.id },
      data: { planId: createdPlan.id },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        coachId: coach.id,
        athleteId,
        action: liberar ? "PUBLISH" : "CREATE",
        entity: "TrainingPlan",
        entityId: createdPlan.id,
        message: liberar
          ? "Periodização gerada e liberada para o atleta."
          : "Periodização salva como rascunho editável.",
        after: {
          modality: selectedModality,
          source,
          weeks: weeks.length,
          workouts: Object.values(workoutsMap).reduce((sum, list) => sum + list.length, 0),
        },
      },
    });

    return createdPlan;
  });

  return NextResponse.json({ planId: plan.id, liberated: liberar, autoReleaseEnabled: true });
}
