import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: athleteId } = await params;
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

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
  if (!athlete) return NextResponse.json({ error: "Atleta não vinculado" }, { status: 403 });

  const plans = await prisma.trainingPlan.findMany({
    where: { athleteId, coachId: coach.id },
    select: {
      id: true,
      name: true,
      source: true,
      startDate: true,
      endDate: true,
      _count: { select: { weeks: true } },
      weeks: { select: { _count: { select: { workouts: true } } } },
    },
  });

  const deletedWorkouts = plans.reduce(
    (sum, plan) => sum + plan.weeks.reduce((inner, week) => inner + week._count.workouts, 0),
    0,
  );

  const result = await prisma.trainingPlan.deleteMany({
    where: { athleteId, coachId: coach.id },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      coachId: coach.id,
      athleteId,
      action: "DELETE",
      entity: "training_plan",
      entityId: athleteId,
      message: `Periodização removida (${result.count} plano(s), ${deletedWorkouts} treino(s)).`,
      before: {
        plans: plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          source: plan.source,
          startDate: plan.startDate.toISOString(),
          endDate: plan.endDate.toISOString(),
          weeks: plan._count.weeks,
        })),
        deletedPlans: result.count,
        deletedWorkouts,
      },
    },
  });

  return NextResponse.json({ success: true, deletedPlans: result.count, deletedWorkouts });
}
