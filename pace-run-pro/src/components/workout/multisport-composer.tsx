"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SportBadge, SPORT_CONFIG } from "./sport-icon";
import type { SportType, WorkoutType } from "@prisma/client";

// ── Mapeamento Sport → WorkoutType options ────────────────────────────────────

const SPORT_WORKOUT_TYPES: Record<SportType, { value: WorkoutType; label: string }[]> = {
  RUN: [
    { value: "RODAGEM_LEVE",      label: "Rodagem leve" },
    { value: "LONGAO",            label: "Longão" },
    { value: "INTERVALADO_CURTO", label: "Intervalado curto" },
    { value: "INTERVALADO_LONGO", label: "Intervalado longo" },
    { value: "TEMPO_RUN",         label: "Tempo Run" },
    { value: "FARTLEK",           label: "Fartlek" },
    { value: "PROGRESSIVO",       label: "Progressivo" },
    { value: "SUBIDA",            label: "Treino de subida" },
    { value: "REGENERATIVO",      label: "Regenerativo" },
    { value: "TECNICA",           label: "Técnica de corrida" },
    { value: "PROVA",             label: "Prova / Competição" },
  ],
  BIKE: [
    { value: "ENDURANCE_BIKE",  label: "Endurance / Base" },
    { value: "RECOVERY_BIKE",   label: "Recuperação ativa" },
    { value: "SWEET_SPOT",      label: "Sweet Spot (88% FTP)" },
    { value: "TEMPO_BIKE",      label: "Tempo (82% FTP)" },
    { value: "THRESHOLD_BIKE",  label: "Limiar (100% FTP)" },
    { value: "VO2MAX_BIKE",     label: "VO2máx (110% FTP)" },
    { value: "ANAEROBIC_BIKE",  label: "Anaeróbico" },
    { value: "SPRINT_BIKE",     label: "Sprint" },
    { value: "LONG_RIDE",       label: "Saída longa" },
  ],
  SWIM: [
    { value: "TECNICA_NATACAO",      label: "Técnica" },
    { value: "ENDURANCE_NATACAO",    label: "Endurance / Base" },
    { value: "INTERVALADO_NATACAO",  label: "Intervalados" },
    { value: "LIMIAR_NATACAO",       label: "Limiar / CSS" },
    { value: "SPRINT_NATACAO",       label: "Sprint" },
    { value: "RECUPERACAO_NATACAO",  label: "Recuperação" },
    { value: "AGUAS_ABERTAS",        label: "Águas abertas" },
  ],
  STRENGTH: [
    { value: "FORCA",     label: "Treino de força" },
    { value: "FUNCIONAL", label: "Funcional" },
  ],
  MOBILITY: [
    { value: "MOBILIDADE", label: "Mobilidade / Flexibilidade" },
    { value: "RECUPERACAO", label: "Recuperação ativa" },
  ],
  TRIATHLON: [
    { value: "SIMULADO_TRIATHLON", label: "Simulado de triathlon" },
    { value: "TREINO_COMBINADO",   label: "Treino combinado" },
    { value: "TRANSICAO",         label: "Transição T1/T2" },
  ],
  BRICK: [
    { value: "BRICK_BIKE_RUN",  label: "Brick Bike + Corrida" },
    { value: "BRICK_SWIM_BIKE", label: "Brick Natação + Bike" },
  ],
};

// ── Intensidade pré-definida ──────────────────────────────────────────────────

const INTENSITY_OPTIONS = [
  { value: "1",  label: "1 — Muito leve / Recuperação" },
  { value: "2",  label: "2 — Leve" },
  { value: "3",  label: "3 — Moderado leve" },
  { value: "4",  label: "4 — Moderado" },
  { value: "5",  label: "5 — Moderado forte" },
  { value: "6",  label: "6 — Forte" },
  { value: "7",  label: "7 — Muito forte" },
  { value: "8",  label: "8 — Intenso" },
  { value: "9",  label: "9 — Muito intenso" },
  { value: "10", label: "10 — Máximo" },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface QuickWorkoutData {
  sport: SportType;
  workoutType: WorkoutType;
  date: string;
  durationMin?: number;
  distanceKm?: number;
  rpe?: number;
  targetPowerPctFtp?: number;
  targetPacePer100m?: number;
  title: string;
  notes?: string;
  mainSet?: string;
}

interface MultisportComposerProps {
  date?: string;
  onSubmit: (data: QuickWorkoutData) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  defaultSport?: SportType;
}

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const selectCls = "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "mb-1 block text-sm font-medium";

// ── Componente ────────────────────────────────────────────────────────────────

export function MultisportComposer({
  date,
  onSubmit,
  onCancel,
  loading = false,
  defaultSport = "RUN",
}: MultisportComposerProps) {
  const [advanced, setAdvanced]   = useState(false);
  const [sport, setSport]         = useState<SportType>(defaultSport);
  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    SPORT_WORKOUT_TYPES[defaultSport][0].value,
  );
  const [durationMin, setDurationMin]           = useState("");
  const [distanceKm, setDistanceKm]             = useState("");
  const [rpe, setRpe]                           = useState("6");
  const [targetPowerPctFtp, setTargetPowerPctFtp] = useState("");
  const [targetPacePer100m, setTargetPacePer100m] = useState("");
  const [notes, setNotes]                       = useState("");
  const [mainSet, setMainSet]                   = useState("");
  const [submitting, setSubmitting]             = useState(false);

  const workoutTypes = SPORT_WORKOUT_TYPES[sport];

  function handleSportChange(s: SportType) {
    setSport(s);
    setWorkoutType(SPORT_WORKOUT_TYPES[s][0].value);
  }

  function buildTitle(): string {
    const typeLabel = workoutTypes.find((t) => t.value === workoutType)?.label ?? workoutType;
    return `${SPORT_CONFIG[sport].label} — ${typeLabel}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        sport,
        workoutType,
        date: date ?? new Date().toISOString().slice(0, 10),
        durationMin:       durationMin       ? parseInt(durationMin)        : undefined,
        distanceKm:        distanceKm        ? parseFloat(distanceKm)       : undefined,
        rpe:               rpe               ? parseInt(rpe)                : undefined,
        targetPowerPctFtp: targetPowerPctFtp ? parseInt(targetPowerPctFtp)  : undefined,
        targetPacePer100m: targetPacePer100m ? parseInt(targetPacePer100m)  : undefined,
        title:   buildTitle(),
        notes:   notes   || undefined,
        mainSet: mainSet || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isBike = sport === "BIKE";
  const isSwim = sport === "SWIM";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sport selector */}
      <div>
        <label className={labelCls}>Modalidade</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(Object.keys(SPORT_WORKOUT_TYPES) as SportType[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSportChange(s)}
              className={`rounded-full border transition-all text-sm px-3 py-1.5 ${
                sport === s
                  ? "ring-2 ring-offset-1 ring-primary font-semibold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <SportBadge sport={s} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {/* Workout type */}
      <div>
        <label htmlFor="wtype" className={labelCls}>Tipo de treino</label>
        <select
          id="wtype"
          className={selectCls}
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
        >
          {workoutTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Duration + Distance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dur" className={labelCls}>Duração (min)</label>
          <input
            id="dur"
            type="number"
            min={1}
            max={720}
            placeholder="ex: 60"
            className={inputCls}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="dist" className={labelCls}>
            {isSwim ? "Distância (m)" : "Distância (km)"}
          </label>
          <input
            id="dist"
            type="number"
            min={0}
            step={isSwim ? 100 : 0.1}
            placeholder={isSwim ? "ex: 2000" : "ex: 10"}
            className={inputCls}
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
          />
        </div>
      </div>

      {/* Intensity / RPE */}
      <div>
        <label htmlFor="rpe" className={labelCls}>Intensidade (RPE 1–10)</label>
        <select
          id="rpe"
          className={selectCls}
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
        >
          {INTENSITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setAdvanced((a) => !a)}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        {advanced ? "▲ Modo simples" : "▼ Modo avançado"}
      </button>

      {advanced && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          {isBike && (
            <div>
              <label htmlFor="pctftp" className={labelCls}>% FTP alvo</label>
              <input
                id="pctftp"
                type="number"
                min={40}
                max={200}
                placeholder="ex: 88 (sweet spot)"
                className={inputCls}
                value={targetPowerPctFtp}
                onChange={(e) => setTargetPowerPctFtp(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                55–75%: base · 75–90%: sweet spot · 90–105%: limiar · {">"} 105%: VO2máx
              </p>
            </div>
          )}

          {isSwim && (
            <div>
              <label htmlFor="swimpace" className={labelCls}>Pace alvo (seg/100m)</label>
              <input
                id="swimpace"
                type="number"
                min={40}
                max={300}
                placeholder="ex: 95 (= 1:35/100m)"
                className={inputCls}
                value={targetPacePer100m}
                onChange={(e) => setTargetPacePer100m(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor="mainset" className={labelCls}>Série principal (estrutura)</label>
            <textarea
              id="mainset"
              rows={3}
              placeholder={
                isSwim
                  ? "Ex: 10×100m @ CSS + 5s, descanso 20s"
                  : isBike
                  ? "Ex: 4×8min @ 95% FTP, rec 3min leve"
                  : "Ex: 6×800m @ pace 5k, pausa 2min trote"
              }
              className={inputCls}
              value={mainSet}
              onChange={(e) => setMainSet(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="notes" className={labelCls}>Observações</label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Instruções, equipamentos, contexto..."
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={loading || submitting}
          className="flex-1"
        >
          {submitting ? "Criando..." : "✓ Criar treino"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
