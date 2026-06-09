"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2cPlans, b2cIncludes } from "@/lib/mock-data";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

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
      <h4 className="font-display text-lg font-bold text-white">{plan.name}</h4>
      <p className="text-xs text-text-muted">{plan.description}</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-2xl font-extrabold text-white">
          R$ {plan.pricePerMonth}
        </span>
        <span className="mb-0.5 text-sm text-text-muted">/mês</span>
      </div>
      {plan.months > 1 && (
        <p className="mt-1 text-xs text-text-muted">
          Total: R$ {plan.totalPrice} em {plan.months}x
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
type PaymentMethod = "cartao" | "pix" | "boleto";

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
    { id: "boleto", label: "Boleto" },
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
              ? "border-primary/60 bg-primary/10 text-white"
              : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-white",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Inner content (reads searchParams) ───────────────────────────────────
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPlano = searchParams.get("plano") ?? "semestral";
  const validIds = b2cPlans.map((p) => p.id);
  const defaultPlan = validIds.includes(paramPlano) ? paramPlano : "semestral";

  const [step, setStep] = useState<1 | 2>(1);
  const [processing, setProcessing] = useState(false);

  // Step 1 — Plan selection
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  // Step 2 — Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  const plan = b2cPlans.find((p) => p.id === selectedPlan) ?? b2cPlans[2];

  function handleCopyPix() {
    navigator.clipboard
      .writeText(
        "00020126580014BR.GOV.BCB.PIX0136e7c6d1a2-3f4b-5c6d-7e8f-9a0b1c2d3e4f5204000053039865802BR5925PACE RUN PRO TECNOLOGIA6009SAO PAULO62070503***6304ABCD"
      )
      .catch(() => undefined);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  }

  function handleConfirm() {
    setProcessing(true);
    setTimeout(() => {
      router.push("/anamnese");
    }, 1500);
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-2xl shadow-primary/40">
          <Zap className="h-10 w-10 text-white animate-pulse" fill="white" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-white">
            Processando...
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Confirmando seu pagamento. Aguarde um momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={step} total={2} />

      {/* ── Step 1: Plan selection ── */}
      {step === 1 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-white">
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
                    <Badge
                      variant="primary"
                      className="shadow-lg shadow-primary/25 whitespace-nowrap"
                    >
                      {p.badge}
                    </Badge>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {p.description}
                    </p>
                  </div>
                  {selectedPlan === p.id && (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-display text-2xl font-extrabold text-white">
                    R$ {p.pricePerMonth}
                  </span>
                  <span className="mb-0.5 text-sm text-text-muted">/mês</span>
                </div>
                {p.months > 1 && (
                  <p className="mt-1 text-xs text-text-muted">
                    Total: R$ {p.totalPrice} em {p.months}x
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
            <p className="mb-4 text-sm font-semibold text-white">
              Todos os planos incluem:
            </p>
            <ul className="space-y-2">
              {b2cIncludes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-text-muted"
                >
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

      {/* ── Step 2: Payment ── */}
      {step === 2 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-white">
            Finalizar assinatura
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Revise seu pedido e conclua o pagamento.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="mb-4 text-sm font-semibold text-white">
                  Resumo do pedido
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Plano</span>
                    <span className="font-medium text-white">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Valor mensal</span>
                    <span className="font-medium text-white">
                      R$ {plan.pricePerMonth}/mês
                    </span>
                  </div>
                  {plan.months > 1 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total cobrado hoje</span>
                      <span className="font-bold text-white">
                        R$ {plan.totalPrice}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 text-xs text-text-muted">
                    {plan.description}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">
                  Forma de pagamento
                </p>
                <PaymentToggle
                  value={paymentMethod}
                  onChange={setPaymentMethod}
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
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
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
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Exatamente como no cartão"
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
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
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
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="000"
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
                    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card-hover">
                      <span className="text-center text-xs text-text-muted">
                        QR Code PIX
                        <br />
                        (mock)
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Escaneie o QR code ou copie a chave PIX abaixo
                    </p>
                    <div className="flex w-full gap-2">
                      <input
                        readOnly
                        value="00020126580014BR.GOV.BCB.PIX..."
                        className={`${inputClass} truncate cursor-default`}
                      />
                      <Button
                        variant="outline"
                        size="md"
                        className="flex-shrink-0 gap-1.5"
                        onClick={handleCopyPix}
                      >
                        <Copy className="h-4 w-4" />
                        {pixCopied ? "Copiado!" : "Copiar"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Boleto */}
                {paymentMethod === "boleto" && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-card-hover">
                      <span className="text-xs text-text-muted">
                        Código de barras
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Boleto vence em{" "}
                      <span className="font-semibold text-warning">
                        3 dias úteis
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Após o pagamento, a confirmação ocorre em até 1 dia útil.
                    </p>
                  </div>
                )}
              </div>
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
              onClick={() => setStep(1)}
            >
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleConfirm}
            >
              Confirmar e assinar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-background text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-wide text-white">
              PACE RUN <span className="gradient-text">PRO</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Suspense fallback={null}>
          <CheckoutContent />
        </Suspense>
      </main>
    </div>
  );
}
