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

  const lead = await prisma.lead.findUnique({ where: { id } });
  return NextResponse.json(lead);
}
