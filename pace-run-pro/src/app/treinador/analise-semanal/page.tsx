"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types (formerly from mock-data) ──────────────────────────────────────────
type RiskLevel = "low" | "medium" | "high";

interface WeeklyMetric {
  label: string;
  value: number;
  prev: number;
  unit: string;
  delta: number;
}

interface AthleteAnalysis {
  athleteId: string;
  athleteName: string;
  weekLabel: string;
  metrics: WeeklyMetric[];
  highlights: string[];
  riskLevel: RiskLevel;
  adherence: number;
  recommendation: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(weeksAgo: number): Date {
  const today = new Date();
  const dow = today.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const d = new Date(today);
  d.setDate(today.getDate() + toMonday - weeksAgo * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)} ${start.getFullYear()}`;
}

// Last 4 weeks (index 0 = most recent)
const WEEKS = Array.from({ length: 4 }, (_, i) => {
  const start = getMondayOf(i);
  return { start, label: formatWeekLabel(start) };
});

type RiskFilter = "todos" | "high" | "medium" | "low";

const RISK_FILTERS: { value: RiskFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "high", label: "Alto risco" },
  { value: "medium", label: "Médio risco" },
  { value: "low", label: "Baixo risco" },
];

const riskLabel: Record<RiskLevel, string> = {
  high: "Alto risco",
  medium: "Médio risco",
  low: "Baixo risco",
};

const riskColors: Record<RiskLevel, string> = {
  high: "border-danger/40 bg-danger/10 text-danger",
  medium: "border-warning/40 bg-warning/10 text-warning",
  low: "border-success/40 bg-success/10 text-success",
};

function DeltaChip({ delta, unit }: { delta: number; unit: string }) {
  const isPace = unit === "s/km";
  const improved = isPace ? delta < 0 : delta > 0;
  if (delta === 0) return <span className="text-xs text-text-muted">—</span>;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        improved ? "text-success" : "text-danger",
      )}
    >
      {improved ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function AdherenceBar({ adherence }: { adherence: number }) {
  const color =
    adherence >= 85 ? "bg-success" : adherence >= 70 ? "bg-warning" : "bg-danger";
  const textColor =
    adherence >= 85 ? "text-success" : adherence >= 70 ? "text-warning" : "text-danger";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Aderência</span>
        <span className={cn("text-xs font-bold", textColor)}>{adherence}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-hover">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${adherence}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="h-4 w-32 rounded bg-card-hover" />
      <div className="h-2 w-full rounded-full bg-card-hover" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-card-hover" />
        ))}
      </div>
      <div className="h-3 w-48 rounded bg-card-hover" />
    </div>
  );
}

function AthleteCard({
  analysis,
  index,
}: {
  analysis: AthleteAnalysis;
  index: number;
}) {
  const [vol, sess, pace] = analysis.metrics;

  return (
    <motion.div
      key={analysis.athleteId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-text">{analysis.athleteName}</p>
              <p className="text-xs text-text-muted mt-0.5">{analysis.weekLabel}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-xl border px-2.5 py-0.5 text-xs font-semibold",
                riskColors[analysis.riskLevel],
              )}
            >
              {riskLabel[analysis.riskLevel]}
            </span>
          </div>

          <AdherenceBar adherence={analysis.adherence} />

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card-hover p-2.5 space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Volume</p>
              <p className="text-sm font-bold text-text">{vol?.value ?? 0} km</p>
              {vol && <DeltaChip delta={vol.delta} unit={vol.unit} />}
            </div>
            <div className="rounded-xl bg-card-hover p-2.5 space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Sessões</p>
              <p className="text-sm font-bold text-text">{sess?.value ?? 0}</p>
              {sess && <DeltaChip delta={sess.delta} unit={sess.unit} />}
            </div>
            <div className="rounded-xl bg-card-hover p-2.5 space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Pace médio</p>
              <p className="text-sm font-bold text-text">
                {pace?.value
                  ? `${Math.floor(pace.value / 60)}:${String(pace.value % 60).padStart(2, "0")}/km`
                  : "—"}
              </p>
              {pace && <DeltaChip delta={pace.delta} unit={pace.unit} />}
            </div>
          </div>

          <ul className="space-y-1.5">
            {analysis.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-muted">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {h}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-primary/20 bg-primary/8 px-3 py-2.5">
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-primary">Recomendação: </span>
              {analysis.recommendation}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnaliseSemanalPage() {
  const [weekIndex, setWeekIndex] = useState(0);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("todos");
  const [analyses, setAnalyses] = useState<AthleteAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback((idx: number) => {
    setLoading(true);
    const weekStart = toIso(WEEKS[idx].start);
    fetch(`/api/coach/analise-semanal?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((d) => setAnalyses(d.analyses ?? []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWeek(weekIndex);
  }, [weekIndex, fetchWeek]);

  const filtered =
    riskFilter === "todos" ? analyses : analyses.filter((a) => a.riskLevel === riskFilter);

  const avgAdherence =
    analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.adherence, 0) / analyses.length)
      : 0;
  const highRiskCount = analyses.filter((a) => a.riskLevel === "high").length;
  const totalVolume = Math.round(
    analyses.reduce((s, a) => s + (a.metrics[0]?.value ?? 0), 0) * 10,
  ) / 10;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Badge variant="primary" className="mb-3">
          <BarChart2 className="h-3 w-3" />
          Análise Semanal
        </Badge>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-text sm:text-3xl">
              Análise Semanal
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Visão consolidada do desempenho e risco de cada atleta na semana.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekIndex((i) => Math.min(WEEKS.length - 1, i + 1))}
              disabled={weekIndex === WEEKS.length - 1}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-all hover:border-primary/40 hover:text-text disabled:opacity-40"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-text sm:min-w-[170px] sm:flex-none">
              {WEEKS[weekIndex].label}
            </span>
            <button
              onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
              disabled={weekIndex === 0}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-all hover:border-primary/40 hover:text-text disabled:opacity-40"
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-text-muted">Atletas analisados</p>
          <p className="mt-1 font-display text-2xl font-bold text-text">{analyses.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-text-muted">Aderência média</p>
          <p className="mt-1 font-display text-2xl font-bold text-text">{avgAdherence}%</p>
        </div>
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-xs text-text-muted">Alto risco</p>
          <p className="mt-1 font-display text-2xl font-bold text-danger">{highRiskCount}</p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
          <p className="text-xs text-text-muted">Volume total</p>
          <p className="mt-1 font-display text-2xl font-bold text-text">{totalVolume} km</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        {RISK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setRiskFilter(f.value)}
            className={cn(
              "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all",
              riskFilter === f.value
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-2 flex flex-col items-center gap-3 py-16 text-center"
            >
              <BarChart2 className="h-10 w-10 text-text-muted" />
              <p className="text-sm text-text-muted">
                {analyses.length === 0
                  ? "Nenhum atleta com dados para esta semana."
                  : "Nenhum atleta neste filtro."}
              </p>
            </motion.div>
          ) : (
            filtered.map((analysis, index) => (
              <AthleteCard key={analysis.athleteId} analysis={analysis} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
