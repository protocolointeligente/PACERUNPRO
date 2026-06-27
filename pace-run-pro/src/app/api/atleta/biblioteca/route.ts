import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { type WorkoutType, type CyclePhase, type Goal } from "@prisma/client";

// ─── Type helpers ────────────────────────────────────────────────────────────

interface ContentWorkout {
  id: string;
  dayOfWeek: number;
  type: string;
  title: string;
  targetDistanceKm?: number;
  targetDurationMin?: number;
  targetRpe?: number;
}

interface ContentWeek {
  weekNumber: number;
  phase: string;
  workouts: ContentWorkout[];
}

const WORKOUT_TYPE_MAP: Record<string, WorkoutType> = {
  LONGO: "LONGAO",
  INTERVALADO: "INTERVALADO_CURTO",
  FARTLEK: "FARTLEK",
  TIME_TRIAL: "TEMPO_RUN",
  REGENERATIVO: "REGENERATIVO",
  CONTINUO: "RODAGEM_LEVE",
  CORRIDA: "RODAGEM_LEVE",
  PROVA: "PROVA",
};

function toWorkoutType(raw: string): WorkoutType {
  return WORKOUT_TYPE_MAP[raw] ?? "RODAGEM_LEVE";
}

const VALID_GOALS = new Set([
  "CINCO_KM", "DEZ_KM", "VINTE_E_UM_KM", "QUARENTA_E_DOIS_KM",
  "ULTRAMARATONA", "EMAGRECIMENTO", "PERFORMANCE", "RETORNO_AS_CORRIDAS",
]);

function toGoal(raw: string): Goal {
  return (VALID_GOALS.has(raw) ? raw : "PERFORMANCE") as Goal;
}

const VALID_PHASES = new Set(["BASE", "CONSTRUCAO", "ESPECIFICO", "POLIMENTO", "COMPETICAO", "RECUPERACAO"]);

function toPhase(raw: string): CyclePhase {
  return (VALID_PHASES.has(raw) ? raw : "BASE") as CyclePhase;
}

// ─── GET — list purchased plans ───────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ purchases: [] });

  const purchases = await prisma.planPurchase.findMany({
    where: { athleteId: athlete.id, status: "PAID" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          sport: true,
          level: true,
          goal: true,
          durationWeeks: true,
          priceCents: true,
          coverUrl: true,
          coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check which purchases have already been activated
  const activePlan = await prisma.trainingPlan.findMany({
    where: {
      athleteId: athlete.id,
      purchaseId: { in: purchases.map((p) => p.id) },
    },
    select: { purchaseId: true, id: true },
  });
  const activatedMap = new Map(activePlan.map((p) => [p.purchaseId, p.id]));

  return NextResponse.json({
    purchases: purchases.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      product: p.product,
      activatedPlanId: activatedMap.get(p.id) ?? null,
    })),
  });
}

// ─── POST — activate a purchased plan ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json();
  const { purchaseId, startDate } = body as { purchaseId?: string; startDate?: string };
  if (!purchaseId || !startDate) {
    return NextResponse.json({ error: "purchaseId e startDate são obrigatórios" }, { status: 400 });
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "startDate inválida" }, { status: 400 });
  }

  // Load purchase
  const purchase = await prisma.planPurchase.findUnique({
    where: { id: purchaseId },
    include: { product: { select: { title: true, goal: true, durationWeeks: true, planContent: true } } },
  });
  if (!purchase || purchase.athleteId !== athlete.id || purchase.status !== "PAID") {
    return NextResponse.json({ error: "Compra não encontrada ou não paga" }, { status: 404 });
  }

  // Idempotent — if already activated, return existing plan
  const existing = await prisma.trainingPlan.findUnique({ where: { purchaseId } });
  if (existing) {
    return NextResponse.json({ planId: existing.id, already: true });
  }

  const { product } = purchase;
  const content = product.planContent as unknown as ContentWeek[];

  if (!content || content.length === 0) {
    return NextResponse.json({ error: "Plano sem conteúdo" }, { status: 422 });
  }

  const lastWeek = content[content.length - 1];
  const totalWeeks = lastWeek.weekNumber;

  // Calculate plan end date
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + totalWeeks * 7 - 1);

  // Determine dominant phase (for plan.phase)
  const dominantPhase = toPhase(content[0]?.phase ?? "BASE");

  // Create plan + weeks + workouts in one transaction
  const plan = await prisma.$transaction(async (tx) => {
    const newPlan = await tx.trainingPlan.create({
      data: {
        athleteId: athlete.id,
        purchaseId,
        name: product.title,
        goal: toGoal(product.goal ?? "PERFORMANCE"),
        phase: dominantPhase,
        startDate: start,
        endDate,
      },
    });

    for (const cw of content) {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + (cw.weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const week = await tx.trainingWeek.create({
        data: {
          planId: newPlan.id,
          weekNumber: cw.weekNumber,
          phase: toPhase(cw.phase),
          startDate: weekStart,
          endDate: weekEnd,
          released: true,
        },
      });

      for (const cwo of cw.workouts) {
        const workoutDate = new Date(weekStart);
        workoutDate.setDate(workoutDate.getDate() + cwo.dayOfWeek);

        await tx.workout.create({
          data: {
            weekId: week.id,
            date: workoutDate,
            type: toWorkoutType(cwo.type),
            title: cwo.title,
            targetDistanceKm: cwo.targetDistanceKm ?? null,
            targetDurationMin: cwo.targetDurationMin ?? null,
            targetRpe: cwo.targetRpe ?? null,
          },
        });
      }
    }

    return newPlan;
  });

  return NextResponse.json({ planId: plan.id });
}
