"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gauge, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(s: string): number {
  const parts = s.split(":").map(Number);
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatRaceTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPaceStr(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  return map[zoneNum] ?? "text-white";
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

  const warmupPace = adjAvgPace * 1.08;  // first 20% slower
  const finishPace = adjAvgPace * 0.95;  // last 15% faster
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
      pace: formatPaceStr(pace),
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
  const waterIntervalKm = hotTemp ? Math.max(1, Math.round((adjAvgPace * 15) / 60)) : Math.max(1, Math.round((adjAvgPace * 20) / 60));
  const gelIntervalKm = Math.max(4, Math.round((adjAvgPace * 45) / 60));

  let nextGelKm = 5 + gelIntervalKm;
  const nextElecKm = Math.max(10, Math.round(60 / (adjAvgPace / 60)));

  for (let km = 1; km <= totalKmInt; km++) {
    // Water
    if (km % waterIntervalKm === 0) {
      nutrition.push({ km, type: "water", label: hotTemp ? "200 ml água" : "150 ml água" });
    }
    // Gel
    if (km >= 5 && km >= nextGelKm) {
      nutrition.push({ km, type: "gel", label: "Gel energético (~25g CHO)" });
      nextGelKm = km + gelIntervalKm;
    }
    // Electrolyte
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimuladorPage() {
  const [raceIdx, setRaceIdx] = useState(1); // default: 10 km
  const [goalTime, setGoalTime] = useState("55:00");
  const [weight, setWeight] = useState("61");
  const [tempIdx, setTempIdx] = useState(1); // 15–22°C
  const [elevIdx, setElevIdx] = useState(0); // Plana

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [splitsOpen, setSplitsOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

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
    <div className="mx-auto max-w-3xl space-y-7">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <Link href="/aluno/previsao">
            <Button variant="ghost" size="sm" className="gap-1.5 text-text-muted hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Previsão de prova
            </Button>
          </Link>
        </div>
        <Badge variant="primary" className="mb-2">
          <Gauge className="h-3 w-3" /> Simulador
        </Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Simulador de estratégia de prova
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Defina sua prova e meta de tempo. O sistema calcula o pace ideal, os splits, a estratégia
          de energia e hidratação.
        </p>
      </div>

      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração da prova</CardTitle>
          <CardDescription>Preencha os dados para gerar sua estratégia personalizada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Prova alvo */}
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Prova alvo
            </span>
            <select
              className={selectClass}
              value={raceIdx}
              onChange={(e) => setRaceIdx(Number(e.target.value))}
            >
              {RACES.map((r, i) => (
                <option key={r.label} value={i}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tempo alvo */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Tempo alvo
            </span>
            <input
              className={inputClass}
              value={goalTime}
              onChange={(e) => setGoalTime(e.target.value)}
              placeholder="Ex.: 1:55:00"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
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

            {/* Altimetria */}
            <div>
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
          </div>

          <Button onClick={handleGenerate} className="w-full sm:w-auto">
            <Gauge className="h-4 w-4" />
            Gerar estratégia
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {strategy && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Card 1 — Resumo */}
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
                    <p className="mt-1 font-display text-xl font-bold text-white">
                      {formatPaceStr(strategy.avgPaceSecPerKm)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      Ritmo de largada (20%)
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-info">
                      {formatPaceStr(strategy.startPaceSecPerKm)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      +{Math.round((strategy.startPaceSecPerKm - strategy.avgPaceSecPerKm))}s/km
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      Ritmo de chegada (15%)
                    </p>
                    <p className="mt-1 font-display text-xl font-bold text-success">
                      {formatPaceStr(strategy.finishPaceSecPerKm)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {Math.round(strategy.finishPaceSecPerKm - strategy.avgPaceSecPerKm)}s/km
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">FC alvo</p>
                    <p className="mt-1 font-display text-base font-bold text-white">Zona 3–4</p>
                    <p className="text-[10px] text-text-muted">150–170 bpm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Splits */}
            <Card>
              <CardHeader>
                <CardTitle>Splits por km</CardTitle>
                <CardDescription>
                  Pace e zona de frequência cardíaca estimada por quilômetro
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Zone legend */}
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
                          <td className="px-4 py-2 font-mono text-sm text-white">{row.km}</td>
                          <td className="px-4 py-2 font-mono text-sm text-white">{row.pace}</td>
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
                    className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-text-muted transition-colors hover:text-white"
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

            {/* Card 3 — Nutrição */}
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
                    <p className="mt-1 font-display text-xl font-bold text-white">
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

                {/* Timeline */}
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
                            <span className="text-xs font-semibold text-text-muted">
                              km {ev.km}
                            </span>
                            <span className="text-xs text-white">{ev.label}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4 — Checklist */}
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
                            checked[i] ? "text-text-muted line-through" : "text-white"
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
    </div>
  );
}
