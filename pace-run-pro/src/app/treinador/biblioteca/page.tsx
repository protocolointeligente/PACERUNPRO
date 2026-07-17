"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Bike,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Flame,
  Globe,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Trophy,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────

type TemplateScope = "PERSONAL" | "TEAM";
type DbTemplateCategory = "CORRIDA" | "FORCA" | "MOBILIDADE" | "FUNCIONAL";
type TemplateCategory = DbTemplateCategory | "CICLISMO" | "NATACAO" | "TRIATHLON";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  workoutType: string | null;
  scope: TemplateScope;
  tags: string[];
  objective: string | null;
  warmup: string | null;
  mainSet: string | null;
  cooldown: string | null;
  notes: string | null;
  targetPaceSecPerKm: number | null;
  targetHrZone: string | null;
  targetRpe: number | null;
  targetDistanceKm: number | null;
  targetDurationMin: number | null;
  usedCount: number;
  createdAt: string;
  coach: { user: { name: string; avatarUrl: string | null } };
}

// ── helpers ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

const CATEGORY_LABELS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  TRIATHLON: "Triathlon",
  FORCA: "Força",
  MOBILIDADE: "Mobilidade",
  FUNCIONAL: "Funcional",
};

const CATEGORY_COLORS: Record<string, string> = {
  CORRIDA: "text-sky-400 bg-sky-400/10",
  CICLISMO: "text-teal-400 bg-teal-400/10",
  NATACAO: "text-cyan-400 bg-cyan-400/10",
  TRIATHLON: "text-blue-400 bg-blue-400/10",
  FORCA: "text-violet-400 bg-violet-400/10",
  MOBILIDADE: "text-slate-300 bg-slate-400/10",
  FUNCIONAL: "text-orange-400 bg-orange-400/10",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  CORRIDA: Flame,
  CICLISMO: Bike,
  NATACAO: Waves,
  TRIATHLON: Trophy,
  FORCA: Dumbbell,
  MOBILIDADE: RotateCcw,
  FUNCIONAL: Globe,
};

const DB_TEMPLATE_CATEGORIES: DbTemplateCategory[] = ["CORRIDA", "FORCA", "MOBILIDADE", "FUNCIONAL"];

function formatPace(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

// ── empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "CORRIDA" as TemplateCategory,
  workoutType: "",
  scope: "PERSONAL" as TemplateScope,
  tags: "",
  objective: "",
  warmup: "",
  mainSet: "",
  cooldown: "",
  notes: "",
  targetPaceSecPerKm: "",
  targetHrZone: "",
  targetRpe: "",
  targetDistanceKm: "",
  targetDurationMin: "",
};

const systemCoach = { user: { name: "Pace Run Pro", avatarUrl: null } };

const SYSTEM_TEMPLATES: Template[] = [
  {
    id: "system-run-z2",
    name: "Corrida Z2 base aerobica",
    description: "Rodagem leve para construir base sem excesso de fadiga.",
    category: "CORRIDA",
    workoutType: "RODAGEM_LEVE",
    scope: "TEAM",
    tags: ["sistema", "corrida", "z2", "base"],
    objective: "Base aerobica e eficiencia mecanica.",
    warmup: "10 min trote leve + mobilidade dinamica.",
    mainSet: "35-50 min em Z2 / RPE 3-4.",
    cooldown: "5-10 min leve.",
    notes: "Manter conversa confortavel.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2",
    targetRpe: 4,
    targetDistanceKm: null,
    targetDurationMin: 50,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-run-vo2",
    name: "Intervalado VO2 6x800m",
    description: "Sessao de VO2 para fase especifica.",
    category: "CORRIDA",
    workoutType: "INTERVALADO_LONGO",
    scope: "TEAM",
    tags: ["sistema", "corrida", "vo2", "intervalado"],
    objective: "Elevar potencia aerobica mantendo tecnica.",
    warmup: "15 min leve + 4 educativos + 4 aceleracoes.",
    mainSet: "6x800m em ritmo 5k com 2 min trote leve.",
    cooldown: "10 min leve.",
    notes: "Cortar repeticoes se a tecnica cair.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z4-Z5",
    targetRpe: 8,
    targetDistanceKm: 8,
    targetDurationMin: 60,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-run-long",
    name: "Longao progressivo",
    description: "Longo com fechamento controlado.",
    category: "CORRIDA",
    workoutType: "LONGAO",
    scope: "TEAM",
    tags: ["sistema", "corrida", "longao"],
    objective: "Resistencia especifica e economia.",
    warmup: "10 min leve.",
    mainSet: "70% Z2 + 20% Z3 + 10% ritmo alvo.",
    cooldown: "5 min leve.",
    notes: "Nao transformar em prova.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2-Z3",
    targetRpe: 6,
    targetDistanceKm: null,
    targetDurationMin: 90,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-bike-z2",
    name: "Bike endurance Z2",
    description: "Pedal de base por potencia ou FC.",
    category: "CICLISMO",
    workoutType: "RODAGEM_LEVE",
    scope: "TEAM",
    tags: ["sistema", "ciclismo", "ftp", "z2"],
    objective: "Base aerobica e tolerancia ao volume.",
    warmup: "10 min progressivo.",
    mainSet: "60-90 min em 60-70% FTP ou Z2 FC.",
    cooldown: "10 min leve.",
    notes: "Cadencia 85-95 rpm.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2 / 60-70% FTP",
    targetRpe: 4,
    targetDistanceKm: null,
    targetDurationMin: 90,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-bike-sweet",
    name: "Sweet spot 3x12min",
    description: "Controle de carga em zona sweet spot.",
    category: "CICLISMO",
    workoutType: "TEMPO_RUN",
    scope: "TEAM",
    tags: ["sistema", "ciclismo", "sweet spot"],
    objective: "Sustentar alto tempo em intensidade sub-limiar.",
    warmup: "15 min progressivo + 3x30s alta cadencia.",
    mainSet: "3x12 min a 88-94% FTP com 5 min leve.",
    cooldown: "10 min leve.",
    notes: "Estavel, sem sprintar.",
    targetPaceSecPerKm: null,
    targetHrZone: "88-94% FTP",
    targetRpe: 7,
    targetDistanceKm: null,
    targetDurationMin: 70,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-bike-vo2",
    name: "VO2 bike 5x4min",
    description: "Bloco curto de potencia aerobica.",
    category: "CICLISMO",
    workoutType: "INTERVALADO_LONGO",
    scope: "TEAM",
    tags: ["sistema", "ciclismo", "vo2"],
    objective: "Elevar teto aerobico e tolerancia ao desconforto.",
    warmup: "20 min com 3 aceleracoes.",
    mainSet: "5x4 min a 106-115% FTP com 4 min leve.",
    cooldown: "10 min leve.",
    notes: "Parar se nao sustentar potencia.",
    targetPaceSecPerKm: null,
    targetHrZone: "106-115% FTP",
    targetRpe: 9,
    targetDistanceKm: null,
    targetDurationMin: 65,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-swim-tech",
    name: "Natação técnica + educativo",
    description: "Sessao tecnica para eficiencia.",
    category: "NATACAO",
    workoutType: "TECNICA",
    scope: "TEAM",
    tags: ["sistema", "natação", "tecnica"],
    objective: "Melhorar alinhamento, respiracao e pegada.",
    warmup: "300m livre leve.",
    mainSet: "8x50m educativos + 8x100m Z2 com 20s pausa.",
    cooldown: "200m solto.",
    notes: "Priorizar qualidade tecnica.",
    targetPaceSecPerKm: null,
    targetHrZone: "CSS + 10-15s/100m",
    targetRpe: 4,
    targetDistanceKm: 1.8,
    targetDurationMin: 45,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-swim-css",
    name: "CSS curto 16x100m",
    description: "Ritmo CSS com pausas curtas.",
    category: "NATACAO",
    workoutType: "INTERVALADO_CURTO",
    scope: "TEAM",
    tags: ["sistema", "natação", "css"],
    objective: "Sustentar ritmo critico com controle tecnico.",
    warmup: "400m leve + 4x50m progressivo.",
    mainSet: "16x100m em CSS com 15-20s pausa.",
    cooldown: "200m solto.",
    notes: "Manter mesma saida em todas.",
    targetPaceSecPerKm: null,
    targetHrZone: "CSS",
    targetRpe: 7,
    targetDistanceKm: 2.4,
    targetDurationMin: 55,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-swim-aerobic",
    name: "Aerobio continuo 2.000m",
    description: "Volume continuo para triathlon e aguas abertas.",
    category: "NATACAO",
    workoutType: "RODAGEM_LEVE",
    scope: "TEAM",
    tags: ["sistema", "natação", "aerobio"],
    objective: "Construir resistencia na agua.",
    warmup: "300m leve.",
    mainSet: "3x500m Z2 com 45s pausa.",
    cooldown: "200m solto.",
    notes: "Respiracao bilateral quando possivel.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2 agua",
    targetRpe: 5,
    targetDistanceKm: 2,
    targetDurationMin: 50,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-strength-full",
    name: "Força full body RPE 7",
    description: "Sessao geral de força para endurance.",
    category: "FORCA",
    workoutType: "FORCA",
    scope: "TEAM",
    tags: ["sistema", "força", "full body"],
    objective: "Desenvolver força geral com fadiga controlada.",
    warmup: "Mobilidade + ativacao 8 min.",
    mainSet: "Agachamento 3x6, supino 3x8, remada 3x8, stiff 3x8.",
    cooldown: "Mobilidade leve.",
    notes: "RPE 7, deixar 2-3 repeticoes na reserva.",
    targetPaceSecPerKm: null,
    targetHrZone: null,
    targetRpe: 7,
    targetDistanceKm: null,
    targetDurationMin: 50,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-strength-lower",
    name: "Força inferior corredores",
    description: "Inferiores com foco em corrida.",
    category: "FORCA",
    workoutType: "FORCA",
    scope: "TEAM",
    tags: ["sistema", "força", "corrida"],
    objective: "Força e resiliencia de quadril, joelho e tornozelo.",
    warmup: "Ativacao gluteos + mobilidade tornozelo.",
    mainSet: "Agachamento 4x5, avanco 3x8, panturrilha 4x10, prancha 3x40s.",
    cooldown: "Alongamento leve.",
    notes: "Descanso 90-150s.",
    targetPaceSecPerKm: null,
    targetHrZone: null,
    targetRpe: 8,
    targetDistanceKm: null,
    targetDurationMin: 45,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-strength-core",
    name: "Core + mobilidade funcional",
    description: "Sessao curta para manutencao.",
    category: "FORCA",
    workoutType: "FUNCIONAL",
    scope: "TEAM",
    tags: ["sistema", "força", "core", "mobilidade"],
    objective: "Controle de tronco e mobilidade sem gerar fadiga alta.",
    warmup: "Respiracao + mobilidade coluna.",
    mainSet: "Dead bug 3x10, prancha 3x45s, ponte 3x12, mobilidade quadril 8 min.",
    cooldown: "Soltura leve.",
    notes: "Ideal em semanas de maior volume.",
    targetPaceSecPerKm: null,
    targetHrZone: null,
    targetRpe: 5,
    targetDistanceKm: null,
    targetDurationMin: 30,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-tri-base-week",
    name: "Triathlon base semanal",
    description: "Modelo de microciclo com natação, bike, corrida e força leve.",
    category: "TRIATHLON",
    workoutType: "TRIATHLON",
    scope: "TEAM",
    tags: ["sistema", "triathlon", "base", "multimodal"],
    objective: "Organizar estimulos de base sem conflito entre modalidades.",
    warmup: "Distribuir aquecimentos especificos por sessao.",
    mainSet: "Natação técnica 45min, bike Z2 75min, corrida Z2 45min, força 35min.",
    cooldown: "Encerrar cada sessao com 5-10 min leve.",
    notes: "Usar como semana inicial para atletas intermediarios com 4-6h disponiveis.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2 predominante",
    targetRpe: 5,
    targetDistanceKm: null,
    targetDurationMin: 200,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-tri-brick",
    name: "Brick bike + corrida",
    description: "Treino combinado para adaptar transicao bike-corrida.",
    category: "TRIATHLON",
    workoutType: "TRIATHLON",
    scope: "TEAM",
    tags: ["sistema", "triathlon", "brick", "transicao"],
    objective: "Melhorar sensacao de corrida apos pedal controlado.",
    warmup: "Bike 15 min progressivo.",
    mainSet: "Bike 50-70 min Z2/Z3 leve + transicao rapida + corrida 15-25 min Z2.",
    cooldown: "5 min caminhada/trote leve.",
    notes: "Nao transformar o brick em prova; foco em controle e transicao.",
    targetPaceSecPerKm: null,
    targetHrZone: "Bike Z2-Z3 / corrida Z2",
    targetRpe: 6,
    targetDistanceKm: null,
    targetDurationMin: 95,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
  {
    id: "system-tri-specific",
    name: "Triathlon especifico equilibrado",
    description: "Semana de fase especifica com uma sessao-chave por modalidade.",
    category: "TRIATHLON",
    workoutType: "TRIATHLON",
    scope: "TEAM",
    tags: ["sistema", "triathlon", "especifico", "prova"],
    objective: "Combinar limiar controlado, endurance e tecnica mantendo recuperacao.",
    warmup: "Aquecimento especifico antes das sessoes-chave.",
    mainSet: "Natação CSS 55min, bike sweet spot 70min, corrida tempo 50min, longo Z2 75min.",
    cooldown: "Volta a calma por modalidade e check-in de fadiga.",
    notes: "Indicado para atletas com base consolidada; ajustar volume por nivel.",
    targetPaceSecPerKm: null,
    targetHrZone: "Z2-Z4 conforme modalidade",
    targetRpe: 7,
    targetDistanceKm: null,
    targetDurationMin: 250,
    usedCount: 0,
    createdAt: "2026-07-13T00:00:00.000Z",
    coach: systemCoach,
  },
];

// ── main component ────────────────────────────────────────────────────────────

export default function BibliotecaPage() {
  const [tab, setTab] = useState<"meus" | "equipe">("equipe");
  const [category, setCategory] = useState<TemplateCategory | "">("");
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ tab });
    if (category && DB_TEMPLATE_CATEGORIES.includes(category as DbTemplateCategory)) params.set("category", category);
    fetch(`/api/coach/biblioteca?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.templates) {
          const systemTemplates = tab === "equipe" ? SYSTEM_TEMPLATES : [];
          const merged = [...systemTemplates, ...d.templates];
          setTemplates(category ? merged.filter((template) => template.category === category) : merged);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [tab, category]);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setForm({
      name: t.name,
      description: t.description ?? "",
      category: t.category,
      workoutType: t.workoutType ?? "",
      scope: t.scope,
      tags: t.tags.join(", "),
      objective: t.objective ?? "",
      warmup: t.warmup ?? "",
      mainSet: t.mainSet ?? "",
      cooldown: t.cooldown ?? "",
      notes: t.notes ?? "",
      targetPaceSecPerKm: t.targetPaceSecPerKm ? String(t.targetPaceSecPerKm) : "",
      targetHrZone: t.targetHrZone ?? "",
      targetRpe: t.targetRpe ? String(t.targetRpe) : "",
      targetDistanceKm: t.targetDistanceKm ? String(t.targetDistanceKm) : "",
      targetDurationMin: t.targetDurationMin ? String(t.targetDurationMin) : "",
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      targetPaceSecPerKm: form.targetPaceSecPerKm ? parseInt(form.targetPaceSecPerKm) : null,
      targetRpe: form.targetRpe ? parseInt(form.targetRpe) : null,
      targetDistanceKm: form.targetDistanceKm ? parseFloat(form.targetDistanceKm) : null,
      targetDurationMin: form.targetDurationMin ? parseInt(form.targetDurationMin) : null,
      workoutType: form.workoutType || null,
      targetHrZone: form.targetHrZone || null,
    };
    const url = editingId ? `/api/coach/biblioteca/${editingId}` : "/api/coach/biblioteca";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este template?")) return;
    await fetch(`/api/coach/biblioteca/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleUse(t: Template) {
    if (!t.id.startsWith("system-")) {
      await fetch(`/api/coach/biblioteca/${t.id}/usar`, { method: "POST" });
    }
    // Copy main workout content to clipboard
    const text = [
      t.name,
      t.objective && `Objetivo: ${t.objective}`,
      t.warmup && `Aquecimento: ${t.warmup}`,
      t.mainSet && `Principal: ${t.mainSet}`,
      t.cooldown && `Volta à calma: ${t.cooldown}`,
      t.notes && `Notas: ${t.notes}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).catch(() => null);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
    // refresh count
    setTemplates((prev) => prev.map((item) => item.id === t.id ? { ...item, usedCount: item.usedCount + 1 } : item));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Biblioteca</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Biblioteca de treinos</h1>
          <p className="mt-1 text-sm text-text-muted">Templates reutilizáveis — seus ou compartilhados com a equipe.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo template
        </Button>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(["meus", "equipe"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === t ? "bg-primary text-white" : "text-text-muted hover:text-text"
              )}
            >
              {t === "meus" ? <Lock className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              {t === "meus" ? "Meus templates" : "Equipe"}
            </button>
          ))}
        </div>

        {(["", "CORRIDA", "CICLISMO", "NATACAO", "TRIATHLON", "FORCA", "MOBILIDADE", "FUNCIONAL"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:border-primary/40 hover:text-text"
            )}
          >
            {c === "" ? "Todos" : CATEGORY_LABELS[c]}
          </button>
        ))}

        <div className="relative ml-auto w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60"
            placeholder="Buscar templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <BookOpen className="h-8 w-8 text-text-muted/40" />
          <p className="text-sm font-semibold text-text">Nenhum template aqui ainda</p>
          <p className="text-sm text-text-muted">
            {tab === "equipe" ? "Nenhum modelo do sistema ou da equipe foi encontrado." : "Crie seu primeiro template clicando em \"Novo template\"."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => {
            const Icon = CATEGORY_ICONS[t.category];
            const isExpanded = expandedId === t.id;
            const isOwner = tab === "meus";
            return (
              <Card key={t.id} className="group transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", CATEGORY_COLORS[t.category])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{t.name}</CardTitle>
                        {t.description && <CardDescription className="mt-0.5 line-clamp-1">{t.description}</CardDescription>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {t.scope === "TEAM" ? (
                        <Badge variant="info" className="text-[10px]"><Users className="mr-1 h-2.5 w-2.5" />Equipe</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]"><Lock className="mr-1 h-2.5 w-2.5" />Pessoal</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Tags */}
                  {t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-card-hover/60 px-2 py-0.5 text-[10px] text-text-muted">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    {t.targetDistanceKm && <span>{t.targetDistanceKm} km</span>}
                    {t.targetDurationMin && <span>{t.targetDurationMin} min</span>}
                    {t.targetPaceSecPerKm && <span>{formatPace(t.targetPaceSecPerKm)}</span>}
                    {t.targetHrZone && <span>Zona {t.targetHrZone}</span>}
                    {t.targetRpe && <span>RPE {t.targetRpe}</span>}
                  </div>

                  {/* Expand content */}
                  {isExpanded && (
                    <div className="space-y-2 rounded-xl bg-card-hover/40 p-3 text-xs text-text-muted">
                      {t.objective && <p><span className="font-semibold text-text">Objetivo:</span> {t.objective}</p>}
                      {t.warmup && <p><span className="font-semibold text-text">Aquecimento:</span> {t.warmup}</p>}
                      {t.mainSet && <p><span className="font-semibold text-text">Principal:</span> {t.mainSet}</p>}
                      {t.cooldown && <p><span className="font-semibold text-text">Volta à calma:</span> {t.cooldown}</p>}
                      {t.notes && <p><span className="font-semibold text-text">Notas:</span> {t.notes}</p>}
                      {tab === "equipe" && (
                        <p className="mt-1 text-text-muted/70">Por: {t.coach.user.name}</p>
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-text-muted"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {isExpanded ? "Fechar" : "Ver detalhes"}
                      </Button>
                      <span className="text-xs text-text-muted/50">· usado {t.usedCount}x</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-text-muted hover:text-primary"
                        title="Copiar conteúdo"
                        onClick={() => handleUse(t)}
                      >
                        {copiedId === t.id ? <span className="text-[10px] font-semibold text-success">✓</span> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      {isOwner && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-text-muted hover:text-primary" onClick={() => openEdit(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-text-muted hover:text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="font-display text-lg font-bold text-text">
                {editingId ? "Editar template" : "Novo template"}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Nome *</label>
                <input className={inputClass} placeholder="Ex: Intervalado 5×1000m" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              {/* Category + scope row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">Categoria</label>
                  <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TemplateCategory }))}>
                    <option value="CORRIDA">Corrida</option>
                    <option value="CICLISMO">Ciclismo</option>
                    <option value="NATACAO">Natação</option>
                    <option value="FORCA">Força</option>
                    <option value="MOBILIDADE">Mobilidade</option>
                    <option value="FUNCIONAL">Funcional</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">Visibilidade</label>
                  <select className={inputClass} value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as TemplateScope }))}>
                    <option value="PERSONAL">Pessoal</option>
                    <option value="TEAM">Compartilhar com equipe</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Descrição curta</label>
                <input className={inputClass} placeholder="Resumo do treino em uma linha" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text">Tags (separadas por vírgula)</label>
                <input className={inputClass} placeholder="Ex: vo2max, pista, avançado" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>

              {/* Targets row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">Distância (km)</label>
                  <input type="number" step="0.1" className={inputClass} placeholder="0" value={form.targetDistanceKm} onChange={(e) => setForm((f) => ({ ...f, targetDistanceKm: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">Duração (min)</label>
                  <input type="number" className={inputClass} placeholder="0" value={form.targetDurationMin} onChange={(e) => setForm((f) => ({ ...f, targetDurationMin: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">Pace (seg/km)</label>
                  <input type="number" className={inputClass} placeholder="300 = 5:00" value={form.targetPaceSecPerKm} onChange={(e) => setForm((f) => ({ ...f, targetPaceSecPerKm: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text">RPE alvo</label>
                  <input type="number" min="1" max="10" className={inputClass} placeholder="1-10" value={form.targetRpe} onChange={(e) => setForm((f) => ({ ...f, targetRpe: e.target.value }))} />
                </div>
              </div>

              {/* Content */}
              {(["objective", "warmup", "mainSet", "cooldown", "notes"] as const).map((field) => {
                const labels: Record<string, string> = { objective: "Objetivo", warmup: "Aquecimento", mainSet: "Parte principal", cooldown: "Volta à calma", notes: "Notas do treinador" };
                return (
                  <div key={field}>
                    <label className="mb-1.5 block text-xs font-semibold text-text">{labels[field]}</label>
                    <textarea
                      rows={field === "mainSet" ? 4 : 2}
                      className={cn(inputClass, "resize-none")}
                      placeholder={field === "mainSet" ? "Ex: 5×1000m em pace de limiar, com 90s de recuperação entre repetições" : ""}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? "Salvando…" : "Salvar template"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
