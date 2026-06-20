import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json([]);

  const expenses = await prisma.expense.findMany({
    where: { coachId: coach.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    description: string;
    amountCents: number;
    category?: string;
    supplier?: string;
    date?: string;
    recurring?: boolean;
    notes?: string;
  };

  if (!body.description || !body.amountCents) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      coachId: coach.id,
      description: body.description,
      amountCents: body.amountCents,
      category: body.category ?? "outros",
      supplier: body.supplier ?? null,
      date: body.date ? new Date(body.date) : new Date(),
      recurring: body.recurring ?? false,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
