"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Copy, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ZONE_PRESETS,
  SPORT_LABELS,
  METHOD_LABELS,
  type ZoneDef,
  type ZoneModelPreset,
} from "@/lib/zone-models";

interface ZoneModel {
  id: string;
  name: string;
  sport: string;
  method: string;
  zoneCount: number;
  zones: ZoneDef[];
  createdAt: string;
  updatedAt: string;
}

const SPORTS = Object.keys(SPORT_LABELS);
const METHODS = Object.keys(METHOD_LABELS);

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
const selectClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ── Default zone names ────────────────────────────────────────────────────────

function defaultZones(count: number, method: string): ZoneDef[] {
  const FIVE_ZONE_DEFAULTS: ZoneDef[] = [
    { number: 1, name: "Z1 — Recuperação",       color: "#4ade80", minPct: 50,  maxPct: 60,  rpeRange: [1,2] },
    { number: 2, name: "Z2 — Aeróbico Leve",     color: "#38bdf8", minPct: 60,  maxPct: 70,  rpeRange: [3,4] },
    { number: 3, name: "Z3 — Aeróbico Moderado", color: "#a78bfa", minPct: 70,  maxPct: 80,  rpeRange: [5,6] },
    { number: 4, name: "Z4 — Limiar",            color: "#fb923c", minPct: 80,  maxPct: 90,  rpeRange: [7,8] },
    { number: 5, name: "Z5 — VO2máx/Anaeróbico", color: "#f87171", minPct: 90,  maxPct: 100, rpeRange: [9,10] },
  ];
  const SEVEN_ZONE_DEFAULTS: ZoneDef[] = [
    { number: 1, name: "Z1 — Recuperação Ativa",       color: "#4ade80", minPct: 0,   maxPct: 55 },
    { number: 2, name: "Z2 — Resistência",             color: "#38bdf8", minPct: 55,  maxPct: 75 },
    { number: 3, name: "Z3 — Ritmo/Tempo",             color: "#34d399", minPct: 75,  maxPct: 90 },
    { number: 4, name: "Z4 — Limiar Lactato",          color: "#fb923c", minPct: 90,  maxPct: 105 },
    { number: 5, name: "Z5 — VO2máx",                  color: "#f87171", minPct: 105, maxPct: 120 },
    { number: 6, name: "Z6 — Cap. Anaeróbica",         color: "#ef4444", minPct: 120, maxPct: 150 },
    { number: 7, name: "Z7 — Potência Neuromuscular",  color: "#dc2626", minPct: 150, maxPct: 999 },
  ];
  const THREE_ZONE_DEFAULTS: ZoneDef[] = [
    { number: 1, name: "Z1 — Leve",     color: "#4ade80", minPct: 0,  maxPct: 75 },
    { number: 2, name: "Z2 — Moderado", color: "#fb923c", minPct: 75, maxPct: 90 },
    { number: 3, name: "Z3 — Intenso",  color: "#f87171", minPct: 90, maxPct: 100 },
  ];
  if (method === "RPE") {
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      name: `Zona ${i + 1}`,
      color: ["#4ade80","#38bdf8","#a78bfa","#fb923c","#f87171","#ef4444","#dc2626"][i] ?? "#9ca3af",
      minPct: 0,
      maxPct: 0,
      rpeRange: [i * 2 + 1, Math.min(i * 2 + 2, 10)] as [number, number],
    }));
  }
  if (count === 7) return SEVEN_ZONE_DEFAULTS;
  if (count === 3) return THREE_ZONE_DEFAULTS;
  return FIVE_ZONE_DEFAULTS;
}

// ── Zone Editor ───────────────────────────────────────────────────────────────

function ZoneEditor({
  zones,
  method,
  onChange,
}: {
  zones: ZoneDef[];
  method: string;
  onChange: (zones: ZoneDef[]) => void;
}) {
  const isRpe = method === "RPE";
  const isPace = method === "PACE";

  const updateZone = (i: number, patch: Partial<ZoneDef>) => {
    const next = zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "grid gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
        isRpe ? "grid-cols-[2rem_1fr_3rem_3rem_5rem]" : "grid-cols-[2rem_1fr_3rem_4rem_4rem_3rem]"
      )}>
        <span>#</span>
        <span>Nome da zona</span>
        <span>Cor</span>
        {!isRpe && <span>{isPace ? "Min%" : "Mín %"}</span>}
        {!isRpe && <span>{isPace ? "Max%" : "Máx %"}</span>}
        <span>RPE</span>
      </div>
      {zones.map((z, i) => (
        <div key={i} className={cn(
          "grid items-center gap-2",
          isRpe ? "grid-cols-[2rem_1fr_3rem_3rem_5rem]" : "grid-cols-[2rem_1fr_3rem_4rem_4rem_3rem]"
        )}>
          <span className="text-center text-xs font-bold text-text-muted">{z.number}</span>
          <input
            value={z.name}
            onChange={(e) => updateZone(i, { name: e.target.value })}
            className={inputClass}
          />
          <input
            type="color"
            value={z.color}
            onChange={(e) => updateZone(i, { color: e.target.value })}
            className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          />
          {!isRpe && (
            <input
              type="number"
              value={z.minPct}
              onChange={(e) => updateZone(i, { minPct: Number(e.target.value) })}
              className={cn(inputClass, "text-center")}
            />
          )}
          {!isRpe && (
            <input
              type="number"
              value={z.maxPct === 999 ? "" : z.maxPct}
              placeholder="Max"
              onChange={(e) => updateZone(i, { maxPct: e.target.value ? Number(e.target.value) : 999 })}
              className={cn(inputClass, "text-center")}
            />
          )}
          <input
            value={z.rpeRange ? `${z.rpeRange[0]}-${z.rpeRange[1]}` : ""}
            onChange={(e) => {
              const parts = e.target.value.split("-").map(Number);
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                updateZone(i, { rpeRange: [parts[0], parts[1]] });
              }
            }}
            placeholder="ex: 5-7"
            className={cn(inputClass, "text-center text-xs")}
          />
        </div>
      ))}
    </div>
  );
}

// ── Create/Edit Modal ─────────────────────────────────────────────────────────

interface FormState {
  name: string;
  sport: string;
  method: string;
  zoneCount: number;
  zones: ZoneDef[];
}

function ZoneModelModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ZoneModel | ZoneModelPreset;
  onSave: (data: Omit<FormState, never>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (initial) {
      return {
        name: initial.name,
        sport: initial.sport,
        method: initial.method,
        zoneCount: initial.zoneCount,
        zones: initial.zones,
      };
    }
    return { name: "", sport: "CORRIDA", method: "FC_MAXIMA", zoneCount: 5, zones: defaultZones(5, "FC_MAXIMA") };
  });
  const [saving, setSaving] = useState(false);

  const handleZoneCountChange = (count: number) => {
    setForm((f) => ({
      ...f,
      zoneCount: count,
      zones: defaultZones(count, f.method),
    }));
  };

  const handleMethodChange = (method: string) => {
    setForm((f) => ({
      ...f,
      method,
      zones: defaultZones(f.zoneCount, method),
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 mb-8 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-display text-base font-bold text-text">
              {initial && "id" in initial ? "Editar modelo" : "Novo modelo de zona"}
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover">
              <Plus className="h-4 w-4 rotate-45" />
            </button>
          </div>

          <div className="space-y-5 p-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome do modelo</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ex: Corrida Avançada"
                className={inputClass}
              />
            </div>

            {/* Sport + Method + Zone count */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Modalidade</label>
                <select
                  value={form.sport}
                  onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}
                  className={selectClass}
                >
                  {SPORTS.map((s) => <option key={s} value={s}>{SPORT_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Método</label>
                <select
                  value={form.method}
                  onChange={(e) => handleMethodChange(e.target.value)}
                  className={selectClass}
                >
                  {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nº de zonas</label>
                <select
                  value={form.zoneCount}
                  onChange={(e) => handleZoneCountChange(Number(e.target.value))}
                  className={selectClass}
                >
                  {[3, 5, 7].map((n) => <option key={n} value={n}>{n} zonas</option>)}
                </select>
              </div>
            </div>

            {/* Zone definitions */}
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Definição das zonas — {METHOD_LABELS[form.method]}
              </label>
              <ZoneEditor
                zones={form.zones}
                method={form.method}
                onChange={(zones) => setForm((f) => ({ ...f, zones }))}
              />
              {form.method !== "RPE" && (
                <p className="mt-2 text-[11px] text-text-muted">
                  % relativo ao parâmetro de referência ({form.method === "FTP" ? "FTP em watts" : form.method === "PACE" ? "pace de limiar" : "FC máxima ou limiar"}). Máx vazio = sem limite superior.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar modelo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Zone Model Card ───────────────────────────────────────────────────────────

function ZoneModelCard({
  model,
  onEdit,
  onDelete,
}: {
  model: ZoneModel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          {/* Color stripe */}
          <div className="flex flex-col gap-0.5">
            {model.zones.slice(0, 5).map((z, i) => (
              <div key={i} className="h-2.5 w-2 rounded-full" style={{ backgroundColor: z.color }} />
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-text truncate">{model.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{SPORT_LABELS[model.sport] ?? model.sport}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{METHOD_LABELS[model.method] ?? model.method}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.zoneCount} zonas</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
              title="Ver zonas"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded zone table */}
        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="space-y-1.5">
              {model.zones.map((z) => (
                <div key={z.number} className="flex items-center gap-3 rounded-lg bg-card-hover/30 px-3 py-2">
                  <div className="h-4 w-4 shrink-0 rounded-full border border-border/50" style={{ backgroundColor: z.color }} />
                  <span className="text-[11px] font-semibold text-text-muted w-6 shrink-0">Z{z.number}</span>
                  <span className="text-sm font-medium text-text flex-1">{z.name}</span>
                  {(z.minPct > 0 || z.maxPct > 0) && (
                    <span className="text-[11px] text-text-muted font-mono">
                      {z.minPct}–{z.maxPct === 999 ? "∞" : z.maxPct}%
                    </span>
                  )}
                  {z.rpeRange && (
                    <span className="text-[11px] text-text-muted">RPE {z.rpeRange[0]}-{z.rpeRange[1]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ZoneModelsPage() {
  const [models, setModels] = useState<ZoneModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ZoneModel | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadModels() {
    setLoading(true);
    const data = await fetch("/api/coach/zone-models")
      .then((r) => r.ok ? r.json() : [])
      .catch(() => []);
    setModels(data);
    setLoading(false);
  }

  useEffect(() => { loadModels(); }, []);

  async function handleSave(form: {
    name: string; sport: string; method: string; zoneCount: number; zones: ZoneDef[];
  }) {
    if (editingModel) {
      await fetch(`/api/coach/zone-models/${editingModel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/coach/zone-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    setEditingModel(null);
    await loadModels();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/coach/zone-models/${id}`, { method: "DELETE" });
    setDeletingId(null);
    await loadModels();
  }

  async function importPreset(preset: ZoneModelPreset) {
    await fetch("/api/coach/zone-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset),
    });
    setShowPresets(false);
    await loadModels();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Configurações</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Modelos de zona de treino</h1>
          <p className="mt-1 text-sm text-text-muted">
            Configure zonas de intensidade para corrida, ciclismo, natação e força.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowPresets(true)}>
            <Copy className="h-4 w-4" />
            Modelos prontos
          </Button>
          <Button onClick={() => { setEditingModel(null); setShowModal(true); }}>
            <Plus className="h-4 w-4" />
            Novo modelo
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-text-muted">
            Os modelos de zona definem como a intensidade dos treinos é categorizada — por FC Máxima, FC Limiar, FTP (ciclismo), Pace Limiar (corrida) ou RPE.
            O sistema usa o método configurado ao calcular TSS, sugerir zonas na prescrição e exibir dados de carga no painel do atleta.
          </p>
        </CardContent>
      </Card>

      {/* Models list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-text">Nenhum modelo configurado</p>
              <p className="mt-1 text-sm text-text-muted">
                Adicione um modelo pronto ou crie o seu próprio.
              </p>
            </div>
            <Button onClick={() => setShowPresets(true)}>
              <Copy className="h-4 w-4" />
              Importar modelo pronto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {models.map((m) => (
            <ZoneModelCard
              key={m.id}
              model={m}
              onEdit={() => { setEditingModel(m); setShowModal(true); }}
              onDelete={() => {
                if (confirm(`Excluir o modelo "${m.name}"?`)) handleDelete(m.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <ZoneModelModal
          initial={editingModel ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingModel(null); }}
        />
      )}

      {/* Preset picker modal */}
      {showPresets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPresets(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-5">
              <h2 className="font-display text-base font-bold text-text">Modelos prontos</h2>
              <button onClick={() => setShowPresets(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover">
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {ZONE_PRESETS.map((preset, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      {preset.zones.slice(0, 5).map((z, zi) => (
                        <div key={zi} className="h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{preset.name}</p>
                      <div className="mt-0.5 flex gap-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{SPORT_LABELS[preset.sport]}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{METHOD_LABELS[preset.method]}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{preset.zoneCount} z.</Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => importPreset(preset)}>
                    Importar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
