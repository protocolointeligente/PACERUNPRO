import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const comment = await prisma.workoutLogComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.workoutLogComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
