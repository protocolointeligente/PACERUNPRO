import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;

  const where = role === "COACH" ? { coachId: userId } : { athleteId: userId };
  const conversations = await prisma.conversation.findMany({ where, select: { id: true } });
  const ids = conversations.map((c) => c.id);
  if (!ids.length) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { conversationId: { in: ids }, fromUserId: { not: userId }, readAt: null },
  });

  return NextResponse.json({ count });
}
