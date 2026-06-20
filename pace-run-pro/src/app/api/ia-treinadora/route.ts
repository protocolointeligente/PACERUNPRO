import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { messages, athleteContext } = await req.json();

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: getMockReply(messages[messages.length - 1]?.content ?? ""),
    });
  }

  const systemPrompt = `Você é a IA Treinadora do PACE RUN PRO, uma assistente especializada em corrida de rua e triathlon para atletas brasileiros. Você tem acesso ao contexto do atleta:

${JSON.stringify(athleteContext, null, 2)}

Responda sempre em português brasileiro. Seja objetiva, prática e motivadora. Use terminologia de corrida. Limite respostas a 3-4 parágrafos. Não ofereça diagnósticos médicos.`;

  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );

  if (!resp.ok) {
    return NextResponse.json(
      { reply: getMockReply(messages[messages.length - 1]?.content ?? "") },
      { status: 200 }
    );
  }

  const data = await resp.json();
  const reply =
    (data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined) ??
    "Não consegui processar sua pergunta agora.";
  return NextResponse.json({ reply });
}

function getMockReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("pace") || q.includes("ritmo")) {
    return "Baseado no seu histórico, seu pace atual está adequado para a fase de base. Para a próxima semana, sugiro manter o volume com 80% das corridas em Z2 (conversacional). Seu pace de treino longo deve ficar entre 6:20–6:40 min/km para garantir recuperação adequada.\n\nLembre-se: consistência supera intensidade na fase de construção de base aeróbica!";
  }
  if (q.includes("lesão") || q.includes("dor")) {
    return "Qualquer dor persistente merece atenção de um profissional de saúde. Para dores musculares típicas pós-treino, o protocolo RICE (repouso, gelo, compressão, elevação) nas primeiras 48h é eficaz.\n\nNão treine com dor aguda — prefira cruzamento (natação, bike) até a avaliação médica. Posso ajustar seu plano para o período de recuperação se precisar.";
  }
  if (q.includes("prova") || q.includes("corrida")) {
    return "Ótima pergunta sobre preparação para prova! Baseado no seu plano atual, você está em boa trajetória. Na semana da prova, reduza o volume em 40–50% mas mantenha algumas acelerações curtas para manter a agilidade neuromuscular.\n\nNa véspera: refeição rica em carboidratos, hidratação adequada e sono de qualidade. No dia: café leve 2–3h antes, aquecimento de 10–15 minutos em ritmo fácil.";
  }
  if (q.includes("nutri") || q.includes("aliment") || q.includes("carboidrato")) {
    return "A nutrição para corredores é simples na essência: carboidratos são o combustível principal. Para treinos acima de 1h, consuma 30–60g de carboidratos por hora durante o esforço.\n\nNa janela pós-treino (até 30 min após): proteína + carboidrato (proporção 1:3) para recuperação muscular. Para provas longas, treine seu intestino com géis nos treinos longos antes de usar em prova.";
  }
  return "Baseado no seu perfil e histórico de treinos, você está progredindo bem! Minha recomendação é manter a regularidade e respeitar os dias de recuperação.\n\nSe tiver uma dúvida mais específica sobre pace, nutrição, periodização ou preparação para provas, estarei aqui para ajudar. Qual aspecto do seu treino você quer explorar?";
}
