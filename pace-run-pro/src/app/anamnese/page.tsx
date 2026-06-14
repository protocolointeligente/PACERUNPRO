"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// ── Radio card ────────────────────────────────────────────────────────────
function RadioCard({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex flex-col rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary/60 bg-primary/15"
          : "border-border bg-card hover:border-primary/30",
      ].join(" ")}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <span className="text-sm font-semibold text-white">{label}</span>
      {sub && <span className="mt-0.5 text-xs text-text-muted">{sub}</span>}
    </button>
  );
}

// ── Plan generation logic ─────────────────────────────────────────────────
function generateWeeklyPlan(distance: string, level: string, days: number) {
  const baseKm =
    ({ "5k": 15, "10k": 20, "21k": 30, "42k": 40, trail: 25 } as Record<string, number>)[distance] ?? 20;
  const multiplier =
    ({ iniciante: 0.7, intermediario: 1.0, avancado: 1.3 } as Record<string, number>)[level] ?? 1.0;
  const base = Math.round(baseKm * multiplier);
  return [
    {
      week: 1,
      label: "Base aeróbica",
      km: base,
      sessions: Math.min(days, 4),
      focus: "Construir base aeróbica com corridas fáceis em Zona 1–2",
      color: "border-l-info",
      badge: "Semana 1",
    },
    {
      week: 2,
      label: "Construção",
      km: base + 3,
      sessions: days,
      focus: "Incluir um treino de qualidade (intervalado curto)",
      color: "border-l-primary",
      badge: "Semana 2",
    },
    {
      week: 3,
      label: "Desenvolvimento",
      km: base + 6,
      sessions: days,
      focus: "Treino longo progressivo + intervalado médio",
      color: "border-l-warning",
      badge: "Semana 3",
    },
    {
      week: 4,
      label: "Deload",
      km: Math.round(base * 0.7),
      sessions: Math.max(days - 1, 3),
      focus: "Recuperação ativa e consolidação das adaptações",
      color: "border-l-success",
      badge: "Semana 4",
    },
  ];
}

// ── Main page component ───────────────────────────────────────────────────
export default function AnamnesePage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [distance, setDistance] = useState("");
  const [level, setLevel] = useState("");
  const [yearsRunning, setYearsRunning] = useState("");

  // Step 2
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [hasGym, setHasGym] = useState<boolean | null>(null);
  const [injury, setInjury] = useState("");
  const [raceDate, setRaceDate] = useState("");

  // Step 3
  const [time5k, setTime5k] = useState("");
  const [cooperDistance, setCooperDistance] = useState("");
  const [hasGps, setHasGps] = useState<boolean | null>(null);

  const plan = done
    ? generateWeeklyPlan(distance, level, daysPerWeek ?? 4)
    : [];

  function handleFinishStep3() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 1500);
  }

  // ── Loading screen ────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="min-h-dvh bg-background text-white">
        <Nav />
        <div className="flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-2xl shadow-primary/40">
            <Zap className="h-10 w-10 animate-pulse text-white" fill="white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white">
              Gerando seu plano...
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Analisando suas respostas e criando um plano personalizado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh bg-background text-white">
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-12">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 border border-success/30">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold text-white">
                Seu plano de 4 semanas está pronto!
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
                Baseado nas suas respostas, o treinador{" "}
                <span className="font-semibold text-white">Ricardo Pace</span>{" "}
                criou um plano personalizado:
              </p>
            </div>
          </div>

          {/* Plan weeks */}
          <div className="space-y-4">
            {plan.map((w) => (
              <div
                key={w.week}
                className={[
                  "rounded-2xl border border-border bg-card p-5 border-l-4",
                  w.color,
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {w.badge}
                    </span>
                    <h3 className="mt-0.5 font-display text-base font-bold text-white">
                      {w.label}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">{w.focus}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-display text-xl font-extrabold text-white">
                      {w.km} km
                    </div>
                    <div className="text-xs text-text-muted">
                      {w.sessions} sessões
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-text-muted">
              Próximos passos
            </h4>
            <ul className="space-y-2">
              {[
                "Treino liberado para hoje no seu painel",
                "Treinador Ricardo Pace entrará em contato em 24h",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/aluno/dashboard" className="mt-8 block">
            <Button variant="primary" size="lg" className="w-full gap-2">
              Acessar meu painel →
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  // ── Quiz steps ────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-background text-white">
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <StepIndicator current={step} total={3} />

        {/* ── Step 1: Sobre você ── */}
        {step === 1 && (
          <div className="mt-8">
            <h1 className="font-display text-3xl font-extrabold text-white">
              Sobre você
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Vamos conhecer seu perfil de corredor.
            </p>

            {/* Distância alvo */}
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white">
                Qual sua distância alvo?
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { id: "5k", label: "5 km" },
                  { id: "10k", label: "10 km" },
                  { id: "21k", label: "21 km", sub: "Meia Maratona" },
                  { id: "42k", label: "42 km", sub: "Maratona" },
                  { id: "trail", label: "Trail" },
                ].map((d) => (
                  <RadioCard
                    key={d.id}
                    label={d.label}
                    sub={d.sub}
                    selected={distance === d.id}
                    onClick={() => setDistance(d.id)}
                  />
                ))}
              </div>
            </div>

            {/* Nível atual */}
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white">
                Qual seu nível atual?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "iniciante",
                    label: "Iniciante",
                    sub: "até 15 km/semana",
                  },
                  {
                    id: "intermediario",
                    label: "Intermediário",
                    sub: "15–40 km/semana",
                  },
                  {
                    id: "avancado",
                    label: "Avançado",
                    sub: "40+ km/semana",
                  },
                ].map((l) => (
                  <RadioCard
                    key={l.id}
                    label={l.label}
                    sub={l.sub}
                    selected={level === l.id}
                    onClick={() => setLevel(l.id)}
                  />
                ))}
              </div>
            </div>

            {/* Anos correndo */}
            <div className="mt-8 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Há quantos anos você corre?
                </span>
                <select
                  value={yearsRunning}
                  onChange={(e) => setYearsRunning(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option value="menos1">Menos de 1 ano</option>
                  <option value="1a2">1–2 anos</option>
                  <option value="3a5">3–5 anos</option>
                  <option value="mais5">5+ anos</option>
                </select>
              </label>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="mt-8 w-full"
              onClick={() => setStep(2)}
              disabled={!distance || !level || !yearsRunning}
            >
              Continuar →
            </Button>
          </div>
        )}

        {/* ── Step 2: Disponibilidade ── */}
        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-3xl font-extrabold text-white">
              Disponibilidade
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Nos conte sua rotina de treinos.
            </p>

            {/* Dias por semana */}
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white">
                Quantos dias por semana pode treinar?
              </p>
              <div className="flex gap-3">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={[
                      "flex h-14 flex-1 items-center justify-center rounded-xl border text-lg font-bold transition-all",
                      daysPerWeek === d
                        ? "border-primary/60 bg-primary/15 text-white"
                        : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-white",
                    ].join(" ")}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted">dias/semana</p>
            </div>

            {/* Academia */}
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white">
                Você tem acesso a academia?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <RadioCard
                  label="Sim"
                  selected={hasGym === true}
                  onClick={() => setHasGym(true)}
                />
                <RadioCard
                  label="Não"
                  selected={hasGym === false}
                  onClick={() => setHasGym(false)}
                />
              </div>
            </div>

            {/* Lesão */}
            <div className="mt-8 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Alguma lesão ou limitação física?{" "}
                  <span className="text-xs font-normal text-text-muted/60">
                    (opcional)
                  </span>
                </span>
                <textarea
                  value={injury}
                  onChange={(e) => setInjury(e.target.value)}
                  placeholder="Ex.: dor no joelho direito, tendinite..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </label>
            </div>

            {/* Data da prova */}
            <div className="mt-6 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Data da sua próxima prova{" "}
                  <span className="text-xs font-normal text-text-muted/60">
                    (opcional)
                  </span>
                </span>
                <input
                  type="date"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className={inputClass}
                />
              </label>
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
                disabled={daysPerWeek === null || hasGym === null}
              >
                Continuar →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Testes de performance ── */}
        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-3xl font-extrabold text-white">
              Testes de performance
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Esses dados ajudam a calibrar seu ritmo de treino ideal.
            </p>

            {/* Tempo 5k */}
            <div className="mt-8 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Seu melhor tempo em 5 km (ou último resultado)
                </span>
                <input
                  type="text"
                  value={time5k}
                  onChange={(e) => setTime5k(e.target.value)}
                  placeholder="Ex.: 25:00"
                  className={inputClass}
                />
              </label>
            </div>

            {/* Cooper */}
            <div className="mt-6 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Distância no teste de Cooper (12 min)
                </span>
                <input
                  type="text"
                  value={cooperDistance}
                  onChange={(e) => setCooperDistance(e.target.value)}
                  placeholder="Ex.: 2.200 m"
                  className={inputClass}
                />
              </label>
            </div>

            {/* GPS / app */}
            <div className="mt-8 space-y-3">
              <p className="text-sm font-semibold text-white">
                Você usa relógio GPS ou aplicativo?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <RadioCard
                  label="Sim"
                  selected={hasGps === true}
                  onClick={() => setHasGps(true)}
                />
                <RadioCard
                  label="Não"
                  selected={hasGps === false}
                  onClick={() => setHasGps(false)}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="px-5"
                onClick={() => setStep(2)}
              >
                ← Voltar
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleFinishStep3}
                disabled={hasGps === null}
              >
                Gerar meu plano →
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared nav ────────────────────────────────────────────────────────────
function Nav() {
  return (
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
  );
}
