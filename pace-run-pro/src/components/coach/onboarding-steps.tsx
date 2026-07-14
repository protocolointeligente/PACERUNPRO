"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, UserPlus, CalendarPlus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "coach_onboarding_dismissed";

const STEPS = [
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
    id: "workout",
    icon: CalendarPlus,
    title: "Crie a primeira semana de treinos",
    description: "Use a periodização para montar uma semana completa e liberar para o atleta.",
    href: "/treinador/prescricao/periodizacao",
    cta: "Criar semana",
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
    accent: "text-accent",
    bg: "bg-accent/10",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function loadDone(): Set<StepId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("coach_onboarding_done");
    const parsed = JSON.parse(raw ?? "[]") as StepId[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveDone(done: Set<StepId>) {
  localStorage.setItem("coach_onboarding_done", JSON.stringify([...done]));
}

interface CoachOnboardingStepsProps {
  athleteCount: number;
}

export function CoachOnboardingSteps({ athleteCount }: CoachOnboardingStepsProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [done, setDone] = useState<Set<StepId>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    const doneSaved = loadDone();

    // Auto-mark "invite" step if athlete already exists
    if (athleteCount > 0 && !doneSaved.has("invite")) {
      doneSaved.add("invite");
      saveDone(doneSaved);
    }

    setDone(doneSaved);
    setDismissed(isDismissed || doneSaved.size === STEPS.length);
    setMounted(true);
  }, [athleteCount]);

  const markDone = (id: StepId) => {
    const next = new Set(done);
    next.add(id);
    saveDone(next);
    setDone(next);
    if (next.size === STEPS.length) {
      localStorage.setItem(STORAGE_KEY, "true");
      setDismissed(true);
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const progress = (done.size / STEPS.length) * 100;

  if (!mounted || dismissed) return null;

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
              Complete os 3 passos abaixo para começar a treinar seus atletas.
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
        <div className="grid gap-3 sm:grid-cols-3">
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
