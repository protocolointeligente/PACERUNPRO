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

const TRIATHLON_WORKOUT_TYPES = [
  { value: "BRICK_BIKE_RUN", label: "Brick Bike+Run", description: "Treino de transição B→R", sport: "BRICK", color: "#f97316" },
  { value: "BRICK_SWIM_BIKE", label: "Brick Nado+Bike", description: "Transição N→B", sport: "BRICK", color: "#f97316" },
  { value: "TREINO_COMBINADO", label: "Treino Combinado", description: "Multiesporte num treino", sport: "TRIATHLON", color: "#C6F24E" },
  { value: "SPRINT_TRIATHLON", label: "Simulado Sprint", description: "750m+20km+5km ritmo raça", sport: "TRIATHLON", color: "#a855f7" },
  { value: "OLIMPICO", label: "Simulado Olímpico", description: "1500m+40km+10km", sport: "TRIATHLON", color: "#eab308" },
  { value: "CORRIDA_TRIATLO", label: "Corrida (especif. tri)", description: "Corrida no ritmo raça", sport: "RUN", color: "#3b82f6" },
] as const;

type TriWorkoutTypeValue = (typeof TRIATHLON_WORKOUT_TYPES)[number]["value"];

function today() {
  return new Date().toISOString().split("T")[0];
}

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

export default function TriathlonPrescricaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [workoutType, setWorkoutType] = useState<TriWorkoutTypeValue>("BRICK_BIKE_RUN");
  const [date, setDate] = useState(today());
  const [duration, setDuration] = useState(90);
  const [rpe, setRpe] = useState(7);
  const [mainSet, setMainSet] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/treinador/atletas")
      .then((r) => r.json() as Promise<AthleteListItem[]>)
      .then(setAthletes)
      .catch(() => {});
  }, []);

  const selectedType = TRIATHLON_WORKOUT_TYPES.find((t) => t.value === workoutType);

  const handleSubmit = async () => {
    if (!selectedId || !workoutType) {
      setError("Selecione um atleta e tipo de treino.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/coach/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        athleteId: selectedId,
        date,
        sport: selectedType?.sport ?? "TRIATHLON",
        workoutType,
        title: selectedType?.label ?? workoutType,
        targetDurationMin: duration,
        targetRpe: rpe,
        mainSet: mainSet || null,
        notes: notes || null,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setMainSet("");
      setNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const d = await res.json() as { error?: string };
      setError(d?.error ?? "Erro ao salvar.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🏅</span>
          <h1 className="text-xl font-bold">Prescrição de Triathlon</h1>
        </div>
        <p className="text-sm text-text-muted">Bricks, simulados e treinos multiesporte combinados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Athlete selector */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-semibold">Atleta</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {athletes.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                      selectedId === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-base">🏅</span>
                    <span className="truncate">{a.name}</span>
                    {selectedId === a.id && <CheckCircle2 size={14} className="ml-auto shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workout type */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Tipo de treino</p>
              <div className="grid grid-cols-2 gap-2">
                {TRIATHLON_WORKOUT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setWorkoutType(t.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      workoutType === t.value
                        ? "border-2 bg-card"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                    style={workoutType === t.value ? { borderColor: t.color } : {}}
                  >
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-text-muted">{t.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-semibold">Detalhes</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Data</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Duração (min)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(+e.target.value)}
                    min={15} max={480} step={5} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>RPE alvo (1–10): {rpe}</label>
                <input type="range" min={1} max={10} value={rpe}
                  onChange={(e) => setRpe(+e.target.value)} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Muito leve</span><span>Máximo</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Plano do treino</label>
                <textarea
                  value={mainSet}
                  onChange={(e) => setMainSet(e.target.value)}
                  placeholder="Ex: Bike 40km Z2 → T2 → Corrida 5km ritmo raça"
                  className={`${inputClass} min-h-[80px] resize-none font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Observações</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções adicionais, foco do dia..." rows={2}
                  className={`${inputClass} resize-none`} />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button onClick={handleSubmit} disabled={loading || !selectedId} className="w-full gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : success ? <CheckCircle2 size={16} /> : <Send size={16} />}
                {success ? "Treino enviado!" : "Enviar treino"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reference sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <p className="text-sm font-semibold">Sobre bricks</p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Treinos brick combinam duas modalidades sequencialmente para adaptar o corpo às transições T1 e T2. A intensidade reduzida na corrida pós-bike é normal nos primeiros meses.
              </p>
              <div className="space-y-2 mt-2">
                {[
                  ["Sprint", "750m nado + 20km bike + 5km corrida"],
                  ["Olímpico", "1,5km + 40km + 10km"],
                  ["70.3", "1,9km + 90km + 21km"],
                  ["Ironman", "3,8km + 180km + 42km"],
                ].map(([label, desc]) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="text-primary font-semibold w-20 shrink-0">{label}</span>
                    <span className="text-text-muted">{desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">Distribuição sugerida</p>
              <div className="space-y-2">
                {[
                  { label: "Natação", pct: "15%", color: "#06b6d4" },
                  { label: "Ciclismo", pct: "50%", color: "#f97316" },
                  { label: "Corrida", pct: "35%", color: "#3b82f6" },
                ].map((z) => (
                  <div key={z.label} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="flex-1 text-text-muted">{z.label}</span>
                    <span className="font-semibold" style={{ color: z.color }}>{z.pct}</span>
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
