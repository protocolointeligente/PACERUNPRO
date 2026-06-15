"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { b2bPlans } from "@/lib/mock-data";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ── Step indicator ────────────────────────────────────────────────────────
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

// ── B2B plan summary card ────────────────────────────────────────────────
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
          R$ {plan.price}
        </span>
        <span className="mb-0.5 text-sm text-text-muted">/mês</span>
      </div>
      {plan.badge && (
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {plan.badge}
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
    { id: "cartao", label: "Cartão" },
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

const STEP_LABELS = ["Plano", "Assessoria", "Treinador", "Pagamento"];

// ── Inner content ─────────────────────────────────────────────────────────
function AssessoriaContent() {
  const searchParams = useSearchParams();
  const paramPlano = searchParams.get("plano") ?? "b2b-pro";
  const validIds = b2bPlans.map((p) => p.id);
  const defaultPlan = validIds.includes(paramPlano) ? paramPlano : "b2b-pro";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitted, setSubmitted] = useState(false);

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

  // Step 4
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const plan = b2bPlans.find((p) => p.id === selectedPlan) ?? b2bPlans[1];

  // ── Pending / success screen ────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/15 border border-warning/30">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <div>
          <Badge variant="warning" className="mb-4">
            Aguardando aprovação
          </Badge>
          <h2 className="font-display text-3xl font-extrabold text-text">
            Solicitação recebida!
          </h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Sua solicitação foi recebida. Nossa equipe analisará seu cadastro e entrará em
            contato em até 1 dia útil pelo WhatsApp informado.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-text-muted">
            Após a aprovação, você receberá um e-mail com o link de acesso para configurar
            sua assessoria.
          </p>
        </div>
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-6 py-4 text-sm text-warning">
          Assessoria <strong>{nomeAssessoria || "cadastrada"}</strong> · Plano{" "}
          <strong>{plan.name}</strong>
        </div>
        <Link href="/">
          <Button variant="outline" size="lg">
            Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

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
                    R$ {p.price}
                  </span>
                  <span className="mb-0.5 text-sm text-text-muted">/mês</span>
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

          <Button
            variant="primary"
            size="lg"
            className="mt-8 w-full"
            onClick={() => setStep(2)}
          >
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

            {/* Plan summary — desktop */}
            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          {/* Plan summary — mobile */}
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
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option value="corrida-rua">Corrida de rua</option>
                  <option value="maratona">Maratona</option>
                  <option value="trail">Trail running</option>
                  <option value="triathlon">Triathlon</option>
                  <option value="corrida-forca">Corrida + Força</option>
                </select>
              </label>
            </div>

            {/* Plan summary — desktop */}
            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          {/* Plan summary — mobile */}
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
              className="flex-1"
              onClick={() => setStep(4)}
              disabled={!nomeCoach.trim() || !emailCoach.trim() || !especialidade}
            >
              Próximo →
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
              {/* Summary card */}
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
                    <span className="font-bold text-text">R$ {plan.price}/mês</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Treinador responsável</span>
                    <span className="font-medium text-text">{nomeCoach || "—"}</span>
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
                      <Button variant="outline" size="md" className="flex-shrink-0">
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Boleto */}
                {paymentMethod === "boleto" && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-card-hover">
                      <span className="text-xs text-text-muted">Código de barras</span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Boleto vence em{" "}
                      <span className="font-semibold text-warning">3 dias úteis</span>
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Após o pagamento, a confirmação ocorre em até 1 dia útil.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Plan summary — desktop */}
            <div className="hidden lg:block">
              <B2bPlanSummaryCard planId={selectedPlan} assessoriaName={nomeAssessoria} />
            </div>
          </div>

          {/* Plan summary — mobile */}
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
              className="flex-1"
              onClick={() => setSubmitted(true)}
            >
              Enviar para aprovação
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function AssessoriaOnboardingPage() {
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
