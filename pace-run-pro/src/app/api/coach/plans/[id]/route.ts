import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    priceCents?: number;
    period?: string;
    features?: string[];
    highlight?: boolean;
    active?: boolean;
    maxSlots?: number | null;
    sortOrder?: number;
  };

  const plan = await prisma.coachPlan.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priceCents !== undefined && { priceCents: body.priceCents }),
      ...(body.period !== undefined && { period: body.period as "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" }),
      ...(body.features !== undefined && { features: body.features }),
      ...(body.highlight !== undefined && { highlight: body.highlight }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.maxSlots !== undefined && { maxSlots: body.maxSlots }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.coachPlan.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
