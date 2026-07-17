import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function resolveCoachPlan(userId: string, planId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!coach) return null;

  const plan = await prisma.coachPlan.findFirst({
    where: { id: planId, coachId: coach.id },
    select: { id: true, coachId: true },
  });

  return plan ? { coach, plan } : null;
}

function commercialProductFilter(planId: string, coachId: string) {
  return {
    coachId,
    planContent: {
      path: ["coachPlanId"],
      equals: planId,
    },
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachPlan(session.user.id, id);
  if (!resolved) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    description?: string | null;
    priceCents?: number;
    active?: boolean;
    features?: string[];
    highlight?: boolean;
    maxSlots?: number | null;
    sortOrder?: number;
  };

  const data = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.priceCents !== undefined ? { priceCents: body.priceCents } : {}),
    ...(body.active !== undefined ? { active: body.active } : {}),
    ...(body.features !== undefined ? { features: body.features } : {}),
    ...(body.highlight !== undefined ? { highlight: body.highlight } : {}),
    ...(body.maxSlots !== undefined ? { maxSlots: body.maxSlots } : {}),
    ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
  };

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const plan = await tx.coachPlan.update({ where: { id }, data });

    const productData = {
      ...(body.name !== undefined ? { title: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description ?? "Plano de acompanhamento personalizado." } : {}),
      ...(body.priceCents !== undefined ? { priceCents: body.priceCents } : {}),
      ...(body.active !== undefined ? { published: body.active } : {}),
      ...(body.features !== undefined ? { included: body.features } : {}),
      ...(body.highlight !== undefined ? { featured: body.highlight } : {}),
    };

    if (Object.keys(productData).length > 0) {
      await tx.planProduct.updateMany({
        where: commercialProductFilter(id, resolved.coach.id),
        data: productData,
      });
    }

    return plan;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachPlan(session.user.id, id);
  if (!resolved) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const activePurchases = await prisma.coachPlanPurchase.count({
    where: { coachPlanId: id, status: { in: ["pending", "paid"] } },
  });

  await prisma.$transaction(async (tx) => {
    if (activePurchases > 0) {
      await tx.coachPlan.update({ where: { id }, data: { active: false } });
    } else {
      await tx.coachPlan.delete({ where: { id } });
    }

    await tx.planProduct.updateMany({
      where: commercialProductFilter(id, resolved.coach.id),
      data: { published: false },
    });
  });

  return NextResponse.json({
    success: true,
    mode: activePurchases > 0 ? "paused" : "deleted",
  });
}
