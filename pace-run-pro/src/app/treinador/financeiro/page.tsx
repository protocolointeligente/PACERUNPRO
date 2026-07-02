"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, CheckCircle2, CreditCard, ExternalLink, Landmark, Loader2, Wallet, Zap } from "lucide-react";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";
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

type ReceivingMethod = "pix" | "pagbank" | "mercadopago" | "stripe";

const METHODS: { id: ReceivingMethod; label: string; description: string; icon: React.ElementType; badge?: string }[] = [
  {
    id: "pix",
    label: "PIX",
    description: "Receba diretamente via chave PIX. Sem taxas na transferência.",
    icon: Zap,
  },
  {
    id: "pagbank",
    label: "PagBank",
    description: "Conta PagBank ou PagSeguro. Aceita cartão, PIX e boleto.",
    icon: CreditCard,
    badge: "Recomendado",
  },
  {
    id: "mercadopago",
    label: "Mercado Pago",
    description: "Conta Mercado Pago. Em breve — integração em desenvolvimento.",
    icon: Wallet,
    badge: "Em breve",
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Para assessorias com atletas internacionais ou necessidade de moeda estrangeira.",
    icon: Landmark,
  },
];

function MethodCard({
  method,
  selected,
  onSelect,
}: {
  method: typeof METHODS[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = method.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150",
        selected
          ? "border-primary/60 bg-primary/8 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-border/80 hover:bg-card-hover/40"
      )}
    >
      <div className={cn(
        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        selected ? "bg-primary/15" : "bg-card-hover"
      )}>
        <Icon className={cn("h-4.5 w-4.5", selected ? "text-primary" : "text-text-muted")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-display text-sm font-bold", selected ? "text-primary" : "text-text")}>
            {method.label}
          </p>
          {method.badge && (
            <Badge variant="success" className="text-[10px] py-0">{method.badge}</Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">{method.description}</p>
      </div>
      <div className={cn(
        "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-all",
        selected ? "border-primary bg-primary" : "border-border"
      )} />
    </button>
  );
}

function FinanceiroContent() {
  // Dados fiscais
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Conta de recebimento
  const [method, setMethod] = useState<ReceivingMethod | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAgency, setBankAgency] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountType, setBankAccountType] = useState<"corrente" | "poupanca">("corrente");

  // Cobrança automática
  const [autoCharge, setAutoCharge] = useState(false);
  const [chargeDay, setChargeDay] = useState(5);
  const [graceDays, setGraceDays] = useState(3);
  const [blockDays, setBlockDays] = useState(15);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/coach/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razaoSocial, cpfCnpj, responsavel,
          receivingMethod: method,
          pixKey, bankName, bankAgency, bankAccount, bankAccountType,
          autoChargeEnabled: autoCharge,
          autoChargeDayOfMonth: chargeDay,
          gracePeriodDays: graceDays,
          blockAfterDays: blockDays,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">
          <Wallet className="h-3 w-3" /> Financeiro
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Configurações financeiras</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Configure como você recebe os pagamentos dos seus atletas. Os dados fiscais são usados
          na emissão de notas e relatórios.
        </p>
      </motion.div>

      {/* ── Dados fiscais ───────────────────────────────────────────── */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-text-muted" />
              <h2 className="font-display text-sm font-bold text-text">Dados fiscais</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Razão social / Nome</span>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex.: Pace & Cia Esportes LTDA"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>CPF / CNPJ</span>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Responsável financeiro</span>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do responsável pelas finanças"
                className={inputClass}
              />
            </label>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Conta de recebimento ────────────────────────────────────── */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-text-muted" />
              <h2 className="font-display text-sm font-bold text-text">Conta de recebimento</h2>
            </div>
            <p className="text-xs text-text-muted -mt-2">
              Escolha como seus atletas pagam a mensalidade dentro da plataforma.
            </p>

            <div className="space-y-2">
              {METHODS.map((m) => (
                <MethodCard
                  key={m.id}
                  method={m}
                  selected={method === m.id}
                  onSelect={() => setMethod(m.id)}
                />
              ))}
            </div>

            {/* PIX fields */}
            {method === "pix" && (
              <div className="rounded-xl border border-border/60 bg-card-hover/30 p-4 space-y-4">
                <p className="text-xs font-semibold text-text">Chave PIX</p>
                <label className="block">
                  <span className={labelClass}>Chave PIX (CPF, CNPJ, e-mail, celular ou aleatória)</span>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Ex.: contato@minhaassessoria.com.br"
                    className={inputClass}
                  />
                </label>
              </div>
            )}

            {/* Bank account fields */}
            {method === "pix" && (
              <div className="rounded-xl border border-border/60 bg-card-hover/30 p-4 space-y-4">
                <p className="text-xs font-semibold text-text">Dados bancários (opcional — para TED/DOC)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Banco</span>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Ex.: Nubank, Itaú, Bradesco"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Agência</span>
                    <input
                      type="text"
                      value={bankAgency}
                      onChange={(e) => setBankAgency(e.target.value)}
                      placeholder="0001"
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Conta</span>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="00000-0"
                      className={inputClass}
                    />
                  </label>
                  <div>
                    <span className={labelClass}>Tipo de conta</span>
                    <div className="mt-1.5 flex gap-3">
                      {(["corrente", "poupanca"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBankAccountType(t)}
                          className={cn(
                            "flex-1 rounded-xl border py-2 text-xs font-semibold transition-all",
                            bankAccountType === t
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-border bg-card text-text-muted hover:border-border/70"
                          )}
                        >
                          {t === "corrente" ? "Corrente" : "Poupança"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway connect placeholder */}
            {(method === "pagbank" || method === "mercadopago" || method === "stripe") && (
              <div className="rounded-xl border border-border/60 bg-card-hover/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      Conectar conta {method === "pagbank" ? "PagBank" : method === "mercadopago" ? "Mercado Pago" : "Stripe"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Você será redirecionado para autorizar a conexão via OAuth. Em desenvolvimento.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" disabled>
                    <ExternalLink className="h-3.5 w-3.5" /> Conectar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cobrança automática ─────────────────────────────────────── */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
        <Card className="border-warning/20">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <h2 className="font-display text-sm font-bold text-text">Cobrança automática de atletas</h2>
              </div>
              <Badge variant="warning" className="text-[10px]">Plano Assessoria+</Badge>
            </div>
            <p className="text-xs text-text-muted -mt-2">
              O sistema notifica o atleta antes do vencimento, cobra automaticamente e bloqueia o acesso em caso de inadimplência.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card-hover/30 p-4">
              <div>
                <p className="text-sm font-semibold text-text">Ativar cobrança automática</p>
                <p className="text-xs text-text-muted mt-0.5">Requer integração com PagBank ou Mercado Pago</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoCharge((v) => !v)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  autoCharge ? "bg-warning" : "bg-border"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  autoCharge ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {autoCharge && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card-hover/30 p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>Dia de vencimento</span>
                      <select
                        value={chargeDay}
                        onChange={(e) => setChargeDay(Number(e.target.value))}
                        className={inputClass}
                      >
                        {[1, 5, 10, 15, 20, 25].map((d) => (
                          <option key={d} value={d}>Dia {d}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Aviso antes (dias)</span>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={graceDays}
                        onChange={(e) => setGraceDays(Number(e.target.value))}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Bloquear após (dias)</span>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={blockDays}
                        onChange={(e) => setBlockDays(Number(e.target.value))}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>

                {/* Preview flow */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Fluxo do atleta</p>
                  {[
                    { day: `${graceDays} dias antes`, label: "Aviso de vencimento", color: "text-info" },
                    { day: "No vencimento", label: "Cobrança automática enviada", color: "text-success" },
                    { day: `${blockDays} dias em atraso`, label: "Acesso bloqueado automaticamente", color: "text-danger" },
                  ].map((step) => (
                    <div key={step.day} className="flex items-center gap-3 text-xs">
                      <span className="w-28 shrink-0 font-medium text-text-muted">{step.day}</span>
                      <span className="h-px flex-1 border-t border-dashed border-border/50" />
                      <span className={cn("font-semibold", step.color)}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!autoCharge && (
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
                <p className="text-xs text-warning font-medium">
                  <BadgeCheck className="inline h-3.5 w-3.5 mr-1" />
                  Quando ativado, assessorias com cobrança automática têm retenção 40% maior — o atleta passa a depender do sistema para manter acesso.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Salvar ──────────────────────────────────────────────────── */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3 pb-8">
        <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" /> Salvo</>
          ) : (
            "Salvar configurações"
          )}
        </Button>
        {saved && <p className="text-xs text-success">Configurações salvas com sucesso.</p>}
      </motion.div>
    </div>
  );
}

export default function FinanceiroPage() {
  const { role } = useCoachRole();
  if (!canAccess(role, "financeiro")) {
    return <AccessRestricted feature="Config. Financeiras" currentRole={role} requiredRoles={["autonomo", "owner"]} />;
  }
  return <FinanceiroContent />;
}
