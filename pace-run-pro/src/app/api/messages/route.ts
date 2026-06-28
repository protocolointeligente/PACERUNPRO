import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET — lista conversas do usuário atual
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role;

  if (role === "COACH") {
    const conversations = await prisma.conversation.findMany({
      where: { coachId: userId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    const enriched = await Promise.all(
      conversations.map(async (c) => {
        const athlete = await prisma.user.findUnique({ where: { id: c.athleteId }, select: { id: true, name: true, avatarUrl: true } });
        const unread = await prisma.message.count({
          where: { conversationId: c.id, fromUserId: { not: userId }, readAt: null },
        });
        return { ...c, athlete, unread };
      })
    );
    return NextResponse.json(enriched);
  } else {
    // ATHLETE — retorna só a conversa com seu treinador
    const athlete = await prisma.athlete.findUnique({ where: { userId }, select: { coachId: true, coach: { select: { userId: true } } } });
    if (!athlete?.coachId) return NextResponse.json([]);
    const coachUserId = athlete.coach!.userId;

    let conversation = await prisma.conversation.findUnique({
      where: { athleteId_coachId: { athleteId: userId, coachId: coachUserId } },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { athleteId: userId, coachId: coachUserId },
      });
    }
    const coach = await prisma.user.findUnique({ where: { id: coachUserId }, select: { id: true, name: true, avatarUrl: true } });
    return NextResponse.json([{ ...conversation, coach, unread: 0 }]);
  }
}
