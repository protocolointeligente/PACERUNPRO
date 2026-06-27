import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST — toggle like on a post
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { postId } = (await req.json()) as { postId?: string };
  if (!postId) return NextResponse.json({ error: "postId obrigatório" }, { status: 400 });

  const existing = await prisma.feedLike.findFirst({
    where: { postId, userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.feedLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.feedLike.create({
    data: { postId, userId: session.user.id },
  });
  return NextResponse.json({ liked: true });
}
