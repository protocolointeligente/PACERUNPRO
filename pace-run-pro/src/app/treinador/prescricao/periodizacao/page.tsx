"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Save,
  FileDown,
  TrendingDown,
  ChevronDown,
  Info,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { athleteList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = "Base" | "Construção" | "Específico" | "Taper";

interface Week {
  week: number;
  phase: Phase;
  mesocycle: number;
  isDeload: boolean;
  volume: number;
  intensity: number;
  notes: string;
  km: number;
  sessions: number;
}

type Goal = "5k" | "10k" | "Meia-maratona" | "Maratona" | "Trail" | "Personalizado";
type Level = "Iniciante" | "Intermediário" | "Avançado";

// ── Auto-generation logic ────────────────────────────────────────────────────

function generatePeriodization(totalWeeks: number): Week[] {
  const baseEnd = Math.round(totalWeeks * 0.35);
  const construcaoEnd = baseEnd + Math.round(totalWeeks * 0.3);
  const especificoEnd = construcaoEnd + Math.round(totalWeeks * 0.25);

  return Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    const isDeload = week % 4 === 0;

    let phase: Phase;
    if (week <= baseEnd) phase = "Base";
    else if (week <= construcaoEnd) phase = "Construção";
    else if (week <= especificoEnd) phase = "Específico";
    else phase = "Taper";

    const baseVolume = isDeload ? 60 : 70 + Math.min(week * 1.5, 25);
    const volume = Math.round(Math.min(baseVolume, 100));
    const intensity = isDeload ? 50 : Math.round(40 + week * 2.5);

    return {
      week,
      phase,
      mesocycle: Math.ceil(week / 4),
      isDeload,
      volume,
      intensity: Math.min(intensity, 95),
      notes: "",
      km: Math.round(20 + week * 1.8),
      sessions: isDeload ? 3 : 4,
    };
  });
}

// ── Constants ────────────────────────────────────────────────────────────────

const PHASE_BADGE: Record<Phase, "info" | "primary" | "warning" | "success"> = {
  Base: "info",
  Construção: "primary",
  Específico: "warning",
  Taper: "success",
};

const PHASE_BG: Record<Phase, string> = {
  Base: "bg-info/5 border-info/20",
  Construção: "bg-primary/5 border-primary/20",
  Específico: "bg-warning/5 border-warning/20",
  Taper: "bg-success/5 border-success/20",
};

const PHASE_BAR: Record<Phase, string> = {
  Base: "bg-info",
  Construção: "bg-primary",
  Específico: "bg-warning",
  Taper: "bg-success",
};

const goals: Goal[] = ["5k", "10k", "Meia-maratona", "Maratona", "Trail", "Personalizado"];
const levels: Level[] = ["Iniciante", "Intermediário", "Avançado"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer";

// ── Component ────────────────────────────────────────────────────────────────

export default function PeriodizacaoPage() {
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [goal, setGoal] = useState<Goal>("Meia-maratona");
  const [level, setLevel] = useState<Level>("Intermediário");
  const [totalWeeks, setTotalWeeks] = useState(16);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleGenerate() {
    const result = generatePeriodization(totalWeeks);
    setWeeks(result);
    setGenerated(true);
    setSaved(false);
  }

  function handleWeekChange(weekNum: number, field: keyof Week, value: string | number) {
    setWeeks((prev) =>
      prev.map((w) => (w.week === weekNum ? { ...w, [field]: value } : w))
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const phaseCounts = weeks.reduce(
    (acc, w) => {
      acc[w.phase] = (acc[w.phase] ?? 0) + 1;
      return acc;
    },
    {} as Record<Phase, number>
  );

  const peakVolumeWeek = weeks.reduce(
    (best, w) => (w.volume > (best?.volume ?? 0) ? w : best),
    null as Week | null
  );

  const taperWeeks = weeks.filter((w) => w.phase === "Taper").length;
  const deloadWeeks = weeks.filter((w) => w.isDeload).length;

  // Group weeks by mesocycle for visual separation
  const mesocycles = weeks.reduce((acc, w) => {
    const key = w.mesocycle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {} as Record<number, Week[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <Link
            href="/treinador/prescricao/corrida"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-border">·</span>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold text-white">
              Planejamento Periodização
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left panel: Generator ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Gerador automático
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Athlete */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Atleta</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={selectedAthlete}
                      onChange={(e) => setSelectedAthlete(e.target.value)}
                    >
                      <option value="">Selecionar atleta…</option>
                      {athleteList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Objetivo</label>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as Goal)}
                    >
                      {goals.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Nível</label>
                  <div className="flex gap-2">
                    {levels.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                          level === l
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-background text-text-muted hover:border-primary/30 hover:text-white"
                        )}
                      >
                        {l === "Intermediário" ? "Inter." : l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total weeks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">
                      Semanas totais
                    </label>
                    <span className="text-sm font-semibold text-white">{totalWeeks}</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={52}
                    value={totalWeeks}
                    onChange={(e) => setTotalWeeks(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>4 sem</span>
                    <span>52 sem</span>
                  </div>
                  <input
                    type="number"
                    min={4}
                    max={52}
                    value={totalWeeks}
                    onChange={(e) =>
                      setTotalWeeks(Math.min(52, Math.max(4, Number(e.target.value))))
                    }
                    className={cn(inputClass, "text-center")}
                  />
                </div>

                {/* Generate button */}
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={handleGenerate}
                >
                  <Wand2 className="h-4 w-4" />
                  Gerar periodização
                </Button>
              </CardContent>
            </Card>

            {/* Phase legend */}
            <Card>
              <CardContent className="py-4 space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
                  Fases
                </p>
                {(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <Badge variant={PHASE_BADGE[p]} className="w-24 justify-center text-[11px]">
                      {p}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {p === "Base" && "Aeróbico e adaptação"}
                      {p === "Construção" && "Volume e limiar"}
                      {p === "Específico" && "Intensidade e prova"}
                      {p === "Taper" && "Redução e descanso"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* ── Main area ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {!generated ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center"
              >
                <CalendarDays className="h-12 w-12 text-primary/30 mb-4" />
                <p className="font-display text-lg font-semibold text-white">
                  Nenhuma periodização gerada
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Configure os parâmetros e clique em{" "}
                  <span className="text-primary">Gerar periodização</span>
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${totalWeeks}-${goal}-${level}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Title row */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">
                        Macrociclo — {totalWeeks} semanas
                      </h2>
                      <p className="text-sm text-text-muted mt-0.5">
                        {goal} · {level}
                        {selectedAthlete
                          ? ` · ${athleteList.find((a) => a.id === selectedAthlete)?.name ?? ""}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert("Exportar PDF — em breve")}
                      >
                        <FileDown className="h-4 w-4" />
                        Exportar PDF
                      </Button>
                      <Button
                        variant={saved ? "success" : "primary"}
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="h-4 w-4" />
                        {saved ? "Salvo!" : "Salvar periodização"}
                      </Button>
                    </div>
                  </div>

                  {/* Mesocycle blocks */}
                  {Object.entries(mesocycles).map(([meso, mesoWeeks]) => {
                    const dominantPhase = mesoWeeks.reduce(
                      (acc, w) => {
                        acc[w.phase] = (acc[w.phase] ?? 0) + 1;
                        return acc;
                      },
                      {} as Record<Phase, number>
                    );
                    const topPhase = (
                      Object.entries(dominantPhase) as [Phase, number][]
                    ).sort((a, b) => b[1] - a[1])[0][0];

                    return (
                      <div key={meso} className="space-y-1">
                        {/* Mesocycle header */}
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                            Mesociclo {meso}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                          <Badge variant={PHASE_BADGE[topPhase]} className="text-[10px]">
                            {topPhase}
                          </Badge>
                        </div>

                        {/* Week rows */}
                        <div
                          className={cn(
                            "rounded-2xl border overflow-hidden",
                            PHASE_BG[topPhase]
                          )}
                        >
                          {/* Table header */}
                          <div className="grid grid-cols-[3rem_7rem_5rem_6rem_6rem_4rem_4rem_1fr] gap-x-2 border-b border-border/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                            <span>Sem.</span>
                            <span>Fase</span>
                            <span>Volume</span>
                            <span>Inten. %</span>
                            <span>km/sem</span>
                            <span>Sessões</span>
                            <span>Descarga</span>
                            <span>Notas</span>
                          </div>

                          {mesoWeeks.map((w) => (
                            <WeekRow
                              key={w.week}
                              week={w}
                              phase={topPhase}
                              onChange={handleWeekChange}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bottom save */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert("Exportar PDF — em breve")}
                    >
                      <FileDown className="h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button
                      variant={saved ? "success" : "primary"}
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4" />
                      {saved ? "Salvo!" : "Salvar periodização"}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Right sidebar ── */}
          {generated && (
            <aside className="w-full lg:w-60 xl:w-64 shrink-0 space-y-4">
              {/* Summary card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SummaryRow label="Total de semanas" value={`${totalWeeks} sem`} />
                  <div className="space-y-1.5">
                    <span className="text-xs text-text-muted">Fases</span>
                    {(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((p) => (
                      <div key={p} className="flex items-center justify-between">
                        <Badge variant={PHASE_BADGE[p]} className="text-[10px]">
                          {p}
                        </Badge>
                        <span className="text-white font-medium text-xs">
                          {phaseCounts[p] ?? 0} sem
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <SummaryRow
                    label="Pico de volume"
                    value={
                      peakVolumeWeek
                        ? `Sem. ${peakVolumeWeek.week} — ${peakVolumeWeek.volume}%`
                        : "—"
                    }
                  />
                  <SummaryRow label="Semanas de taper" value={`${taperWeeks} sem`} />
                  <SummaryRow label="Semanas descarga" value={`${deloadWeeks} sem`} />
                </CardContent>
              </Card>

              {/* Tip card */}
              <Card className="border-info/30 bg-info/5">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center gap-2 text-info">
                    <Info className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold">Sobre periodização</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    A estrutura gerada é uma{" "}
                    <span className="text-white">referência automática</span>. Edite
                    volume, intensidade e notas de cada semana para adaptar ao atleta.
                    Semanas de descarga (↓) reduzem o volume para favorecer a
                    supercompensação.
                  </p>
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WeekRow ──────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  phase,
  onChange,
}: {
  week: Week;
  phase: Phase;
  onChange: (weekNum: number, field: keyof Week, value: string | number) => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[3rem_7rem_5rem_6rem_6rem_4rem_4rem_1fr] gap-x-2 items-center px-4 py-2.5 border-b border-border/30 last:border-0 transition-colors hover:bg-white/[0.02]",
        week.isDeload && "bg-warning/[0.04]"
      )}
    >
      {/* Week number */}
      <span className="text-xs font-semibold text-white">{week.week}</span>

      {/* Phase badge */}
      <Badge variant={PHASE_BADGE[week.phase]} className="w-fit text-[10px] px-2">
        {week.phase}
      </Badge>

      {/* Volume bar */}
      <div className="space-y-0.5">
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", PHASE_BAR[week.phase])}
            style={{ width: `${week.volume}%` }}
          />
        </div>
        <input
          type="number"
          min={10}
          max={100}
          value={week.volume}
          onChange={(e) =>
            onChange(week.week, "volume", Math.min(100, Math.max(10, Number(e.target.value))))
          }
          className="w-full rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-white text-center outline-none focus:border-primary/60"
        />
      </div>

      {/* Intensity */}
      <input
        type="number"
        min={10}
        max={100}
        value={week.intensity}
        onChange={(e) =>
          onChange(week.week, "intensity", Math.min(100, Math.max(10, Number(e.target.value))))
        }
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-white text-center outline-none focus:border-primary/60"
      />

      {/* km */}
      <input
        type="number"
        min={0}
        value={week.km}
        onChange={(e) => onChange(week.week, "km", Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-white text-center outline-none focus:border-primary/60"
      />

      {/* Sessions */}
      <input
        type="number"
        min={1}
        max={7}
        value={week.sessions}
        onChange={(e) =>
          onChange(week.week, "sessions", Math.min(7, Math.max(1, Number(e.target.value))))
        }
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-white text-center outline-none focus:border-primary/60"
      />

      {/* Deload indicator */}
      <div className="flex justify-center">
        {week.isDeload ? (
          <span title="Semana de descarga" className="flex items-center gap-0.5 text-warning text-[11px] font-semibold">
            <TrendingDown className="h-3.5 w-3.5" />
            ↓
          </span>
        ) : (
          <span className="text-text-muted text-[11px]">—</span>
        )}
      </div>

      {/* Notes */}
      <input
        type="text"
        placeholder="Adicionar nota…"
        value={week.notes}
        onChange={(e) => onChange(week.week, "notes", e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] text-white placeholder:text-text-muted/40 outline-none focus:border-primary/60 transition-colors"
      />
    </div>
  );
}

// ── SummaryRow ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  );
}
