"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import QRCode from "react-qr-code";
import { Check, CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2bPlans } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center gap-1">
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
            <span
              className={[
                "hidden text-[10px] font-medium sm:block",
                s === current ? "text-text" : "text-text-muted",
              ].join(" ")}
            >
              {labels[s - 1]}
            </span>
          </div>
          {s < total && (
            <div
              className={[
                "mb-4 h-px w-6 transition-colors sm:w-10",
                s < current ? "bg-success/40" : "bg-border",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function B2bPlanSummaryCard({
  planId,
  assessoriaName,
}: {
  planId: string;
  assessoriaName?: string;
}) {
  const plan = b2bPlans.find((p) => p.id === planId) ?? b2bPlans[1];
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Plano selecionado
      </p>
      {assessoriaName && (
        <p className="mb-2 text-xs text-text-muted truncate">{assessoriaName}</p>
      )}
      <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
      <p className="mt-0.5 text-xs text-text-muted">
        {plan.maxAthletes === null ? "Atletas ilimitados" : `Até ${plan.maxAthletes} atletas`}
        {" · "}
        {plan.maxCoaches === null ? "Treinadores ilimitados" : `${plan.maxCoaches} treinadores`}
      </p>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-2xl font-extrabold text-text">
          {plan.price === 0 ? "Grátis" : `R$ ${formatBRL(plan.price)}`}
        </span>
        {plan.price > 0 && <span className="mb-0.5 text-sm text-text-muted">/mês</span>}
      </div>
      {plan.badge && (
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {plan.badge}
        </span>
      )}
    </div>
  );
}

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

interface PixResult {
  pixText: string;
  pixQrCodeUrl: string | null;
}

const STEP_LABELS = ["Plano", "Assessoria", "Treinador", "Pagamento"];

function AssessoriaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramPlano = searchParams.get("plano") ?? "b2b-pro";
  const validIds = b2bPlans.map((p) => p.id);
  const defaultPlan = validIds.includes(paramPlano) ? paramPlano : "b2b-pro";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  // Step 1
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);

  // Step 2
  const [nomeAssessoria, setNomeAssessoria] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cidadeEstado, setCidadeEstado] = useState("");
  const [siteInsta, setSiteInsta] = useState("");
  const [numAtletas, setNumAtletas] = useState("");
  const [numTreinadores, setNumTreinadores] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [whatsResponsavel, setWhatsResponsavel] = useState("");

  // Step 3
  const [nomeCoach, setNomeCoach] = useState("");
  const [cref, setCref] = useState("");
  const [emailCoach, setEmailCoach] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Step 4
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const plan = b2bPlans.find((p) => p.id === selectedPlan) ?? b2bPlans[1];
  const isWhiteLabel = selectedPlan === "b2b-unlimited";
  const isFree = plan.price === 0;

  // ── White-label approval screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/15 border border-warning/30">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <div>
          <Badge variant="warning" className="mb-4">Aguardando configuração</Badge>
          <h2 className="font-display text-3xl font-extrabold text-text">Solicitação recebida!</h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Sua solicitação White Label foi recebida. Nossa equipe entrará em contato em até 1 dia
            útil pelo WhatsApp para iniciar a configuração do seu ambiente personalizado.
          </p>
        </div>
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-6 py-4 text-sm text-warning">
          Assessoria <strong>{nomeAssessoria || "cadastrada"}</strong> · Plano{" "}
          <strong>{plan.name}</strong>
        </div>
        <Link href="/">
          <Button variant="outline" size="lg">Voltar ao início</Button>
        </Link>
      </div>
    );
  }

  // ── PIX awaiting screen ──────────────────────────────────────────────────
  if (pixResult) {
    function handleCopyPix() {
      void navigator.clipboard.writeText(pixResult!.pixText).then(() => {
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 2500);
      });
    }

    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <Badge variant="primary" className="mb-4">PIX gerado</Badge>
          <h2 className="font-display text-3xl font-extrabold text-text">Escaneie o QR Code PIX</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
            Após o pagamento, sua conta será ativada automaticamente em instantes.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          {pixResult.pixText ? (
            <QRCode value={pixResult.pixText} size={200} />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-text-muted">
              QR Code indisponível
            </div>
          )}
        </div>

        {pixResult.pixText && (
          <div className="w-full max-w-sm space-y-2">
            <p className="text-xs text-text-muted">Ou copie o código PIX:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={pixResult.pixText}
                className={`${inputClass} truncate cursor-default text-xs`}
              />
              <Button variant="outline" size="md" className="shrink-0" onClick={handleCopyPix}>
                {pixCopied ? <CheckCircle2 className="h-4 w-4 text-success" /> : "Copiar"}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 text-sm text-text-muted">
          Valor: <strong className="text-text">R$ {formatBRL(plan.price)}/mês</strong> ·{" "}
          Plano <strong className="text-text">{plan.name}</strong>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push("/treinador/dashboard?onboarding=pix")}
        >
          Continuar para minha conta →
        </Button>
        <p className="text-xs text-text-muted">
          Sua conta será ativada automaticamente assim que o PIX for confirmado.
        </p>
      </div>
    );
  }

  // ── Account creation (step 3 → 4) ────────────────────────────────────────
  async function handleCreateAccount() {
    setCreateAccountError(null);
    if (senha.length < 8) {
      setCreateAccountError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setCreateAccountError("As senhas não conferem.");
      return;
    }
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nomeCoach,
          email: emailCoach,
          password: senha,
          role: "COACH",
          studentCount: Number(numAtletas) || 1,
        }),
      });
      const data = await res.json() as { user?: { id: string }; error?: string };
      if (!res.ok) {
        setCreateAccountError(data.error ?? "Erro ao criar conta.");
        return;
      }
      setCreatedUserId(data.user!.id);
      setStep(4);
    } catch {
      setCreateAccountError("Erro de conexão. Verifique sua internet.");
    } finally {
      setCreatingAccount(false);
    }
  }

  // ── Submit handler ───────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitError(null);

    // White Label → manual review flow
    if (isWhiteLabel) {
      setSubmitted(true);
      return;
    }

    // Free plan → skip payment
    if (isFree) {
      router.push("/treinador/dashboard?onboarding=success");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentMethod,
          planId: selectedPlan,
          planName: plan.name,
          amountCents: Math.round(plan.price * 100),
          customerName: nomeResponsavel,
          customerEmail: emailResponsavel,
          customerCpf: cnpj,
          userId: createdUserId ?? undefined,
          cardNumber: paymentMethod === "cartao" ? cardNumber : undefined,
          cardName: paymentMethod === "cartao" ? cardName : undefined,
          cardExpiry: paymentMethod === "cartao" ? cardExpiry : undefined,
          cardCvv: paymentMethod === "cartao" ? cardCvv : undefined,
        }),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setSubmitError((data.error as string | undefined) ?? "Erro ao processar pagamento. Tente novamente.");
        return;
      }

      if (paymentMethod === "pix") {
        setPixResult({
          pixText: (data.pixText as string | undefined) ?? "",
          pixQrCodeUrl: (data.pixQrCodeUrl as string | null | undefined) ?? null,
        });
      } else {
        // Cartão
        const status = data.status as string | undefined;
        if (status === "PAID" || status === "AUTHORIZED") {
          router.push("/treinador/dashboard?onboarding=success");
        } else {
          setSubmitError("Pagamento recusado. Verifique os dados do cartão e tente novamente.");
        }
      }
    } catch {
      setSubmitError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = isFree
    ? "Criar conta grátis"
    : isWhiteLabel
    ? "Enviar solicitação"
    : paymentMethod === "pix"
    ? "Gerar QR Code PIX"
    : "Confirmar e pagar";

  return (
    <>
      <StepIndicator current={step} total={4} labels={STEP_LABELS} />

      {/* ── Step 1 — Plano ── */}
      {step === 1 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Escolha o plano para sua assessoria
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Selecione o plano que melhor se encaixa no tamanho da sua assessoria.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {b2bPlans.map((p) => (
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
                    <p className="mt-0.5 text-xs text-text-muted">
                      {p.maxAthletes === null ? "Atletas ilimitados" : `Até ${p.maxAthletes} atletas`}
                      {" · "}
                      {p.maxCoaches === null ? "Ilimitado" : `${p.maxCoaches} treinadores`}
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
                    {p.price === 0 ? "Grátis" : `R$ ${formatBRL(p.price)}`}
                  </span>
                  {p.price > 0 && <span className="mb-0.5 text-sm text-text-muted">/mês</span>}
                </div>
                {selectedPlan === p.id && (
                  <ul className="mt-4 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>

          <Button variant="primary" size="lg" className="mt-8 w-full" onClick={() => setStep(2)}>
            Próximo →
          </Button>
        </div>
      )}

      {/* ── Step 2 — Dados da assessoria ── */}
      {step === 2 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Dados da sua assessoria
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Preencha as informações da sua assessoria para personalizar a plataforma.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome da assessoria
                </span>
                <input
                  value={nomeAssessoria}
                  onChange={(e) => setNomeAssessoria(e.target.value)}
                  placeholder="Ex.: Run Tribe Assessoria"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  CNPJ ou CPF
                </span>
                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00 ou 000.000.000-00"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Cidade / Estado
                </span>
                <input
                  value={cidadeEstado}
                  onChange={(e) => setCidadeEstado(e.target.value)}
                  placeholder="Ex.: São Paulo, SP"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Site ou Instagram{" "}
                  <span className="normal-case font-normal text-text-muted/60">(opcional)</span>
                </span>
                <input
                  value={siteInsta}
                  onChange={(e) => setSiteInsta(e.target.value)}
                  placeholder="https://assessoria.com.br ou @assessoria"
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Atletas atuais
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={numAtletas}
                    onChange={(e) => setNumAtletas(e.target.value)}
                    placeholder="Ex.: 30"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Treinadores na equipe
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={numTreinadores}
                    onChange={(e) => setNumTreinadores(e.target.value)}
                    placeholder="Ex.: 3"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="border-t border-border pt-5">
                <p className="mb-4 text-sm font-semibold text-text">Responsável pela conta</p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Nome do responsável
                    </span>
                    <input
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      placeholder="Ex.: Fernando Queiroz"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      E-mail do responsável
                    </span>
                    <input
                      type="email"
                      value={emailResponsavel}
                      onChange={(e) => setEmailResponsavel(e.target.value)}
                      placeholder="responsavel@assessoria.com"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      WhatsApp do responsável
                    </span>
                    <input
                      type="tel"
                      value={whatsResponsavel}
                      onChange={(e) => setWhatsResponsavel(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" size="lg" className="px-5" onClick={() => setStep(1)}>
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => setStep(3)}
              disabled={
                !nomeAssessoria.trim() ||
                !cnpj.trim() ||
                !cidadeEstado.trim() ||
                !nomeResponsavel.trim() ||
                !emailResponsavel.trim()
              }
            >
              Próximo →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Primeiro treinador ── */}
      {step === 3 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Cadastre o treinador responsável
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Você pode adicionar mais treinadores depois do acesso ser liberado.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome completo
                </span>
                <input
                  value={nomeCoach}
                  onChange={(e) => setNomeCoach(e.target.value)}
                  placeholder="Ex.: Fernando Queiroz"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  CREF{" "}
                  <span className="normal-case font-normal text-text-muted/60">(opcional)</span>
                </span>
                <input
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  placeholder="Ex.: 022140-G/SP"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  E-mail de acesso
                </span>
                <input
                  type="email"
                  value={emailCoach}
                  onChange={(e) => setEmailCoach(e.target.value)}
                  placeholder="treinador@assessoria.com"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Especialidade
                </span>
                <select
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>Selecione...</option>
                  <option value="corrida-rua">Corrida de rua</option>
                  <option value="maratona">Maratona</option>
                  <option value="trail">Trail running</option>
                  <option value="triathlon">Triathlon</option>
                  <option value="corrida-forca">Corrida + Força</option>
                </select>
              </label>

              <div className="border-t border-border pt-5">
                <p className="mb-4 text-sm font-semibold text-text">Crie sua senha de acesso</p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Senha
                    </span>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Confirmar senha
                    </span>
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className={inputClass}
                    />
                  </label>
                  {createAccountError && (
                    <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                      {createAccountError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" size="lg" className="px-5" onClick={() => setStep(2)}>
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleCreateAccount}
              disabled={
                !nomeCoach.trim() ||
                !emailCoach.trim() ||
                !especialidade ||
                !senha ||
                !confirmarSenha ||
                creatingAccount
              }
            >
              {creatingAccount ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta…</>
              ) : (
                "Próximo →"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4 — Revisão e pagamento ── */}
      {step === 4 && (
        <div>
          <h1 className="mt-8 font-display text-3xl font-extrabold text-text">
            Confirmar e pagar
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Revise os dados e conclua o processo de onboarding.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="mb-4 text-sm font-semibold text-text">Resumo do cadastro</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Assessoria</span>
                    <span className="font-medium text-text">{nomeAssessoria || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Plano</span>
                    <span className="font-medium text-text">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Valor mensal</span>
                    <span className="font-bold text-text">
                      {plan.price === 0 ? "Grátis" : `R$ ${formatBRL(plan.price)}/mês`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Treinador responsável</span>
                    <span className="font-medium text-text">{nomeCoach || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Payment method — only if paid plan */}
              {!isFree && !isWhiteLabel && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-text">Forma de pagamento</p>
                  <PaymentToggle value={paymentMethod} onChange={setPaymentMethod} />

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

                  {paymentMethod === "pix" && (
                    <div className="rounded-2xl border border-border bg-card p-5 text-sm text-text-muted">
                      <p className="font-medium text-text">Como funciona o PIX:</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
                        <li>Clique em &quot;Gerar QR Code PIX&quot; abaixo</li>
                        <li>Escaneie o código com seu app de banco</li>
                        <li>Sua conta é ativada automaticamente após a confirmação</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {isWhiteLabel && (
                <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 text-sm text-warning">
                  <p className="font-semibold">Plano White Label — setup manual</p>
                  <p className="mt-1 text-xs">
                    Nossa equipe entrará em contato para configurar seu ambiente personalizado.
                    Nenhum pagamento será cobrado agora.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {submitError}
                </div>
              )}
            </div>

            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" size="lg" className="px-5" onClick={() => setStep(3)}>
              ← Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 gap-2"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processando…</>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AssessoriaOnboardingPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
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
          <span className="text-xs text-text-muted">Cadastro de Assessoria</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Suspense fallback={null}>
          <AssessoriaContent />
        </Suspense>
      </main>
    </div>
  );
}
