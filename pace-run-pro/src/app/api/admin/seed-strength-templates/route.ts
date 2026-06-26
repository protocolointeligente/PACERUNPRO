import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// ─── Exercise helpers ─────────────────────────────────────────────────────────

type Level = "Iniciante" | "Intermediário" | "Avançado" | "Pro";

interface Ex {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  rpe?: number;
  notes?: string;
}

function sets(level: Level): number {
  return { Iniciante: 3, Intermediário: 3, Avançado: 4, Pro: 5 }[level];
}
function reps(level: Level, kind: "force" | "hyper" | "power" | "endur"): string {
  const map: Record<Level, Record<typeof kind, string>> = {
    Iniciante:    { force: "12-15", hyper: "15-20", power: "5-6",  endur: "20-25" },
    Intermediário:{ force: "8-10",  hyper: "10-12", power: "4-5",  endur: "15-20" },
    Avançado:     { force: "5-8",   hyper: "8-10",  power: "3-4",  endur: "12-15" },
    Pro:          { force: "3-5",   hyper: "6-8",   power: "2-3",  endur: "10-12" },
  };
  return map[level][kind];
}
function rest(level: Level, kind: "force" | "hyper" | "power" | "endur"): number {
  const map: Record<Level, Record<typeof kind, number>> = {
    Iniciante:    { force: 90,  hyper: 60,  power: 120, endur: 45  },
    Intermediário:{ force: 120, hyper: 75,  power: 150, endur: 60  },
    Avançado:     { force: 150, hyper: 90,  power: 180, endur: 75  },
    Pro:          { force: 180, hyper: 105, power: 210, endur: 90  },
  };
  return map[level][kind];
}
function rpe(level: Level): number {
  return { Iniciante: 6, Intermediário: 7, Avançado: 8, Pro: 9 }[level];
}

function ex(name: string, level: Level, kind: "force" | "hyper" | "power" | "endur", notes?: string): Ex {
  return { name, sets: sets(level), reps: reps(level, kind), restSec: rest(level, kind), rpe: rpe(level), notes };
}
function exCustom(name: string, s: number, r: string, restS: number, rpeVal?: number, notes?: string): Ex {
  return { name, sets: s, reps: r, restSec: restS, rpe: rpeVal, notes };
}

// ─── Session builders ─────────────────────────────────────────────────────────

function sessionLowerPush(level: Level) {
  return {
    label: "A — Membros Inferiores (Push)",
    exercises: [
      ex("Agachamento livre", level, "force"),
      ex("Afundo alternado", level, "force"),
      ex("Step-up unilateral", level, "hyper"),
      ex("Panturrilha em pé (unilateral)", level, "endur"),
      ex("Hip thrust barra", level, "force"),
    ] as Ex[],
  };
}

function sessionLowerPull(level: Level) {
  return {
    label: "B — Membros Inferiores (Pull)",
    exercises: [
      ex("Peso morto romeno (RDL)", level, "force"),
      ex("Mesa flexora (Leg curl)", level, "hyper"),
      ex("Afundo reverso com halteres", level, "hyper"),
      ex("Panturrilha sentado", level, "endur"),
      ex("Good morning", level, "force"),
    ] as Ex[],
  };
}

function sessionUpperPush(level: Level) {
  return {
    label: level === "Iniciante" || level === "Intermediário" ? "B — Superior (Push)" : "C — Superior (Push)",
    exercises: [
      ex("Supino com halteres", level, "force"),
      ex("Desenvolvimento com halteres", level, "force"),
      ex("Tríceps polia (corda)", level, "hyper"),
      ex("Elevação lateral", level, "hyper"),
      ex("Push-up variação", level, "endur"),
    ] as Ex[],
  };
}

function sessionUpperPull(level: Level) {
  const label = level === "Iniciante" || level === "Intermediário" ? "B — Superior (Pull)" : "D — Superior (Pull)";
  return {
    label,
    exercises: [
      ex("Puxada na polia alta", level, "force"),
      ex("Remada curvada com barra", level, "force"),
      ex("Rosca direta com halteres", level, "hyper"),
      ex("Face pull (polia)", level, "hyper"),
      ex("Encolhimento de ombros", level, "hyper"),
    ] as Ex[],
  };
}

function sessionCore(level: Level, label = "C — Core & Estabilidade") {
  const plank = { Iniciante: "30-45s", Intermediário: "45-60s", Avançado: "60-90s", Pro: "90-120s" }[level];
  return {
    label,
    exercises: [
      exCustom("Prancha frontal", 3, plank, 60, rpe(level)),
      ex("Dead bug", level, "endur"),
      ex("Russian twist com peso", level, "endur"),
      ex("Elevação de perna (solo)", level, "endur"),
      exCustom("Bird dog", 3, "10 p/ lado", 45, rpe(level)),
      ex("Hiperextensão lombar", level, "endur"),
    ] as Ex[],
  };
}

function sessionPrevention(level: Level) {
  return {
    label: "E — Prevenção e Mobilidade",
    exercises: [
      exCustom("Ativação de glúteo médio (elástico)", 3, "15 p/ lado", 30, rpe(level), "Movimento lento e controlado"),
      exCustom("Exercício de tornozelo (alfabeto)", 2, "1 série completa", 30, 5),
      exCustom("VMO — Extensão de joelho (arco curto)", 3, "15 p/ lado", 30, rpe(level)),
      exCustom("Mobilidade de quadril (90/90)", 3, "45s p/ lado", 0, 5),
      exCustom("Alongamento de isquiotibial (ativo)", 3, "30s p/ lado", 0, 5),
      exCustom("Fortalecimento de tornozelo (elástico)", 3, "20 p/ lado", 30, rpe(level)),
    ] as Ex[],
  };
}

function sessionPlyometrics(level: Level) {
  const jumpReps = { Iniciante: "6-8", Intermediário: "8-10", Avançado: "10-12", Pro: "12-15" }[level];
  return {
    label: "E — Pliometria & Potência",
    exercises: [
      exCustom("Agachamento com salto (Jump squat)", 3, jumpReps, 90, rpe(level), "Aterrissagem suave"),
      exCustom("Salto lateral (Lateral hop)", 3, jumpReps, 90, rpe(level), "Alternado"),
      exCustom("Box jump", 3, `${level === "Iniciante" ? "4-6" : level === "Intermediário" ? "6-8" : "8-10"}`, 120, rpe(level)),
      exCustom("Salto unipodal progressivo", 3, "5 p/ lado", 90, rpe(level)),
      exCustom("Sprint skipping / joelho alto", 3, "20m", 60, rpe(level)),
    ] as Ex[],
  };
}

function sessionFullBody(level: Level, label: string) {
  return {
    label,
    exercises: [
      ex("Agachamento livre", level, "force"),
      ex("Peso morto romeno (RDL)", level, "force"),
      ex("Puxada na polia alta", level, "force"),
      ex("Supino com halteres", level, "force"),
      exCustom("Prancha frontal", 3,
        { Iniciante: "30s", Intermediário: "45s", Avançado: "60s", Pro: "90s" }[level],
        45, rpe(level)),
      ex("Hip thrust barra", level, "hyper"),
      ex("Panturrilha em pé (unilateral)", level, "endur"),
    ] as Ex[],
  };
}

// ─── Template matrix: Division × Level ────────────────────────────────────────

type Template = {
  name: string;
  description: string;
  division: string;
  targetLevel: Level;
  focus: string;
  sessions: { label: string; exercises: Ex[] }[];
};

function buildTemplates(): Template[] {
  const levels: Level[] = ["Iniciante", "Intermediário", "Avançado", "Pro"];
  const templates: Template[] = [];

  // ── Full Body (4 templates) ──────────────────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Full Body para Corredores — ${level}`,
      description: `Treino de corpo inteiro adaptado para corredores de nível ${level.toLowerCase()}. Equilibra força funcional, prevenção e condicionamento.`,
      division: "FULL_BODY",
      targetLevel: level,
      focus: "forca",
      sessions: [
        sessionFullBody(level, "Sessão A — Full Body (Força)"),
        sessionFullBody(level, "Sessão B — Full Body (Volume)"),
      ],
    });
  }

  // ── AB Division (4 templates) ────────────────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Divisão AB — ${level}`,
      description: `Divisão AB clássica para corredores: Dia A foca em membros inferiores, Dia B em superior e core.`,
      division: "AB",
      targetLevel: level,
      focus: "forca",
      sessions: [
        { ...sessionLowerPush(level), label: "A — Membros Inferiores" },
        {
          label: "B — Superior + Core",
          exercises: [
            ...sessionUpperPull(level).exercises.slice(0, 3),
            ...sessionUpperPush(level).exercises.slice(0, 2),
            ...sessionCore(level).exercises.slice(0, 3),
          ],
        },
      ],
    });
  }

  // ── ABC Division (4 templates) ───────────────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Divisão ABC — ${level}`,
      description: `Divisão ABC para corredores: Inferior push / Superior / Inferior pull + Core.`,
      division: "ABC",
      targetLevel: level,
      focus: "forca",
      sessions: [
        sessionLowerPush(level),
        {
          label: "B — Superior (Push + Pull)",
          exercises: [
            ...sessionUpperPull(level).exercises.slice(0, 3),
            ...sessionUpperPush(level).exercises.slice(0, 3),
          ],
        },
        {
          label: "C — Inferior Pull + Core",
          exercises: [
            ...sessionLowerPull(level).exercises.slice(0, 3),
            ...sessionCore(level).exercises.slice(0, 3),
          ],
        },
      ],
    });
  }

  // ── ABCD Division (4 templates) ──────────────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Divisão ABCD — ${level}`,
      description: `Divisão ABCD completa: inferior push / superior push / inferior pull / superior pull + core.`,
      division: "ABCD",
      targetLevel: level,
      focus: "forca",
      sessions: [
        sessionLowerPush(level),
        sessionUpperPush(level),
        sessionLowerPull(level),
        { ...sessionUpperPull(level), label: "D — Superior Pull + Core",
          exercises: [...sessionUpperPull(level).exercises, ...sessionCore(level).exercises.slice(0, 3)] },
      ],
    });
  }

  // ── ABCDE Division (4 templates) ─────────────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Divisão ABCDE — ${level}`,
      description: `Divisão ABCDE completa para atletas avançados: 5 sessões semanais com ênfase em prevenção e potência.`,
      division: "ABCDE",
      targetLevel: level,
      focus: "forca",
      sessions: [
        sessionLowerPush(level),
        sessionUpperPush(level),
        sessionLowerPull(level),
        sessionUpperPull(level),
        level === "Avançado" || level === "Pro" ? sessionPlyometrics(level) : sessionPrevention(level),
      ],
    });
  }

  // ── Upper/Lower Division (4 templates) ───────────────────────────────────────
  for (const level of levels) {
    templates.push({
      name: `Upper/Lower para Corredores — ${level}`,
      description: `Divisão Upper/Lower com 4 sessões semanais (2 lower + 2 upper). Foco em força funcional e prevenção.`,
      division: "UPPER_LOWER",
      targetLevel: level,
      focus: "forca",
      sessions: [
        { label: "Lower A — Foco Quad/Glúteo",
          exercises: [...sessionLowerPush(level).exercises] },
        { label: "Upper A — Foco Pull",
          exercises: [...sessionUpperPull(level).exercises,
            ...sessionCore(level).exercises.slice(0, 2)] },
        { label: "Lower B — Foco Posterior/Prevenção",
          exercises: [...sessionLowerPull(level).exercises,
            ...sessionPrevention(level).exercises.slice(0, 2)] },
        { label: "Upper B — Foco Push",
          exercises: [...sessionUpperPush(level).exercises,
            ...sessionCore(level).exercises.slice(2, 4)] },
      ],
    });
  }

  // ── Personalizada Division (4 templates) ─────────────────────────────────────
  const personalizadaFocus: Record<Level, string> = {
    Iniciante: "Introdução à musculação com segurança para iniciantes",
    Intermediário: "Periodização ondulatória semanal para ganhos consistentes",
    Avançado: "Bloco de força máxima com técnica avançada",
    Pro: "Preparação específica de pré-temporada com pliometria integrada",
  };

  for (const level of levels) {
    templates.push({
      name: `Personalizada — ${level}`,
      description: personalizadaFocus[level],
      division: "PERSONALIZADA",
      targetLevel: level,
      focus: level === "Avançado" || level === "Pro" ? "potencia" : "forca",
      sessions: [
        {
          label: "Sessão 1 — Força Base",
          exercises: [
            ...sessionLowerPush(level).exercises.slice(0, 3),
            ...sessionUpperPull(level).exercises.slice(0, 2),
          ],
        },
        {
          label: "Sessão 2 — Auxiliar + Core",
          exercises: [
            ...sessionLowerPull(level).exercises.slice(0, 3),
            ...sessionCore(level).exercises.slice(0, 3),
          ],
        },
        level === "Avançado" || level === "Pro"
          ? sessionPlyometrics(level)
          : sessionPrevention(level),
      ],
    });
  }

  return templates;
}

// ─── Route handlers ────────────────────────────────────────────────────────────

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Find or create system coach
  let coach = await prisma.coach.findFirst({ orderBy: { createdAt: "asc" } });
  if (!coach) {
    await prisma.user.upsert({
      where: { email: "sistema@pacerunpro.com.br" },
      create: {
        email: "sistema@pacerunpro.com.br",
        name: "Pace Run Pro",
        role: "COACH",
        coach: {
          create: {
            credential: "Pace Run Pro",
            bio: "Templates oficiais Pace Run Pro",
            specialties: ["Corrida de rua"],
            slug: "pace-run-pro",
          },
        },
      },
      update: {},
    });
    coach = await prisma.coach.findFirst({ where: { user: { email: "sistema@pacerunpro.com.br" } } });
  }
  if (!coach) {
    return NextResponse.json({ error: "Coach não encontrado" }, { status: 500 });
  }

  const templates = buildTemplates();
  const results: { name: string; id: string }[] = [];

  for (const tpl of templates) {
    const existing = await prisma.coachStrengthTemplate.findFirst({
      where: { coachId: coach.id, name: tpl.name },
    });

    if (existing) {
      const updated = await prisma.coachStrengthTemplate.update({
        where: { id: existing.id },
        data: {
          description: tpl.description,
          division: tpl.division,
          targetLevel: tpl.targetLevel,
          focus: tpl.focus,
          sessions: tpl.sessions,
        },
      });
      results.push({ name: tpl.name, id: updated.id });
    } else {
      const created = await prisma.coachStrengthTemplate.create({
        data: {
          coachId: coach.id,
          name: tpl.name,
          description: tpl.description,
          division: tpl.division,
          targetLevel: tpl.targetLevel,
          focus: tpl.focus,
          sessions: tpl.sessions,
        },
      });
      results.push({ name: tpl.name, id: created.id });
    }
  }

  return NextResponse.json({
    ok: true,
    coachId: coach.id,
    count: results.length,
    templates: results,
    message: `${results.length} strength templates upserted`,
  });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const count = await prisma.coachStrengthTemplate.count();
  const byDivision = await prisma.coachStrengthTemplate.groupBy({
    by: ["division", "targetLevel"],
    _count: true,
    orderBy: [{ division: "asc" }, { targetLevel: "asc" }],
  });

  return NextResponse.json({ count, byDivision });
}
