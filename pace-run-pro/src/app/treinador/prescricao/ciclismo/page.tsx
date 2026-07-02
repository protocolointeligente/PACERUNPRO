"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AthleteListItem } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

// WorkoutType enum values for cycling
const bikeWorkoutTypes = [
  {
    value: "ENDURANCE_BIKE",
    label: "Endurance / Z2 Base",
    description: "55–75% FTP",
    pctFtp: 65,
    color: "#3b82f6",
  },
  {
    value: "SWEET_SPOT",
    label: "Sweet Spot",
    description: "88% FTP",
    pctFtp: 88,
    color: "#8b5cf6",
  },
  {
    value: "TEMPO_BIKE",
    label: "Tempo",
    description: "82% FTP",
    pctFtp: 82,
    color: "#f59e0b",
  },
  {
    value: "THRESHOLD_BIKE",
    label: "Limiar",
    description: "100% FTP",
    pctFtp: 100,
    color: "#ef4444",
  },
  {
    value: "VO2MAX_BIKE",
    label: "VO2máx",
    description: "110% FTP",
    pctFtp: 110,
    color: "#ec4899",
  },
  {
    value: "RECOVERY_BIKE",
    label: "Recuperação Ativa",
    description: "<55% FTP",
    pctFtp: 50,
    color: "#10b981",
  },
  {
    value: "LONG_RIDE",
    label: "Saída Longa",
    description: "60–70% FTP",
    pctFtp: 65,
    color: "#06b6d4",
  },
] as const;

type BikeWorkoutTypeValue = (typeof bikeWorkoutTypes)[number]["value"];

const powerZones = [
  { zone: "Z1", label: "<55% FTP", description: "Recuperação", color: "#10b981" },
  { zone: "Z2", label: "55–75% FTP", description: "Endurance", color: "#3b82f6" },
  { zone: "Z3", label: "75–90% FTP", description: "Tempo / Sweet Spot", color: "#f59e0b" },
  { zone: "Z4", label: "90–105% FTP", description: "Limiar", color: "#ef4444" },
  { zone: "Z5", label: "105–120% FTP", description: "VO2máx", color: "#ec4899" },
  { zone: "Z6", label: ">120% FTP", description: "Anaeróbico", color: "#7c3aed" },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function CiclismoPrescricaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);

  // Form state
  const [athleteId, setAthleteId] = useState("");
  const [workoutType, setWorkoutType] = useState<BikeWorkoutTypeValue>("ENDURANCE_BIKE");
  const [date, setDate] = useState(today());
  const [durationMin, setDurationMin] = useState<string>("60");
  const [ftp, setFtp] = useState<string>("");
  const [pctFtp, setPctFtp] = useState<string>("65");
  const [rpe, setRpe] = useState<string>("6");
  const [mainSet, setMainSet] = useState("");
  const [notes, setNotes] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch athletes
  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AthleteListItem[]) => {
        setAthletes(data);
        if (data.length > 0) setAthleteId(data[0].id);
      })
      .catch(() => null)
      .finally(() => setLoadingAthletes(false));
  }, []);

  // Auto-fill pctFtp when workout type changes
  function handleWorkoutTypeSelect(type: BikeWorkoutTypeValue) {
    setWorkoutType(type);
    const found = bikeWorkoutTypes.find((t) => t.value === type);
    if (found) setPctFtp(String(found.pctFtp));
  }

  // Auto-calculate target watts when FTP or pctFtp changes
  const targetWatts =
    ftp && pctFtp
      ? Math.round((Number(ftp) * Number(pctFtp)) / 100)
      : null;

  // Build a sensible title for the workout
  function buildTitle(): string {
    const typeMeta = bikeWorkoutTypes.find((t) => t.value === workoutType);
    const label = typeMeta?.label ?? workoutType;
    return `Ciclismo — ${label}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!athleteId || !date || !durationMin) {
      setError("Preencha atleta, data e duração.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body = {
        athleteId,
        date,
        type: workoutType,
        title: buildTitle(),
        sport: "BIKE",
        targetDurationMin: Number(durationMin),
        targetPowerPctFtp: pctFtp ? Number(pctFtp) : undefined,
        targetRpe: rpe ? Number(rpe) : undefined,
        objective: mainSet || undefined,
        notes: notes || undefined,
      };
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `Erro ${res.status}`);
      }
      setSuccess(true);
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setMainSet("");
        setNotes("");
        setDurationMin("60");
        setFtp("");
        setPctFtp("65");
        setRpe("6");
        setDate(today());
        setWorkoutType("ENDURANCE_BIKE");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar treino.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-16 sm:p-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-display text-xl font-bold text-text">
          🚴 Prescrição Ciclismo
        </h1>
        <p className="text-sm text-text-muted">
          Prescreva um treino de ciclismo baseado em FTP para um atleta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main form ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-5 p-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Athlete */}
                <label className="block">
                  <span className={labelClass}>Atleta</span>
                  {loadingAthletes ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Carregando atletas…
                    </div>
                  ) : (
                    <select
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value)}
                      className={inputClass}
                      required
                    >
                      {athletes.length === 0 && (
                        <option value="">Nenhum atleta encontrado</option>
                      )}
                      {athletes.map((a) => (
                        <option key={a.id} value={a.id} className="bg-card text-text">
                          {a.name}
                          {a.level ? ` — ${a.level}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                {/* Workout type chips */}
                <div>
                  <span className={labelClass}>Tipo de Treino</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {bikeWorkoutTypes.map((t) => {
                      const active = workoutType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => handleWorkoutTypeSelect(t.value)}
                          className={[
                            "flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                            active
                              ? "border-primary/60 bg-primary/10 ring-2 ring-primary/20"
                              : "border-border bg-background hover:border-primary/30 hover:bg-card-hover/30",
                          ].join(" ")}
                        >
                          <span
                            className="text-xs font-semibold leading-tight"
                            style={{ color: active ? t.color : undefined }}
                          >
                            {t.label}
                          </span>
                          <span className="text-[11px] text-text-muted">{t.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date + Duration */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Data</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Duração (minutos)</span>
                    <input
                      type="number"
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      min={5}
                      max={600}
                      placeholder="60"
                      className={inputClass}
                      required
                    />
                  </label>
                </div>

                {/* FTP + % FTP */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>FTP (watts, opcional)</span>
                    <input
                      type="number"
                      value={ftp}
                      onChange={(e) => setFtp(e.target.value)}
                      min={50}
                      max={700}
                      placeholder="Ex.: 260"
                      className={inputClass}
                    />
                  </label>
                  <div>
                    <label className="block">
                      <span className={labelClass}>Alvo % FTP</span>
                      <input
                        type="number"
                        value={pctFtp}
                        onChange={(e) => setPctFtp(e.target.value)}
                        min={30}
                        max={200}
                        placeholder="Ex.: 88"
                        className={inputClass}
                      />
                    </label>
                    {targetWatts !== null && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                        <Zap className="h-3 w-3 text-amber-400" />
                        Alvo calculado:
                        <span className="font-semibold text-text">{targetWatts} W</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* RPE */}
                <label className="block">
                  <span className={labelClass}>RPE (1–10)</span>
                  <select
                    value={rpe}
                    onChange={(e) => setRpe(e.target.value)}
                    className={inputClass}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                      <option key={v} value={v} className="bg-card text-text">
                        {v}
                        {v === 1
                          ? " — Muito leve"
                          : v === 3
                          ? " — Leve"
                          : v === 5
                          ? " — Moderado"
                          : v === 7
                          ? " — Difícil"
                          : v === 9
                          ? " — Muito difícil"
                          : v === 10
                          ? " — Máximo"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Main set description */}
                <label className="block">
                  <span className={labelClass}>Set Principal</span>
                  <textarea
                    value={mainSet}
                    onChange={(e) => setMainSet(e.target.value)}
                    rows={4}
                    placeholder="Descreva o set principal do treino…&#10;Ex.: 3×10 min @ 88% FTP com 5 min recuperação entre blocos"
                    className={inputClass}
                  />
                </label>

                {/* Notes */}
                <label className="block">
                  <span className={labelClass}>Observações</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Orientações adicionais, equipamento, percurso…"
                    className={inputClass}
                  />
                </label>

                {/* Error message */}
                {error && (
                  <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                {/* Success message */}
                {success && (
                  <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Treino prescrito com sucesso!
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || success}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Prescrever Treino
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar: Power zones reference ──────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                <Zap className="h-4 w-4 text-amber-400" />
                Zonas de Potência
              </h2>
              <div className="space-y-2">
                {powerZones.map((z) => (
                  <div
                    key={z.zone}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: z.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-text">{z.zone}</span>
                        <span className="font-mono text-[11px] text-text-muted">{z.label}</span>
                      </div>
                      <p className="text-[11px] text-text-muted">{z.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FTP quick calculator preview */}
              {ftp && (
                <div className="rounded-xl border border-border bg-background/40 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Watts por zona (FTP {ftp} W)
                  </p>
                  {[
                    { zone: "Z1", min: 0, max: 0.55 },
                    { zone: "Z2", min: 0.55, max: 0.75 },
                    { zone: "Z3", min: 0.75, max: 0.90 },
                    { zone: "Z4", min: 0.90, max: 1.05 },
                    { zone: "Z5", min: 1.05, max: 1.20 },
                    { zone: "Z6", min: 1.20, max: null },
                  ].map((z) => {
                    const ftpVal = Number(ftp);
                    const low = Math.round(ftpVal * z.min);
                    const high = z.max ? Math.round(ftpVal * z.max) : null;
                    const zoneColor = powerZones.find((p) => p.zone === z.zone)?.color;
                    return (
                      <div key={z.zone} className="flex items-center justify-between text-xs">
                        <span className="font-semibold" style={{ color: zoneColor }}>
                          {z.zone}
                        </span>
                        <span className="font-mono text-text-muted">
                          {z.min === 0 ? `< ${Math.round(ftpVal * 0.55)}` : high ? `${low}–${high}` : `> ${low}`} W
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
