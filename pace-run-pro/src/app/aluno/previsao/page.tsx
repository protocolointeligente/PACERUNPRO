"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Target, TrendingUp, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Prediction helpers ───────────────────────────────────────────────────────

// Riegel formula: t2 = t1 × (d2/d1)^1.06
function riegelPredict(baseTimeSec: number, baseDistKm: number, targetDistKm: number): number {
  return Math.round(baseTimeSec * Math.pow(targetDistKm / baseDistKm, 1.06));
}

// Parse "HH:MM:SS" or "MM:SS" → seconds
function parseTime(s: string): number {
  const parts = s.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Format seconds → "H:MM:SS" or "MM:SS"
function formatRaceTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
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

const STRATEGY_RACES = [
  { dist: 5, label: "5 km" },
  { dist: 10, label: "10 km" },
  { dist: 21.0975, label: "Meia maratona" },
  { dist: 42.195, label: "Maratona" },
];

type ResultItem = { dist: number; label: string; timeSec: number };

type SplitRow = {
  km: number;
  pace: string;
  cumTimeSec: number;
  zone: string;
  zoneNum: number;
};

function getDistanceBadgeVariant(dist: number): "primary" | "warning" | "danger" {
  if (dist >= 42) return "danger";
  if (dist >= 21) return "warning";
  return "primary";
}

function buildSplits(totalKm: number, goalTimeSec: number): SplitRow[] {
  const avgPace = goalTimeSec / totalKm; // sec/km
  const warmupPace = avgPace * 1.05;
  const strongPace = avgPace * 0.97;
  const totalKmInt = Math.ceil(totalKm);

  const rows: SplitRow[] = [];
  let cum = 0;

  for (let km = 1; km <= totalKmInt; km++) {
    let pace: number;
    if (km <= 5) {
      pace = warmupPace;
    } else if (km > totalKmInt - 5) {
      pace = strongPace;
    } else {
      pace = avgPace;
    }

    // Partial last km
    const segDist = km === totalKmInt ? totalKm - (km - 1) : 1;
    cum += pace * segDist;

    // HR zone based on pace ratio relative to avg
    const ratio = pace / avgPace;
    let zone: string;
    let zoneNum: number;
    if (ratio > 1.25) { zone = "Z1"; zoneNum = 1; }
    else if (ratio > 1.1) { zone = "Z2"; zoneNum = 2; }
    else if (ratio > 0.95) { zone = "Z3"; zoneNum = 3; }
    else if (ratio > 0.88) { zone = "Z4"; zoneNum = 4; }
    else { zone = "Z5"; zoneNum = 5; }

    rows.push({ km, pace: formatPace(pace), cumTimeSec: Math.round(cum), zone, zoneNum });
  }
  return rows;
}

function zoneColor(zoneNum: number) {
  const map: Record<number, string> = {
    1: "text-text-muted",
    2: "text-success",
    3: "text-info",
    4: "text-warning",
    5: "text-danger",
  };
  return map[zoneNum] ?? "text-white";
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrevisaoPage() {
  const [refTime, setRefTime] = useState("25:00");
  const [refDist, setRefDist] = useState("5");
  const [predicted, setPredicted] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  // Strategy state
  const [stratRaceIdx, setStratRaceIdx] = useState(0);
  const [stratGoalTime, setStratGoalTime] = useState("");
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [stratGenerated, setStratGenerated] = useState(false);
  const [splitsOpen, setSplitsOpen] = useState(false);

  function handleCalculate() {
    const baseSec = parseTime(refTime.trim());
    const baseKm = parseFloat(refDist);
    if (!baseSec || !baseKm) return;
    const targets = TARGETS;
    setResults(
      targets.map((t) => ({
        dist: t.dist,
        label: t.label,
        timeSec: riegelPredict(baseSec, baseKm, t.dist),
      }))
    );
    setPredicted(true);
    setSplits([]);
    setStratGenerated(false);

    // Pre-fill strategy goal with predicted time for currently selected race
    const chosenDist = STRATEGY_RACES[stratRaceIdx].dist;
    const predicted5 = riegelPredict(baseSec, baseKm, chosenDist);
    setStratGoalTime(formatRaceTime(predicted5).replace(/\/km$/, ""));
  }

  function handleGenerateStrategy() {
    const goalSec = parseTime(stratGoalTime.trim());
    const totalKm = STRATEGY_RACES[stratRaceIdx].dist;
    if (!goalSec || !totalKm) return;
    setSplits(buildSplits(totalKm, goalSec));
    setStratGenerated(true);
    setSplitsOpen(true);
  }

  // When race selection changes, update pre-filled time from results
  function handleStratRaceChange(idx: number) {
    setStratRaceIdx(idx);
    setStratGenerated(false);
    if (predicted && results.length > 0) {
      const dist = STRATEGY_RACES[idx].dist;
      const match = results.find((r) => Math.abs(r.dist - dist) < 0.01);
      if (match) setStratGoalTime(formatRaceTime(match.timeSec));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <Link href="/aluno/testes">
            <Button variant="ghost" size="sm" className="gap-1.5 text-text-muted hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Testes
            </Button>
          </Link>
        </div>
        <Badge variant="primary" className="mb-2">
          <Target className="h-3 w-3" /> Previsão de Prova
        </Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Motor de previsão de desempenho
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Informe um resultado recente e calcule seus tempos previstos em qualquer distância, baseado na
          fórmula de Riegel.
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
                      ? "border-primary/60 bg-primary/15 text-white"
                      : "border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-white"
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
            <h2 className="mb-4 font-display text-lg font-semibold text-white">Tempos previstos</h2>
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

                        <p className="font-display text-3xl font-bold text-white">
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

      {/* Pace strategy section */}
      <AnimatePresence>
        {predicted && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Timer className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Estratégia de largada</CardTitle>
                    <CardDescription>
                      Gere os splits por km com zonas de FC estimadas
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
                    {STRATEGY_RACES.map((r, idx) => (
                      <button
                        key={r.label}
                        onClick={() => handleStratRaceChange(idx)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          stratRaceIdx === idx
                            ? "border-primary/60 bg-primary/15 text-white"
                            : "border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-white"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal time */}
                <label className="block max-w-xs">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Tempo alvo
                  </span>
                  <input
                    className={inputClass}
                    value={stratGoalTime}
                    onChange={(e) => setStratGoalTime(e.target.value)}
                    placeholder="Ex.: 24:30 ou 1:55:00"
                  />
                </label>

                <Button variant="secondary" onClick={handleGenerateStrategy} className="w-full sm:w-auto">
                  Gerar estratégia
                </Button>

                {/* Splits table */}
                <AnimatePresence>
                  {stratGenerated && splits.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      {/* Legend */}
                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <span className="text-text-muted">Zona:</span>
                        <span className="text-success">Z2 — aeróbico leve</span>
                        <span className="text-info">Z3 — aeróbico moderado</span>
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
                                Zona FC estimada
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(splitsOpen ? splits : splits.slice(0, 5)).map((row, i) => (
                              <tr
                                key={row.km}
                                className={`border-b border-border/50 transition-colors ${
                                  i % 2 === 0 ? "bg-transparent" : "bg-card-hover/20"
                                }`}
                              >
                                <td className="px-4 py-2 font-mono text-sm text-white">
                                  {row.km}
                                </td>
                                <td className="px-4 py-2 font-mono text-sm text-white">
                                  {row.pace}
                                </td>
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

                      {splits.length > 5 && (
                        <button
                          onClick={() => setSplitsOpen((v) => !v)}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
                        >
                          {splitsOpen ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" /> Recolher splits
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" /> Ver todos os {splits.length} splits
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
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
            <p className="font-display text-sm font-semibold text-white">Fórmula de Riegel</p>
            <p className="mt-1 text-sm text-text-muted">
              A previsão usa a equação{" "}
              <span className="font-mono text-white">t₂ = t₁ × (d₂/d₁)^1.06</span>, validada
              cientificamente para distâncias de corrida. Quanto maior a distância, maior o fator de
              fadiga (expoente 1.06).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
