"use client";

import { useState } from "react";
import {
  Dumbbell,
  RefreshCw,
  Info,
  BarChart3,
  Zap,
  ChevronDown,
  TrendingUp,
  Shield,
  Flame,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type Objective =
  | "hipertrofia"
  | "forca_maxima"
  | "emagrecimento"
  | "definicao"
  | "perf_corrida"
  | "perf_ciclismo"
  | "saude"
  | "reabilitacao";

type Level = "Iniciante" | "Intermediário" | "Avançado" | "PRO";

type MesocycleType =
  | "Anatomical Adaptation"
  | "Hypertrophy"
  | "Basic Strength"
  | "Maximum Strength"
  | "Power"
  | "Deload"
  | "Maintenance"
  | "Metabolic"
  | "Active Recovery";

interface MuscleVolume {
  muscle: string;
  sets: number;
  mev: number;
  mrv: number;
}

interface Mesocycle {
  week: number;
  weeks: number;
  type: MesocycleType;
  intensityPct: number;
  repsRange: string;
  rpe: string;
  isDeload: boolean;
  rir: number;
  restMin: number;
  frequency: number;
  muscleVolumes: MuscleVolume[];
  focus: string;
  keyPrinciple: string;
}

interface GeneratedPlan {
  objective: Objective;
  level: Level;
  daysPerWeek: number;
  totalWeeks: number;
  mesocycles: Mesocycle[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OBJECTIVES: { id: Objective; label: string; emoji: string; desc: string }[] = [
  { id: "hipertrofia",   label: "Hipertrofia",     emoji: "💪", desc: "Ganho muscular máximo"         },
  { id: "forca_maxima",  label: "Força Máxima",     emoji: "🏋️", desc: "1RM e força bruta"             },
  { id: "emagrecimento", label: "Emagrecimento",    emoji: "🔥", desc: "Perda de gordura + músculo"    },
  { id: "definicao",     label: "Definição",        emoji: "✂️", desc: "Cutting sem perder força"      },
  { id: "perf_corrida",  label: "Perf. Corrida",    emoji: "🏃", desc: "Força para corredores"         },
  { id: "perf_ciclismo", label: "Perf. Ciclismo",   emoji: "🚴", desc: "Potência e resistência"        },
  { id: "saude",         label: "Saúde Geral",      emoji: "❤️", desc: "Bem-estar e longevidade"       },
  { id: "reabilitacao",  label: "Reabilitação",     emoji: "🩺", desc: "Recuperação e prevenção"       },
];

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "Iniciante",     label: "Iniciante",     desc: "< 1 ano" },
  { id: "Intermediário", label: "Intermediário", desc: "1–3 anos" },
  { id: "Avançado",      label: "Avançado",      desc: "3–5 anos" },
  { id: "PRO",           label: "PRO / Elite",   desc: "> 5 anos" },
];

const DAYS_OPTIONS = [2, 3, 4, 5] as const;
const DURATION_OPTIONS = [8, 10, 12, 16, 20, 24] as const;

const MESO_COLORS: Record<MesocycleType, string> = {
  "Anatomical Adaptation": "#94a3b8",
  "Hypertrophy":           "#6366f1",
  "Basic Strength":        "#38bdf8",
  "Maximum Strength":      "#f59e0b",
  "Power":                 "#ef4444",
  "Deload":                "#22c55e",
  "Maintenance":           "#8b5cf6",
  "Metabolic":             "#f97316",
  "Active Recovery":       "#10b981",
};

// ── MEV/MRV reference data (Schoenfeld) ──────────────────────────────────────

const MUSCLE_VOLUMES: Record<Level, MuscleVolume[]> = {
  Iniciante: [
    { muscle: "Peitoral",      sets: 10, mev: 8,  mrv: 16 },
    { muscle: "Costas",        sets: 10, mev: 10, mrv: 20 },
    { muscle: "Ombros",        sets: 8,  mev: 6,  mrv: 16 },
    { muscle: "Bíceps",        sets: 6,  mev: 6,  mrv: 14 },
    { muscle: "Tríceps",       sets: 6,  mev: 6,  mrv: 14 },
    { muscle: "Quadríceps",    sets: 10, mev: 8,  mrv: 20 },
    { muscle: "Isquiotibiais", sets: 8,  mev: 6,  mrv: 16 },
    { muscle: "Glúteos",       sets: 8,  mev: 4,  mrv: 16 },
    { muscle: "Panturrilha",   sets: 6,  mev: 6,  mrv: 16 },
    { muscle: "Core",          sets: 8,  mev: 4,  mrv: 16 },
  ],
  Intermediário: [
    { muscle: "Peitoral",      sets: 14, mev: 10, mrv: 20 },
    { muscle: "Costas",        sets: 15, mev: 12, mrv: 25 },
    { muscle: "Ombros",        sets: 12, mev: 8,  mrv: 22 },
    { muscle: "Bíceps",        sets: 10, mev: 8,  mrv: 20 },
    { muscle: "Tríceps",       sets: 10, mev: 6,  mrv: 18 },
    { muscle: "Quadríceps",    sets: 14, mev: 10, mrv: 22 },
    { muscle: "Isquiotibiais", sets: 12, mev: 8,  mrv: 20 },
    { muscle: "Glúteos",       sets: 12, mev: 6,  mrv: 20 },
    { muscle: "Panturrilha",   sets: 10, mev: 8,  mrv: 20 },
    { muscle: "Core",          sets: 10, mev: 6,  mrv: 20 },
  ],
  Avançado: [
    { muscle: "Peitoral",      sets: 18, mev: 12, mrv: 22 },
    { muscle: "Costas",        sets: 20, mev: 14, mrv: 28 },
    { muscle: "Ombros",        sets: 16, mev: 10, mrv: 26 },
    { muscle: "Bíceps",        sets: 14, mev: 10, mrv: 22 },
    { muscle: "Tríceps",       sets: 14, mev: 8,  mrv: 20 },
    { muscle: "Quadríceps",    sets: 18, mev: 12, mrv: 26 },
    { muscle: "Isquiotibiais", sets: 16, mev: 10, mrv: 22 },
    { muscle: "Glúteos",       sets: 16, mev: 8,  mrv: 24 },
    { muscle: "Panturrilha",   sets: 14, mev: 10, mrv: 22 },
    { muscle: "Core",          sets: 12, mev: 8,  mrv: 22 },
  ],
  PRO: [
    { muscle: "Peitoral",      sets: 22, mev: 14, mrv: 26 },
    { muscle: "Costas",        sets: 25, mev: 16, mrv: 32 },
    { muscle: "Ombros",        sets: 20, mev: 12, mrv: 30 },
    { muscle: "Bíceps",        sets: 18, mev: 12, mrv: 26 },
    { muscle: "Tríceps",       sets: 18, mev: 10, mrv: 24 },
    { muscle: "Quadríceps",    sets: 22, mev: 14, mrv: 30 },
    { muscle: "Isquiotibiais", sets: 20, mev: 12, mrv: 26 },
    { muscle: "Glúteos",       sets: 20, mev: 10, mrv: 28 },
    { muscle: "Panturrilha",   sets: 18, mev: 12, mrv: 26 },
    { muscle: "Core",          sets: 16, mev: 10, mrv: 26 },
  ],
};

// ── Plan generation ───────────────────────────────────────────────────────────

function getMesoParams(type: MesocycleType): {
  intensityPct: number; repsRange: string; rpe: string; rir: number;
  restMin: number; frequency: number; focus: string; keyPrinciple: string;
} {
  switch (type) {
    case "Anatomical Adaptation":
      return { intensityPct: 50, repsRange: "15–20", rpe: "5–6", rir: 4, restMin: 1, frequency: 2,
        focus: "Adaptação articular e neuromotora",
        keyPrinciple: "Preparar tendões e articulações para cargas progressivas" };
    case "Hypertrophy":
      return { intensityPct: 67, repsRange: "6–12", rpe: "7–8", rir: 2, restMin: 2, frequency: 2,
        focus: "Maximizar hipertrofia sarcoplasmática e miofibrilar",
        keyPrinciple: "Schoenfeld: 6–12 reps a 67–85% 1RM com RIR 1–3 é o sweet spot" };
    case "Basic Strength":
      return { intensityPct: 78, repsRange: "4–6", rpe: "7–8", rir: 2, restMin: 3, frequency: 2,
        focus: "Adaptar sistema nervoso ao levantamento pesado",
        keyPrinciple: "Volume moderado, intensidade alta, técnica perfeita" };
    case "Maximum Strength":
      return { intensityPct: 88, repsRange: "1–3", rpe: "8–9", rir: 1, restMin: 4, frequency: 2,
        focus: "Expressão máxima de força neuromuscular",
        keyPrinciple: "Alta intensidade, baixo volume, longa recuperação inter-séries" };
    case "Power":
      return { intensityPct: 60, repsRange: "3–5", rpe: "6–7", rir: 3, restMin: 3, frequency: 2,
        focus: "Taxa de desenvolvimento de força (RFD)",
        keyPrinciple: "Velocidade de execução intencional — potência máxima" };
    case "Metabolic":
      return { intensityPct: 55, repsRange: "12–20", rpe: "7–8", rir: 2, restMin: 1, frequency: 3,
        focus: "EPOC e déficit calórico com preservação muscular",
        keyPrinciple: "Circuitos metabólicos + densidade de volume alta" };
    case "Deload":
      return { intensityPct: 40, repsRange: "10–15", rpe: "4–5", rir: 5, restMin: 2, frequency: 2,
        focus: "Recuperação e supercompensação",
        keyPrinciple: "Reduzir 30–40% volume, manter intensidade relativa" };
    case "Maintenance":
      return { intensityPct: 70, repsRange: "8–12", rpe: "6–7", rir: 3, restMin: 2, frequency: 2,
        focus: "Manutenção do ganho muscular",
        keyPrinciple: "MEV (volume mínimo efetivo) é suficiente para manter" };
    case "Active Recovery":
      return { intensityPct: 30, repsRange: "15–20", rpe: "3–4", rir: 6, restMin: 1, frequency: 2,
        focus: "Recuperação ativa e mobilidade",
        keyPrinciple: "Movimento suave, fluxo sanguíneo, sem falha muscular" };
  }
}

function buildPhases(
  objective: Objective,
  totalWeeks: number
): { type: MesocycleType; weeks: number }[] {
  const isStrength = objective === "forca_maxima";
  const isHypertrophy = objective === "hipertrofia";
  const isFat = objective === "emagrecimento" || objective === "definicao";
  const isPerf = objective === "perf_corrida" || objective === "perf_ciclismo";

  if (totalWeeks <= 8) {
    if (isStrength) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Basic Strength", weeks: 3 },
      { type: "Maximum Strength", weeks: 2 },
      { type: "Deload", weeks: 1 },
    ];
    return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Deload", weeks: 2 },
    ];
  }

  if (totalWeeks <= 12) {
    if (isStrength) return [
      { type: "Anatomical Adaptation", weeks: 3 },
      { type: "Hypertrophy", weeks: 2 },
      { type: "Basic Strength", weeks: 4 },
      { type: "Maximum Strength", weeks: 2 },
      { type: "Deload", weeks: 1 },
    ];
    if (isHypertrophy) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Deload", weeks: 1 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Deload", weeks: 1 },
    ];
    if (isFat) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Metabolic", weeks: 4 },
      { type: "Deload", weeks: 1 },
      { type: "Metabolic", weeks: 4 },
      { type: "Deload", weeks: 1 },
    ];
    if (isPerf) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Basic Strength", weeks: 4 },
      { type: "Power", weeks: 4 },
      { type: "Deload", weeks: 2 },
    ];
    return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Maintenance", weeks: 4 },
      { type: "Deload", weeks: 2 },
    ];
  }

  if (totalWeeks <= 16) {
    if (isStrength) return [
      { type: "Anatomical Adaptation", weeks: 3 },
      { type: "Hypertrophy", weeks: 3 },
      { type: "Basic Strength", weeks: 4 },
      { type: "Maximum Strength", weeks: 3 },
      { type: "Power", weeks: 2 },
      { type: "Deload", weeks: 1 },
    ];
    if (isHypertrophy) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Deload", weeks: 1 },
      { type: "Hypertrophy", weeks: 5 },
      { type: "Deload", weeks: 1 },
      { type: "Hypertrophy", weeks: 3 },
    ];
    if (isFat) return [
      { type: "Anatomical Adaptation", weeks: 2 },
      { type: "Metabolic", weeks: 5 },
      { type: "Deload", weeks: 1 },
      { type: "Metabolic", weeks: 5 },
      { type: "Active Recovery", weeks: 1 },
      { type: "Metabolic", weeks: 2 },
    ];
    return [
      { type: "Anatomical Adaptation", weeks: 3 },
      { type: "Hypertrophy", weeks: 4 },
      { type: "Deload", weeks: 1 },
      { type: "Basic Strength", weeks: 4 },
      { type: "Deload", weeks: 1 },
      { type: "Maintenance", weeks: 3 },
    ];
  }

  // 20-24 weeks
  if (isStrength) return [
    { type: "Anatomical Adaptation", weeks: 4 },
    { type: "Hypertrophy", weeks: 4 },
    { type: "Deload", weeks: 1 },
    { type: "Basic Strength", weeks: 5 },
    { type: "Maximum Strength", weeks: 4 },
    { type: "Deload", weeks: 1 },
    { type: "Power", weeks: 4 },
    { type: "Deload", weeks: 1 },
  ];
  if (isHypertrophy) return [
    { type: "Anatomical Adaptation", weeks: 3 },
    { type: "Hypertrophy", weeks: 5 },
    { type: "Deload", weeks: 1 },
    { type: "Hypertrophy", weeks: 6 },
    { type: "Deload", weeks: 1 },
    { type: "Hypertrophy", weeks: 6 },
    { type: "Deload", weeks: 2 },
  ];
  return [
    { type: "Anatomical Adaptation", weeks: 4 },
    { type: "Hypertrophy", weeks: 5 },
    { type: "Deload", weeks: 1 },
    { type: "Basic Strength", weeks: 5 },
    { type: "Deload", weeks: 1 },
    { type: "Maximum Strength", weeks: 4 },
    { type: "Maintenance", weeks: 4 },
  ];
}

function generateMesocycles(
  objective: Objective,
  level: Level,
  totalWeeks: number,
): Mesocycle[] {
  const baseVolumes = MUSCLE_VOLUMES[level];
  const phases = buildPhases(objective, totalWeeks);
  const mesocycles: Mesocycle[] = [];
  let weekStart = 1;

  phases.forEach((phase) => {
    const params = getMesoParams(phase.type);
    const muscleVolumes = baseVolumes.map((mv) => {
      let sets = mv.sets;
      if (phase.type === "Deload" || phase.type === "Active Recovery") {
        sets = mv.mev;
      } else if (phase.type === "Maximum Strength" || phase.type === "Basic Strength") {
        sets = Math.round(mv.sets * 0.75);
      } else if (phase.type === "Hypertrophy" || phase.type === "Metabolic") {
        sets = Math.min(mv.mrv, Math.round(mv.sets * 1.1));
      }
      return { ...mv, sets };
    });

    mesocycles.push({
      week: weekStart,
      weeks: phase.weeks,
      type: phase.type,
      isDeload: phase.type === "Deload" || phase.type === "Active Recovery",
      muscleVolumes,
      ...params,
    });
    weekStart += phase.weeks;
  });

  return mesocycles;
}

// ── Charts ─────────────────────────────────────────────────────────────────────

function VolumeBarChart({ mesocycles }: { mesocycles: Mesocycle[] }) {
  const totals = mesocycles.map((m) => m.muscleVolumes.reduce((s, mv) => s + mv.sets, 0));
  const maxSets = Math.max(...totals, 1);
  const svgH = 140;
  const n = mesocycles.length;
  const barW = Math.min(44, 560 / n - 4);
  const padX = (580 - n * (barW + 4)) / 2;

  return (
    <svg viewBox={`0 0 580 ${svgH}`} className="w-full" style={{ minHeight: 140 }}>
      {mesocycles.map((m, i) => {
        const barH = Math.max(4, ((totals[i] / maxSets) * (svgH - 36)));
        const x = padX + i * (barW + 4);
        const y = svgH - 20 - barH;
        const color = MESO_COLORS[m.type];
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4}
              fill={color} opacity={m.isDeload ? 0.5 : 1} />
            <text x={x + barW / 2} y={svgH - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
              S{m.week}
            </text>
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fill={color}>
              {totals[i]}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={svgH - 20} x2={580} y2={svgH - 20} stroke="#374151" strokeWidth={1} />
    </svg>
  );
}

function IntensityWaveChart({ mesocycles }: { mesocycles: Mesocycle[] }) {
  const svgH = 100;
  const svgW = 580;
  const padX = 20;
  const pts = mesocycles.map((m, i) => ({
    x: padX + (i / Math.max(mesocycles.length - 1, 1)) * (svgW - padX * 2),
    y: svgH - 20 - (m.intensityPct / 100) * (svgH - 30),
    m,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 100 }}>
      <path d={pathD} fill="none" stroke="#C6F24E" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={MESO_COLORS[p.m.type]} />
          <text x={p.x} y={svgH - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
            {p.m.intensityPct}%
          </text>
        </g>
      ))}
      <line x1={0} y1={svgH - 16} x2={svgW} y2={svgH - 16} stroke="#374151" strokeWidth={1} />
    </svg>
  );
}

// ── MEV/MRV progress bar ──────────────────────────────────────────────────────

function MuscleVolumeBar({ mv }: { mv: MuscleVolume }) {
  const pct = Math.min(100, (mv.sets / mv.mrv) * 100);
  const inZone = mv.sets >= mv.mev && mv.sets <= mv.mrv;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-text-muted shrink-0 text-xs">{mv.muscle}</span>
      <div className="flex-1 relative h-3.5 bg-card-hover rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60 z-10"
          style={{ left: `${(mv.mev / mv.mrv) * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: inZone ? "#6366f1" : pct > 100 ? "#ef4444" : "#94a3b8" }}
        />
      </div>
      <span className={cn("w-8 text-right text-xs font-mono shrink-0", inZone ? "text-primary" : "text-text-muted")}>
        {mv.sets}
      </span>
      <span className="text-xs text-text-muted shrink-0">/ {mv.mrv}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForcaPeriodizacaoPage() {
  const [objective, setObjective] = useState<Objective>("hipertrofia");
  const [level, setLevel] = useState<Level>("Intermediário");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [totalWeeks, setTotalWeeks] = useState(12);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [expandedMeso, setExpandedMeso] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"macro" | "volume" | "intensidade">("macro");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const mesocycles = generateMesocycles(objective, level, totalWeeks);
      setPlan({ objective, level, daysPerWeek, totalWeeks, mesocycles });
      setExpandedMeso(0);
      setGenerating(false);
    }, 400);
  };

  const objInfo = OBJECTIVES.find((o) => o.id === objective)!;
  const levelInfo = LEVELS.find((l) => l.id === level)!;
  const deloads = plan?.mesocycles.filter((m) => m.isDeload).length ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-4 w-4 text-primary" />
              Periodização de Força
            </CardTitle>
            <p className="text-xs text-text-muted">Modelo Brad Schoenfeld · MEV/MRV</p>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Objective */}
            <div>
              <label className="text-xs text-text-muted font-medium mb-2 block">Objetivo</label>
              <div className="grid grid-cols-2 gap-1.5">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-left text-xs transition-all border",
                      objective === obj.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-text-muted hover:border-primary/40 hover:text-text"
                    )}
                  >
                    <span className="mr-1">{obj.emoji}</span>
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="text-xs text-text-muted font-medium mb-2 block">Nível</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.id}
                    onClick={() => setLevel(lv.id)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs transition-all border flex flex-col",
                      level === lv.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-text-muted hover:border-primary/40 hover:text-text"
                    )}
                  >
                    <span className="font-medium">{lv.label}</span>
                    <span className="text-[10px] opacity-70">{lv.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs text-text-muted font-medium mb-2 block">
                Duração — <span className="text-primary">{totalWeeks} semanas</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {DURATION_OPTIONS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setTotalWeeks(w)}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-mono border transition-all",
                      totalWeeks === w
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-text-muted hover:border-primary/40"
                    )}
                  >
                    {w}s
                  </button>
                ))}
              </div>
            </div>

            {/* Days per week */}
            <div>
              <label className="text-xs text-text-muted font-medium mb-2 block">Dias / semana</label>
              <div className="flex gap-1">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-mono border transition-all",
                      daysPerWeek === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-text-muted hover:border-primary/40"
                    )}
                  >
                    {d}×
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={generating}
              className="w-full gradient-primary text-background font-semibold text-sm"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Dumbbell className="h-4 w-4 mr-2" />
              )}
              {generating ? "Gerando..." : "Gerar Periodização"}
            </Button>
          </CardContent>
        </Card>

        {/* Schoenfeld principles */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs mb-2">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium text-text">Princípios Schoenfeld</span>
            </div>
            {[
              { icon: <Zap className="h-3 w-3" />,       text: "Freq ≥ 2×/sem por grupo muscular" },
              { icon: <BarChart3 className="h-3 w-3" />,  text: "67–85% 1RM = hipertrofia máxima" },
              { icon: <Activity className="h-3 w-3" />,   text: "RIR 1–3 para estímulo ótimo" },
              { icon: <TrendingUp className="h-3 w-3" />, text: "Sobrecarga progressiva semanal" },
              { icon: <Shield className="h-3 w-3" />,     text: "Deload a cada 4–6 semanas" },
              { icon: <Flame className="h-3 w-3" />,      text: "Volume ∈ [MEV, MRV] por músculo" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                <span className="text-primary">{p.icon}</span>
                {p.text}
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 space-y-4">
        {!plan ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Dumbbell className="h-14 w-14 text-text-muted/40 mb-4" />
            <p className="text-text-muted text-sm">Configure o objetivo e o nível à esquerda</p>
            <p className="text-text-muted/60 text-xs mt-1">e clique em Gerar Periodização</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-display font-bold text-text">
                  {objInfo.emoji} Força — {objInfo.label} · {plan.totalWeeks} semanas
                </h1>
                <p className="text-sm text-text-muted mt-0.5">
                  {levelInfo.label} · {plan.daysPerWeek}×/sem · {plan.mesocycles.length} mesociclos · {deloads} deloads
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">Schoenfeld Model</Badge>
                <Badge variant="outline" className="text-xs text-primary border-primary/30">MEV / MRV</Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-card rounded-xl w-fit border border-border">
              {(["macro", "volume", "intensidade"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 text-xs rounded-lg transition-all font-medium",
                    activeTab === tab ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"
                  )}
                >
                  {tab === "macro" ? "Macrociclo" : tab === "volume" ? "Volume" : "Intensidade"}
                </button>
              ))}
            </div>

            {/* ── Macro tab ── */}
            {activeTab === "macro" && (
              <div className="space-y-3">
                {/* Timeline strip */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-0.5 rounded-lg overflow-hidden">
                      {plan.mesocycles.map((m, i) => (
                        <div
                          key={i}
                          className="relative flex items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-all hover:brightness-125"
                          style={{
                            flex: m.weeks,
                            minWidth: 20,
                            backgroundColor: `${MESO_COLORS[m.type]}${m.isDeload ? "66" : "cc"}`,
                            height: 32,
                          }}
                          onClick={() => setExpandedMeso(expandedMeso === i ? null : i)}
                          title={m.type}
                        >
                          {m.weeks > 1 ? `S${m.week}` : ""}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {Array.from(new Set(plan.mesocycles.map((m) => m.type))).map((type) => (
                        <div key={type} className="flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: MESO_COLORS[type] }} />
                          {type}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mesocycle cards */}
                {plan.mesocycles.map((m, i) => {
                  const isExpanded = expandedMeso === i;
                  const color = MESO_COLORS[m.type];
                  const totalSets = m.muscleVolumes.reduce((s, mv) => s + mv.sets, 0);
                  return (
                    <Card key={i} className={cn("transition-all", isExpanded && "ring-1 ring-primary/30")}>
                      <button className="w-full text-left" onClick={() => setExpandedMeso(isExpanded ? null : i)}>
                        <div className="flex items-center gap-3 p-4">
                          <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-text">{m.type}</span>
                              {m.isDeload && (
                                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">Deload</Badge>
                              )}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5 flex flex-wrap gap-3">
                              <span>Sem {m.week}–{m.week + m.weeks - 1}</span>
                              <span>{m.repsRange} reps</span>
                              <span>{m.intensityPct}% 1RM</span>
                              <span>RIR {m.rir}</span>
                              <span>{totalSets} séries/sem</span>
                            </div>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform shrink-0", isExpanded && "rotate-180")} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-card-hover rounded-lg p-3">
                              <p className="text-xs text-text-muted mb-1">Foco</p>
                              <p className="text-sm text-text">{m.focus}</p>
                            </div>
                            <div className="bg-card-hover rounded-lg p-3">
                              <p className="text-xs text-text-muted mb-1">Princípio Schoenfeld</p>
                              <p className="text-sm text-text">{m.keyPrinciple}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: "Intensidade", value: `${m.intensityPct}% 1RM` },
                              { label: "Repetições",  value: m.repsRange },
                              { label: "RPE",         value: m.rpe },
                              { label: "Descanso",    value: `${m.restMin}min` },
                            ].map((kv) => (
                              <div key={kv.label} className="bg-card-hover rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-text-muted">{kv.label}</p>
                                <p className="text-sm font-bold text-text mt-0.5">{kv.value}</p>
                              </div>
                            ))}
                          </div>

                          <div>
                            <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
                              <span className="h-1.5 w-3 rounded-sm bg-amber-400/60 inline-block" />
                              Barra amarela = MEV · Azul = volume alvo · Limite = MRV
                            </p>
                            <div className="space-y-2">
                              {m.muscleVolumes.map((mv) => (
                                <MuscleVolumeBar key={mv.muscle} mv={mv} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ── Volume tab ── */}
            {activeTab === "volume" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Volume total semanal por mesociclo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VolumeBarChart mesocycles={plan.mesocycles} />
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Array.from(new Set(plan.mesocycles.map((m) => m.type))).map((type) => (
                      <div key={type} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: MESO_COLORS[type] }} />
                        {type}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Intensidade tab ── */}
            {activeTab === "intensidade" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Ondulação de intensidade (% 1RM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <IntensityWaveChart mesocycles={plan.mesocycles} />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Pico",        value: `${Math.max(...plan.mesocycles.map((m) => m.intensityPct))}%` },
                      { label: "Média",        value: `${Math.round(plan.mesocycles.reduce((s, m) => s + m.intensityPct, 0) / plan.mesocycles.length)}%` },
                      { label: "Deloads",     value: deloads },
                      { label: "Mesociclos",  value: plan.mesocycles.length },
                    ].map((kv) => (
                      <div key={kv.label} className="bg-card-hover rounded-lg p-3 text-center">
                        <p className="text-xs text-text-muted">{kv.label}</p>
                        <p className="text-lg font-bold text-primary">{kv.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
