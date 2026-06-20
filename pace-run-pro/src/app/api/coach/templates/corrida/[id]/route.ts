import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });

  const { id } = await params;

  const tpl = await prisma.coachRunTemplate.findFirst({
    where: { id, coachId: coach.id },
  });
  if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });

  await prisma.coachRunTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
