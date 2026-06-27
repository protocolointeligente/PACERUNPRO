"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2, ExternalLink, Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

const PERIOD_LABELS: Record<string, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

interface LocalPlan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  period: string;
  features: string[];
  highlight: boolean;
  maxSlots: number | null;
  active: boolean;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PlanCard({ plan, onEdit, onToggle, onDelete, publicUrl }: {
  plan: LocalPlan;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  publicUrl: string;
}) {
  const [showQr, setShowQr] = useState(false);

  return (
    <Card className={cn(
      "relative transition-all",
      plan.highlight ? "border-accent/50 shadow-lg shadow-accent/10" : "border-border",
      !plan.active && "opacity-50"
    )}>
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" className="gap-1 shadow"><Star className="h-2.5 w-2.5" /> Mais popular</Badge>
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold text-text">{plan.name}</p>
            <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{plan.description}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-xl font-extrabold text-text">R$ {formatBRL(plan.priceCents)}</p>
            <p className="text-xs text-text-muted">{PERIOD_LABELS[plan.period] ?? plan.period}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
              <Check className="h-3 w-3 shrink-0 text-success" />
              {f}
            </li>
          ))}
          {plan.features.length > 4 && (
            <li className="text-xs text-text-muted pl-5">+{plan.features.length - 4} benefícios</li>
          )}
        </ul>

        {plan.maxSlots !== null && (
          <p className="mt-3 text-xs text-text-muted">
            <span className="font-semibold text-text">{plan.maxSlots}</span> vagas máx.
          </p>
        )}

        {showQr && (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4">
            <QRCode value={publicUrl} size={140} />
            <p className="text-center text-[10px] text-text-muted">QR Code para este plano</p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowQr(false)}>Fechar</Button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onToggle}>
            {plan.active ? <X className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {plan.active ? "Pausar" : "Reativar"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-danger hover:text-danger" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> Excluir
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs ml-auto" onClick={() => setShowQr((v) => !v)}>
            QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanFormState {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string;
  highlight: boolean;
  maxSlots: string;
}

const EMPTY_FORM: PlanFormState = {
  name: "", description: "", price: "", period: "MENSAL",
  features: "", highlight: false, maxSlots: "",
};

export default function PlanosVendaClient() {
  const [plans, setPlans] = useState<LocalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPublicQr, setShowPublicQr] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const publicUrl = slug ? `https://pacerunpro.com.br/p/${slug}` : "";

  useEffect(() => {
    fetch("/api/coach/profile")
      .then((r) => r.json())
      .then((d: { slug?: string | null }) => { if (d.slug) setSlug(d.slug); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/coach/plans")
      .then((res) => {
        if (!res.ok) throw new Error("not ok");
        return res.json() as Promise<LocalPlan[]>;
      })
      .then((data) => setPlans(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(plan: LocalPlan) {
    setForm({
      name: plan.name,
      description: plan.description,
      price: (plan.priceCents / 100).toFixed(2).replace(".", ","),
      period: plan.period,
      features: plan.features.join("\n"),
      highlight: plan.highlight,
      maxSlots: plan.maxSlots === null ? "" : String(plan.maxSlots),
    });
    setEditingId(plan.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.price) return;
    setSaving(true);

    const priceCents = Math.round(parseFloat(form.price.replace(",", ".")) * 100);
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const maxSlots = form.maxSlots ? parseInt(form.maxSlots) : null;

    const body = {
      name: form.name,
      description: form.description,
      priceCents,
      period: form.period,
      features,
      highlight: form.highlight,
      maxSlots,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/coach/plans/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json() as LocalPlan;
          setPlans((prev) => prev.map((p) => p.id === editingId ? { ...p, ...updated } : p));
        }
      } else {
        const res = await fetch("/api/coach/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json() as LocalPlan;
          setPlans((prev) => [...prev, created]);
        }
      }
    } catch {
      // silently keep local state consistent
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
  }

  async function togglePlan(id: string) {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    const newActive = !plan.active;
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, active: newActive } : p));
    try {
      await fetch(`/api/coach/plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
    } catch {
      // revert on failure
      setPlans((prev) => prev.map((p) => p.id === id ? { ...p, active: plan.active } : p));
    }
  }

  async function deletePlan(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/coach/plans/${id}`, { method: "DELETE" });
    } catch {
      // deletion already reflected in UI; ignore
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">Meus planos</Badge>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Planos de venda</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Configure os planos que aparecem na sua página pública. Cada plano tem preço, benefícios e limite de vagas.
            </p>
          </div>
          <Button variant="primary" className="gap-2 shrink-0" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo plano
          </Button>
        </div>
      </motion.div>

      {/* Public page link */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary">Sua página pública</p>
                <p className="mt-0.5 text-sm text-text-muted font-mono">{publicUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowPublicQr((v) => !v)}>
                  QR Code
                </Button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary/30 hover:text-text transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Visualizar
                </a>
              </div>
            </div>
            {showPublicQr && (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4">
                <QRCode value={publicUrl} size={160} />
                <p className="text-xs text-text-muted">QR Code da sua página pública — imprima ou compartilhe</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan form */}
      {showForm && (
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Card className="border-primary/30">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-text">
                  {editingId ? "Editar plano" : "Novo plano"}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Nome do plano *</span>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex.: Corrida Iniciante" className={inputClass} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Preço (R$) *</span>
                    <input type="text" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="149,00" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Período</span>
                    <select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} className={inputClass}>
                      {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className={labelClass}>Descrição</span>
                <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Resumo do plano para o atleta" className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Benefícios (um por linha)</span>
                <textarea rows={4} value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  placeholder={"Planilha semanal personalizada\nCheck-in semanal\nRelatório mensal PDF"}
                  className={cn(inputClass, "resize-none")} />
              </label>

              <div className="flex flex-wrap gap-6">
                <label className="block">
                  <span className={labelClass}>Vagas máximas (deixe vazio = ilimitado)</span>
                  <input type="number" value={form.maxSlots} onChange={(e) => setForm((f) => ({ ...f, maxSlots: e.target.value }))}
                    placeholder="ex.: 20" className={cn(inputClass, "w-40")} />
                </label>
                <div className="flex items-center gap-3 pt-5">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, highlight: !f.highlight }))}
                    className={cn("h-6 w-11 rounded-full transition-colors", form.highlight ? "bg-accent" : "bg-border")}>
                    <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5",
                      form.highlight ? "translate-x-5" : "translate-x-0")} />
                  </button>
                  <span className="text-sm text-text-muted">Destacar como &quot;Mais popular&quot;</span>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border/50 pt-4">
                <Button variant="primary" onClick={handleSave} disabled={saving || !form.name || !form.price} className="gap-2">
                  {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Salvar plano</>}
                </Button>
                <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plans grid */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-border" />
                  <div className="h-3 w-full rounded bg-border" />
                  <div className="h-8 w-1/2 rounded bg-border" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
        {!loading && loadError && (
          <div className="col-span-3 rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center text-sm text-danger">
            Não foi possível carregar os planos. Verifique se o seu perfil de treinador está configurado.
          </div>
        )}
        {!loading && !loadError && plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            publicUrl={`${publicUrl}?plano=${plan.id}`}
            onEdit={() => openEdit(plan)}
            onToggle={() => togglePlan(plan.id)}
            onDelete={() => deletePlan(plan.id)}
          />
        ))}
        {!loading && !loadError && plans.length === 0 && (
          <div className="col-span-3 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-text-muted">Nenhum plano cadastrado ainda.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" /> Criar primeiro plano
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
