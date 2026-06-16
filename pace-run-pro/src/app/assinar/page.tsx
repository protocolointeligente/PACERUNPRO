"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check, CheckCircle, Copy, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2cPlans, b2cIncludes } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ── Input formatters ──────────────────────────────────────────────────────
function formatCpf(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})/g, "$1 ")
    .trim();
}

function formatCardExpiry(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/^(\d{2})(\d)/, "$1/$2");
}

// ── Step indicator ────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
              s === current
                ? "gradient-primary text-white shadow-lg shadow-primary/30"
                : s < current
                ? "bg-success/20 text-success border border-success/40"
                : "border border-border bg-card text-text-muted",
            ].join(" ")}
          >
            {s < current ? <Check className="h-3.5 w-3.5" /> : s}
          </div>
          {s < total && (
            <div
              className={[
                "h-px w-8 transition-colors",
                s < current ? "bg-success/40" : "bg-border",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Plan summary card ─────────────────────────────────────────────────────
function PlanSummaryCard({ planId }: { planId: string }) {
  const plan = b2cPlans.find((p) => p.id === planId) ?? b2cPlans[2];
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Plano selecionado
      </p>
      <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
      <p className="text-xs text-text-muted">{plan.description}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-2xl font-extrabold text-text">
          R$ {formatBRL(plan.pricePerMonth)}
        </span>
        <span className="mb-0.5 text-sm text-text-muted">/mês</span>
      </div>
      {plan.months > 1 && (
        <p className="mt-1 text-xs text-text-muted">
          Total: R$ {formatBRL(plan.totalPrice)} em {plan.months}x
        </p>
      )}
      {plan.discountPct > 0 && (
        <span className="mt-2 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
          {plan.discountPct}% de desconto
        </span>
      )}
    </div>
  );
}

// ── Payment method toggle ─────────────────────────────────────────────────
type PaymentMethod = "cartao" | "pix";

function PaymentToggle({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}) {
  const options: { id: PaymentMethod; label: string }[] = [
    { id: "cartao", label: "Cartão de crédito" },
    { id: "pix", label: "PIX" },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={[
            "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
            value === o.id
              ? "border-primary/60 bg-primary/10 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Inner content (reads searchParams) ───────────────────────────────────
function AssinarContent() {
  const searchParams = useSearchParams();
  const paramPlano = searchParams.get("plano") ?? "semestral";
  const validIds = b2cPlans.map((p) => p.id);
  const defaultPlan = validIds.includes(paramPlano) ? paramPlano : "semestral";

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmed, setConfirmed] = useState(false);

  // Step 1
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  // Step 2
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [dataProva, setDataProva] = useState("");

  // Step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  // Step 3 — checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [pixResult, setPixResult] = useState<{
    orderId: string;
    pixText: string;
    pixQrCodeUrl: string | null;
  } | null>(null);

  // Cupom de desconto
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; type: "PERCENT" | "FREE_MONTHS"; value: number } | null>(null);

  const plan = b2cPlans.find((p) => p.id === selectedPlan) ?? b2cPlans[2];

  const discountPct = coupon?.type === "PERCENT" ? coupon.value : 0;
  const discountedMonthly = plan.pricePerMonth * (1 - discountPct / 100);
  const discountedTotal = plan.totalPrice * (1 - discountPct / 100);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, audience: "B2C" }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCoupon(null);
        setCouponError(data.error ?? "Cupom inválido.");
      } else {
        setCoupon({ code: couponCode.trim().toUpperCase(), type: data.type, value: data.value });
        setCouponError("");
      }
    } catch {
      setCoupon(null);
      setCouponError("Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleCopyPix(text: string) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const amountCents = Math.round(discountedTotal * 100);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          planId: selectedPlan,
          planName: plan.name,
          amountCents,
          customerName: nome,
          customerEmail: email,
          customerCpf: cpf,
          ...(paymentMethod === "cartao" && { cardNumber, cardName, cardExpiry, cardCvv }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Erro ao processar pagamento.");
        return;
      }
      if (paymentMethod === "pix") {
        setPixResult(data);
      } else {
        if (data.status === "PAID") {
          setConfirmed(true);
        } else {
          setCheckoutError(
            `Pagamento recusado${data.declineCode ? ` (cód. ${data.declineCode})` : ""}. Verifique os dados do cartão.`
          );
        }
      }
    } catch {
      setCheckoutError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 border border-success/30">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-extrabold text-text">
            Assinatura confirmada!
          </h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Bem-vindo(a) ao Pace Run Pro! O treinador Ricardo Pace e sua equipe entrarão em contato
            em até 24h para iniciar seu plano.
          </p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/5 px-6 py-4 text-sm text-success">
          Plano <strong>{plan.name}</strong> · R$ {formatBRL(discountedMonthly)}/mês ativo
          {coupon?.type === "FREE_MONTHS" &&
            ` · +${coupon.value} ${coupon.value === 1 ? "mês" : "meses"} grátis`}
        </div>
        <Link href="/aluno/dashboard">
          <Button variant="primary" size="lg" className="gap-2">
            Acessar minha conta →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={step} total={3} />

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Escolha seu plano
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Selecione o período que melhor se encaixa no seu objetivo.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {b2cPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={[
                  "relative flex flex-col rounded-2xl border p-6 text-left transition-all",
                  selectedPlan === p.id
                    ? "border-primary/60 bg-primary/15"
                    : "border-border bg-card hover:border-primary/30",
                ].join(" ")}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-5">
                    <Badge variant="primary" className="shadow-lg shadow-primary/25 whitespace-nowrap">
                      {p.badge}
                    </Badge>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-text">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-text-muted">{p.description}</p>
                  </div>
                  {selectedPlan === p.id && (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-text" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-display text-2xl font-extrabold text-text">
                    R$ {formatBRL(p.pricePerMonth)}
                  </span>
                  <span className="mb-0.5 text-sm text-text-muted">/mês</span>
                </div>
                {p.months > 1 && (
                  <p className="mt-1 text-xs text-text-muted">
                    Total: R$ {formatBRL(p.totalPrice)} em {p.months}x
                  </p>
                )}
                {p.discountPct > 0 && (
                  <span className="mt-2 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    {p.discountPct}% OFF
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Includes checklist */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 text-sm font-semibold text-text">Todos os planos incluem:</p>
            <ul className="space-y-2">
              {b2cIncludes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-8 w-full"
            onClick={() => setStep(2)}
          >
            Continuar →
          </Button>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Crie sua conta
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Preencha seus dados para personalizar seu plano de treinos.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="space-y-5 lg:col-span-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome completo
                </span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Camila Andrade"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  CPF
                </span>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  WhatsApp
                </span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Cidade / Estado
                </span>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex.: Belo Horizonte, MG"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Seu objetivo principal
                </span>
                <select
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option value="primeira-corrida">Completar minha primeira corrida</option>
                  <option value="melhorar-tempo">Melhorar meu tempo</option>
                  <option value="meia-maratona">Correr meia maratona</option>
                  <option value="maratona">Correr maratona</option>
                  <option value="performance">Performance máxima</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Data da prova{" "}
                  <span className="normal-case font-normal text-text-muted/60">(opcional)</span>
                </span>
                <input
                  type="date"
                  value={dataProva}
                  onChange={(e) => setDataProva(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            {/* Plan summary — desktop right */}
            <div className="hidden lg:block">
              <PlanSummaryCard planId={selectedPlan} />
            </div>
          </div>

          {/* Plan summary — mobile top */}
          <div className="mt-6 lg:hidden">
            <PlanSummaryCard planId={selectedPlan} />
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="px-5"
              onClick={() => setStep(1)}
            >
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => setStep(3)}
              disabled={!nome.trim() || !email.trim() || !objetivo}
            >
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Finalizar assinatura
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Revise seu pedido e conclua o pagamento.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="mb-4 text-sm font-semibold text-text">Resumo do pedido</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Plano</span>
                    <span className="font-medium text-text">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Valor mensal</span>
                    <span className="font-medium text-text">
                      {discountPct > 0 && (
                        <span className="mr-1.5 text-xs text-text-muted line-through">
                          R$ {formatBRL(plan.pricePerMonth)}
                        </span>
                      )}
                      R$ {formatBRL(discountedMonthly)}/mês
                    </span>
                  </div>
                  {plan.months > 1 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total cobrado hoje</span>
                      <span className="font-bold text-text">
                        {discountPct > 0 && (
                          <span className="mr-1.5 text-xs font-normal text-text-muted line-through">
                            R$ {formatBRL(plan.totalPrice)}
                          </span>
                        )}
                        R$ {formatBRL(discountedTotal)}
                      </span>
                    </div>
                  )}

                  {coupon?.type === "PERCENT" && (
                    <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                      🎉 Cupom <strong>{coupon.code}</strong> aplicado: {coupon.value}% de desconto.
                    </div>
                  )}
                  {coupon?.type === "FREE_MONTHS" && (
                    <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                      🎁 Cupom <strong>{coupon.code}</strong> aplicado: {coupon.value}{" "}
                      {coupon.value === 1 ? "mês" : "meses"} grátis serão adicionados após a confirmação.
                    </div>
                  )}

                  <div className="border-t border-border pt-3 text-xs text-text-muted">
                    {plan.description}
                  </div>
                </div>

                {/* Cupom de desconto */}
                <div className="mt-4 border-t border-border pt-4">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Cupom de desconto
                  </span>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Ex.: PACE-ABC123"
                      className={inputClass}
                      disabled={!!coupon}
                    />
                    {coupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        className="flex-shrink-0"
                        onClick={() => {
                          setCoupon(null);
                          setCouponCode("");
                          setCouponError("");
                        }}
                      >
                        Remover
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        className="flex-shrink-0"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? "Validando…" : "Aplicar"}
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="mt-1.5 text-xs text-red-400">{couponError}</p>}
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-text">Forma de pagamento</p>
                <PaymentToggle
                  value={paymentMethod}
                  onChange={(v) => {
                    setPaymentMethod(v);
                    setPixResult(null);
                    setCheckoutError("");
                  }}
                />

                {/* Cartão */}
                {paymentMethod === "cartao" && (
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Número do cartão
                      </span>
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        inputMode="numeric"
                        maxLength={19}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Nome no cartão
                      </span>
                      <input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="EXATAMENTE COMO NO CARTÃO"
                        className={inputClass}
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Validade
                        </span>
                        <input
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                          placeholder="MM/AA"
                          inputMode="numeric"
                          maxLength={5}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                          CVV
                        </span>
                        <input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="000"
                          inputMode="numeric"
                          maxLength={4}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* PIX */}
                {paymentMethod === "pix" && (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
                    {pixResult ? (
                      <>
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          {pixResult.pixQrCodeUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pixResult.pixQrCodeUrl}
                              alt="QR Code PIX"
                              width={200}
                              height={200}
                              className="h-[200px] w-[200px]"
                            />
                          ) : (
                            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                              QR Code indisponível
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-warning">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                          Aguardando pagamento…
                        </div>
                        <p className="text-center text-xs text-text-muted">
                          Escaneie o QR code ou copie a chave PIX abaixo.
                          <br />O código expira em 30 minutos.
                        </p>
                        <div className="flex w-full gap-2">
                          <input
                            readOnly
                            value={pixResult.pixText}
                            className={`${inputClass} cursor-default truncate`}
                          />
                          <Button
                            variant="outline"
                            size="md"
                            className="flex-shrink-0 gap-1.5"
                            onClick={() => handleCopyPix(pixResult.pixText)}
                          >
                            <Copy className="h-4 w-4" />
                            {pixCopied ? "Copiado!" : "Copiar"}
                          </Button>
                        </div>
                        <p className="text-center text-xs text-text-muted">
                          Após pagar, clique em{" "}
                          <strong className="text-text">"Já paguei →"</strong> abaixo para confirmar.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card-hover">
                          <span className="text-center text-xs text-text-muted">
                            QR Code PIX
                            <br />
                            será gerado ao confirmar
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Clique em{" "}
                          <strong className="text-text">"Gerar QR Code PIX"</strong> para continuar
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error feedback */}
              {checkoutError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {checkoutError}
                </div>
              )}
            </div>

            {/* Plan summary — desktop right */}
            <div className="hidden lg:block">
              <PlanSummaryCard planId={selectedPlan} />
            </div>
          </div>

          {/* Plan summary — mobile */}
          <div className="mt-6 lg:hidden">
            <PlanSummaryCard planId={selectedPlan} />
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="px-5"
              onClick={() => setStep(2)}
              disabled={checkoutLoading}
            >
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 gap-2"
              onClick={pixResult ? () => setConfirmed(true) : handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {checkoutLoading
                ? "Processando…"
                : pixResult
                ? "Já paguei →"
                : paymentMethod === "pix"
                ? "Gerar QR Code PIX"
                : "Confirmar e assinar"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function AssinarPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-wide text-text">
              PACE RUN <span className="gradient-text">PRO</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Suspense fallback={null}>
          <AssinarContent />
        </Suspense>
      </main>
    </div>
  );
}
