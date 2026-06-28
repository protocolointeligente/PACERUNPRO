import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { conversationId } = await params;
  const userId = session.user.id;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.athleteId !== userId && conversation.coachId !== userId)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    include: { fromUser: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  recentMessages.reverse();

  const athleteUser = await prisma.user.findUnique({
    where: { id: conversation.athleteId },
    select: { name: true, athlete: { select: { goal: true, level: true, raceDate: true } } },
  });

  const historyText = recentMessages
    .map((m) => `${m.fromUser.name}: ${m.content}`)
    .join("\n");

  const systemPrompt = `Você é o assistente de treinamento do PACERUNPRO. Ajude o atleta ${athleteUser?.name ?? ""}
  (nível: ${athleteUser?.athlete?.level ?? "não informado"}, objetivo: ${athleteUser?.athlete?.goal ?? "não informado"}).
  Responda de forma direta, prática e motivadora. Máximo 2 parágrafos. Sempre incentive o atleta a consultar o treinador para ajustes de plano.`;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        { role: "user", content: `Histórico recente:\n${historyText}\n\nResponda à última mensagem do atleta de forma útil e encorajadora.` },
      ],
    });

    const aiText = response.content[0].type === "text" ? response.content[0].text : "Não foi possível gerar resposta.";

    const aiMessage = await prisma.message.create({
      data: { conversationId, fromUserId: userId, content: aiText, isAI: true },
      include: { fromUser: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json(aiMessage);
  } catch (_) {
    return NextResponse.json({ error: "Erro ao gerar resposta da IA" }, { status: 500 });
  }
}
