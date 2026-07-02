"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Gauge,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Riegel formula: t2 = t1 × (d2/d1)^1.06
function riegelPredict(baseTimeSec: number, baseDistKm: number, targetDistKm: number): number {
  return Math.round(baseTimeSec * Math.pow(targetDistKm / baseDistKm, 1.06));
}

// Parse "HH:MM:SS" or "MM:SS" → seconds
function parseTime(s: string): number {
  const parts = s.split(":").map(Number);
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Format seconds → "H:MM:SS" or "MM:SS"
function formatRaceTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Format pace seconds/km → "M:SS/km"
function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DISTANCES = [
  { label: "5 km", value: "5" },
  { label: "10 km", value: "10" },
  { label: "21,1 km", value: "21.0975" },
  { label: "42,2 km", value: "42.195" },
];

const TARGETS = [
  { dist: 1, label: "1 km" },
  { dist: 5, label: "5 km" },
  { dist: 10, label: "10 km" },
  { dist: 21.0975, label: "Meia maratona" },
  { dist: 42.195, label: "Maratona" },
];

const RACES = [
  { label: "5 km", dist: 5 },
  { label: "10 km", dist: 10 },
  { label: "15 km", dist: 15 },
  { label: "21,1 km", dist: 21.0975 },
  { label: "42,2 km", dist: 42.195 },
];

const TEMPS = ["< 15°C", "15–22°C", "22–28°C", "> 28°C"];
const ELEV = ["Plana", "Moderada", "Íngreme"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultItem = { dist: number; label: string; timeSec: number };

type SplitRow = {
  km: number;
  pace: string;
  paceSecPerKm: number;
  cumTimeSec: number;
  zone: string;
  zoneNum: number;
};

type NutritionEvent = {
  km: number;
  type: "gel" | "water" | "electrolyte";
  label: string;
};

type Strategy = {
  avgPaceSecPerKm: number;
  startPaceSecPerKm: number;
  finishPaceSecPerKm: number;
  splits: SplitRow[];
  nutrition: NutritionEvent[];
  totalDistKm: number;
  totalTimeSec: number;
  carbsBeforeG: number;
  carbsTotalG: number;
  durationMin: number;
};

function getDistanceBadgeVariant(dist: number): "primary" | "warning" | "danger" {
  if (dist >= 42) return "danger";
  if (dist >= 21) return "warning";
  return "primary";
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────

function paceZone(paceRatio: number): { zone: string; zoneNum: number } {
  // ratio = split pace / avg pace; higher ratio = slower = easier zone
  if (paceRatio > 1.15) return { zone: "Z2", zoneNum: 2 };
  if (paceRatio > 1.02) return { zone: "Z3", zoneNum: 3 };
  if (paceRatio > 0.93) return { zone: "Z4", zoneNum: 4 };
  return { zone: "Z5", zoneNum: 5 };
}

function zoneColor(zoneNum: number): string {
  const map: Record<number, string> = {
    1: "text-text-muted",
    2: "text-success",
    3: "text-info",
    4: "text-warning",
    5: "text-danger",
  };
  return map[zoneNum] ?? "text-text";
}

function zoneBgColor(zoneNum: number): string {
  const map: Record<number, string> = {
    1: "bg-border/20",
    2: "bg-success/5",
    3: "bg-info/5",
    4: "bg-warning/5",
    5: "bg-danger/5",
  };
  return map[zoneNum] ?? "";
}

// ─── Strategy builder ─────────────────────────────────────────────────────────

function buildStrategy(
  totalDistKm: number,
  goalTimeSec: number,
  weightKg: number,
  tempLabel: string,
  elevLabel: string
): Strategy {
  const avgPaceSecPerKm = goalTimeSec / totalDistKm;

  // Elevation adjustment
  const elevFactor = elevLabel === "Íngreme" ? 1.04 : elevLabel === "Moderada" ? 1.02 : 1.0;
  const adjAvgPace = avgPaceSecPerKm * elevFactor;

  const warmupPace = adjAvgPace * 1.08; // first 20% slower
  const finishPace = adjAvgPace * 0.95; // last 15% faster
  const startPaceSecPerKm = adjAvgPace * 1.08;
  const finishPaceSecPerKm = adjAvgPace * 0.95;

  const totalKmInt = Math.ceil(totalDistKm);
  const warmupKms = Math.max(1, Math.round(totalDistKm * 0.2));
  const finishKms = Math.max(1, Math.round(totalDistKm * 0.15));

  const splits: SplitRow[] = [];
  let cum = 0;

  for (let km = 1; km <= totalKmInt; km++) {
    let pace: number;
    if (km <= warmupKms) {
      pace = warmupPace;
    } else if (km > totalKmInt - finishKms) {
      pace = finishPace;
    } else {
      pace = adjAvgPace;
    }

    const segDist = km === totalKmInt ? totalDistKm - (km - 1) : 1;
    cum += pace * segDist;

    const ratio = pace / adjAvgPace;
    const { zone, zoneNum } = paceZone(ratio);

    splits.push({
      km,
      pace: formatPace(pace),
      paceSecPerKm: pace,
      cumTimeSec: Math.round(cum),
      zone,
      zoneNum,
    });
  }

  // Nutrition
  const durationMin = goalTimeSec / 60;
  const carbsPerHour = weightKg * 1.0;
  const totalCarbs = carbsPerHour * (durationMin / 60);
  const carbsBeforeG = Math.round(weightKg * 1.5);

  const nutrition: NutritionEvent[] = [];
  const hotTemp = tempLabel === "22–28°C" || tempLabel === "> 28°C";
  const waterIntervalKm = hotTemp
    ? Math.max(1, Math.round((adjAvgPace * 15) / 60))
    : Math.max(1, Math.round((adjAvgPace * 20) / 60));
  const gelIntervalKm = Math.max(4, Math.round((adjAvgPace * 45) / 60));

  let nextGelKm = 5 + gelIntervalKm;
  const nextElecKm = Math.max(10, Math.round(60 / (adjAvgPace / 60)));

  for (let km = 1; km <= totalKmInt; km++) {
    if (km % waterIntervalKm === 0) {
      nutrition.push({ km, type: "water", label: hotTemp ? "200 ml água" : "150 ml água" });
    }
    if (km >= 5 && km >= nextGelKm) {
      nutrition.push({ km, type: "gel", label: "Gel energético (~25g CHO)" });
      nextGelKm = km + gelIntervalKm;
    }
    if (km >= nextElecKm && km % Math.max(5, Math.round(nextElecKm / 2)) === 0) {
      nutrition.push({ km, type: "electrolyte", label: "Eletrólito / isotônico" });
    }
  }

  return {
    avgPaceSecPerKm: adjAvgPace,
    startPaceSecPerKm,
    finishPaceSecPerKm,
    splits,
    nutrition,
    totalDistKm,
    totalTimeSec: goalTimeSec,
    carbsBeforeG,
    carbsTotalG: Math.round(totalCarbs),
    durationMin,
  };
}

const CHECKLIST_ITEMS = (carbsBefore: number) => [
  `Carboidratos 2h antes: ${carbsBefore} g`,
  "Café 45 min antes (opcional)",
  "Hidratação pré: 500 ml nas 2h anteriores",
  "Aquecimento: 10 min trote leve + drills",
  "Tênis e meias testados em treino longo",
  "GPS ativo e com carga",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealDataResponse {
  bestEffort: { distanceKm: number; durationSec: number; avgPaceSecPerKm: number | null; date: string } | null;
  latestTest: { vo2max: number | null; vamKmh: number | null; thresholdPaceSecPerKm: number | null; date: string; testType: string } | null;
  latestRace: { name: string; distanceKm: number; timeSeconds: number; date: string } | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrevisaoPage() {
  const [realData, setRealData] = useState<RealDataResponse | null>(null);

  useEffect(() => {
    fetch("/api/atleta/previsao")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setRealData(d))
      .catch(() => null);
  }, []);

  // Prediction state
  const [refTime, setRefTime] = useState("25:00");
  const [refDist, setRefDist] = useState("5");
  const [predicted, setPredicted] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  // Strategy state
  const [raceIdx, setRaceIdx] = useState(1); // default: 10 km
  const [goalTime, setGoalTime] = useState("");
  const [weight, setWeight] = useState("61");
  const [tempIdx, setTempIdx] = useState(1); // 15–22°C
  const [elevIdx, setElevIdx] = useState(0); // Plana
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [splitsOpen, setSplitsOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

  function handleCalculate() {
    const baseSec = parseTime(refTime.trim());
    const baseKm = parseFloat(refDist);
    if (!baseSec || !baseKm) return;

    setResults(
      TARGETS.map((t) => ({
        dist: t.dist,
        label: t.label,
        timeSec: riegelPredict(baseSec, baseKm, t.dist),
      }))
    );
    setPredicted(true);
    setStrategy(null);

    // Pre-fill the strategy goal time with the predicted time for the selected race
    const dist = RACES[raceIdx].dist;
    setGoalTime(formatRaceTime(riegelPredict(baseSec, baseKm, dist)));
  }

  function handleRaceChange(idx: number) {
    setRaceIdx(idx);
    setStrategy(null);
    if (predicted) {
      const baseSec = parseTime(refTime.trim());
      const baseKm = parseFloat(refDist);
      if (baseSec && baseKm) {
        setGoalTime(formatRaceTime(riegelPredict(baseSec, baseKm, RACES[idx].dist)));
      }
    }
  }

  function handleGenerate() {
    const goalSec = parseTime(goalTime.trim());
    const weightKg = parseFloat(weight);
    const totalDistKm = RACES[raceIdx].dist;
    if (!goalSec || !weightKg || !totalDistKm) return;

    const s = buildStrategy(totalDistKm, goalSec, weightKg, TEMPS[tempIdx], ELEV[elevIdx]);
    setStrategy(s);
    setSplitsOpen(false);
    setChecked(Array(CHECKLIST_ITEMS(s.carbsBeforeG).length).fill(false));
  }

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  const nutritionIcon = (type: NutritionEvent["type"]) => {
    if (type === "gel") return "🍬";
    if (type === "water") return "💧";
    return "⚡";
  };

  const nutritionColor = (type: NutritionEvent["type"]) => {
    if (type === "gel") return "border-warning/30 bg-warning/10 text-warning";
    if (type === "water") return "border-info/30 bg-info/10 text-info";
    return "border-success/30 bg-success/10 text-success";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <Link href="/atleta/testes">
            <Button variant="ghost" size="sm" className="gap-1.5 text-text-muted hover:text-text">
              <ArrowLeft className="h-4 w-4" /> Testes
            </Button>
          </Link>
        </div>
        <Badge variant="primary" className="mb-2">
          <Target className="h-3 w-3" /> Previsão & Estratégia
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Preveja seu tempo e monte sua estratégia de prova
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Informe um resultado recente para prever seus tempos em outras distâncias (fórmula de
          Riegel) e gerar uma estratégia completa de prova — pace, splits, nutrição e checklist de
          largada.
        </p>
      </div>

      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle>Seu resultado de referência</CardTitle>
          <CardDescription>Selecione a distância e informe seu tempo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Distance radio pills */}
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Distância
            </span>
            <div className="flex flex-wrap gap-2">
              {DISTANCES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRefDist(d.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    refDist === d.value
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-text"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time input */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Tempo realizado
            </span>
            <input
              className={inputClass}
              value={refTime}
              onChange={(e) => setRefTime(e.target.value)}
              placeholder="Ex.: 25:30 (MM:SS) ou 1:58:00"
            />
          </label>

          {/* Real data seed */}
          {(realData?.bestEffort || realData?.latestRace) && (() => {
            const effort = realData.bestEffort;
            const race = realData.latestRace;
            const src = effort ?? (race ? { distanceKm: race.distanceKm, durationSec: race.timeSeconds, date: race.date } : null);
            if (!src) return null;
            const label = effort
              ? `Melhor treino: ${src.distanceKm} km em ${formatRaceTime(src.durationSec)}`
              : `Corrida: ${race!.name} ${src.distanceKm} km em ${formatRaceTime(src.durationSec)}`;
            return (
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text">{label}</p>
                  <p className="text-[10px] text-text-muted">
                    {new Date(src.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRefDist(String(src.distanceKm));
                    setRefTime(formatRaceTime(src.durationSec));
                  }}
                  className="shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Usar esses dados
                </button>
              </div>
            );
          })()}

          <Button onClick={handleCalculate} className="w-full sm:w-auto">
            <TrendingUp className="h-4 w-4" />
            Calcular previsões
          </Button>
        </CardContent>
      </Card>

      {/* Results grid */}
      <AnimatePresence>
        {predicted && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="mb-4 font-display text-lg font-semibold text-text">Tempos previstos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => {
                const paceSecPerKm = r.timeSec / r.dist;
                const effortRatio = Math.min(r.dist / 42.195, 1);
                const isRef = Math.abs(r.dist - parseFloat(refDist)) < 0.01;
                const variant = getDistanceBadgeVariant(r.dist);

                return (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                  >
                    <Card className={isRef ? "border-primary/40" : ""}>
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <Badge variant={variant}>{r.label}</Badge>
                          {isRef && (
                            <Badge variant="outline" className="text-[10px]">
                              Sua referência
                            </Badge>
                          )}
                        </div>

                        <p className="font-display text-3xl font-bold text-text">
                          {formatRaceTime(r.timeSec)}
                        </p>
                        <p className="mt-0.5 text-sm text-text-muted">{formatPace(paceSecPerKm)}</p>

                        {/* Effort bar */}
                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-[10px] text-text-muted">
                            <span>Esforço relativo</span>
                            <span>{Math.round(effortRatio * 100)}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${effortRatio * 100}%` }}
                              transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategy section */}
      <AnimatePresence>
        {predicted && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-5"
          >
            {/* Configuração da estratégia */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Gauge className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Estratégia de prova</CardTitle>
                    <CardDescription>
                      Pace, splits, nutrição e checklist personalizados para o dia da prova
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Race selector */}
                <div>
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Prova a simular
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {RACES.map((r, idx) => (
                      <button
                        key={r.label}
                        onClick={() => handleRaceChange(idx)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          raceIdx === idx
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-text"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Goal time */}
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Tempo alvo
                    </span>
                    <input
                      className={inputClass}
                      value={goalTime}
                      onChange={(e) => setGoalTime(e.target.value)}
                      placeholder="Ex.: 55:00 ou 1:55:00"
                    />
                  </label>

                  {/* Peso */}
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Peso corporal (kg)
                    </span>
                    <input
                      className={inputClass}
                      type="number"
                      min={30}
                      max={200}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </label>

                  {/* Temperatura */}
                  <div>
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Temperatura esperada
                    </span>
                    <select
                      className={selectClass}
                      value={tempIdx}
                      onChange={(e) => setTempIdx(Number(e.target.value))}
                    >
                      {TEMPS.map((t, i) => (
                        <option key={t} value={i}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Altimetria */}
                <div className="max-w-xs">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Altimetria
                  </span>
                  <select
                    className={selectClass}
                    value={elevIdx}
                    onChange={(e) => setElevIdx(Number(e.target.value))}
                  >
                    {ELEV.map((e, i) => (
                      <option key={e} value={i}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="secondary" onClick={handleGenerate} className="w-full sm:w-auto">
                  <Gauge className="h-4 w-4" />
                  Gerar estratégia
                </Button>
              </CardContent>
            </Card>

            {/* Strategy results */}
            <AnimatePresence>
              {strategy && (
                <motion.div
                  key="strategy-results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  {/* Resumo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo da estratégia</CardTitle>
                      <CardDescription>
                        {RACES[raceIdx].label} · Meta: {formatRaceTime(strategy.totalTimeSec)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">Pace médio</p>
                          <p className="mt-1 font-display text-xl font-bold text-text">
                            {formatPace(strategy.avgPaceSecPerKm)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Ritmo de largada (20%)
                          </p>
                          <p className="mt-1 font-display text-xl font-bold text-info">
                            {formatPace(strategy.startPaceSecPerKm)}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            +{Math.round(strategy.startPaceSecPerKm - strategy.avgPaceSecPerKm)}s/km
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Ritmo de chegada (15%)
                          </p>
                          <p className="mt-1 font-display text-xl font-bold text-success">
                            {formatPace(strategy.finishPaceSecPerKm)}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {Math.round(strategy.finishPaceSecPerKm - strategy.avgPaceSecPerKm)}s/km
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">FC alvo</p>
                          <p className="mt-1 font-display text-base font-bold text-text">Zona 3–4</p>
                          <p className="text-[10px] text-text-muted">150–170 bpm</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Splits */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Splits por km</CardTitle>
                      <CardDescription>
                        Pace e zona de frequência cardíaca estimada por quilômetro
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-3 flex flex-wrap gap-3 text-xs">
                        <span className="text-text-muted">Zona:</span>
                        <span className="text-success">Z2 — leve</span>
                        <span className="text-info">Z3 — moderado</span>
                        <span className="text-warning">Z4 — limiar</span>
                        <span className="text-danger">Z5 — máximo</span>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-card-hover/40">
                              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                                Km
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                                Pace
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                                Tempo acumulado
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                                Zona FC
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(splitsOpen ? strategy.splits : strategy.splits.slice(0, 5)).map((row, i) => (
                              <tr
                                key={row.km}
                                className={`border-b border-border/50 transition-colors ${zoneBgColor(row.zoneNum)} ${
                                  i % 2 === 0 ? "" : "brightness-90"
                                }`}
                              >
                                <td className="px-4 py-2 font-mono text-sm text-text">{row.km}</td>
                                <td className="px-4 py-2 font-mono text-sm text-text">{row.pace}</td>
                                <td className="px-4 py-2 font-mono text-sm text-text-muted">
                                  {formatRaceTime(row.cumTimeSec)}
                                </td>
                                <td className={`px-4 py-2 text-sm font-semibold ${zoneColor(row.zoneNum)}`}>
                                  {row.zone}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {strategy.splits.length > 5 && (
                        <button
                          onClick={() => setSplitsOpen((v) => !v)}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text"
                        >
                          {splitsOpen ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" /> Recolher splits
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" /> Ver todos os {strategy.splits.length}{" "}
                              splits
                            </>
                          )}
                        </button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Nutrição */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Estratégia de nutrição e hidratação</CardTitle>
                      <CardDescription>
                        Baseado em {Math.round(strategy.durationMin)} min de prova · peso: {weight} kg
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Carboidratos totais
                          </p>
                          <p className="mt-1 font-display text-xl font-bold text-text">
                            {strategy.carbsTotalG} g
                          </p>
                          <p className="text-[10px] text-text-muted">durante a prova</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Água por estação
                          </p>
                          <p className="mt-1 font-display text-xl font-bold text-info">
                            {TEMPS[tempIdx] === "22–28°C" || TEMPS[tempIdx] === "> 28°C" ? "200" : "150"} ml
                          </p>
                          <p className="text-[10px] text-text-muted">a cada ~15 min</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">Eletrólito</p>
                          <p className="mt-1 font-display text-xl font-bold text-success">km 10+</p>
                          <p className="text-[10px] text-text-muted">ou após 60 min</p>
                        </div>
                      </div>

                      {strategy.nutrition.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                            Timeline por km
                          </p>
                          <div className="relative space-y-2 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-border">
                            {strategy.nutrition.map((ev, i) => (
                              <motion.div
                                key={`${ev.km}-${ev.type}-${i}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.25 }}
                                className="flex items-center gap-3"
                              >
                                <span
                                  className={`absolute left-0 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${nutritionColor(ev.type)}`}
                                >
                                  {nutritionIcon(ev.type)}
                                </span>
                                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
                                  <span className="text-xs font-semibold text-text-muted">km {ev.km}</span>
                                  <span className="text-xs text-text">{ev.label}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Checklist */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Checklist de largada</CardTitle>
                      <CardDescription>Marque os itens concluídos antes da prova</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-3">
                        {CHECKLIST_ITEMS(strategy.carbsBeforeG).map((item, i) => (
                          <li key={item}>
                            <button
                              onClick={() => toggleCheck(i)}
                              className="flex w-full items-start gap-3 text-left transition-colors"
                            >
                              {checked[i] ? (
                                <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                              ) : (
                                <Square className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                              )}
                              <span
                                className={`text-sm transition-colors ${
                                  checked[i] ? "text-text-muted line-through" : "text-text"
                                }`}
                              >
                                {item}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {checked.length > 0 && (
                        <div className="mt-5">
                          <div className="mb-1.5 flex justify-between text-xs text-text-muted">
                            <span>Progresso do checklist</span>
                            <span>
                              {checked.filter(Boolean).length}/{checked.length}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border">
                            <motion.div
                              className="h-full rounded-full bg-success"
                              animate={{
                                width: `${(checked.filter(Boolean).length / checked.length) * 100}%`,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info card */}
      <Card className="border-info/30 bg-info/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-text">Fórmula de Riegel</p>
            <p className="mt-1 text-sm text-text-muted">
              A previsão usa a equação{" "}
              <span className="font-mono text-text">t₂ = t₁ × (d₂/d₁)^1.06</span>, validada
              cientificamente para distâncias de corrida. Quanto maior a distância, maior o fator de
              fadiga (expoente 1.06).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
