"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Package, X, Loader2, Send, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ListingStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "SUSPENDED";

interface MarketProduct {
  id: string;
  type: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  published: boolean;
  listingStatus: ListingStatus;
  featured: boolean;
  purchases: number;
  level: string | null;
  sport: string | null;
  durationWeeks: number | null;
}

const STATUS_CONFIG: Record<ListingStatus, { label: string; variant: "outline" | "warning" | "success" | "danger" }> = {
  DRAFT:          { label: "Rascunho",       variant: "outline"  },
  PENDING_REVIEW: { label: "Em revisão",     variant: "warning"  },
  APPROVED:       { label: "Aprovado",       variant: "success"  },
  SUSPENDED:      { label: "Suspenso",       variant: "danger"   },
};

const TYPE_OPTIONS = [
  { value: "PLANILHA", label: "Planilha de treino" },
  { value: "EBOOK", label: "E-book" },
  { value: "CURSO", label: "Curso online" },
  { value: "EVENTO", label: "Evento / corrida" },
  { value: "CONSULTORIA", label: "Consultoria 1:1" },
  { value: "AVALIACAO", label: "Avaliação física" },
  { value: "TESTE", label: "Teste de performance" },
  { value: "ASSINATURA", label: "Assinatura mensal" },
  { value: "TREINAMENTO", label: "Bloco de treinamento" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));
const SPORT_OPTS = ["CORRIDA", "CICLISMO", "NATACAO", "FORCA", "GERAL"];
const LEVEL_OPTS = ["Iniciante", "Intermediário", "Avançado"];

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function autoSlug(title: string) {
  return title.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY_FORM = {
  type: "PLANILHA", title: "", slug: "", description: "", priceCents: "0",
  sport: "", level: "", durationWeeks: "", published: false, featured: false,
  included: "",
};

export default function MarketplaceProductsPage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MarketProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  function resetForm() { setForm({ ...EMPTY_FORM }); setEditing(null); setError(""); }

  function openEdit(p: MarketProduct) {
    setEditing(p);
    setForm({
      type: p.type, title: p.title, slug: p.slug, description: p.description,
      priceCents: String(p.priceCents), sport: p.sport ?? "", level: p.level ?? "",
      durationWeeks: p.durationWeeks ? String(p.durationWeeks) : "",
      published: p.published, featured: p.featured, included: "",
    });
    setShowForm(true);
  }

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/coach/marketplace/products");
      if (r.ok) setProducts(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        slug: form.slug || autoSlug(form.title),
        description: form.description,
        priceCents: Number(form.priceCents),
        sport: form.sport || null,
        level: form.level || null,
        durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : null,
        published: form.published,
        featured: form.featured,
        included: form.included ? form.included.split("\n").filter(Boolean) : [],
      };

      let r: Response;
      if (editing) {
        r = await fetch("/api/coach/marketplace/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        r = await fetch("/api/coach/marketplace/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }

      if (!r.ok) { const d = await r.json(); setError(d.error ?? "Erro ao salvar"); return; }
      setShowForm(false);
      resetForm();
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return;
    setDeleting(id);
    await fetch(`/api/coach/marketplace/products?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  async function submitForReview(id: string) {
    await fetch("/api/coach/marketplace/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, submitForReview: true }),
    });
    await load();
  }

  async function cancelReview(id: string) {
    await fetch("/api/coach/marketplace/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, cancelReview: true }),
    });
    await load();
  }

  const needsSport = ["PLANILHA", "TREINAMENTO"].includes(form.type);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="primary" className="mb-2">Marketplace</Badge>
          <h1 className="font-display text-2xl font-bold text-text">Meus produtos</h1>
          <p className="text-sm text-text-muted mt-1">Crie e publique produtos para vender diretamente para atletas.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </button>
      </div>

      {/* Type pills guide */}
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((t) => (
          <span key={t.value} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-text-muted">{t.label}</span>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-text">{editing ? "Editar produto" : "Novo produto"}</p>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-text-muted hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Tipo de produto</span>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
                    {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Preço (centavos)</span>
                  <input type="number" value={form.priceCents} onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))} className={inputCls} />
                  <p className="mt-1 text-xs text-text-muted">{fmtPrice(Number(form.priceCents))} — 0 = gratuito</p>
                </label>
                <label className="block col-span-full">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Título</span>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Nome do produto" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Slug (URL)</span>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder={autoSlug(form.title || "meu-produto")} className={inputCls} />
                </label>
                {needsSport && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Modalidade</span>
                    <select value={form.sport} onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))} className={inputCls}>
                      <option value="">—</option>
                      {SPORT_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
                {needsSport && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nível</span>
                    <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={inputCls}>
                      <option value="">—</option>
                      {LEVEL_OPTS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                )}
                {needsSport && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Duração (semanas)</span>
                    <input type="number" value={form.durationWeeks} onChange={(e) => setForm((f) => ({ ...f, durationWeeks: e.target.value }))} placeholder="Ex.: 12" className={inputCls} />
                  </label>
                )}
                <label className="block col-span-full">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição</span>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descreva o produto…" className={inputCls} />
                </label>
                <label className="block col-span-full">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">O que está incluído (uma linha por item)</span>
                  <textarea rows={4} value={form.included} onChange={(e) => setForm((f) => ({ ...f, included: e.target.value }))} placeholder={"Planilha de treinos\nFeedback semanal\nSuporto via WhatsApp"} className={inputCls} />
                </label>
                <div className="col-span-full rounded-xl border border-border/60 bg-card-hover/40 px-4 py-3">
                  <p className="text-xs text-text-muted">
                    <span className="font-semibold text-text">Fluxo de publicação:</span>{" "}
                    Produtos salvos ficam como <strong>Rascunho</strong>. Use o botão "Enviar para revisão" na lista para submetê-lo — um administrador irá aprovar antes de aparecer no marketplace.
                  </p>
                </div>
              </div>
              {error && <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover">Cancelar</button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Atualizar" : "Salvar produto"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm text-text-muted">Nenhum produto criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                  <p className="font-semibold text-text truncate">{p.title}</p>
                  {p.featured && <Badge variant="primary" className="text-[10px]">Destaque</Badge>}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {fmtPrice(p.priceCents)}
                  {p.sport ? ` · ${p.sport}` : ""}
                  {p.level ? ` · ${p.level}` : ""}
                  {p.purchases > 0 ? ` · ${p.purchases} vendas` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(() => {
                  const cfg = STATUS_CONFIG[p.listingStatus ?? "DRAFT"];
                  return <Badge variant={cfg.variant} className="text-[10px] hidden sm:flex">{cfg.label}</Badge>;
                })()}
                {p.listingStatus === "DRAFT" && (
                  <button
                    onClick={() => submitForReview(p.id)}
                    className="flex items-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                    title="Enviar para revisão"
                  >
                    <Send className="h-3 w-3" />
                    <span className="hidden sm:inline">Revisar</span>
                  </button>
                )}
                {p.listingStatus === "PENDING_REVIEW" && (
                  <button
                    onClick={() => cancelReview(p.id)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-card-hover"
                    title="Cancelar envio para revisão"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                )}
                {(p.listingStatus === "DRAFT" || p.listingStatus === "PENDING_REVIEW") && (
                  <button onClick={() => openEdit(p)} className="rounded-lg border border-border p-2 text-text-muted hover:text-text hover:bg-card-hover">
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
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
