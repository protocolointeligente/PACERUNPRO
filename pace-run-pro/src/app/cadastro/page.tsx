"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, Dumbbell, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { b2bPlans, getRecommendedB2BPlan } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

type ProfileType = "atleta_independente" | "atleta_com_treinador" | "treinador" | "assessoria";
type Step = "perfil" | "atleta_tipo" | "alunos" | "conta";

const profileOptions: {
  type: ProfileType;
  title: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    type: "atleta_independente",
    title: "Sou atleta — treino sozinho",
    description: "Compro planilhas prontas, conecto o Strava e acompanho minha evolução sem treinador.",
    icon: Dumbbell,
  },
  {
    type: "atleta_com_treinador",
    title: "Sou atleta — tenho treinador",
    description: "Meu treinador já usa a plataforma e me convidou para acompanhar os treinos.",
    icon: User,
  },
  {
    type: "treinador",
    title: "Sou treinador(a)",
    description: "Quero prescrever treinos e acompanhar meus próprios atletas.",
    icon: Users,
  },
  {
    type: "assessoria",
    title: "Tenho uma assessoria",
    description: "Gerencio uma equipe de treinadores e vários atletas.",
    icon: Building2,
  },
];

function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const perfilParam = searchParams.get("perfil");
  const planParam = searchParams.get("plano");
  const coachId = searchParams.get("coach");
  const salesPlanId = searchParams.get("planoVenda");
  const selectedB2BPlan =
    planParam && b2bPlans.some((plan) => plan.id === planParam)
      ? b2bPlans.find((plan) => plan.id === planParam)
      : null;
  const initialProfile: ProfileType | null =
    perfilParam === "treinador" || perfilParam === "assessoria"
      ? perfilParam
      : perfilParam === "atleta"
      ? "atleta_com_treinador"
      : null;

  const [step, setStep] = useState<Step>(
    initialProfile === "atleta_com_treinador"
      ? "conta"
      : initialProfile
      ? "alunos"
      : "perfil"
  );
  const [profileType, setProfileType] = useState<ProfileType | null>(initialProfile);
  const [studentCount, setStudentCount] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAthlete = profileType === "atleta_independente" || profileType === "atleta_com_treinador";
  const role: "ATHLETE" | "COACH" = isAthlete ? "ATHLETE" : "COACH";
  const recommendedPlan = role === "COACH" ? selectedB2BPlan ?? getRecommendedB2BPlan(studentCount) : null;

  function selectProfile(type: ProfileType) {
    setProfileType(type);
    if (type === "atleta_independente" || type === "atleta_com_treinador") {
      setStep("conta");
    } else {
      setStep("alunos");
    }
  }

  function goBack() {
    if (step === "conta") {
      setStep(isAthlete ? "perfil" : "alunos");
    } else if (step === "alunos") {
      setStep("perfil");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome,
          email,
          password: senha,
          role,
          studentCount: role === "COACH" ? studentCount : undefined,
          planId: role === "COACH" ? recommendedPlan?.id : undefined,
          coachId: profileType === "atleta_com_treinador" ? coachId : undefined,
          salesPlanId: profileType === "atleta_com_treinador" ? salesPlanId : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar sua conta. Tente novamente.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password: senha, redirect: false });
      if (result?.error) {
        setError("Conta criada! Faça login para continuar.");
        setLoading(false);
        router.push("/login");
        return;
      }

      if (profileType === "atleta_independente") {
        router.push("/onboarding?tipo=independente");
      } else if (role === "ATHLETE") {
        router.push("/onboarding");
      } else if (recommendedPlan?.id === "b2b-free" || data.recommendedPlanId === "b2b-free") {
        router.push("/treinador/dashboard");
      } else {
        router.push(`/onboarding/assessoria?plano=${recommendedPlan?.id ?? data.recommendedPlanId}`);
      }
    } catch {
      setError("Não foi possível criar sua conta. Tente novamente.");
      setLoading(false);
    }
  }

  function handleGoogle() {
    signIn("google", { callbackUrl: "/onboarding" });
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
        {/* ── Step: perfil ── */}
        {step === "perfil" && (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-extrabold text-text">
                Crie sua conta
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Para começar, conte pra gente quem é você.
              </p>
            </div>

            <div className="space-y-3">
              {profileOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => selectProfile(option.type)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-primary/50 hover:bg-card-hover"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <option.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{option.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step: alunos (treinador / assessoria) ── */}
        {step === "alunos" && (
          <>
            <button
              type="button"
              onClick={goBack}
              className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </button>

            <div className="mb-8">
              <h1 className="font-display text-2xl font-extrabold text-text">
                Quantos atletas você atende?
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Assim te direcionamos para o plano com a melhor relação custo por atleta.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Número de atletas
              </span>
              <input
                type="number"
                min={1}
                value={studentCount}
                onChange={(e) => setStudentCount(Math.max(1, Number(e.target.value) || 1))}
                className={inputClass}
              />
            </label>

            {recommendedPlan && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Plano recomendado
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-text">
                    {recommendedPlan.name}
                  </span>
                  <span className="font-display text-lg font-extrabold text-text">
                    {recommendedPlan.price === 0
                      ? "Grátis"
                      : `R$ ${formatBRL(recommendedPlan.price)}/mês`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {recommendedPlan.maxAthletes === null
                    ? "Atletas ilimitados"
                    : `Até ${recommendedPlan.maxAthletes} atletas`}
                  {" · "}
                  {recommendedPlan.maxCoaches === null
                    ? "Treinadores ilimitados"
                    : `${recommendedPlan.maxCoaches} treinadores`}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={() => setStep("conta")}
            >
              Continuar →
            </Button>
          </>
        )}

        {/* ── Step: conta ── */}
        {step === "conta" && (
          <>
            <button
              type="button"
              onClick={goBack}
              className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </button>

            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-extrabold text-text">
                Crie sua conta
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                {role === "ATHLETE"
                  ? "Comece sua jornada rumo ao seu melhor desempenho."
                  : `Plano ${recommendedPlan?.name} selecionado para ${studentCount} ${
                      studentCount === 1 ? "atleta" : "atletas"
                    }.`}
              </p>
            </div>

            {role === "ATHLETE" && (
              <>
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-text hover:border-primary/40 hover:bg-card-hover transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar com Google
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <hr className="flex-1 border-border" />
                  <span className="text-xs text-text-muted">ou</span>
                  <hr className="flex-1 border-border" />
                </div>
              </>
            )}

            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome completo
                </span>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Camila Andrade"
                  required
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
                  required
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Senha
                </span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className={inputClass}
                />
              </label>

              {/* Error message */}
              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="mt-2 w-full"
              >
                {loading ? (
                  <span className="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4" />
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
          </>
        )}

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-text-muted">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size={36} />
          </Link>
        </div>
      </nav>

      <main className="flex min-h-[calc(100dvh-65px)] items-center justify-center px-6 py-12">
        <Suspense fallback={null}>
          <CadastroContent />
        </Suspense>
      </main>
    </div>
  );
}
