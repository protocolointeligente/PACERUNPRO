"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ClipboardEdit,
  Clock,
  Flame,
  Heart,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRpeLabel } from "@/lib/rpe";

interface WorkoutLogData {
  id: string;
  distanceKm?: number | null;
  durationSec?: number | null;
  rpe?: number | null;
  painLevel?: number | null;
  fatigueLevel?: number | null;
  feeling?: string | null;
  athleteFeedback?: string | null;
  actualLoad?: number | null;
  createdAt: string;
}

interface WorkoutLogSectionProps {
  workoutId: string;
  status: string;
  plannedDistanceKm?: number | null;
  plannedDurationMin?: number | null;
  plannedRpe?: number | null;
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text-muted/40 outline-none focus:border-primary/60 transition-colors";

function SecField({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 font-display text-base font-bold text-text">
        {value}{unit ? <span className="ml-0.5 text-xs font-normal text-text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

function RpeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = ["","#4ade80","#4ade80","#84cc16","#84cc16","#38bdf8","#38bdf8","#a78bfa","#fb923c","#f97316","#ef4444"];
  const col = colors[value] ?? "#a78bfa";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs text-text-muted">RPE (esforço percebido) 1–10</label>
        <span className="rounded-lg px-2 py-0.5 text-sm font-bold" style={{ color: col, backgroundColor: `${col}22` }}>
          {value} — {getRpeLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-primary rounded-full"
      />
      <div className="mt-1 flex justify-between text-[9px] text-text-muted/60">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

function FeelingBar({
  label, value, onChange, color,
}: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}/10</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex-1 rounded-md transition-all"
            style={{
              height: "1.5rem",
              backgroundColor: n <= value ? color : `${color}33`,
              border: n === value ? `2px solid ${color}` : "2px solid transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkoutLogSection({
  workoutId,
  status,
  plannedDistanceKm,
  plannedDurationMin,
  plannedRpe,
}: WorkoutLogSectionProps) {
  const [log, setLog] = useState<WorkoutLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form state
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [rpe, setRpe] = useState(5);
  const [painLevel, setPainLevel] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/workouts/${workoutId}/log`)
      .then((r) => r.ok ? r.json() : { log: null })
      .then((d) => setLog(d.log ?? null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [workoutId]);

  function openModal() {
    // Pre-fill with logged data if it exists
    if (log) {
      setDistanceKm(log.distanceKm?.toString() ?? "");
      setDurationMin(log.durationSec ? String(Math.round(log.durationSec / 60)) : "");
      setRpe(log.rpe ?? 5);
      setPainLevel(log.painLevel ?? 0);
      setFatigueLevel(log.fatigueLevel ?? 0);
      setFeedback(log.athleteFeedback ?? "");
    }
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { rpe };
      if (distanceKm) body.distanceKm = parseFloat(distanceKm.replace(",", "."));
      if (durationMin) body.durationSec = Math.round(parseFloat(durationMin) * 60);
      if (painLevel > 0) body.painLevel = painLevel;
      if (fatigueLevel > 0) body.fatigueLevel = fatigueLevel;
      if (feedback.trim()) body.athleteFeedback = feedback.trim();

      const res = await fetch(`/api/workouts/${workoutId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Erro ao salvar treino.");
        return;
      }

      const saved = await res.json();
      // Refresh log data
      const refreshed = await fetch(`/api/workouts/${workoutId}/log`).then(r => r.json()).catch(() => ({ log: null }));
      setLog(refreshed.log ?? { id: saved.logId, distanceKm: body.distanceKm as number, durationSec: body.durationSec as number, rpe, painLevel, fatigueLevel, athleteFeedback: feedback, actualLoad: saved.actualLoad, createdAt: new Date().toISOString() });
      setOpen(false);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const isCompleted = status === "CONCLUIDO" || log != null;

  return (
    <>
      {/* Summary card */}
      {log ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                  Treino concluído
                </h3>
              </div>
              <button
                onClick={openModal}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:border-primary/40 hover:text-text transition-colors"
              >
                <ClipboardEdit className="h-3 w-3" /> Editar
              </button>
            </div>

            {/* Planned vs actual */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(plannedDistanceKm || log.distanceKm) && (
                <div className="col-span-1">
                  <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                    <MapPin className="h-3 w-3" /> Distância
                  </p>
                  {plannedDistanceKm && (
                    <p className="text-xs text-text-muted/60">Planejado: {plannedDistanceKm} km</p>
                  )}
                  {log.distanceKm && (
                    <p className="font-display text-lg font-bold text-text">{log.distanceKm.toFixed(2)} km</p>
                  )}
                </div>
              )}
              {(plannedDurationMin || log.durationSec) && (
                <div className="col-span-1">
                  <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                    <Clock className="h-3 w-3" /> Duração
                  </p>
                  {plannedDurationMin && (
                    <p className="text-xs text-text-muted/60">Planejado: {plannedDurationMin} min</p>
                  )}
                  {log.durationSec && (
                    <p className="font-display text-lg font-bold text-text">{Math.round(log.durationSec / 60)} min</p>
                  )}
                </div>
              )}
              {log.rpe && (
                <div className="col-span-1">
                  <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                    <Flame className="h-3 w-3" /> RPE
                  </p>
                  {plannedRpe && (
                    <p className="text-xs text-text-muted/60">Planejado: {plannedRpe}</p>
                  )}
                  <p className="font-display text-lg font-bold text-text">{log.rpe}/10</p>
                </div>
              )}
              {log.actualLoad && (
                <div className="col-span-1">
                  <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                    <Heart className="h-3 w-3" /> Carga
                  </p>
                  <p className="font-display text-lg font-bold text-text">{log.actualLoad} UA</p>
                </div>
              )}
            </div>

            {/* Pain/fatigue & feedback */}
            {((log.painLevel && log.painLevel > 0) || (log.fatigueLevel && log.fatigueLevel > 0)) && (
              <div className="mt-3 flex gap-4 text-xs text-text-muted">
                {log.painLevel && log.painLevel > 0 && (
                  <span>Dor: <strong className={log.painLevel >= 7 ? "text-error" : "text-text"}>{log.painLevel}/10</strong></span>
                )}
                {log.fatigueLevel && log.fatigueLevel > 0 && (
                  <span>Fadiga: <strong className={log.fatigueLevel >= 8 ? "text-warning" : "text-text"}>{log.fatigueLevel}/10</strong></span>
                )}
              </div>
            )}
            {log.athleteFeedback && (
              <div className="mt-3 rounded-xl bg-card-hover p-3 text-sm text-text-muted">
                <MessageSquare className="mb-1 h-3.5 w-3.5 inline-block mr-1" />
                {log.athleteFeedback}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        !isCompleted && (
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <ClipboardEdit className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-semibold text-text">Registre sua execução</p>
                <p className="mt-1 text-xs text-text-muted">Informe distância, duração e RPE para fechar o ciclo planned → actual.</p>
              </div>
              <Button onClick={openModal} size="sm" className="px-6">
                Registrar conclusão
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Log modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text">Registrar execução</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">Distância (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={plannedDistanceKm ? String(plannedDistanceKm) : "0.00"}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">Duração (min)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder={plannedDurationMin ? String(plannedDurationMin) : "0"}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <RpeSlider value={rpe} onChange={setRpe} />

              <div className="space-y-3">
                <FeelingBar label="Dor (0 = sem dor)" value={painLevel} onChange={setPainLevel} color="#f87171" />
                <FeelingBar label="Fadiga" value={fatigueLevel} onChange={setFatigueLevel} color="#fb923c" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Como foi o treino?</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Sensações, condições, observações..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">{error}</p>}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Salvando…" : "Salvar execução"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
