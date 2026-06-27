"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Flag, Layers, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultramaratona",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

const PHASE_LABELS: Record<string, string> = {
  BASE: "Construção de Base",
  CONSTRUCAO: "Construção",
  ESPECIFICO: "Específico",
  POLIMENTO: "Polimento",
  COMPETICAO: "Competição",
  RECUPERACAO: "Recuperação",
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  BASE: "Desenvolvimento aeróbico e adaptação muscular com volumes progressivos.",
  CONSTRUCAO: "Aumento de carga e introdução de estímulos específicos da prova-alvo.",
  ESPECIFICO: "Treinos de qualidade próximos ao ritmo de prova e simulações de competição.",
  POLIMENTO: "Redução de volume com manutenção da intensidade para atingir o pico de forma.",
  COMPETICAO: "Semana de prova — manutenção leve e foco na recuperação pré-corrida.",
  RECUPERACAO: "Regeneração ativa após ciclo de alta intensidade.",
};

const PHASE_COLORS: Record<string, string> = {
  BASE: "#38bdf8",
  CONSTRUCAO: "#C6F24E",
  ESPECIFICO: "#f59e0b",
  POLIMENTO: "#10b981",
  COMPETICAO: "#ef4444",
  RECUPERACAO: "#6b7280",
};

interface PlanWeek {
  id: string;
  weekNumber: number;
  mesocycle: string | null;
  phase: string;
  startDate: string;
  endDate: string;
  targetLoad: number | null;
  targetVolumeKm: number | null;
  released: boolean;
}

interface PlanData {
  id: string;
  name: string;
  goal: string;
  raceDate: string | null;
  macrocycle: string | null;
  phase: string;
  startDate: string;
  endDate: string;
  weeks: PlanWeek[];
}

interface DerivedPhase {
  id: string;
  name: string;
  weeks: string;
  description: string;
  current: boolean;
  color: string;
}

interface DerivedMesocycle {
  id: string;
  name: string;
  weeks: string;
  focus: string;
  phase: string;
}

function derivePhases(weeks: PlanWeek[]): DerivedPhase[] {
  if (weeks.length === 0) return [];
  const groups: { phase: string; start: number; end: number; startDate: string; endDate: string }[] = [];
  let cur = weeks[0];
  let groupStart = cur;

  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i].phase !== cur.phase) {
      groups.push({ phase: cur.phase, start: groupStart.weekNumber, end: cur.weekNumber, startDate: groupStart.startDate, endDate: cur.endDate });
      groupStart = weeks[i];
    }
    cur = weeks[i];
  }
  groups.push({ phase: cur.phase, start: groupStart.weekNumber, end: cur.weekNumber, startDate: groupStart.startDate, endDate: cur.endDate });

  const today = new Date();
  return groups.map((g, i) => ({
    id: `phase-${i}`,
    name: PHASE_LABELS[g.phase] ?? g.phase,
    weeks: g.start === g.end ? `Semana ${g.start}` : `Semanas ${g.start}–${g.end}`,
    description: PHASE_DESCRIPTIONS[g.phase] ?? "",
    current: new Date(g.startDate) <= today && today <= new Date(g.endDate),
    color: PHASE_COLORS[g.phase] ?? "#C6F24E",
  }));
}

function deriveMesocycles(weeks: PlanWeek[]): DerivedMesocycle[] {
  const seen = new Map<string, { weeks: number[]; phase: string }>();
  for (const w of weeks) {
    if (!w.mesocycle) continue;
    if (!seen.has(w.mesocycle)) seen.set(w.mesocycle, { weeks: [], phase: w.phase });
    seen.get(w.mesocycle)!.weeks.push(w.weekNumber);
  }
  const result: DerivedMesocycle[] = [];
  for (const [name, data] of seen) {
    const min = Math.min(...data.weeks);
    const max = Math.max(...data.weeks);
    result.push({
      id: name,
      name,
      weeks: min === max ? `Semana ${min}` : `Semanas ${min}–${max}`,
      focus: PHASE_LABELS[data.phase] ?? data.phase,
      phase: PHASE_LABELS[data.phase] ?? data.phase,
    });
  }
  return result;
}

function computeCurrentWeek(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(daysDiff / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlansPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { plan: PlanData | null } | null) => { if (data?.plan) setPlan(data.plan); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-card-hover" />
        ))}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-5xl space-y-7">
        <div>
          <Badge variant="primary" className="mb-2">Planos &amp; periodização</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Periodização</h1>
          <p className="mt-1.5 text-sm text-text-muted">Acompanhe macrociclos, mesociclos e fases do seu plano de treino.</p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarRange className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-text">Nenhum plano de periodização ainda</p>
            <p className="mt-1 text-sm text-text-muted">Seu treinador ainda não criou um plano de periodização para você.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalWeeks = plan.weeks.length;
  const currentWeek = totalWeeks > 0 ? computeCurrentWeek(plan.startDate, totalWeeks) : 1;
  const progress = totalWeeks > 0 ? (currentWeek / totalWeeks) * 100 : 0;
  const phases = derivePhases(plan.weeks);
  const mesocycles = deriveMesocycles(plan.weeks);
  const goalLabel = GOAL_LABELS[plan.goal] ?? plan.goal;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Planos &amp; periodização</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{plan.name}</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Meta: <span className="text-text">{goalLabel}</span>
          {plan.raceDate && (
            <> · Data da prova: <span className="text-text">{formatDate(plan.raceDate)}</span></>
          )}
          {" "}· {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
        </p>
      </div>

      {/* Macrocycle progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-text">
              <CalendarRange className="h-4 w-4 text-primary" />
              {plan.macrocycle ?? "Macrociclo"} — {totalWeeks} semanas
            </span>
            <span className="font-display text-sm font-bold text-text">
              Semana {currentWeek} de {totalWeeks}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="mt-2 text-xs text-text-muted">{Math.round(progress)}% do ciclo concluído</p>
        </CardContent>
      </Card>

      {/* Periodization phases */}
      {phases.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-text">Linha do tempo das fases</h2>
          <div className="relative space-y-4 pl-8">
            <div className="absolute bottom-2 left-[18px] top-2 w-0.5 bg-border" />
            {phases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="relative"
              >
                <span
                  className="absolute -left-8 top-4 flex h-9 w-9 items-center justify-center rounded-full border-4"
                  style={{ borderColor: phase.current ? phase.color : "var(--color-border)", backgroundColor: phase.current ? `${phase.color}33` : "var(--color-card)" }}
                >
                  {phase.current ? (
                    <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full" style={{ backgroundColor: phase.color }} />
                  ) : (
                    <Layers className="h-4 w-4 text-text-muted" />
                  )}
                </span>
                <Card className={phase.current ? "border-primary/40" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-text">{phase.name}</h3>
                        <Badge style={{ borderColor: `${phase.color}55`, color: phase.color, backgroundColor: `${phase.color}1a` }} className="border">
                          {phase.weeks}
                        </Badge>
                      </div>
                      {phase.current && <Badge variant="primary">Fase atual</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm text-text-muted">{phase.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Mesocycles */}
      {mesocycles.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text">
            <Target className="h-4 w-4 text-primary" />
            Mesociclos do plano
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mesocycles.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2">{m.weeks}</Badge>
                  <p className="font-display text-sm font-bold text-text">{m.name}</p>
                  <p className="mt-1 text-xs text-text-muted">Foco: {m.focus}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
                    <Flag className="h-3 w-3" /> Fase: {m.phase}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="border-info/30 bg-info/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-text">Como funciona a periodização</h3>
            <p className="mt-1 text-sm text-text-muted">
              Seu plano é dividido em <span className="text-text">macrociclo</span> (objetivo de longo prazo),{" "}
              <span className="text-text">mesociclos</span> (blocos de 3-5 semanas com foco específico) e{" "}
              <span className="text-text">microciclos semanais</span> — sempre alternando estímulo e recuperação para
              maximizar sua evolução com segurança.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
