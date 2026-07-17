"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Repeat2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  WorkoutBlock, BlockType, ZoneKey, ZONE_OPTIONS, BLOCK_TYPE_STYLE,
  makeBlockId, calcBlocksDuration, calcBlocksTSS, blocksSummary,
} from "@/lib/workout-blocks";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
const selectClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

interface Props {
  blocks: WorkoutBlock[];
  onChange: (blocks: WorkoutBlock[]) => void;
}

function ZoneSelect({ value, onChange }: { value: ZoneKey | null | undefined; onChange: (z: ZoneKey) => void }) {
  return (
    <select
      value={value ?? "LIVRE"}
      onChange={(e) => onChange(e.target.value as ZoneKey)}
      className={selectClass}
    >
      {ZONE_OPTIONS.map((z) => (
        <option key={z.value} value={z.value}>{z.label}</option>
      ))}
    </select>
  );
}

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: WorkoutBlock;
  index: number;
  total: number;
  onChange: (patch: Partial<WorkoutBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const style = BLOCK_TYPE_STYLE[block.type];
  const zoneColor = ZONE_OPTIONS.find((z) => z.value === (block.zone ?? "LIVRE"))?.color ?? "#9ca3af";

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", style.bg, style.border)}>
      {/* Block header */}
      <div className="flex items-center gap-2">
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white", style.badge)}>
          {index + 1}
        </span>
        <input
          value={block.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold text-text outline-none placeholder:text-text-muted/50"
          placeholder="Nome do bloco"
        />
        {/* Reorder */}
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-card-hover disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-card-hover disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={onRemove} disabled={total <= 1}
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block type selector (only for "main" and "other") */}
      {(block.type === "main" || block.type === "other") && (
        <div className="flex items-center gap-2 rounded-xl bg-background/60 p-1">
          <button
            type="button"
            onClick={() => onChange({ isInterval: false })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
              !block.isInterval
                ? "bg-primary text-white"
                : "text-text-muted hover:text-text"
            )}
          >
            <Timer className="h-3 w-3" />
            Contínuo
          </button>
          <button
            type="button"
            onClick={() => onChange({ isInterval: true, reps: block.reps ?? 4, repDurationMin: block.repDurationMin ?? 3, recoveryDurationMin: block.recoveryDurationMin ?? 2 })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
              block.isInterval
                ? "bg-primary text-white"
                : "text-text-muted hover:text-text"
            )}
          >
            <Repeat2 className="h-3 w-3" />
            Intervalado
          </button>
        </div>
      )}

      {/* Continuous fields */}
      {!block.isInterval && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Duração (min)</label>
            <input
              type="number" min={1}
              value={block.durationMin ?? ""}
              onChange={(e) => onChange({ durationMin: e.target.value ? Number(e.target.value) : null })}
              placeholder="10"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Zona</label>
            <ZoneSelect value={block.zone} onChange={(z) => onChange({ zone: z })} />
          </div>
        </div>
      )}

      {/* Interval fields */}
      {block.isInterval && (
        <div className="space-y-2">
          {/* Interval config */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Repetições</label>
              <input
                type="number" min={1}
                value={block.reps ?? ""}
                onChange={(e) => onChange({ reps: e.target.value ? Number(e.target.value) : null })}
                placeholder="6"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Duração (min)</label>
              <input
                type="number" min={0.5} step={0.5}
                value={block.repDurationMin ?? ""}
                onChange={(e) => onChange({ repDurationMin: e.target.value ? Number(e.target.value) : null, repDistanceM: null })}
                placeholder="3"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">— ou Dist (m)</label>
              <input
                type="number" min={100} step={100}
                value={block.repDistanceM ?? ""}
                onChange={(e) => onChange({ repDistanceM: e.target.value ? Number(e.target.value) : null, repDurationMin: null })}
                placeholder="400"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Zona do tiro</label>
              <ZoneSelect value={block.repZone ?? block.zone} onChange={(z) => onChange({ repZone: z })} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Zona da zona</label>
              <ZoneSelect value={block.zone} onChange={(z) => onChange({ zone: z })} />
            </div>
          </div>
          {/* Recovery */}
          <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Recuperação entre tiros</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-text-muted">Duração (min)</label>
                <input
                  type="number" min={0.5} step={0.5}
                  value={block.recoveryDurationMin ?? ""}
                  onChange={(e) => onChange({ recoveryDurationMin: e.target.value ? Number(e.target.value) : null, recoveryDistanceM: null })}
                  placeholder="2"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-text-muted">— ou Dist (m)</label>
                <input
                  type="number" min={100} step={100}
                  value={block.recoveryDistanceM ?? ""}
                  onChange={(e) => onChange({ recoveryDistanceM: e.target.value ? Number(e.target.value) : null, recoveryDurationMin: null })}
                  placeholder="400"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-text-muted">Zona</label>
                <ZoneSelect value={block.recoveryZone ?? "Z1"} onChange={(z) => onChange({ recoveryZone: z })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone color bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: `${zoneColor}40` }}>
          <div className="h-full rounded-full" style={{ backgroundColor: zoneColor, width: `${Math.min(100, (ZONE_OPTIONS.findIndex(z => z.value === (block.zone ?? "LIVRE")) + 1) * 20)}%` }} />
        </div>
        <span className="text-[10px] text-text-muted">{block.zone ?? "LIVRE"}</span>
      </div>

      {/* Notes */}
      <input
        value={block.notes ?? ""}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Instrução para o atleta (opcional)…"
        className={cn(inputClass, "text-xs")}
      />
    </div>
  );
}

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: "warmup",   label: "Aquecimento" },
  { value: "main",     label: "Estímulo" },
  { value: "cooldown", label: "Desaquecimento" },
  { value: "other",    label: "Outro bloco" },
];

export function WorkoutBlockEditor({ blocks, onChange }: Props) {
  const [newBlockType, setNewBlockType] = useState<BlockType>("main");

  function update(index: number, patch: Partial<WorkoutBlock>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function remove(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...blocks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    const next = [...blocks];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  function addBlock() {
    const style = BLOCK_TYPE_STYLE[newBlockType];
    const isMain = newBlockType === "main";
    onChange([...blocks, {
      id: makeBlockId(),
      type: newBlockType,
      label: style.label,
      durationMin: isMain ? 20 : 10,
      zone: isMain ? "Z3" : "Z1",
      isInterval: false,
      notes: "",
    }]);
  }

  const totalMin = calcBlocksDuration(blocks);
  const estimatedTSS = calcBlocksTSS(blocks);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
          onMoveUp={() => moveUp(i)}
          onMoveDown={() => moveDown(i)}
        />
      ))}

      {/* Add block row */}
      <div className="flex items-center gap-2">
        <select
          value={newBlockType}
          onChange={(e) => setNewBlockType(e.target.value as BlockType)}
          className={cn(selectClass, "max-w-[180px]")}
        >
          {BLOCK_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button type="button" size="sm" variant="secondary" onClick={addBlock}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar bloco
        </Button>
      </div>

      {/* Totals bar */}
      {blocks.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card-hover/40 px-4 py-2.5 text-sm">
          <span className="flex items-center gap-1.5 text-text-muted">
            <Timer className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-text">{totalMin} min</span>
            estimado
          </span>
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="font-semibold text-primary">TSS</span>
            ~{estimatedTSS}
          </span>
          <span className="hidden text-[11px] text-text-muted sm:block truncate">
            {blocksSummary(blocks)}
          </span>
        </div>
      )}
    </div>
  );
}
