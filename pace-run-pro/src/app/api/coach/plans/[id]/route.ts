import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const plan = await prisma.trainingPlan.findFirst({
    where: { id, coachId: coach.id },
    select: { id: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  await prisma.trainingPlan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
