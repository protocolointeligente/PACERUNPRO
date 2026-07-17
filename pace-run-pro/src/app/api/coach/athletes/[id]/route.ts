import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Atleta invalido" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!coach) {
    return NextResponse.json({ error: "Treinador nao encontrado" }, { status: 404 });
  }

  const athlete = await prisma.athlete.findFirst({
    where: { id, coachId: coach.id },
    select: {
      id: true,
      coachPlanPurchases: {
        where: {
          status: { in: ["pending", "paid"] },
          plan: { coachId: coach.id },
        },
        select: {
          coachPlanId: true,
        },
      },
      planPurchases: {
        where: {
          status: { in: ["pending", "paid"] },
          product: { coachId: coach.id },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta nao encontrado nesta assessoria" }, { status: 404 });
  }

  const slotReleasesByPlan = athlete.coachPlanPurchases.reduce<Record<string, number>>((acc, purchase) => {
    acc[purchase.coachPlanId] = (acc[purchase.coachPlanId] ?? 0) + 1;
    return acc;
  }, {});

  let archivedWorkoutCount = 0;
  let archivedPlanCount = 0;

  await prisma.$transaction(async (tx) => {
    const coachTrainingPlans = await tx.trainingPlan.findMany({
      where: {
        athleteId: athlete.id,
        coachId: coach.id,
      },
      select: { id: true },
    });
    const coachTrainingPlanIds = coachTrainingPlans.map((plan) => plan.id);
    archivedPlanCount = coachTrainingPlanIds.length;

    if (coachTrainingPlanIds.length > 0) {
      const archivedWorkouts = await tx.workout.updateMany({
        where: {
          week: {
            planId: { in: coachTrainingPlanIds },
          },
          status: { in: ["AGENDADO", "LIBERADO", "AJUSTADO"] },
        },
        data: {
          status: "PERDIDO",
          publishedAt: null,
        },
      });
      archivedWorkoutCount = archivedWorkouts.count;
    }

    await tx.athlete.update({
      where: { id: athlete.id },
      data: {
        coachId: null,
        status: "inativo",
      },
    });

    await tx.coachPlanPurchase.updateMany({
      where: {
        athleteId: athlete.id,
        status: { in: ["pending", "paid"] },
        plan: { coachId: coach.id },
      },
      data: { status: "canceled" },
    });

    await tx.planPurchase.updateMany({
      where: {
        athleteId: athlete.id,
        status: { in: ["pending", "paid"] },
        product: { coachId: coach.id },
      },
      data: { status: "refunded" },
    });

    await tx.trainingPlan.updateMany({
      where: {
        athleteId: athlete.id,
        coachId: coach.id,
      },
      data: { coachId: null },
    });

    for (const [coachPlanId, releaseCount] of Object.entries(slotReleasesByPlan)) {
      const plan = await tx.coachPlan.findFirst({
        where: { id: coachPlanId, coachId: coach.id },
        select: { usedSlots: true },
      });
      if (!plan) continue;

      await tx.coachPlan.update({
        where: { id: coachPlanId },
        data: { usedSlots: Math.max(0, plan.usedSlots - releaseCount) },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        coachId: coach.id,
        athleteId: athlete.id,
        action: "DELETE",
        entity: "AthleteCoachLink",
        entityId: athlete.id,
        message: "Treinador desvinculou atleta e arquivou vinculo operacional de planos antigos.",
        after: {
          coachId: null,
          status: "inativo",
          releasedSlots: Object.values(slotReleasesByPlan).reduce((sum, count) => sum + count, 0),
          archivedPlanCount,
          archivedWorkoutCount,
        },
      },
    });
  });

  return NextResponse.json({
    ok: true,
    releasedSlots: Object.values(slotReleasesByPlan).reduce((sum, count) => sum + count, 0),
    archivedPlanCount,
    archivedWorkoutCount,
  });
}
