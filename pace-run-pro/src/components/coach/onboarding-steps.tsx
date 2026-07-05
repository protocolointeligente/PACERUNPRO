"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, UserPlus, CalendarPlus, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "profile",
    icon: UserPlus,
    title: "Complete seu perfil de treinador",
    description: "Adicione sua foto, CREF e bio para que seus atletas conheçam você.",
    href: "/treinador/perfil",
    cta: "Completar perfil",
    accent: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    id: "invite",
    icon: UserPlus,
    title: "Convide seu primeiro atleta",
    description: "Envie um link de convite para que seu atleta crie a conta e apareça no seu painel.",
    href: "/treinador/atletas/convidar",
    cta: "Convidar atleta",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "zones",
    icon: Zap,
    title: "Configure suas zonas de treino",
    description: "Defina o modelo de zonas de intensidade que será usado na prescrição de todos os atletas.",
    href: "/treinador/configuracoes/zonas",
    cta: "Configurar zonas",
    accent: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    id: "workout",
    icon: CalendarPlus,
    title: "Crie a primeira semana de treinos",
    description: "Use a periodização para montar uma semana completa e liberar para o atleta.",
    href: "/treinador/prescricao/periodizacao",
    cta: "Prescrever treino",
    accent: "text-success",
    bg: "bg-success/10",
  },
  {
    id: "period",
    icon: CalendarPlus,
    title: "Monte a primeira periodização",
    description: "Gere um macrociclo completo com mesociclos e semanas de deload para um atleta.",
    href: "/treinador/prescricao/periodizacao",
    cta: "Criar periodização",
    accent: "text-success",
    bg: "bg-success/10",
  },
  {
    id: "plan",
    icon: CreditCard,
    title: "Escolha seu plano",
    description: "Selecione o plano ideal para o tamanho da sua equipe e comece a crescer.",
    href: "/treinador/loja-planos",
    cta: "Ver planos",
    accent: "text-violet-400",
    bg: "bg-violet-400/10",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface CoachOnboardingStepsProps {
  athleteCount: number;
}

export function CoachOnboardingSteps({ athleteCount }: CoachOnboardingStepsProps) {
  const [dismissed, setDismissed] = useState(true); // hidden until DB data loads
  const [done, setDone] = useState<Set<StepId>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load state from DB on mount
  useEffect(() => {
    fetch("/api/coach/onboarding")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { done?: string[] } | null) => {
        const doneset = new Set((data?.done ?? []) as StepId[]);

        // Auto-mark "invite" if athlete already exists
        if (athleteCount > 0 && !doneset.has("invite")) {
          doneset.add("invite");
          fetch("/api/coach/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stepId: "invite" }),
          }).catch(() => null);
        }

        setDone(doneset);
        setDismissed(doneset.size >= STEPS.length);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [athleteCount]);

  const markDone = (id: StepId) => {
    const next = new Set(done);
    next.add(id);
    setDone(next);
    if (next.size >= STEPS.length) setDismissed(true);

    fetch("/api/coach/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: id }),
    }).catch(() => null);
  };

  const dismiss = () => {
    setDismissed(true);
    // Mark all steps done to suppress permanently
    STEPS.forEach((s) => {
      if (!done.has(s.id)) {
        fetch("/api/coach/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepId: s.id }),
        }).catch(() => null);
      }
    });
  };

  const progress = (done.size / STEPS.length) * 100;

  if (!loaded || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-5"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-text">
              Bem-vindo ao PACE RUN PRO! 🎉
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Complete os 6 passos abaixo para tirar o máximo da plataforma.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Fechar guia de boas-vindas"
            className="mt-0.5 rounded-md p-1 text-text-muted transition-colors hover:bg-card-hover hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
            <span>{done.size} de {STEPS.length} concluídos</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = done.has(step.id);
            return (
              <div
                key={step.id}
                className={cn(
                  "relative rounded-xl border p-4 transition-all duration-200",
                  isDone
                    ? "border-success/30 bg-success/5 opacity-70"
                    : "border-border bg-card hover:bg-card-hover"
                )}
              >
                {isDone && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
                <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-lg", isDone ? "bg-success/10" : step.bg)}>
                  <Icon className={cn("h-4 w-4", isDone ? "text-success" : step.accent)} />
                </div>
                <p className={cn("text-sm font-semibold", isDone ? "text-text-muted line-through decoration-success/50" : "text-text")}>
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-snug text-text-muted">{step.description}</p>
                {!isDone && (
                  <Link href={step.href}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3 w-full text-xs"
                      onClick={() => markDone(step.id)}
                    >
                      {step.cta}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
