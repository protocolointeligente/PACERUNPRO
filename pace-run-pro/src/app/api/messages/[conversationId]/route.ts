import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { conversationId } = await params;
  const userId = session.user.id;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (conversation.athleteId !== userId && conversation.coachId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.message.updateMany({
    where: { conversationId, fromUserId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const isCoach = conversation.coachId === userId;
  const otherUserId = isCoach ? conversation.athleteId : conversation.coachId;
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { name: true, avatarUrl: true },
  });

  return NextResponse.json({
    id: conversation.id,
    currentUserId: userId,
    athleteId: conversation.athleteId,
    coachId: conversation.coachId,
    athleteName: isCoach ? otherUser?.name : null,
    athleteAvatar: isCoach ? otherUser?.avatarUrl : null,
    coachName: !isCoach ? otherUser?.name : null,
    coachAvatar: !isCoach ? otherUser?.avatarUrl : null,
    messages,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { conversationId } = await params;
  const userId = session.user.id;
  const body = await req.json();
  const content = body?.content?.trim();
  if (!content) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (conversation.athleteId !== userId && conversation.coachId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { conversationId, fromUserId: userId, content },
    include: { fromUser: { select: { id: true, name: true, avatarUrl: true } } },
  });

  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  const recipientUserId = conversation.athleteId === userId ? conversation.coachId : conversation.athleteId;
  const senderName = session.user.name ?? "Alguém";

  await prisma.notification.create({
    data: {
      userId: recipientUserId,
      title: `Mensagem de ${senderName}`,
      body: content.length > 80 ? content.slice(0, 80) + "…" : content,
    },
  });

  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: recipientUserId } });
    if (subs.length > 0) {
      const webpush = await import("web-push");
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.default.setVapidDetails(
          `mailto:${process.env.VAPID_EMAIL ?? "suporte@pacerunpro.com.br"}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
        const payload = JSON.stringify({
          title: `💬 ${senderName}`,
          body: content.length > 60 ? content.slice(0, 60) + "…" : content,
          url: `/atleta/treinador`,
        });
        await Promise.allSettled(
          subs.map((s) =>
            webpush.default.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
          )
        );
      }
    }
  } catch (_) {
    // push is non-blocking
  }

  return NextResponse.json(message);
}
