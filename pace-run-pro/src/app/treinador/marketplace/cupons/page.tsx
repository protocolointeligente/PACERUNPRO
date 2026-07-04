"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Plus, Tag, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discountPct: number | null;
  discountCents: number | null;
  minOrderCents: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function fmtDiscount(c: Coupon): string {
  if (c.discountPct != null) return `${Math.round(c.discountPct * 100)}% de desconto`;
  if (c.discountCents != null) return `R$ ${(c.discountCents / 100).toFixed(2)} de desconto`;
  return "—";
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    discountType: "pct" as "pct" | "fixed",
    discountValue: "",
    minOrderBrl: "",
    maxUses: "",
    expiresAt: "",
    description: "",
  });

  const loadCoupons = () => {
    setLoading(true);
    fetch("/api/coach/marketplace/coupons")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { coupons: Coupon[] } | null) => { if (d) setCoupons(d.coupons); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, []);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const value = parseFloat(form.discountValue);
    if (isNaN(value) || value <= 0) { setError("Valor inválido"); setSaving(false); return; }

    const body: Record<string, unknown> = {
      code: form.code.toUpperCase().trim(),
      description: form.description.trim() || undefined,
    };

    if (form.discountType === "pct") {
      body.discountPct = value / 100;
    } else {
      body.discountCents = Math.round(value * 100);
    }
    if (form.minOrderBrl) body.minOrderCents = Math.round(parseFloat(form.minOrderBrl) * 100);
    if (form.maxUses) body.maxUses = parseInt(form.maxUses);
    if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();

    const res = await fetch("/api/coach/marketplace/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao criar cupom"); setSaving(false); return; }

    setSaved(true);
    setShowForm(false);
    setForm({ code: "", discountType: "pct", discountValue: "", minOrderBrl: "", maxUses: "", expiresAt: "", description: "" });
    setTimeout(() => setSaved(false), 3000);
    loadCoupons();
    setSaving(false);
  }

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/coach/marketplace/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    loadCoupons();
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Remover cupom "${coupon.code}"?`)) return;
    await fetch(`/api/coach/marketplace/coupons/${coupon.id}`, { method: "DELETE" });
    loadCoupons();
  }

  const activeCoupons = coupons.filter((c) => c.isActive);
  const inactiveCoupons = coupons.filter((c) => !c.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Badge variant="primary" className="mb-2">Marketplace</Badge>
          <h1 className="font-display text-2xl font-bold text-text">Cupons de desconto</h1>
          <p className="text-sm text-text-muted mt-0.5">Crie cupons para atrair novos compradores e fidelizar atletas.</p>
        </div>
        <Button onClick={() => { setShowForm((v) => !v); setError(null); }} className="gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Fechar" : "Novo cupom"}
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Cupom criado com sucesso!
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-text">Novo cupom</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Código *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))}
                  placeholder="BLACK20"
                  maxLength={32}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Descrição</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Black Friday 20%"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Tipo de desconto</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "pct" | "fixed" }))}
                  className={inputCls}
                >
                  <option value="pct">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {form.discountType === "pct" ? "Desconto (%)" : "Desconto (R$)"} *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step={form.discountType === "pct" ? "1" : "0.01"}
                  max={form.discountType === "pct" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === "pct" ? "20" : "50.00"}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Pedido mínimo (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderBrl}
                  onChange={(e) => setForm((p) => ({ ...p, minOrderBrl: e.target.value }))}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Limite de usos</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                  placeholder="Ilimitado"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Expira em</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || !form.code || !form.discountValue} className="gap-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Criar cupom
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <Tag className="h-10 w-10 text-text-muted/30" />
          <div>
            <p className="font-semibold text-text">Nenhum cupom criado</p>
            <p className="text-sm text-text-muted">Crie cupons para promover seus produtos no marketplace.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Ativos", items: activeCoupons },
            { label: "Inativos", items: inactiveCoupons },
          ].map(({ label, items }) =>
            items.length === 0 ? null : (
              <section key={label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</h2>
                <div className="space-y-2">
                  {items.map((c) => {
                    const used = c.maxUses != null ? `${c.usedCount}/${c.maxUses}` : `${c.usedCount} usos`;
                    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                    return (
                      <div key={c.id} className={cn("flex items-center gap-4 rounded-xl border p-4 transition-colors", c.isActive && !isExpired ? "border-border bg-card" : "border-border/40 bg-card-hover/30 opacity-60")}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-text text-sm">{c.code}</span>
                            {isExpired && <Badge variant="danger" className="text-[10px]">Expirado</Badge>}
                            {!c.isActive && !isExpired && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {fmtDiscount(c)}
                            {c.minOrderCents ? ` · mín. R$ ${(c.minOrderCents / 100).toFixed(0)}` : ""}
                            {" · "}{used}
                            {c.expiresAt ? ` · expira ${new Date(c.expiresAt).toLocaleDateString("pt-BR")}` : ""}
                          </p>
                          {c.description && <p className="text-[11px] text-text-muted/70 mt-0.5">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleActive(c)}
                            className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", c.isActive ? "bg-success/10 text-success hover:bg-success/20" : "bg-card-hover text-text-muted hover:bg-card")}
                          >
                            {c.isActive ? "Ativo" : "Ativar"}
                          </button>
                          <button onClick={() => deleteCoupon(c)} className="text-text-muted hover:text-danger transition-colors p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
