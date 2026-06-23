"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShoppingBag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlanWorkout {
  id: string;
  dayOfWeek: number; // 0=Seg … 6=Dom
  type: string;
  title: string;
  objective?: string;
  warmup?: string;
  mainSet?: string;
  cooldown?: string;
  notes?: string;
  targetDistanceKm?: number;
  targetDurationMin?: number;
  targetPaceSecPerKm?: number;
  targetRpe?: number;
  exercises?: { name: string; sets: number; reps: string; restSec?: number }[];
}

interface PlanWeek {
  weekNumber: number;
  phase: string;
  label?: string;
  workouts: PlanWorkout[];
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  sport: string;
  level: string;
  durationWeeks: number;
  weeklyHoursMin: number | null;
  weeklyHoursMax: number | null;
  goal: string;
  priceCents: number;
  coverUrl: string | null;
  published: boolean;
  featured: boolean;
  purchases: number;
  included: string[];
  planContent: PlanWeek[] | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const PHASES = [
  { value: "BASE", label: "Base" },
  { value: "CONSTRUCAO", label: "Construção" },
  { value: "ESPECIFICO", label: "Específico" },
  { value: "POLIMENTO", label: "Polimento" },
  { value: "COMPETICAO", label: "Competição" },
  { value: "RECUPERACAO", label: "Recuperação" },
];

const WORKOUT_TYPES = {
  corrida: [
    { value: "RODAGEM_LEVE", label: "Rodagem leve", icon: Flame },
    { value: "INTERVALADO_CURTO", label: "Intervalado curto", icon: Zap },
    { value: "INTERVALADO_LONGO", label: "Intervalado longo", icon: Zap },
    { value: "TEMPO_RUN", label: "Tempo run", icon: Flame },
    { value: "FARTLEK", label: "Fartlek", icon: Flame },
    { value: "PROGRESSIVO", label: "Progressivo", icon: Flame },
    { value: "LONGAO", label: "Longão", icon: Flame },
    { value: "REGENERATIVO", label: "Regenerativo", icon: Flame },
    { value: "SUBIDA", label: "Subida", icon: Flame },
    { value: "TECNICA", label: "Técnica", icon: Flame },
    { value: "PROVA", label: "Prova / simulado", icon: Flame },
  ],
  forca: [
    { value: "FORCA", label: "Força", icon: Dumbbell },
    { value: "FUNCIONAL", label: "Funcional", icon: Dumbbell },
  ],
  recuperacao: [
    { value: "MOBILIDADE", label: "Mobilidade", icon: RotateCcw },
    { value: "RECUPERACAO", label: "Recuperação", icon: RotateCcw },
  ],
};

const ALL_TYPES = [...WORKOUT_TYPES.corrida, ...WORKOUT_TYPES.forca, ...WORKOUT_TYPES.recuperacao];

const SPORT_LABELS: Record<string, string> = {
  CORRIDA: "Corrida", CICLISMO: "Ciclismo", NATACAO: "Natação", FORCA: "Força", GERAL: "Geral",
};
const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km", DEZ_KM: "10 km", VINTE_E_UM_KM: "Meia maratona",
  QUARENTA_E_DOIS_KM: "Maratona", ULTRAMARATONA: "Ultramaratona",
  EMAGRECIMENTO: "Emagrecimento", PERFORMANCE: "Performance", RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
function typeLabel(type: string) {
  return ALL_TYPES.find((t) => t.value === type)?.label ?? type;
}
function typeCategory(type: string): "corrida" | "forca" | "recuperacao" {
  if (WORKOUT_TYPES.corrida.some((t) => t.value === type)) return "corrida";
  if (WORKOUT_TYPES.forca.some((t) => t.value === type)) return "forca";
  return "recuperacao";
}

// ── EMPTY FORM STATES ──────────────────────────────────────────────────────────

const EMPTY_META = {
  title: "", description: "", sport: "CORRIDA", level: "Intermediário",
  durationWeeks: "12", minH: "", maxH: "", goal: "PERFORMANCE",
  priceCents: "", includedRaw: "",
};

const EMPTY_WORKOUT: PlanWorkout = {
  id: "", dayOfWeek: 0, type: "RODAGEM_LEVE", title: "",
  objective: "", warmup: "", mainSet: "", cooldown: "", notes: "",
  targetDistanceKm: undefined, targetDurationMin: undefined,
  targetPaceSecPerKm: undefined, targetRpe: undefined, exercises: [],
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

export default function MinhaLojaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // modes: "list" | "builder"
  const [mode, setMode] = useState<"list" | "builder">("list");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // meta form
  const [showMeta, setShowMeta] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ ...EMPTY_META });

  // plan builder state
  const [planContent, setPlanContent] = useState<PlanWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [wForm, setWForm] = useState<PlanWorkout>({ ...EMPTY_WORKOUT });
  const [exerciseRow, setExerciseRow] = useState({ name: "", sets: "3", reps: "10-12", restSec: "60" });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // workout picker (reuse)
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDay, setPickerDay] = useState(0);

  // exercise library for autocomplete
  const [exerciseLibrary, setExerciseLibrary] = useState<{ name: string; category: string }[]>([]);
  useEffect(() => {
    fetch("/exercises.json")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { name: string; category: string }[]) =>
        setExerciseLibrary(data.map((e) => ({ name: e.name, category: e.category })))
      )
      .catch(() => null);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/coach/produtos")
      .then((r) => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── product CRUD ────────────────────────────────────────────────────────────

  function openNew() {
    setMeta({ ...EMPTY_META });
    setEditId(null);
    setShowMeta(true);
  }

  function openEdit(p: Product) {
    setMeta({
      title: p.title,
      description: p.description,
      sport: p.sport,
      level: p.level,
      durationWeeks: String(p.durationWeeks),
      minH: p.weeklyHoursMin ? String(p.weeklyHoursMin) : "",
      maxH: p.weeklyHoursMax ? String(p.weeklyHoursMax) : "",
      goal: p.goal,
      priceCents: p.priceCents ? String(p.priceCents / 100) : "",
      includedRaw: p.included.join("\n"),
    });
    setEditId(p.id);
    setShowMeta(true);
  }

  async function handleSaveMeta() {
    if (!meta.title.trim()) return;
    setSaving(true);
    const body = {
      title: meta.title.trim(),
      description: meta.description.trim(),
      sport: meta.sport,
      level: meta.level,
      goal: meta.goal,
      durationWeeks: parseInt(meta.durationWeeks) || 12,
      weeklyHoursMin: meta.minH ? parseFloat(meta.minH) : null,
      weeklyHoursMax: meta.maxH ? parseFloat(meta.maxH) : null,
      priceCents: meta.priceCents ? Math.round(parseFloat(meta.priceCents) * 100) : 0,
      included: meta.includedRaw.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const url = editId ? `/api/coach/produtos/${editId}` : "/api/coach/produtos";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setShowMeta(false);
    load();
  }

  async function togglePublish(p: Product) {
    await fetch(`/api/coach/produtos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, published: !x.published } : x));
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Excluir "${p.title}"?`)) return;
    await fetch(`/api/coach/produtos/${p.id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
  }

  // ── plan builder ────────────────────────────────────────────────────────────

  function openBuilder(p: Product) {
    const weeks = p.durationWeeks;
    const existing = Array.isArray(p.planContent) ? (p.planContent as PlanWeek[]) : [];
    // Fill in any missing weeks
    const content: PlanWeek[] = Array.from({ length: weeks }, (_, i) => {
      const w = existing.find((x) => x.weekNumber === i + 1);
      return w ?? { weekNumber: i + 1, phase: "BASE", workouts: [] };
    });
    setPlanContent(content);
    setSelectedWeek(1);
    setSelectedProduct(p);
    setMode("builder");
    setPlanSaved(false);
  }

  function currentWeek() {
    return planContent.find((w) => w.weekNumber === selectedWeek) ?? { weekNumber: selectedWeek, phase: "BASE", workouts: [] };
  }

  function updateWeekField(weekNumber: number, field: keyof PlanWeek, value: string) {
    setPlanContent((prev) =>
      prev.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w)
    );
  }

  async function savePlan() {
    if (!selectedProduct) return;
    setSavingPlan(true);
    await fetch(`/api/coach/produtos/${selectedProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planContent }),
    });
    setSavingPlan(false);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 3000);
  }

  // auto-save after 2s of inactivity
  function touchPlan(updated: PlanWeek[]) {
    setPlanContent(updated);
    setPlanSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!selectedProduct) return;
      await fetch(`/api/coach/produtos/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planContent: updated }),
      });
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 2000);
    }, 2000);
  }

  // ── workout form ────────────────────────────────────────────────────────────

  function openAddWorkout(dayOfWeek: number) {
    const existing = planContent.flatMap((w) => w.workouts);
    if (existing.length > 0) {
      setPickerDay(dayOfWeek);
      setShowPicker(true);
    } else {
      setWForm({ ...EMPTY_WORKOUT, id: uid(), dayOfWeek });
      setExerciseRow({ name: "", sets: "3", reps: "10-12", restSec: "60" });
      setShowWorkoutForm(true);
    }
  }

  function importWorkout(source: PlanWorkout) {
    setWForm({ ...source, id: uid(), dayOfWeek: pickerDay });
    setExerciseRow({ name: "", sets: "3", reps: "10-12", restSec: "60" });
    setShowPicker(false);
    setShowWorkoutForm(true);
  }

  function openNewFromPicker() {
    setWForm({ ...EMPTY_WORKOUT, id: uid(), dayOfWeek: pickerDay });
    setExerciseRow({ name: "", sets: "3", reps: "10-12", restSec: "60" });
    setShowPicker(false);
    setShowWorkoutForm(true);
  }

  function openEditWorkout(w: PlanWorkout) {
    setWForm({ ...w, exercises: w.exercises ? [...w.exercises] : [] });
    setExerciseRow({ name: "", sets: "3", reps: "10-12", restSec: "60" });
    setShowWorkoutForm(true);
  }

  function saveWorkout() {
    if (!wForm.title.trim()) return;
    const updated = planContent.map((week) => {
      if (week.weekNumber !== selectedWeek) return week;
      const exists = week.workouts.find((w) => w.id === wForm.id);
      const workouts = exists
        ? week.workouts.map((w) => w.id === wForm.id ? wForm : w)
        : [...week.workouts, wForm];
      return { ...week, workouts };
    });
    touchPlan(updated);
    setShowWorkoutForm(false);
  }

  function deleteWorkout(workoutId: string) {
    const updated = planContent.map((week) =>
      week.weekNumber !== selectedWeek ? week : { ...week, workouts: week.workouts.filter((w) => w.id !== workoutId) }
    );
    touchPlan(updated);
  }

  function addExercise() {
    if (!exerciseRow.name.trim()) return;
    setWForm((f) => ({
      ...f,
      exercises: [...(f.exercises ?? []), {
        name: exerciseRow.name.trim(),
        sets: parseInt(exerciseRow.sets) || 3,
        reps: exerciseRow.reps,
        restSec: parseInt(exerciseRow.restSec) || undefined,
      }],
    }));
    setExerciseRow({ name: "", sets: "3", reps: "10-12", restSec: "60" });
  }

  function removeExercise(idx: number) {
    setWForm((f) => ({ ...f, exercises: (f.exercises ?? []).filter((_, i) => i !== idx) }));
  }

  // ── render helpers ──────────────────────────────────────────────────────────

  const cat = typeCategory(wForm.type);
  const week = currentWeek();
  const workoutsPerDay = DAY_LABELS.map((_, d) => week.workouts.filter((w) => w.dayOfWeek === d));

  // ── LIST VIEW ───────────────────────────────────────────────────────────────

  if (mode === "list") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="primary" className="mb-2">Loja</Badge>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Minha loja de treinos</h1>
            <p className="mt-1 text-sm text-text-muted">Crie planos de treino, elabore as semanas e publique na loja para venda.</p>
          </div>
          <Button onClick={openNew} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo plano
          </Button>
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <ShoppingBag className="h-8 w-8 text-text-muted/40" />
            <p className="text-sm font-semibold text-text">Nenhum plano ainda</p>
            <p className="text-sm text-text-muted">Clique em &quot;Novo plano&quot; para começar a criar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const weeksDone = Array.isArray(p.planContent)
                ? (p.planContent as PlanWeek[]).filter((w) => w.workouts.length > 0).length
                : 0;
              const progress = Math.round((weeksDone / p.durationWeeks) * 100);
              return (
                <Card key={p.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge variant={p.published ? "success" : "outline"} className="text-[10px]">
                            {p.published ? "Publicado" : "Rascunho"}
                          </Badge>
                          <Badge variant="default" className="text-[10px]">{SPORT_LABELS[p.sport] ?? p.sport}</Badge>
                          <Badge variant="default" className="text-[10px]">{p.level}</Badge>
                        </div>
                        <h3 className="font-display text-base font-bold text-text">{p.title}</h3>
                        {p.description && <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{p.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.durationWeeks} semanas</span>
                          <span>{fmtPrice(p.priceCents)}</span>
                          <span>{p.purchases} vendas</span>
                          {/* Progress bar */}
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                              <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                            </span>
                            <span>{weeksDone}/{p.durationWeeks} sem. elaboradas</span>
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />Detalhes
                        </Button>
                        <Button size="sm" onClick={() => openBuilder(p)}>
                          <BookOpen className="mr-1 h-3.5 w-3.5" />Elaborar treinos
                          <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => togglePublish(p)} title={p.published ? "Despublicar" : "Publicar na loja"}>
                          {p.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Meta form modal */}
        {showMeta && (
          <MetaModal
            meta={meta}
            setMeta={setMeta}
            editId={editId}
            saving={saving}
            onSave={handleSaveMeta}
            onClose={() => setShowMeta(false)}
          />
        )}
      </div>
    );
  }

  // ── BUILDER VIEW ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode("list"); setSelectedProduct(null); }}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Minha loja
          </button>
          <span className="text-text-muted/30">/</span>
          <span className="text-sm font-semibold text-text truncate max-w-xs">{selectedProduct?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {planSaved && (
            <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" />Salvo</span>
          )}
          <Button size="sm" onClick={savePlan} disabled={savingPlan}>
            {savingPlan ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
            Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={() => togglePublish(selectedProduct!)} disabled={!selectedProduct}>
            {selectedProduct?.published ? <><EyeOff className="mr-1 h-3.5 w-3.5" />Despublicar</> : <><Eye className="mr-1 h-3.5 w-3.5" />Publicar</>}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Week sidebar */}
        <div className="w-44 shrink-0 overflow-y-auto border-r border-border bg-card/50 py-3">
          <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Semanas</p>
          {planContent.map((w) => {
            const done = w.workouts.length;
            return (
              <button
                key={w.weekNumber}
                onClick={() => setSelectedWeek(w.weekNumber)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                  w.weekNumber === selectedWeek ? "bg-primary/10 text-primary font-semibold" : "text-text-muted hover:bg-card-hover hover:text-text"
                )}
              >
                <span>Sem. {w.weekNumber}</span>
                {done > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{done}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Week header */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-bold text-text">Semana {selectedWeek}</h2>
            <select
              className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-text outline-none focus:border-primary/60"
              value={week.phase}
              onChange={(e) => updateWeekField(selectedWeek, "phase", e.target.value)}
            >
              {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <input
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted/40 outline-none focus:border-primary/60"
              placeholder="Rótulo opcional (ex: Semana de choque)"
              value={week.label ?? ""}
              onChange={(e) => updateWeekField(selectedWeek, "label", e.target.value)}
            />
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((day, d) => {
              const dayWorkouts = workoutsPerDay[d];
              return (
                <div key={day} className="flex flex-col gap-2">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">{day}</p>
                  <div className="flex-1 space-y-1.5">
                    {dayWorkouts.map((w) => (
                      <WorkoutChip key={w.id} workout={w} onEdit={() => openEditWorkout(w)} onDelete={() => deleteWorkout(w.id)} />
                    ))}
                    <button
                      onClick={() => openAddWorkout(d)}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-border py-2.5 text-text-muted/50 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week summary */}
          {week.workouts.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo da semana</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 pt-0 sm:grid-cols-4">
                {[
                  { label: "Sessões", value: String(week.workouts.length) },
                  { label: "Corridas", value: String(week.workouts.filter((w) => typeCategory(w.type) === "corrida").length) },
                  { label: "Força", value: String(week.workouts.filter((w) => typeCategory(w.type) === "forca").length) },
                  { label: "Volume total", value: week.workouts.reduce((s, w) => s + (w.targetDistanceKm ?? 0), 0).toFixed(1) + " km" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-card-hover/40 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-text-muted">{label}</p>
                    <p className="text-base font-bold text-text">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Workout form modal */}
      {showWorkoutForm && (
        <WorkoutFormModal
          wForm={wForm}
          setWForm={setWForm}
          cat={cat}
          exerciseRow={exerciseRow}
          setExerciseRow={setExerciseRow}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onSave={saveWorkout}
          onClose={() => setShowWorkoutForm(false)}
          exerciseLibrary={exerciseLibrary}
        />
      )}

      {/* Workout picker modal */}
      {showPicker && (
        <WorkoutPickerModal
          workouts={planContent.flatMap((w) => w.workouts)}
          day={pickerDay}
          onImport={importWorkout}
          onNew={openNewFromPicker}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── WorkoutChip ─────────────────────────────────────────────────────────────────

function WorkoutChip({ workout, onEdit, onDelete }: { workout: PlanWorkout; onEdit: () => void; onDelete: () => void }) {
  const cat = typeCategory(workout.type);
  const colors = {
    corrida: "bg-sky-400/10 border-sky-400/20 text-sky-400",
    forca: "bg-violet-400/10 border-violet-400/20 text-violet-400",
    recuperacao: "bg-lime-400/10 border-lime-400/20 text-lime-400",
  };
  return (
    <div className={cn("group relative rounded-xl border p-2 text-[10px]", colors[cat])}>
      <p className="font-semibold leading-tight line-clamp-2">{workout.title}</p>
      <p className="opacity-70">{typeLabel(workout.type)}</p>
      {workout.targetDistanceKm && <p className="opacity-70">{workout.targetDistanceKm} km</p>}
      {workout.targetDurationMin && <p className="opacity-70">{workout.targetDurationMin} min</p>}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded p-0.5 hover:bg-white/10"><Pencil className="h-3 w-3" /></button>
        <button onClick={onDelete} className="rounded p-0.5 hover:bg-white/10"><Trash2 className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

// ── Meta Modal ─────────────────────────────────────────────────────────────────

function MetaModal({ meta, setMeta, editId, saving, onSave, onClose }: {
  meta: typeof EMPTY_META;
  setMeta: React.Dispatch<React.SetStateAction<typeof EMPTY_META>>;
  editId: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
  const set = (k: keyof typeof meta) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setMeta((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-bold text-text">{editId ? "Editar plano" : "Novo plano de treino"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div><label className="mb-1.5 block text-xs font-semibold text-text">Título *</label>
            <input className={inputClass} placeholder="Ex: Maratona em 16 semanas — Avançado" value={meta.title} onChange={set("title")} /></div>

          <div><label className="mb-1.5 block text-xs font-semibold text-text">Descrição</label>
            <textarea rows={2} className={cn(inputClass, "resize-none")} placeholder="Breve descrição do plano" value={meta.description} onChange={set("description")} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-semibold text-text">Modalidade</label>
              <select className={inputClass} value={meta.sport} onChange={set("sport")}>
                {Object.entries(SPORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-text">Nível</label>
              <select className={inputClass} value={meta.level} onChange={set("level")}>
                {["Iniciante", "Intermediário", "Avançado"].map((l) => <option key={l}>{l}</option>)}
              </select></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1.5 block text-xs font-semibold text-text">Semanas</label>
              <input type="number" min="1" max="52" className={inputClass} value={meta.durationWeeks} onChange={set("durationWeeks")} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-text">H/sem mín.</label>
              <input type="number" step="0.5" className={inputClass} placeholder="—" value={meta.minH} onChange={set("minH")} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-text">H/sem máx.</label>
              <input type="number" step="0.5" className={inputClass} placeholder="—" value={meta.maxH} onChange={set("maxH")} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-semibold text-text">Objetivo</label>
              <select className={inputClass} value={meta.goal} onChange={set("goal")}>
                {Object.entries(GOAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-text">Preço (R$)</label>
              <input type="number" step="0.01" min="0" className={inputClass} placeholder="0 = grátis" value={meta.priceCents} onChange={set("priceCents")} /></div>
          </div>

          <div><label className="mb-1.5 block text-xs font-semibold text-text">O que está incluído (1 item por linha)</label>
            <textarea rows={4} className={cn(inputClass, "resize-none")} placeholder={"Acesso à planilha completa\nAcompanhamento de carga semanal\nDicas de ritmo por zona"} value={meta.includedRaw} onChange={set("includedRaw")} /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving || !meta.title.trim()}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {editId ? "Salvar alterações" : "Criar plano"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Workout Picker Modal ───────────────────────────────────────────────────────

function WorkoutPickerModal({ workouts, day, onImport, onNew, onClose }: {
  workouts: PlanWorkout[];
  day: number;
  onImport: (w: PlanWorkout) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = workouts.filter((w) =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    typeLabel(w.type).toLowerCase().includes(search.toLowerCase())
  );

  const catColors: Record<string, string> = {
    corrida: "bg-sky-400/10 border-sky-400/20 text-sky-400",
    forca: "bg-violet-400/10 border-violet-400/20 text-violet-400",
    recuperacao: "bg-lime-400/10 border-lime-400/20 text-lime-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-lg font-bold text-text">{DAY_LABELS[day]} — Adicionar treino</h2>
            <p className="text-xs text-text-muted mt-0.5">Importe um treino existente ou crie um novo</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <Button onClick={onNew} className="w-full" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Criar novo treino
          </Button>
        </div>

        {workouts.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Importar de treinos anteriores
              </p>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60"
                placeholder="Buscar por título ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">Nenhum treino encontrado</p>
              ) : (
                filtered.map((w) => {
                  const cat = typeCategory(w.type);
                  return (
                    <button
                      key={w.id}
                      onClick={() => onImport(w)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:opacity-80",
                        catColors[cat]
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{w.title}</p>
                        <p className="text-xs opacity-70 mt-0.5">{typeLabel(w.type)}</p>
                        {(w.targetDistanceKm || w.targetDurationMin) && (
                          <p className="text-[11px] opacity-60 mt-0.5">
                            {w.targetDistanceKm ? `${w.targetDistanceKm} km` : ""}
                            {w.targetDistanceKm && w.targetDurationMin ? " · " : ""}
                            {w.targetDurationMin ? `${w.targetDurationMin} min` : ""}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50 mt-0.5" />
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Workout Form Modal ─────────────────────────────────────────────────────────

function WorkoutFormModal({ wForm, setWForm, cat, exerciseRow, setExerciseRow, onAddExercise, onRemoveExercise, onSave, onClose, exerciseLibrary }: {
  wForm: PlanWorkout;
  setWForm: React.Dispatch<React.SetStateAction<PlanWorkout>>;
  cat: "corrida" | "forca" | "recuperacao";
  exerciseRow: { name: string; sets: string; reps: string; restSec: string };
  setExerciseRow: React.Dispatch<React.SetStateAction<{ name: string; sets: string; reps: string; restSec: string }>>;
  onAddExercise: () => void;
  onRemoveExercise: (i: number) => void;
  onSave: () => void;
  onClose: () => void;
  exerciseLibrary: { name: string; category: string }[];
}) {
  const inputClass = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
  const miniInput = "rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text outline-none focus:border-primary/60";
  const setF = (k: keyof PlanWorkout) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setWForm((f) => ({ ...f, [k]: e.target.value || undefined }));
  const setNum = (k: keyof PlanWorkout) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setWForm((f) => ({ ...f, [k]: e.target.value ? parseFloat(e.target.value) : undefined }));

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = exerciseRow.name.length >= 2
    ? exerciseLibrary
        .filter((e) => e.name.toLowerCase().includes(exerciseRow.name.toLowerCase()))
        .slice(0, 8)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-bold text-text">
            {DAY_LABELS[wForm.dayOfWeek]} — {wForm.id ? "Editar" : "Novo"} treino
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          {/* Type selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-text">Tipo de treino</label>
            <div className="space-y-2">
              {(["corrida", "forca", "recuperacao"] as const).map((group) => (
                <div key={group}>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-text-muted/60">
                    {group === "corrida" ? "Corrida" : group === "forca" ? "Força / Funcional" : "Recuperação"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORKOUT_TYPES[group].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setWForm((f) => ({ ...f, type: t.value }))}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          wForm.type === t.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-text-muted hover:border-primary/40 hover:text-text"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text">Título do treino *</label>
            <input className={inputClass} placeholder="Ex: Intervalado 5×1000m" value={wForm.title}
              onChange={(e) => setWForm((f) => ({ ...f, title: e.target.value }))} />
          </div>

          {/* Running fields */}
          {cat === "corrida" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1.5 block text-xs font-semibold text-text">Distância (km)</label>
                  <input type="number" step="0.1" className={inputClass} placeholder="—" value={wForm.targetDistanceKm ?? ""} onChange={setNum("targetDistanceKm")} /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-text">Duração (min)</label>
                  <input type="number" className={inputClass} placeholder="—" value={wForm.targetDurationMin ?? ""} onChange={setNum("targetDurationMin")} /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-text">Pace alvo (seg/km)</label>
                  <input type="number" className={inputClass} placeholder="ex: 300 = 5:00" value={wForm.targetPaceSecPerKm ?? ""} onChange={setNum("targetPaceSecPerKm")} /></div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Objetivo</label>
                <input className={inputClass} placeholder="O que o atleta vai desenvolver nesta sessão" value={wForm.objective ?? ""} onChange={setF("objective")} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Aquecimento</label>
                <input className={inputClass} placeholder="Ex: 10 min em Z1–Z2" value={wForm.warmup ?? ""} onChange={setF("warmup")} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Parte principal</label>
                <textarea rows={3} className={cn(inputClass, "resize-none")}
                  placeholder="Ex: 5×1000m no pace de limiar (Z4), recuperação de 90s em trote entre repetições"
                  value={wForm.mainSet ?? ""} onChange={setF("mainSet")} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Volta à calma</label>
                <input className={inputClass} placeholder="Ex: 10 min em Z1" value={wForm.cooldown ?? ""} onChange={setF("cooldown")} />
              </div>
            </>
          )}

          {/* Strength fields */}
          {cat === "forca" && (
            <div>
              <label className="mb-2 block text-xs font-semibold text-text">Exercícios</label>
              {(wForm.exercises ?? []).map((ex, i) => (
                <div key={i} className="mb-1.5 flex items-center gap-2 rounded-xl bg-card-hover/40 px-3 py-2 text-xs">
                  <span className="flex-1 font-semibold">{ex.name}</span>
                  <span className="text-text-muted">{ex.sets}×{ex.reps}</span>
                  {ex.restSec && <span className="text-text-muted">{ex.restSec}s</span>}
                  <button onClick={() => onRemoveExercise(i)} className="ml-1 text-text-muted hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <div className="mt-2 flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-0">
                  <input
                    className={cn(miniInput, "w-full")}
                    placeholder="Exercício (busca da biblioteca)"
                    value={exerciseRow.name}
                    autoComplete="off"
                    onChange={(e) => {
                      setExerciseRow((r) => ({ ...r, name: e.target.value }));
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-card shadow-xl">
                      {suggestions.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setExerciseRow((r) => ({ ...r, name: s.name }));
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-card-hover"
                        >
                          <span className="flex-1 font-medium text-text">{s.name}</span>
                          <span className="shrink-0 text-[10px] text-text-muted">{s.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" className={cn(miniInput, "w-14")} placeholder="Séries" value={exerciseRow.sets}
                  onChange={(e) => setExerciseRow((r) => ({ ...r, sets: e.target.value }))} />
                <input className={cn(miniInput, "w-20")} placeholder="Reps" value={exerciseRow.reps}
                  onChange={(e) => setExerciseRow((r) => ({ ...r, reps: e.target.value }))} />
                <input type="number" className={cn(miniInput, "w-16")} placeholder="Descanso" value={exerciseRow.restSec}
                  onChange={(e) => setExerciseRow((r) => ({ ...r, restSec: e.target.value }))} />
                <Button size="sm" variant="outline" onClick={onAddExercise} disabled={!exerciseRow.name.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Recovery fields */}
          {cat === "recuperacao" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text">Descrição</label>
              <textarea rows={3} className={cn(inputClass, "resize-none")}
                placeholder="Ex: 20 min de yoga + alongamento de quadríceps e panturrilha"
                value={wForm.mainSet ?? ""} onChange={setF("mainSet")} />
            </div>
          )}

          {/* Shared notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text">Notas do treinador (opcional)</label>
            <input className={inputClass} placeholder="Observações, dicas ou alertas para o atleta" value={wForm.notes ?? ""} onChange={setF("notes")} />
          </div>

          {/* RPE */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text">RPE esperado (1–10)</label>
            <input type="number" min="1" max="10" className={cn(inputClass, "w-24")} placeholder="—" value={wForm.targetRpe ?? ""} onChange={setNum("targetRpe")} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-5">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={!wForm.title.trim()}>Salvar treino</Button>
        </div>
      </div>
    </div>
  );
}
