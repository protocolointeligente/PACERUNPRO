import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

interface GeneratorInput {
  sport: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  trainingDays: string[];
  weeks: number;
  hasEvent: boolean;
  eventName: string;
  eventDate: string;
  notes: string;
}

interface GeneratedWeek {
  week: number;
  phase: "Base" | "Construção" | "Específico" | "Taper";
  mesocycle: number;
  isDeload: boolean;
  volume: number;
  intensity: number;
  notes: string;
  km: number;
  sessions: number;
}

function buildSystemPrompt(): string {
  return `Você é um especialista em periodização esportiva do PACE RUN PRO.
Sua tarefa é gerar um plano de periodização estruturado como JSON.

Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem blocos de código.
O JSON deve ter exatamente este formato:

{
  "weeks": [
    {
      "week": 1,
      "phase": "Base",
      "mesocycle": 1,
      "isDeload": false,
      "volume": 65,
      "intensity": 55,
      "notes": "Adaptação inicial, ritmo conversacional",
      "km": 28,
      "sessions": 3
    }
  ],
  "planName": "Nome do plano",
  "summary": "Resumo em 1 frase da estratégia"
}

Regras:
- phase: APENAS "Base", "Construção", "Específico" ou "Taper"
- volume: 0–100 (porcentagem do volume máximo)
- intensity: 0–100 (porcentagem da intensidade máxima)
- km: quilômetros semanais realistas para o esporte/nível
- sessions: número de treinos nessa semana (respeitar daysPerWeek)
- isDeload: true a cada 4ª semana (semana de recuperação)
- mesocycle: número do mesociclo (1, 2, 3...)
- Estrutura clássica: Base → Construção → Específico → Taper
- Para Taper: reduza volume em 40–50% nas últimas 1–2 semanas
- Para Força/Funcional: adapte km para "séries totais" mas mantenha o campo km com valor simbólico`;
}

function buildUserPrompt(input: GeneratorInput): string {
  const lines = [
    `Modalidade: ${input.sport}`,
    `Objetivo: ${input.goal}`,
    `Nível: ${input.level}`,
    `Dias de treino/semana: ${input.daysPerWeek} (${input.trainingDays.join(", ")})`,
    `Total de semanas: ${input.weeks}`,
  ];

  if (input.hasEvent && input.eventDate) {
    lines.push(`Prova alvo: ${input.eventName || "sem nome"} em ${input.eventDate}`);
  }

  if (input.notes) {
    lines.push(`Observações/restrições: ${input.notes}`);
  }

  lines.push(`\nGere um plano de periodização com ${input.weeks} semanas.`);
  lines.push("Retorne APENAS o JSON, sem texto adicional.");

  return lines.join("\n");
}

function generateFallbackPlan(input: GeneratorInput): GeneratedWeek[] {
  const phases = [
    { name: "Base" as const, volumePct: [60, 65, 70, 60], intensityPct: [55, 55, 60, 50] },
    { name: "Construção" as const, volumePct: [75, 80, 85, 70], intensityPct: [65, 70, 75, 60] },
    { name: "Específico" as const, volumePct: [85, 90, 90, 75], intensityPct: [78, 82, 85, 70] },
    { name: "Taper" as const, volumePct: [60, 45], intensityPct: [80, 70] },
  ];

  const weeksList: GeneratedWeek[] = [];
  let weekNum = 1;
  let meso = 1;

  const basekm = input.level === "Iniciante" ? 20
    : input.level === "Intermediário" ? 40
    : input.level === "Avançado" ? 60
    : 80;

  const totalWeeks = input.weeks;
  // Distribute weeks: ~40% base, 30% construção, 20% específico, 10% taper (min 1)
  const taperW = Math.max(1, Math.round(totalWeeks * 0.1));
  const specificW = Math.max(2, Math.round(totalWeeks * 0.2));
  const buildW = Math.max(2, Math.round(totalWeeks * 0.3));
  const baseW = totalWeeks - taperW - specificW - buildW;

  const phaseWeeks = [baseW, buildW, specificW, taperW];

  for (let pi = 0; pi < phases.length; pi++) {
    const ph = phases[pi];
    const count = phaseWeeks[pi];
    for (let wi = 0; wi < count; wi++) {
      const volIdx = Math.min(wi, ph.volumePct.length - 1);
      const vol = ph.volumePct[volIdx];
      const inten = ph.intensityPct[volIdx];
      const isDeload = (wi + 1) % 4 === 0 && wi !== count - 1;
      weeksList.push({
        week: weekNum++,
        phase: ph.name,
        mesocycle: meso,
        isDeload,
        volume: isDeload ? Math.max(50, vol - 20) : vol,
        intensity: isDeload ? Math.max(45, inten - 15) : inten,
        notes: isDeload ? "Semana de recuperação ativa" : `${ph.name}: foco em ${ph.name === "Base" ? "volume aeróbico" : ph.name === "Construção" ? "progressão de volume e ritmo" : ph.name === "Específico" ? "ritmo de prova" : "recuperação pré-prova"}`,
        km: Math.round(basekm * vol / 100),
        sessions: input.daysPerWeek,
      });
      if ((weekNum - 1) % 4 === 0) meso++;
    }
  }

  return weeksList;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let input: GeneratorInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!input.sport || !input.goal || !input.level || !input.weeks) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fallback = generateFallbackPlan(input);
    return NextResponse.json({
      ok: true,
      weeks: fallback,
      planName: `${input.sport} — ${input.goal}`,
      summary: `Plano de ${input.weeks} semanas para ${input.goal} — gerado sem IA (configure ANTHROPIC_API_KEY).`,
      source: "fallback",
    });
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    }),
  });

  if (!resp.ok) {
    const fallback = generateFallbackPlan(input);
    return NextResponse.json({
      ok: true,
      weeks: fallback,
      planName: `${input.sport} — ${input.goal}`,
      summary: `Plano de ${input.weeks} semanas para ${input.goal}.`,
      source: "fallback",
    });
  }

  const data = await resp.json();
  const text = (data.content?.[0]?.text as string | undefined) ?? "";

  let parsed: { weeks: GeneratedWeek[]; planName?: string; summary?: string };
  try {
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    const fallback = generateFallbackPlan(input);
    return NextResponse.json({
      ok: true,
      weeks: fallback,
      planName: `${input.sport} — ${input.goal}`,
      summary: `Plano de ${input.weeks} semanas para ${input.goal}.`,
      source: "fallback_parse_error",
    });
  }

  if (!Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
    const fallback = generateFallbackPlan(input);
    return NextResponse.json({
      ok: true,
      weeks: fallback,
      planName: `${input.sport} — ${input.goal}`,
      summary: `Plano de ${input.weeks} semanas para ${input.goal}.`,
      source: "fallback_empty",
    });
  }

  return NextResponse.json({
    ok: true,
    weeks: parsed.weeks,
    planName: parsed.planName ?? `${input.sport} — ${input.goal}`,
    summary: parsed.summary ?? "",
    source: "ai",
  });
}
