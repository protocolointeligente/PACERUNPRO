import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json([]);

  const leads = await prisma.lead.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const { id, stage, notes } = (await req.json()) as { id: string; stage?: string; notes?: string };

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(stage !== undefined ? { stage } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return NextResponse.json(lead);
}
