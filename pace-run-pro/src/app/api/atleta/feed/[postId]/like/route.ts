import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST — toggle like on a post
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { postId } = await params;

  const existing = await prisma.feedLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.feedLike.delete({ where: { id: existing.id } });
    const count = await prisma.feedLike.count({ where: { postId } });
    return NextResponse.json({ liked: false, likesCount: count });
  } else {
    await prisma.feedLike.create({ data: { postId, userId: session.user.id } });
    const count = await prisma.feedLike.count({ where: { postId } });
    return NextResponse.json({ liked: true, likesCount: count });
  }
}
