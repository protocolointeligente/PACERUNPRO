"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2cPlans, b2cIncludes } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

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

// ── CPF formatter ─────────────────────────────────────────────────────────
function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
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
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Plan selection
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  // Step 2 — User info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // PIX result
  const [pixText, setPixText] = useState<string | null>(null);
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);

  // Success
  const [success, setSuccess] = useState(false);

  const plan = b2cPlans.find((p) => p.id === selectedPlan) ?? b2cPlans[2];

  // Pre-fill from session
  useEffect(() => {
    fetch("/api/atleta/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { name?: string; email?: string } | null) => {
        if (d?.name && !customerName) setCustomerName(d.name);
        if (d?.email && !customerEmail) setCustomerEmail(d.email);
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopyPix() {
    if (!pixText) return;
    navigator.clipboard.writeText(pixText).catch(() => undefined);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  }

  async function handlePay() {
    setError(null);
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }
    if (paymentMethod === "pix" && !customerCpf.replace(/\D/g, "")) {
      setError("CPF é obrigatório para pagamento via PIX.");
      return;
    }
    if (paymentMethod === "cartao") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setError("Preencha todos os dados do cartão.");
        return;
      }
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          planId: selectedPlan,
          planName: plan.name,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerCpf: customerCpf.replace(/\D/g, ""),
          ...(paymentMethod === "cartao"
            ? { cardNumber: cardNumber.replace(/\s/g, ""), cardName, cardExpiry, cardCvv }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pagamento.");
        return;
      }

      if (paymentMethod === "pix") {
        // Show PIX QR code — user pays and we wait for webhook
        setPixText(data.pixText ?? null);
        setPixQrCodeUrl(data.pixQrCodeUrl ?? null);
        setPixOrderId(data.orderId ?? null);
      } else {
        // Card — check status
        if (data.status === "PAID" || data.status === "AUTHORIZED") {
          setSuccess(true);
        } else if (data.status === "DECLINED") {
          setError(`Cartão recusado: ${data.declineCode ?? "tente outro cartão"}.`);
        } else {
          // Other statuses — redirect to success page
          setSuccess(true);
        }
      }
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setProcessing(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20 shadow-2xl shadow-success/20">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text">
            Pagamento aprovado!
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Seu plano foi ativado. Bem-vindo ao PACERUNPRO.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => router.push("/atleta/dashboard")}>
          Acessar minha conta →
        </Button>
      </div>
    );
  }

  // ── PIX waiting screen ────────────────────────────────────────────────
  if (pixText) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <h2 className="font-display text-2xl font-extrabold text-text">Pague via PIX</h2>
        <p className="text-sm text-text-muted max-w-sm">
          Escaneie o QR code ou copie a chave PIX. O acesso é liberado automaticamente após o pagamento.
        </p>

        {/* QR code image */}
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl border border-border bg-white p-3">
          {pixQrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pixQrCodeUrl} alt="QR Code PIX" className="h-full w-full object-contain" />
          ) : (
            <div className="text-center text-xs text-gray-400">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
              Carregando QR Code…
            </div>
          )}
        </div>

        {/* Copy PIX code */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex gap-2">
            <input
              readOnly
              value={pixText}
              className={`${inputClass} truncate cursor-default text-xs`}
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
          {pixOrderId && (
            <p className="text-xs text-text-muted">
              Pedido: <span className="font-mono">{pixOrderId}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-muted max-w-sm">
          O QR Code expira em <strong className="text-warning">30 minutos</strong>. Após pagar, aguarde a confirmação automática.
        </div>

        <Button variant="outline" size="md" onClick={() => { setPixText(null); setPixQrCodeUrl(null); }}>
          ← Voltar
        </Button>
      </div>
    );
  }

  return (
    <>
      <StepIndicator current={step} total={2} />

      {/* ── Step 1: Plan selection ── */}
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
                    <h3 className="font-display text-base font-bold text-text">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {p.description}
                    </p>
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
                    Total: R$ {formatBRL(p.totalPrice)}
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
            <p className="mb-4 text-sm font-semibold text-text">
              Todos os planos incluem:
            </p>
            <ul className="space-y-2">
              {b2cIncludes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-center text-xs text-text-muted">
            Sem renovação automática — você decide quando e se quer continuar. Nenhuma cobrança surpresa.
          </p>

          <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => setStep(2)}>
            Continuar →
          </Button>
        </div>
      )}

      {/* ── Step 2: Payment ── */}
      {step === 2 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Finalizar assinatura
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Revise seu pedido e conclua o pagamento.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* User info */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <p className="text-sm font-semibold text-text">Seus dados</p>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Nome completo *
                  </span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    E-mail *
                  </span>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    CPF {paymentMethod === "pix" ? "*" : "(recomendado)"}
                  </span>
                  <input
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    className={inputClass}
                  />
                </label>
              </div>

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
                      R$ {formatBRL(plan.pricePerMonth)}/mês
                    </span>
                  </div>
                  {plan.months > 1 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total cobrado hoje</span>
                      <span className="font-bold text-text">
                        R$ {formatBRL(plan.totalPrice)}
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
                <p className="text-sm font-semibold text-text">Forma de pagamento</p>
                <PaymentToggle value={paymentMethod} onChange={setPaymentMethod} />

                {/* Cartão */}
                {paymentMethod === "cartao" && (
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Número do cartão
                      </span>
                      <input
                        value={cardNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(digits.replace(/(\d{4})/g, "$1 ").trim());
                        }}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        inputMode="numeric"
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
                        placeholder="NOME COMO NO CARTÃO"
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
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                          }}
                          placeholder="MM/AA"
                          maxLength={5}
                          inputMode="numeric"
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
                          maxLength={4}
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* PIX info */}
                {paymentMethod === "pix" && (
                  <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-2">
                    <div className="text-4xl">⚡</div>
                    <p className="font-semibold text-text">Pagamento instantâneo</p>
                    <p className="text-sm text-text-muted">
                      Clique em &ldquo;Gerar QR Code PIX&rdquo; abaixo. O acesso é liberado automaticamente após o pagamento.
                    </p>
                    <p className="text-xs text-text-muted">CPF obrigatório para PIX</p>
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
            <Button variant="outline" size="lg" className="px-5" onClick={() => { setStep(1); setError(null); }}>
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando…</>
              ) : paymentMethod === "pix" ? (
                "Gerar QR Code PIX →"
              ) : (
                "Confirmar pagamento →"
              )}
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card-hover/40 p-4 text-xs text-text-muted space-y-1.5">
            <p className="font-semibold text-text text-[11px] uppercase tracking-wider">Como funciona a assinatura</p>
            <p>
              Ao confirmar o pagamento, você terá acesso pelo período contratado ({b2cPlans.find(p => p.id === selectedPlan)?.name.toLowerCase() ?? "selecionado"}).
              O acesso é liberado <strong className="text-text">automaticamente</strong> após a confirmação do pagamento.
            </p>
            <p>
              A assinatura <strong className="text-text">não renova automaticamente</strong> — ao final do período, você receberá um aviso por e-mail
              e poderá escolher renovar. Sem cobranças surpresa.
            </p>
            <p>🔒 Pagamento seguro via PagBank. Seus dados são criptografados.</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Dúvidas? </span>
            <a href="mailto:suporte@pacerunpro.com.br" className="text-xs text-primary hover:underline">
              suporte@pacerunpro.com.br
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
