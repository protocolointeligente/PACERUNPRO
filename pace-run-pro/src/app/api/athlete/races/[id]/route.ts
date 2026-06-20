import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.race.deleteMany({ where: { id, athleteId: athlete.id } });
  return NextResponse.json({ ok: true });
}
