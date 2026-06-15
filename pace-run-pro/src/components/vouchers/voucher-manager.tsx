"use client";

import { useEffect, useState } from "react";
import { Gift, Plus, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

type VoucherType = "PERCENT" | "FREE_MONTHS";
type VoucherAudience = "B2C" | "B2B" | "ALL";

interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  audience: VoucherAudience;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  note: string | null;
  createdAt: string;
  createdBy?: { name: string; role: string };
}

const audienceLabels: Record<VoucherAudience, string> = {
  ALL: "Todos os planos",
  B2C: "Planos de atleta",
  B2B: "Planos de assessoria",
};

function generateCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PACE-${random}`;
}

function formatValue(v: Voucher) {
  return v.type === "PERCENT" ? `${v.value}% OFF` : `${v.value} ${v.value === 1 ? "mês" : "meses"} grátis`;
}

function isExpired(v: Voucher) {
  return v.expiresAt ? new Date(v.expiresAt) < new Date() : false;
}

function isExhausted(v: Voucher) {
  return v.maxUses !== null && v.usedCount >= v.maxUses;
}

export function VoucherManager({ showCreator = false }: { showCreator?: boolean }) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState(generateCode());
  const [type, setType] = useState<VoucherType>("PERCENT");
  const [value, setValue] = useState(10);
  const [audience, setAudience] = useState<VoucherAudience>("ALL");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setCode(generateCode());
    setType("PERCENT");
    setValue(10);
    setAudience("ALL");
    setMaxUses("");
    setExpiresAt("");
    setNote("");
    setError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value,
          audience,
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o voucher.");
        setSaving(false);
        return;
      }
      setOpen(false);
      resetForm();
      await load();
    } catch {
      setError("Não foi possível criar o voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(voucher: Voucher) {
    const res = await fetch(`/api/vouchers/${voucher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !voucher.active }),
    });
    if (res.ok) {
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, active: !v.active } : v))
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-text">Vouchers de desconto</h2>
          <p className="mt-1 text-sm text-text-muted">
            Crie cupons para promoções ou presentes — desconto percentual ou meses grátis.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) resetForm();
          }}
        >
          <Button variant="primary" size="md" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo voucher
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Criar voucher
              </DialogTitle>
              <DialogDescription>
                Configure o cupom e compartilhe o código com quem vai usar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Código
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className={inputClass}
                    required
                  />
                  <Button type="button" variant="outline" size="md" onClick={() => setCode(generateCode())}>
                    Gerar
                  </Button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Tipo
                  </span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VoucherType)}
                    className={inputClass}
                  >
                    <option value="PERCENT">% de desconto</option>
                    <option value="FREE_MONTHS">Meses grátis</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {type === "PERCENT" ? "Percentual (1-100)" : "Nº de meses"}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={type === "PERCENT" ? 100 : undefined}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value) || 0)}
                    className={inputClass}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Válido para
                </span>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as VoucherAudience)}
                  className={inputClass}
                >
                  <option value="ALL">Todos os planos</option>
                  <option value="B2C">Planos de atleta (B2C)</option>
                  <option value="B2B">Planos de assessoria (B2B)</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Limite de usos
                  </span>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ilimitado"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Validade
                  </span>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Observação interna
                </span>
                <input
                  type="text"
                  placeholder="Ex.: Black Friday 2026, presente para a Camila…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={inputClass}
                />
              </label>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={saving} className="w-full">
                {saving ? "Criando…" : "Criar voucher"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Carregando vouchers…</p>
      ) : vouchers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Ticket className="h-8 w-8 text-text-muted" />
            <p className="text-sm font-semibold text-text">Nenhum voucher criado ainda</p>
            <p className="text-xs text-text-muted">
              Crie cupons de desconto para promoções, parcerias ou presentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {vouchers.map((v) => {
            const expired = isExpired(v);
            const exhausted = isExhausted(v);
            const inactive = !v.active || expired || exhausted;
            return (
              <Card key={v.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold tracking-wide text-text">{v.code}</span>
                        <Badge variant="primary">{formatValue(v)}</Badge>
                        <Badge variant="outline">{audienceLabels[v.audience]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {v.usedCount} uso{v.usedCount === 1 ? "" : "s"}
                        {v.maxUses !== null ? ` de ${v.maxUses}` : " · ilimitado"}
                        {v.expiresAt && ` · válido até ${new Date(v.expiresAt).toLocaleDateString("pt-BR")}`}
                        {showCreator && v.createdBy && ` · criado por ${v.createdBy.name}`}
                        {v.note && ` · ${v.note}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired && <Badge variant="danger">Expirado</Badge>}
                    {exhausted && !expired && <Badge variant="danger">Esgotado</Badge>}
                    {!v.active && !expired && !exhausted && <Badge variant="outline">Inativo</Badge>}
                    {!inactive && <Badge variant="success">Ativo</Badge>}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(v)}
                      disabled={expired || exhausted}
                    >
                      {v.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
