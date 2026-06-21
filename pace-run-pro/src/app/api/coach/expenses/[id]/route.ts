import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.expense.deleteMany({ where: { id, coachId: coach.id } });
  return NextResponse.json({ ok: true });
}
