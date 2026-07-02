"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AthleteListItem } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

const swimWorkoutTypes = [
  {
    value: "TECNICA_NATACAO",
    label: "Técnica",
    description: "Drills, posição, braçada",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
    activeBg: "bg-blue-400/20 border-blue-400",
  },
  {
    value: "ENDURANCE_NATACAO",
    label: "Endurance / Base",
    description: "Volume em ritmo sustentável",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
    activeBg: "bg-green-400/20 border-green-400",
  },
  {
    value: "INTERVALADO_NATACAO",
    label: "Intervalados",
    description: "Tiros com descanso",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/30",
    activeBg: "bg-orange-400/20 border-orange-400",
  },
  {
    value: "LIMIAR_NATACAO",
    label: "Limiar / CSS",
    description: "Ritmo crítico de natação",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30",
    activeBg: "bg-purple-400/20 border-purple-400",
  },
  {
    value: "SPRINT_NATACAO",
    label: "Sprint",
    description: "Velocidade máxima",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/30",
    activeBg: "bg-red-400/20 border-red-400",
  },
  {
    value: "RECUPERACAO_NATACAO",
    label: "Recuperação",
    description: "Ritmo muito leve",
    color: "text-teal-400",
    bg: "bg-teal-400/10 border-teal-400/30",
    activeBg: "bg-teal-400/20 border-teal-400",
  },
  {
    value: "AGUAS_ABERTAS",
    label: "Águas Abertas",
    description: "Treino em lago, mar ou rio",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/30",
    activeBg: "bg-cyan-400/20 border-cyan-400",
  },
] as const;

type SwimWorkoutType = (typeof swimWorkoutTypes)[number]["value"];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function formatSecPer100m(sec: number | ""): string {
  if (sec === "" || isNaN(Number(sec))) return "";
  const s = Number(sec);
  const min = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${min}:${rem.toString().padStart(2, "0")}/100m`;
}

export default function PrescricaoNatacaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);

  // Form state
  const [athleteId, setAthleteId] = useState("");
  const [workoutType, setWorkoutType] = useState<SwimWorkoutType>("ENDURANCE_NATACAO");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [distanceM, setDistanceM] = useState<number | "">("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [cssPace, setCssPace] = useState<number | "">("");
  const [avgTargetPace, setAvgTargetPace] = useState<number | "">("");
  const [rpe, setRpe] = useState<number | "">("");
  const [mainSet, setMainSet] = useState("");
  const [notes, setNotes] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // CSS calculator state
  const [t400, setT400] = useState("");
  const [t200, setT200] = useState("");

  useEffect(() => {
    setLoadingAthletes(true);
    fetch("/api/coach/athletes")
      .then((r) => r.json())
      .then((data) => {
        setAthletes(Array.isArray(data) ? data : (data.athletes ?? []));
      })
      .catch(() => setAthletes([]))
      .finally(() => setLoadingAthletes(false));
  }, []);

  // CSS ≈ 200 / (T400 - T200)
  function calcCss(): { mPerSec: number; secPer100m: number } | null {
    function parseTime(str: string): number | null {
      const parts = str.trim().split(":");
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        const s = parseFloat(parts[1]);
        if (isNaN(m) || isNaN(s)) return null;
        return m * 60 + s;
      }
      if (parts.length === 1) {
        const s = parseFloat(parts[0]);
        return isNaN(s) ? null : s;
      }
      return null;
    }
    const sec400 = parseTime(t400);
    const sec200 = parseTime(t200);
    if (!sec400 || !sec200 || sec400 <= sec200) return null;
    const mPerSec = 200 / (sec400 - sec200);
    const secPer100m = 100 / mPerSec;
    return { mPerSec, secPer100m };
  }

  const cssResult = calcCss();

  const selectedType = swimWorkoutTypes.find((t) => t.value === workoutType);

  function buildTitle(): string {
    const typeName = selectedType?.label ?? "Treino";
    return `Natação - ${typeName}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!athleteId) { setError("Selecione um atleta."); return; }
    if (!date) { setError("Informe a data."); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        athleteId,
        date,
        type: workoutType,
        title: buildTitle(),
        sport: "SWIM",
      };
      if (durationMin !== "") body.targetDurationMin = Number(durationMin);
      if (distanceM !== "") body.targetDistanceKm = Number(distanceM) / 1000;
      if (avgTargetPace !== "") body.targetPacePer100m = Number(avgTargetPace);
      if (cssPace !== "") body.cssPacePer100m = Number(cssPace);
      if (rpe !== "") body.targetRpe = Number(rpe);
      if (mainSet.trim()) body.objective = mainSet.trim();
      if (notes.trim()) body.notes = notes.trim();

      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar prescrição");

      setSubmitted(true);
      // reset form
      setTimeout(() => {
        setSubmitted(false);
        setAthleteId("");
        setWorkoutType("ENDURANCE_NATACAO");
        setDate(new Date().toISOString().slice(0, 10));
        setDistanceM("");
        setDurationMin("");
        setCssPace("");
        setAvgTargetPace("");
        setRpe("");
        setMainSet("");
        setNotes("");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          🏊 Prescrição Natação
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Crie sessões de natação individualizadas para seus atletas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Athlete selector */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text">Atleta</span>
              </div>

              {loadingAthletes ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando atletas…
                </div>
              ) : athletes.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhum atleta cadastrado.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {athletes.map((a) => {
                    const selected = athleteId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAthleteId(selected ? "" : a.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                          selected
                            ? "border-primary/60 bg-primary/10 text-text ring-2 ring-primary/20"
                            : "border-border bg-background text-text hover:border-border/80 hover:bg-card-hover/40"
                        )}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={a.avatarUrl} alt={a.name} />
                          <AvatarFallback className="text-[10px]">
                            {initials(a.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{a.name}</span>
                        {selected && (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout type chips */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className={labelClass}>Tipo de Treino</p>
              <div className="flex flex-wrap gap-2">
                {swimWorkoutTypes.map((t) => {
                  const active = workoutType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setWorkoutType(t.value)}
                      className={cn(
                        "flex flex-col rounded-xl border px-3.5 py-2.5 text-left transition-all",
                        active ? t.activeBg : t.bg,
                        "hover:opacity-90"
                      )}
                    >
                      <span className={cn("text-xs font-semibold", t.color)}>
                        {t.label}
                      </span>
                      <span className="mt-0.5 text-[11px] text-text-muted">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Date, Distance, Duration */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <span className={labelClass}>Data</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </label>
                <label>
                  <span className={labelClass}>Distância (m)</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={distanceM}
                    onChange={(e) =>
                      setDistanceM(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="ex: 2000"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>Duração (min)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={durationMin}
                    onChange={(e) =>
                      setDurationMin(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="ex: 60"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <span className={labelClass}>CSS (seg/100m)</span>
                  <input
                    type="number"
                    min={50}
                    max={300}
                    step={1}
                    value={cssPace}
                    onChange={(e) =>
                      setCssPace(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="ex: 95"
                    className={inputClass}
                  />
                  {cssPace !== "" && (
                    <p className="mt-1 text-[11px] text-text-muted font-mono">
                      = {formatSecPer100m(cssPace)}
                    </p>
                  )}
                </label>
                <label>
                  <span className={labelClass}>Pace alvo médio (seg/100m)</span>
                  <input
                    type="number"
                    min={50}
                    max={300}
                    step={1}
                    value={avgTargetPace}
                    onChange={(e) =>
                      setAvgTargetPace(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="opcional"
                    className={inputClass}
                  />
                  {avgTargetPace !== "" && (
                    <p className="mt-1 text-[11px] text-text-muted font-mono">
                      = {formatSecPer100m(avgTargetPace)}
                    </p>
                  )}
                </label>
                <label>
                  <span className={labelClass}>RPE (1–10)</span>
                  <select
                    value={rpe}
                    onChange={(e) =>
                      setRpe(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className={inputClass}
                  >
                    <option value="">— selecione —</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                      <option key={v} value={v}>
                        {v} — {
                          v <= 2 ? "Muito fácil" :
                          v <= 4 ? "Fácil" :
                          v <= 6 ? "Moderado" :
                          v <= 8 ? "Difícil" :
                          "Máximo"
                        }
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Main set + Notes */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <label>
                <span className={labelClass}>Série Principal (main set)</span>
                <textarea
                  rows={4}
                  value={mainSet}
                  onChange={(e) => setMainSet(e.target.value)}
                  placeholder="ex: 10×100m @ CSS+5s desc 20s&#10;    4×200m @ CSS desc 30s&#10;    200m soltura"
                  className={cn(inputClass, "resize-y font-mono text-xs leading-relaxed")}
                />
              </label>
              <label>
                <span className={labelClass}>Observações</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Orientações técnicas, foco da sessão, equipamentos..."
                  className={cn(inputClass, "resize-y")}
                />
              </label>
            </CardContent>
          </Card>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Prescrição criada com sucesso!
              </motion.div>
            ) : (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !athleteId}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? "Salvando…" : "Salvar Prescrição"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Sidebar: CSS reference panel + calculator */}
        <div className="space-y-4">
          {/* CSS Reference */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Calcular CSS
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                CSS (Critical Swim Speed) é o ritmo sustentável por longos
                períodos — análogo ao limiar anaeróbico.
              </p>
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5 font-mono text-[11px] text-text">
                <p className="font-semibold text-primary">CSS ≈ 200 / (T400 − T200)</p>
                <p className="mt-1 text-text-muted">Resultado em m/s → converta para seg/100m</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-[11px] text-text-muted space-y-0.5">
                <p className="font-semibold text-text">Exemplo</p>
                <p>400m em 6:00 (360s), 200m em 2:50 (170s)</p>
                <p className="font-mono">200 / (360 − 170) = 1,05 m/s</p>
                <p className="font-mono text-primary">≈ 1:35/100m (95 seg/100m)</p>
              </div>

              {/* Live calculator */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Calculadora rápida
                </p>
                <label>
                  <span className="mb-1 block text-[10px] text-text-muted">
                    Tempo 400m (mm:ss)
                  </span>
                  <input
                    type="text"
                    value={t400}
                    onChange={(e) => setT400(e.target.value)}
                    placeholder="ex: 6:00"
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] text-text-muted">
                    Tempo 200m (mm:ss)
                  </span>
                  <input
                    type="text"
                    value={t200}
                    onChange={(e) => setT200(e.target.value)}
                    placeholder="ex: 2:50"
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </label>

                <AnimatePresence>
                  {cssResult && (
                    <motion.div
                      key="css-result"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 space-y-1"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        CSS calculado
                      </p>
                      <p className="font-mono text-sm font-bold text-text">
                        {formatSecPer100m(Math.round(cssResult.secPer100m))}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono">
                        {cssResult.mPerSec.toFixed(2)} m/s ·{" "}
                        {Math.round(cssResult.secPer100m)} seg/100m
                      </p>
                      <button
                        type="button"
                        onClick={() => setCssPace(Math.round(cssResult.secPer100m))}
                        className="mt-1 w-full rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                      >
                        Usar no formulário
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Quick reference zones */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Zonas de intensidade
              </p>
              <div className="space-y-2 text-[11px]">
                {[
                  { label: "Z1 Recuperação", pace: "CSS + 15s+", color: "bg-teal-400" },
                  { label: "Z2 Endurance", pace: "CSS + 8–15s", color: "bg-green-400" },
                  { label: "Z3 Limiar", pace: "CSS + 3–8s", color: "bg-yellow-400" },
                  { label: "Z4 CSS / Limiar superior", pace: "CSS a CSS + 3s", color: "bg-orange-400" },
                  { label: "Z5 Sprint / VO₂máx", pace: "< CSS", color: "bg-red-400" },
                ].map((z) => (
                  <div key={z.label} className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", z.color)} />
                    <span className="flex-1 text-text">{z.label}</span>
                    <span className="font-mono text-text-muted">{z.pace}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
