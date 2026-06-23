"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, CheckCircle2, Edit2, Eye, EyeOff, Globe, Loader2,
  Package, Plus, Star, Trash2, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

interface Product {
  id: string;
  title: string;
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
  rating: number | null;
  included: string[];
}

const SPORT_LABELS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  FORCA: "Força",
  GERAL: "Geral",
};

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultra",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno",
};

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LojaPlanos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("CORRIDA");
  const [level, setLevel] = useState("Intermediário");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [minH, setMinH] = useState("");
  const [maxH, setMaxH] = useState("");
  const [goal, setGoal] = useState("PERFORMANCE");
  const [priceCents, setPriceCents] = useState("");
  const [includedRaw, setIncludedRaw] = useState("");

  useEffect(() => {
    fetch("/api/coach/produtos")
      .then((r) => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setTitle(""); setDescription(""); setSport("CORRIDA"); setLevel("Intermediário");
    setDurationWeeks("12"); setMinH(""); setMaxH(""); setGoal("PERFORMANCE");
    setPriceCents(""); setIncludedRaw(""); setEditId(null);
  }

  function openNew() { resetForm(); setShowForm(true); }

  function openEdit(p: Product) {
    setEditId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setSport(p.sport);
    setLevel(p.level);
    setDurationWeeks(String(p.durationWeeks));
    setMinH(p.weeklyHoursMin != null ? String(p.weeklyHoursMin) : "");
    setMaxH(p.weeklyHoursMax != null ? String(p.weeklyHoursMax) : "");
    setGoal(p.goal);
    setPriceCents(String(p.priceCents / 100));
    setIncludedRaw(p.included.join("\n"));
    setShowForm(true);
  }

  async function handleSave() {
    if (!title.trim() || saving) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      sport, level, goal,
      durationWeeks: parseInt(durationWeeks) || 12,
      weeklyHoursMin: minH ? parseFloat(minH) : undefined,
      weeklyHoursMax: maxH ? parseFloat(maxH) : undefined,
      priceCents: Math.round((parseFloat(priceCents) || 0) * 100),
      included: includedRaw.split("\n").map((l) => l.trim()).filter(Boolean),
    };
    try {
      let res: Response;
      if (editId) {
        res = await fetch(`/api/coach/produtos/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/coach/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        const saved: Product = await res.json();
        if (editId) {
          setProducts((prev) => prev.map((p) => (p.id === editId ? saved : p)));
        } else {
          setProducts((prev) => [saved, ...prev]);
        }
        setShowForm(false);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(p: Product) {
    const res = await fetch(`/api/coach/produtos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este produto?")) return;
    await fetch(`/api/coach/produtos/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-2">Loja</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Meus planos à venda</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Publique planilhas de treino para atletas independentes comprarem diretamente.
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4" /> Novo plano
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-text">
                {editId ? "Editar plano" : "Novo plano"}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="h-4 w-4 text-text-muted hover:text-text" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClass}>Título *</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Plano 10km em 12 semanas" className={inputClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Descrição</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Para quem é este plano e o que o atleta vai conseguir"
                  className={cn(inputClass, "resize-none")} />
              </label>

              <label className="block">
                <span className={labelClass}>Modalidade</span>
                <select value={sport} onChange={(e) => setSport(e.target.value)} className={inputClass}>
                  {Object.entries(SPORT_LABELS).map(([v, l]) => (
                    <option key={v} value={v} className="bg-card">{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Objetivo</span>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
                  {Object.entries(GOAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v} className="bg-card">{l}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Duração (semanas)</span>
                <input type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)}
                  min={1} max={52} className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Nível</span>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
                  {["Iniciante","Intermediário","Avançado"].map((l) => (
                    <option key={l} className="bg-card">{l}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={labelClass}>Horas/sem mín.</span>
                  <input type="number" value={minH} onChange={(e) => setMinH(e.target.value)}
                    placeholder="3" step={0.5} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Horas/sem máx.</span>
                  <input type="number" value={maxH} onChange={(e) => setMaxH(e.target.value)}
                    placeholder="6" step={0.5} className={inputClass} />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Preço (R$)</span>
                <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                  placeholder="89.90" step={0.01} min={0} className={inputClass} />
              </label>

              <label className="block sm:col-span-2">
                <span className={labelClass}>O que está incluído (1 item por linha)</span>
                <textarea value={includedRaw} onChange={(e) => setIncludedRaw(e.target.value)}
                  rows={4} placeholder={"Planilha em PDF\nVídeos explicativos\nSuporte via WhatsApp"}
                  className={cn(inputClass, "resize-none font-mono text-xs")} />
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={!title.trim() || saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {saving ? "Salvando…" : editId ? "Salvar alterações" : "Criar plano"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-card-hover/60" />)}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
            <p className="text-sm font-semibold text-text">Nenhum plano ainda</p>
            <p className="mt-1 text-xs text-text-muted">Crie seu primeiro plano e comece a vender para atletas independentes.</p>
            <Button className="mt-4" onClick={openNew}><Plus className="h-4 w-4" />Criar plano</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} className={p.published ? "border-success/20" : ""}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-text">{p.title}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted line-clamp-2">{p.description}</p>
                  </div>
                  <Badge variant={p.published ? "success" : "outline"} className="shrink-0 text-[10px]">
                    {p.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-text-muted">
                    {SPORT_LABELS[p.sport] ?? p.sport}
                  </span>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-text-muted">
                    {p.level}
                  </span>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-text-muted">
                    {p.durationWeeks} sem.
                  </span>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    {fmtPrice(p.priceCents)}
                  </span>
                </div>

                {p.purchases > 0 && (
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{p.purchases} venda{p.purchases !== 1 ? "s" : ""}</span>
                    {p.rating != null && (
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{p.rating.toFixed(1)}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                    <Edit2 className="h-3 w-3" /> Editar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => togglePublished(p)}>
                    {p.published
                      ? <><EyeOff className="h-3 w-3" /> Despublicar</>
                      : <><Globe className="h-3 w-3" /> Publicar</>
                    }
                  </Button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="ml-auto rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <p className="text-xs text-text-muted">
          <Globe className="mr-1 inline h-3 w-3" />
          Planos publicados aparecem em <span className="font-semibold text-text">/loja</span> para atletas independentes.
          Pagamentos via Stripe (configure em <span className="font-semibold text-text">Config. financeiras</span>).
        </p>
      )}
    </div>
  );
}
