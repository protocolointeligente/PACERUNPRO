"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, ShoppingBag, X, Check, Loader2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlatformProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  sport: string;
  level: string;
  durationWeeks: number;
  goal: string;
  priceCents: number;
  featured: boolean;
  published: boolean;
  purchases: number;
}

const SPORT_OPTS = ["CORRIDA", "CICLISMO", "NATACAO", "FORCA", "GERAL"];
const LEVEL_OPTS = ["Iniciante", "Intermediário", "Avançado"];
const GOAL_OPTS = ["PERFORMANCE", "EMAGRECIMENTO", "RETORNO_AS_CORRIDAS", "CINCO_KM", "DEZ_KM", "VINTE_E_UM_KM", "QUARENTA_E_DOIS_KM"];

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const DEFAULT_INCLUDED = [
  "Planilha de treinos semanalizada",
  "Progressão de carga estruturada",
  "Semana de deload a cada 4 semanas",
  "Suporte técnico via app",
];

export default function AdminLojaPage() {
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlatformProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    sport: "FORCA",
    level: "Intermediário",
    durationWeeks: "12",
    goal: "PERFORMANCE",
    priceCents: "4990",
    featured: true,
    weeklyHoursMin: "3",
    weeklyHoursMax: "5",
  });

  function resetForm() {
    setForm({ title: "", slug: "", description: "", sport: "FORCA", level: "Intermediário", durationWeeks: "12", goal: "PERFORMANCE", priceCents: "4990", featured: true, weeklyHoursMin: "3", weeklyHoursMax: "5" });
    setEditing(null);
    setError("");
  }

  function openEdit(p: PlatformProduct) {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description,
      sport: p.sport,
      level: p.level,
      durationWeeks: String(p.durationWeeks),
      goal: p.goal,
      priceCents: String(p.priceCents),
      featured: p.featured,
      weeklyHoursMin: "3",
      weeklyHoursMax: "5",
    });
    setShowForm(true);
  }

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/platform-products");
      if (r.ok) setProducts(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function autoSlug(title: string) {
    return "pace-" + title.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || autoSlug(form.title),
        description: form.description,
        sport: form.sport,
        level: form.level,
        durationWeeks: Number(form.durationWeeks),
        goal: form.goal,
        priceCents: Number(form.priceCents),
        featured: form.featured,
        weeklyHoursMin: Number(form.weeklyHoursMin),
        weeklyHoursMax: Number(form.weeklyHoursMax),
        included: DEFAULT_INCLUDED,
      };

      let r: Response;
      if (editing) {
        r = await fetch("/api/admin/platform-products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        r = await fetch("/api/admin/platform-products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }

      if (!r.ok) {
        const d = await r.json();
        setError(d.error ?? "Erro ao salvar");
        return;
      }
      setShowForm(false);
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto da loja da plataforma?")) return;
    setDeleting(id);
    await fetch(`/api/admin/platform-products?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="primary" className="mb-2">Loja da Plataforma</Badge>
          <h1 className="font-display text-2xl font-bold text-text">Treinos PACE RUN PRO</h1>
          <p className="text-sm text-text-muted mt-1">Produtos vendidos pela própria plataforma — sem assessoria vinculada.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-text">{editing ? "Editar produto" : "Novo produto da plataforma"}</p>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-text-muted hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block col-span-full">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Título</span>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="ex.: Periodização Força 12 Semanas" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Slug (URL)</span>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder={autoSlug(form.title || "meu-treino")} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Preço (centavos)</span>
                  <input type="number" value={form.priceCents} onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))} className={inputCls} />
                  <p className="mt-1 text-xs text-text-muted">{fmtPrice(Number(form.priceCents))} → 4990 = R$ 49,90</p>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Modalidade</span>
                  <select value={form.sport} onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))} className={inputCls}>
                    {SPORT_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nível</span>
                  <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={inputCls}>
                    {LEVEL_OPTS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Duração (semanas)</span>
                  <input type="number" value={form.durationWeeks} onChange={(e) => setForm((f) => ({ ...f, durationWeeks: e.target.value }))} className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Objetivo</span>
                  <select value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} className={inputCls}>
                    {GOAL_OPTS.map((g) => <option key={g} value={g}>{g.replace(/_/g, " ")}</option>)}
                  </select>
                </label>
                <label className="block col-span-full">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição</span>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descreva o produto brevemente…" className={inputCls} />
                </label>
                <label className="flex items-center gap-3 col-span-full">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 accent-primary" />
                  <span className="text-sm text-text">Marcar como destaque na loja</span>
                </label>
              </div>
              {error && <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover">Cancelar</button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editing ? "Atualizar" : "Publicar produto"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm text-text-muted">Nenhum produto da plataforma ainda.</p>
          <p className="mt-1 text-xs text-text-muted">Crie o primeiro treino ao preço de R$ 49,90.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text truncate">{p.title}</p>
                  {p.featured && <Badge variant="primary" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />Destaque</Badge>}
                  {!p.published && <Badge variant="outline" className="text-[10px]">Rascunho</Badge>}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {p.sport} · {p.level} · {p.durationWeeks} semanas · {fmtPrice(p.priceCents)}
                  {p.purchases > 0 && ` · ${p.purchases} vendas`}
                </p>
                <p className="text-[11px] text-text-muted/60 mt-0.5">/loja/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(p)} className="rounded-lg border border-border p-2 text-text-muted hover:text-text hover:bg-card-hover">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                  {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
