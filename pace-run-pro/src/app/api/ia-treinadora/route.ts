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

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply:
        "A inteligência está temporariamente indisponível porque o provedor de IA não está configurado. Com os dados disponíveis, consigo registrar sua pergunta, mas não vou gerar uma recomendação simulada. Peça ao treinador para revisar seus últimos treinos, check-ins e carga antes de ajustar o plano.",
      dataQuality: {
        confidence: "baixa",
        reason: "GOOGLE_AI_API_KEY ausente",
        contextAvailable: {
          checkins: recentCheckIns.length,
          logs: recentLogs.length,
          loadSeries: series.length,
        },
      },
    });
  }

  const systemPrompt = `Você é a IA Treinadora do PACE RUN PRO, uma assistente especializada em corrida de rua e triathlon para atletas brasileiros. Você tem acesso ao contexto real do atleta, obtido diretamente da plataforma:

${JSON.stringify(athleteContext, null, 2)}

Responda sempre em português brasileiro. Seja objetiva, prática e motivadora. Use terminologia de corrida. Limite respostas a 3-4 parágrafos. Não ofereça diagnósticos médicos. Use os dados reais (carga CTL/ATL/TSB, check-ins recentes, treinos recentes) para personalizar suas recomendações ao atleta ${athlete.user.name}.`;

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
    },
  );

  if (!resp.ok) {
    return NextResponse.json({
      reply:
        "Não consegui consultar a inteligência agora. Não vou substituir isso por uma resposta pronta. Os dados reais do atleta foram carregados, mas a recomendação deve ser revisada pelo treinador quando o serviço voltar.",
      dataQuality: {
        confidence: "baixa",
        reason: `provedor respondeu ${resp.status}`,
        contextAvailable: {
          checkins: recentCheckIns.length,
          logs: recentLogs.length,
          loadSeries: series.length,
        },
      },
    });
  }

  const data = await resp.json();
  const reply =
    (data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined) ??
    "Não consegui processar sua pergunta agora.";
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      athleteId: athlete.id,
      action: "AI_GENERATION",
      entity: "AthleteInsight",
      message: "Resposta da IA Treinadora gerada com contexto real do atleta.",
      after: {
        contextAvailable: {
          checkins: recentCheckIns.length,
          logs: recentLogs.length,
          loadSeries: series.length,
        },
      },
    },
  });

  return NextResponse.json({ reply });
}
