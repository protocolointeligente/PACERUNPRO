"use client";

import Link from "next/link";
import Script from "next/script";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2bPlans } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

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

// PagBank.js type shim — loaded via script tag at runtime
declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (opts: {
        publicKey: string;
        holder: string;
        number: string;
        expMonth: string;
        expYear: string;
        securityCode: string;
      }) => { encryptedCard: string; hasErrors: boolean; errors?: unknown[] };
    };
  }
}

// ── Plan summary card ─────────────────────────────────────────────────────
function B2BPlanSummaryCard({ planId }: { planId: string }) {
  const plan = b2bPlans.find((p) => p.id === planId) ?? b2bPlans[2];
  const isFree = plan.price === 0;
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Plano selecionado
      </p>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
        {plan.badge && (
          <Badge variant="primary" className="shrink-0 whitespace-nowrap">
            {plan.badge}
          </Badge>
        )}
      </div>
      {plan.maxAthletes !== null ? (
        <p className="text-xs text-text-muted">
          Até {plan.maxAthletes} atletas
          {plan.maxCoaches && plan.maxCoaches > 1 ? ` · até ${plan.maxCoaches} treinadores` : ""}
        </p>
      ) : (
        <p className="text-xs text-text-muted">Atletas e treinadores ilimitados</p>
      )}
      <div className="mt-3 flex items-end gap-1">
        {isFree ? (
          <span className="font-display text-2xl font-extrabold text-text">Grátis</span>
        ) : (
          <>
            <span className="font-display text-2xl font-extrabold text-text">
              R$ {formatBRL(plan.price)}
            </span>
            <span className="mb-0.5 text-sm text-text-muted">/mês</span>
          </>
        )}
      </div>
      {plan.features.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Inner content (reads searchParams) ───────────────────────────────────
function B2BCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPlano = searchParams.get("plano") ?? "b2b-pro";
  const validIds = b2bPlans.map((p) => p.id);
  const planId = validIds.includes(paramPlano) ? paramPlano : "b2b-pro";

  const plan = b2bPlans.find((p) => p.id === planId) ?? b2bPlans[2];
  const isFree = plan.price === 0;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // User info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // PagBank public key for client-side card encryption
  const pagbankPubKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (isFree) return; // no need to load the key for free plan
    fetch("/api/checkout/pagbank-pubkey")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { publicKey?: string } | null) => {
        if (d?.publicKey) pagbankPubKeyRef.current = d.publicKey;
      })
      .catch(() => null);
  }, [isFree]);

  // PIX result
  const [pixText, setPixText] = useState<string | null>(null);
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);

  // Pre-fill from coach profile
  useEffect(() => {
    fetch("/api/coach/profile")
      .then((r) => (r.ok ? r.json() : null))
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

  async function handleActivateFree() {
    setError(null);
    setProcessing(true);
    try {
      const res = await fetch("/api/checkout/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "pix",
          planId,
          customerName: customerName.trim() || "Coach",
          customerEmail: customerEmail.trim() || "noreply@pacerunpro.com.br",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao ativar plano.");
        return;
      }
      router.push("/treinador/dashboard");
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setProcessing(false);
    }
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

    let encryptedCard: string | undefined;
    if (paymentMethod === "cartao") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setError("Preencha todos os dados do cartão.");
        return;
      }
      const pubKey = pagbankPubKeyRef.current;
      if (!pubKey || !window.PagSeguro) {
        setError("Módulo de segurança de cartão não carregado. Recarregue a página.");
        return;
      }
      const [expMonth, rawYear] = cardExpiry.split("/");
      const expYear = rawYear?.length === 2 ? `20${rawYear}` : rawYear;
      const result = window.PagSeguro.encryptCard({
        publicKey: pubKey,
        holder: cardName,
        number: cardNumber.replace(/\s/g, ""),
        expMonth: expMonth?.trim() ?? "",
        expYear: expYear?.trim() ?? "",
        securityCode: cardCvv,
      });
      if (result.hasErrors) {
        setError("Dados do cartão inválidos. Verifique e tente novamente.");
        return;
      }
      encryptedCard = result.encryptedCard;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/checkout/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          planId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerCpf: customerCpf.replace(/\D/g, ""),
          ...(paymentMethod === "cartao" ? { encryptedCard } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pagamento.");
        return;
      }

      if (paymentMethod === "pix") {
        setPixText(data.pixText ?? null);
        setPixQrCodeUrl(data.pixQrCodeUrl ?? null);
        setPixOrderId(data.orderId ?? null);
      } else {
        if (data.status === "PAID" || data.status === "AUTHORIZED") {
          setSuccess(true);
        } else if (data.status === "DECLINED") {
          setError(`Cartão recusado: ${data.declineCode ?? "tente outro cartão"}.`);
        } else {
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
            Seu plano {plan.name} foi ativado. Bem-vindo ao PACE RUN PRO para assessorias.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => router.push("/treinador/dashboard")}>
          Acessar painel do treinador →
        </Button>
      </div>
    );
  }

  // ── PIX waiting screen ────────────────────────────────────────────────
  if (pixText) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <h2 className="font-display text-2xl font-extrabold text-text">Pague via PIX</h2>
        <p className="max-w-sm text-sm text-text-muted">
          Escaneie o QR code ou copie a chave PIX. Assim que confirmarmos o pagamento, seu plano
          será ativado automaticamente.
        </p>

        {/* QR code image */}
        <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl border border-border bg-white p-3">
          {pixQrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pixQrCodeUrl}
              alt="QR Code PIX"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-center text-xs text-gray-400">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
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
              className={`${inputClass} cursor-default truncate text-xs`}
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

        <div className="max-w-sm rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-muted">
          Assim que confirmarmos o pagamento, seu plano será ativado. O QR Code expira em{" "}
          <strong className="text-warning">30 minutos</strong>.
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setPixText(null);
            setPixQrCodeUrl(null);
          }}
        >
          ← Voltar
        </Button>
      </div>
    );
  }

  return (
    <>
      {!isFree && (
        <Script
          src="https://assets.pagseguro.com.br/checkout-sdk/iojs/pagseguro.min.js"
          strategy="afterInteractive"
        />
      )}

      <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
        {isFree ? "Ativar plano gratuito" : "Assinar plano para treinadores"}
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        {isFree
          ? "Comece agora mesmo, sem cartão de crédito."
          : "Preencha seus dados e conclua o pagamento para ativar sua conta de treinador."}
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Left/main column ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* User info */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
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
            {!isFree && (
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
            )}
          </div>

          {/* Order summary */}
          {!isFree && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-4 text-sm font-semibold text-text">Resumo do pedido</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Plano</span>
                  <span className="font-medium text-text">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Cobrança mensal</span>
                  <span className="font-bold text-text">R$ {formatBRL(plan.price)}/mês</span>
                </div>
                {plan.maxAthletes !== null ? (
                  <div className="border-t border-border pt-3 text-xs text-text-muted">
                    Suporte para até {plan.maxAthletes} atletas
                    {plan.maxCoaches && plan.maxCoaches > 1
                      ? ` e ${plan.maxCoaches} treinadores`
                      : ""}
                  </div>
                ) : (
                  <div className="border-t border-border pt-3 text-xs text-text-muted">
                    Atletas e treinadores ilimitados
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment method — hidden for free plan */}
          {!isFree && (
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
                        onChange={(e) =>
                          setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
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
                <div className="space-y-2 rounded-2xl border border-border bg-card p-5 text-center">
                  <div className="text-4xl">⚡</div>
                  <p className="font-semibold text-text">Pagamento instantâneo</p>
                  <p className="text-sm text-text-muted">
                    Clique em &ldquo;Gerar QR Code PIX&rdquo; abaixo. Assim que confirmarmos o
                    pagamento, seu plano será ativado.
                  </p>
                  <p className="text-xs text-text-muted">CPF obrigatório para PIX</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column — plan summary (desktop) ── */}
        <div className="hidden lg:block">
          <B2BPlanSummaryCard planId={planId} />
        </div>
      </div>

      {/* Plan summary — mobile */}
      <div className="mt-6 lg:hidden">
        <B2BPlanSummaryCard planId={planId} />
      </div>

      {/* Action buttons */}
      <div className="mt-8">
        {isFree ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleActivateFree}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ativando…
              </>
            ) : (
              "Ativar plano grátis →"
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando…
              </>
            ) : paymentMethod === "pix" ? (
              "Gerar QR Code PIX →"
            ) : (
              "Confirmar pagamento →"
            )}
          </Button>
        )}
      </div>

      {!isFree && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-card-hover/40 p-4 text-xs text-text-muted">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text">
            Como funciona a assinatura
          </p>
          <p>
            Ao confirmar o pagamento, você terá acesso por 30 dias. O acesso é liberado{" "}
            <strong className="text-text">automaticamente</strong> após a confirmação. Você pode
            cancelar a qualquer momento em Perfil → Assinatura.
          </p>
          {paymentMethod === "pix" && (
            <p className="text-[11px] italic text-text-muted">
              PIX não suporta renovação automática — você receberá um lembrete por e-mail antes
              do vencimento.
            </p>
          )}
          <p>🔒 Pagamento seguro via PagBank. Seus dados são criptografados.</p>
        </div>
      )}
    </>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function B2BCheckoutPage() {
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
            <a
              href="mailto:suporte@pacerunpro.com.br"
              className="text-xs text-primary hover:underline"
            >
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
          <B2BCheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
