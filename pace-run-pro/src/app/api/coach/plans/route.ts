import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { plans: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(coach?.plans ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name: string;
    description?: string;
    priceCents: number;
    period?: string;
    features?: string[];
    highlight?: boolean;
    maxSlots?: number | null;
    sortOrder?: number;
  };

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const plan = await prisma.coachPlan.create({
    data: {
      coachId: coach.id,
      name: body.name,
      description: body.description ?? null,
      priceCents: body.priceCents,
      period: (body.period as "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL") ?? "MENSAL",
      features: body.features ?? [],
      highlight: body.highlight ?? false,
      maxSlots: body.maxSlots ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
