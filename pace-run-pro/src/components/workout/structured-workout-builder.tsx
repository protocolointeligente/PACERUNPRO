"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Play, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────

type BlockPhase = "WARMUP" | "WORK" | "RECOVERY" | "COOLDOWN" | "REST";
type BlockDurationType = "TIME" | "DISTANCE" | "OPEN";
type BlockTargetType = "PACE" | "POWER" | "HR" | "RPE" | "CSS" | "FREE";
type BlockSport = "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "MOBILITY";

export interface WorkoutBlock {
  id: string;
  phase: BlockPhase;
  sport: BlockSport;
  repeatCount: number;
  durationType: BlockDurationType;
  durationSeconds: number;
  distanceMeters: number;
  targetType: BlockTargetType;
  targetMin: number;
  targetMax: number;
  targetUnit: string;
  instruction: string;
  countdownEnabled: boolean;
  autoAdvance: boolean;
  vibrationEnabled: boolean;
}

interface StructuredWorkoutBuilderProps {
  sport: BlockSport;
  onChange?: (blocks: WorkoutBlock[]) => void;
  onPreview?: (blocks: WorkoutBlock[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<BlockPhase, { label: string; color: string; emoji: string }> = {
  WARMUP:   { label: "Aquecimento",   color: "#f97316", emoji: "🌡️" },
  WORK:     { label: "Trabalho",      color: "#C6F24E", emoji: "⚡" },
  RECOVERY: { label: "Recuperação",   color: "#06b6d4", emoji: "🔄" },
  COOLDOWN: { label: "Desaquecimento",color: "#a855f7", emoji: "❄️" },
  REST:     { label: "Descanso",      color: "#6b7280", emoji: "⏸️" },
};

const TARGET_UNITS: Record<BlockTargetType, string> = {
  PACE: "sec/km", POWER: "% FTP", HR: "bpm", RPE: "RPE", CSS: "sec/100m", FREE: "",
};

let blockCounter = 0;
function newId() { return `blk-${++blockCounter}`; }

function defaultBlock(sport: BlockSport, phase: BlockPhase): WorkoutBlock {
  const targetType: BlockTargetType =
    sport === "BIKE" ? "POWER" : sport === "SWIM" ? "CSS" : "PACE";
  const [tmin, tmax] =
    sport === "BIKE" ? [80, 90] :
    sport === "SWIM" ? [85, 95] :
    phase === "WARMUP" || phase === "COOLDOWN" ? [330, 360] :
    phase === "RECOVERY" ? [320, 350] : [280, 310];

  return {
    id: newId(),
    phase,
    sport,
    repeatCount: 1,
    durationType: "TIME",
    durationSeconds: phase === "WARMUP" || phase === "COOLDOWN" ? 600 : 180,
    distanceMeters: 0,
    targetType,
    targetMin: tmin,
    targetMax: tmax,
    targetUnit: TARGET_UNITS[targetType],
    instruction: PHASE_CONFIG[phase].label,
    countdownEnabled: phase === "WORK",
    autoAdvance: true,
    vibrationEnabled: true,
  };
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}min` : `${m}:${s.toString().padStart(2, "0")}`;
}

function totalDurationSec(blocks: WorkoutBlock[]): number {
  return blocks.reduce((a, b) => a + b.durationSeconds * b.repeatCount, 0);
}

// ── Block Editor ───────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
}: {
  block: WorkoutBlock;
  onChange: (b: WorkoutBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PHASE_CONFIG[block.phase];

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
      {/* Summary row */}
      <div className="flex items-center gap-2 p-3 bg-card">
        <GripVertical size={14} className="text-text-muted shrink-0" />
        <span>{cfg.emoji}</span>
        <span className="text-sm font-medium flex-1">
          {block.repeatCount > 1 && <span className="text-primary font-bold">{block.repeatCount}× </span>}
          {cfg.label}
          {block.durationType === "TIME" && (
            <span className="text-text-muted ml-2">{fmtDuration(block.durationSeconds)}</span>
          )}
          {block.durationType === "DISTANCE" && (
            <span className="text-text-muted ml-2">{block.distanceMeters}m</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} title="Duplicar" className="text-text-muted hover:text-foreground p-1">
            <Copy size={13} />
          </button>
          <button onClick={onMoveUp} disabled={isFirst} className="text-text-muted hover:text-foreground p-1 disabled:opacity-30">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-text-muted hover:text-foreground p-1 disabled:opacity-30">
            <ChevronDown size={14} />
          </button>
          <button onClick={onRemove} className="text-red-400 hover:text-red-300 p-1" title="Remover">
            <Trash2 size={13} />
          </button>
          <button onClick={() => setExpanded((v) => !v)} className="text-text-muted hover:text-foreground p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="p-3 space-y-3 bg-background/50 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Fase</label>
              <select value={block.phase} onChange={(e) => onChange({ ...block, phase: e.target.value as BlockPhase })}
                className={inputCls}>
                {Object.entries(PHASE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Repetições</label>
              <input type="number" min={1} max={30} value={block.repeatCount}
                onChange={(e) => onChange({ ...block, repeatCount: +e.target.value })}
                className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Tipo de duração</label>
              <select value={block.durationType} onChange={(e) => onChange({ ...block, durationType: e.target.value as BlockDurationType })}
                className={inputCls}>
                <option value="TIME">Tempo</option>
                <option value="DISTANCE">Distância</option>
                <option value="OPEN">Aberto</option>
              </select>
            </div>
            {block.durationType === "TIME" && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Duração (min)</label>
                <input type="number" min={1} max={240} value={Math.round(block.durationSeconds / 60)}
                  onChange={(e) => onChange({ ...block, durationSeconds: +e.target.value * 60 })}
                  className={inputCls} />
              </div>
            )}
            {block.durationType === "DISTANCE" && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Distância (m)</label>
                <input type="number" min={100} step={100} value={block.distanceMeters}
                  onChange={(e) => onChange({ ...block, distanceMeters: +e.target.value })}
                  className={inputCls} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Alvo</label>
              <select value={block.targetType}
                onChange={(e) => {
                  const tt = e.target.value as BlockTargetType;
                  onChange({ ...block, targetType: tt, targetUnit: TARGET_UNITS[tt] });
                }}
                className={inputCls}>
                <option value="PACE">Pace</option>
                <option value="POWER">Potência</option>
                <option value="HR">FC</option>
                <option value="RPE">RPE</option>
                <option value="CSS">CSS</option>
                <option value="FREE">Livre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Mín</label>
              <input type="number" value={block.targetMin}
                onChange={(e) => onChange({ ...block, targetMin: +e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Máx</label>
              <input type="number" value={block.targetMax}
                onChange={(e) => onChange({ ...block, targetMax: +e.target.value })}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Instrução</label>
            <input type="text" value={block.instruction}
              onChange={(e) => onChange({ ...block, instruction: e.target.value })}
              placeholder="Ex: Manter pace Z3, cadência 90rpm..."
              className={inputCls} />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            {[
              ["Contagem regressiva", "countdownEnabled"],
              ["Avançar automático", "autoAdvance"],
              ["Vibração", "vibrationEnabled"],
            ].map(([label, key]) => (
              <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={block[key as keyof WorkoutBlock] as boolean}
                  onChange={(e) => onChange({ ...block, [key]: e.target.checked })}
                  className="accent-primary" />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Builder ────────────────────────────────────────────────────────────

const QUICK_ADD: Array<{ phase: BlockPhase; label: string }> = [
  { phase: "WARMUP",   label: "+ Aquecimento" },
  { phase: "WORK",     label: "+ Trabalho" },
  { phase: "RECOVERY", label: "+ Recuperação" },
  { phase: "COOLDOWN", label: "+ Desaquecimento" },
];

export function StructuredWorkoutBuilder({ sport, onChange, onPreview }: StructuredWorkoutBuilderProps) {
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([
    defaultBlock(sport, "WARMUP"),
    defaultBlock(sport, "WORK"),
    defaultBlock(sport, "RECOVERY"),
    defaultBlock(sport, "COOLDOWN"),
  ]);

  const update = (updated: WorkoutBlock[]) => {
    setBlocks(updated);
    onChange?.(updated);
  };

  const addBlock = (phase: BlockPhase) => {
    update([...blocks, defaultBlock(sport, phase)]);
  };

  const removeBlock = (idx: number) => {
    update(blocks.filter((_, i) => i !== idx));
  };

  const updateBlock = (idx: number, b: WorkoutBlock) => {
    const next = [...blocks];
    next[idx] = b;
    update(next);
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  const duplicateBlock = (idx: number) => {
    const dup = { ...blocks[idx], id: newId() };
    const next = [...blocks.slice(0, idx + 1), dup, ...blocks.slice(idx + 1)];
    update(next);
  };

  const totalMin = Math.round(totalDurationSec(blocks) / 60);

  return (
    <div className="space-y-3">
      {/* Blocks */}
      <div className="space-y-2">
        {blocks.map((block, idx) => (
          <BlockEditor
            key={block.id}
            block={block}
            onChange={(b) => updateBlock(idx, b)}
            onRemove={() => removeBlock(idx)}
            onMoveUp={() => moveBlock(idx, -1)}
            onMoveDown={() => moveBlock(idx, 1)}
            onDuplicate={() => duplicateBlock(idx)}
            isFirst={idx === 0}
            isLast={idx === blocks.length - 1}
          />
        ))}
      </div>

      {/* Quick add */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map(({ phase, label }) => (
          <button key={phase} onClick={() => addBlock(phase)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors">
            <Plus size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-3">
        <span>{blocks.length} bloco{blocks.length !== 1 ? "s" : ""} · {totalMin} min estimado</span>
        {onPreview && (
          <Button size="sm" variant="outline" onClick={() => onPreview(blocks)} className="gap-2 h-7 text-xs">
            <Play size={12} /> Prévia
          </Button>
        )}
      </div>
    </div>
  );
}
