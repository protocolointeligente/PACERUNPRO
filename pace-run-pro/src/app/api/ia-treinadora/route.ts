import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { iaTreinadoraLimiter } from "@/lib/rate-limit";
import { estimateTSS, computeLoadSeries } from "@/lib/training-load";

function formatPace(secPerKm: number | null | undefined): string | null {
  if (!secPerKm) return null;
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, "0")}/km`;
}

export async function POST(req: NextRequest) {
  const rl = iaTreinadoraLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Limite de mensagens atingido. Aguarde um momento antes de enviar mais." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { messages } = await req.json();

  // Fetch real athlete context server-side — never trust client-supplied athleteContext
  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      goal: true,
      level: true,
      birthDate: true,
      weightKg: true,
      heightCm: true,
      recoveryScore: true,
      loadParams: {
        select: { thresholdPaceSecPerKm: true, hrMax: true, hrRest: true },
      },
      user: { select: { name: true } },
    },
  });

  if (!athlete) {
    return NextResponse.json({ error: "Perfil de atleta não encontrado" }, { status: 404 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);

  const [recentCheckIns, recentLogs, workouts] = await Promise.all([
    prisma.checkIn.findMany({
      where: { athleteId: athlete.id, date: { gte: sevenDaysAgo } },
      select: { date: true, rpe: true, sleep: true, fatigue: true, mood: true, pain: true, notes: true },
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.workoutLog.findMany({
      where: { athleteId: athlete.id },
      select: {
        startedAt: true,
        distanceKm: true,
        durationSec: true,
        avgPaceSecPerKm: true,
        avgHr: true,
        rpe: true,
        feeling: true,
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.workout.findMany({
      where: {
        week: { plan: { athleteId: athlete.id } },
        date: { gte: new Date(Date.now() - 120 * 86400_000) },
      },
      select: {
        date: true,
        type: true,
        targetDistanceKm: true,
        targetDurationMin: true,
        targetPaceSecPerKm: true,
        targetRpe: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Compute training load (CTL/ATL/TSB)
  const dailyTss = new Map<string, number>();
  for (const w of workouts) {
    const tss = estimateTSS(
      { type: w.type as string, targetDistanceKm: w.targetDistanceKm, targetDurationMin: w.targetDurationMin, targetPaceSecPerKm: w.targetPaceSecPerKm, targetRpe: w.targetRpe },
      athlete.loadParams,
    );
    const day = w.date.toISOString().slice(0, 10);
    dailyTss.set(day, (dailyTss.get(day) ?? 0) + tss);
  }

  const series = computeLoadSeries(dailyTss, 30);
  const latest = series[series.length - 1] ?? null;

  const athleteContext = {
    nome: athlete.user.name,
    objetivo: athlete.goal,
    nivel: athlete.level,
    peso: athlete.weightKg ? `${athlete.weightKg} kg` : null,
    altura: athlete.heightCm ? `${athlete.heightCm} cm` : null,
    paceLimiar: formatPace(athlete.loadParams?.thresholdPaceSecPerKm),
    fcMax: athlete.loadParams?.hrMax ?? null,
    fcRepouso: athlete.loadParams?.hrRest ?? null,
    cargaAtual: latest
      ? { CTL: latest.ctl, ATL: latest.atl, TSB: latest.tsb }
      : null,
    checkinRecentes: recentCheckIns.map((c) => ({
      data: c.date.toISOString().slice(0, 10),
      rpe: c.rpe,
      sono: c.sleep,
      fadiga: c.fatigue,
      humor: c.mood,
      dor: c.pain,
      notas: c.notes,
    })),
    ultimosTreinos: recentLogs.map((l) => ({
      data: l.startedAt?.toISOString().slice(0, 10),
      distanciaKm: l.distanceKm,
      duracao: l.durationSec ? `${Math.round(l.durationSec / 60)} min` : null,
      paceMedia: formatPace(l.avgPaceSecPerKm),
      fcMedia: l.avgHr,
      rpe: l.rpe,
      sensacao: l.feeling,
    })),
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: getMockReply(messages[messages.length - 1]?.content ?? "") });
  }

  const systemPrompt = `Você é a IA Treinadora do PACE RUN PRO, uma assistente especializada em corrida de rua e triathlon para atletas brasileiros. Você tem acesso ao contexto real do atleta, obtido diretamente da plataforma:

${JSON.stringify(athleteContext, null, 2)}

Responda sempre em português brasileiro. Seja objetiva, prática e motivadora. Use terminologia de corrida. Limite respostas a 3-4 parágrafos. Não ofereça diagnósticos médicos. Use os dados reais (carga CTL/ATL/TSB, check-ins recentes, treinos recentes) para personalizar suas recomendações ao atleta ${athlete.user.name}.`;

  const claudeMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    }),
  });

  if (!resp.ok) {
    return NextResponse.json({ reply: getMockReply(messages[messages.length - 1]?.content ?? "") });
  }

  const data = await resp.json();
  const reply =
    (data.content?.[0]?.text as string | undefined) ??
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
