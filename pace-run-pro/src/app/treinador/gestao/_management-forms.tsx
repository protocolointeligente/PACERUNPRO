"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Trash2, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BillingSettings = {
  razaoSocial?: string | null;
  cpfCnpj?: string | null;
  responsavel?: string | null;
  receivingMethod?: string | null;
  pixKey?: string | null;
  bankName?: string | null;
  bankAgency?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  asaasAccountId?: string | null;
  asaasWalletId?: string | null;
  asaasOnboardingStatus?: string | null;
  autoChargeEnabled?: boolean | null;
  autoChargeDayOfMonth?: number | null;
};

function inputClass() {
  return "w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary/60 focus:outline-none";
}

function parsePriceToCents(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function CreateCoachPlanForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("MENSAL");
  const [features, setFeatures] = useState("Prescrição mensal\nAcompanhamento por WhatsApp\nAjustes semanais");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priceCents: parsePriceToCents(price),
          period,
          features: features.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Não foi possível criar o plano.");
      setMessage("Plano criado, publicado na loja e disponível para contratação.");
      setName("");
      setDescription("");
      setPrice("");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar plano.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Nome do plano
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} placeholder="Performance mensal" required />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Valor
          <input className={inputClass()} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="197,00" inputMode="decimal" required />
        </label>
      </div>
      <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Periodicidade
        <select className={inputClass()} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="MENSAL">Mensal</option>
          <option value="TRIMESTRAL">Trimestral</option>
          <option value="SEMESTRAL">Semestral</option>
          <option value="ANUAL">Anual</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Descrição
        <input className={inputClass()} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para atletas que querem acompanhamento contínuo" />
      </label>
      <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Entregas do plano
        <textarea className={`${inputClass()} min-h-24 resize-y`} value={features} onChange={(e) => setFeatures(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Criar plano de venda
        </Button>
        {message && <span className="text-xs text-text-muted">{message}</span>}
      </div>
    </form>
  );
}

export function RemoveManagedAthleteButton({ athleteId, athleteName }: { athleteId: string; athleteName: string }) {
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remover ${athleteName} da sua gestao? O historico do atleta sera preservado, mas o vinculo e a vaga do plano serao liberados.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/coach/athletes/${athleteId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Nao foi possivel remover o atleta.");
      }
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao remover atleta.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" size="sm" onClick={handleRemove} disabled={removing}>
        {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Remover
      </Button>
      {message && <span className="max-w-48 text-xs text-danger">{message}</span>}
    </div>
  );
}

export function BillingSettingsForm({ initialSettings }: { initialSettings: BillingSettings | null }) {
  const [form, setForm] = useState({
    razaoSocial: initialSettings?.razaoSocial ?? "",
    cpfCnpj: initialSettings?.cpfCnpj ?? "",
    responsavel: initialSettings?.responsavel ?? "",
    pixKey: initialSettings?.pixKey ?? "",
    bankName: initialSettings?.bankName ?? "",
    bankAgency: initialSettings?.bankAgency ?? "",
    bankAccount: initialSettings?.bankAccount ?? "",
    bankAccountType: initialSettings?.bankAccountType ?? "corrente",
    asaasAccountId: initialSettings?.asaasAccountId ?? "",
    asaasWalletId: initialSettings?.asaasWalletId ?? "",
    asaasOnboardingStatus: initialSettings?.asaasOnboardingStatus ?? "pending",
    autoChargeEnabled: Boolean(initialSettings?.autoChargeEnabled),
    autoChargeDayOfMonth: String(initialSettings?.autoChargeDayOfMonth ?? 5),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          receivingMethod: "ASAAS",
          autoChargeDayOfMonth: Number(form.autoChargeDayOfMonth) || 5,
        }),
      });
      if (!res.ok) throw new Error("Não foi possível salvar os dados de recebimento.");
      setMessage("Dados de recebimento salvos.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar dados.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={form.asaasOnboardingStatus === "ready" ? "success" : "warning"}>
          {form.asaasOnboardingStatus === "ready" ? "Dados de recebimento prontos" : "Recebimento pendente"}
        </Badge>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <input
            type="checkbox"
            checked={form.autoChargeEnabled}
            onChange={(e) => update("autoChargeEnabled", e.target.checked)}
          />
          Cobrança automática
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass()} value={form.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} placeholder="Razão social / Nome completo" />
        <input className={inputClass()} value={form.cpfCnpj} onChange={(e) => update("cpfCnpj", e.target.value)} placeholder="CPF ou CNPJ" />
        <input className={inputClass()} value={form.responsavel} onChange={(e) => update("responsavel", e.target.value)} placeholder="Responsável financeiro" />
        <input className={inputClass()} value={form.pixKey} onChange={(e) => update("pixKey", e.target.value)} placeholder="Chave PIX de recebimento" />
        <input className={inputClass()} value={form.asaasAccountId} onChange={(e) => update("asaasAccountId", e.target.value)} placeholder="ID da conta de recebimento" />
        <input className={inputClass()} value={form.asaasWalletId} onChange={(e) => update("asaasWalletId", e.target.value)} placeholder="Carteira de repasse" />
        <input className={inputClass()} value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="Banco" />
        <input className={inputClass()} value={form.bankAgency} onChange={(e) => update("bankAgency", e.target.value)} placeholder="Agência" />
        <input className={inputClass()} value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} placeholder="Conta" />
        <input className={inputClass()} value={form.autoChargeDayOfMonth} onChange={(e) => update("autoChargeDayOfMonth", e.target.value)} placeholder="Dia de cobrança" inputMode="numeric" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          Salvar dados de recebimento
        </Button>
        {message && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
