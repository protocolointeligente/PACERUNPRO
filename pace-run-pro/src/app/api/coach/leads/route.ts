import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json([]);

  const leads = await prisma.lead.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const { name, email, phone, source, stage, notes, monthlyFeeCents } = (await req.json()) as {
    name: string;
    email?: string | null;
    phone?: string | null;
    source?: string;
    stage?: string;
    notes?: string | null;
    monthlyFeeCents?: number | null;
  };

  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: {
      coachId: coach.id,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      source: source || "instagram",
      stage: stage || "novo",
      notes: notes || null,
      monthlyFeeCents: monthlyFeeCents ?? null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const { id, stage, notes } = (await req.json()) as { id: string; stage?: string; notes?: string };

  const result = await prisma.lead.updateMany({
    where: { id, coachId: coach.id },
    data: {
      ...(stage !== undefined ? { stage } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  if (result.count === 0) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const lead = await prisma.lead.findFirst({ where: { id, coachId: coach.id } });
  return NextResponse.json(lead);
}
