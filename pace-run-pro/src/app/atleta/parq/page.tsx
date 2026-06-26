"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Heart, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PARQ_QUESTIONS = [
  "Seu médico já disse que você tem algum problema cardíaco e recomendou atividades físicas apenas sob supervisão médica?",
  "Você sente dor no peito quando pratica atividade física?",
  "No último mês, você teve dor no peito quando não estava praticando atividade física?",
  "Você perde o equilíbrio por causa de tontura ou já perdeu a consciência?",
  "Você tem algum problema ósseo ou articular (como coluna, joelho ou quadril) que pode ser agravado pela atividade física?",
  "Seu médico prescreveu atualmente medicamentos para pressão arterial ou problemas cardíascos?",
  "Você tem alguma outra razão pela qual não deveria praticar atividade física?",
];

type Answer = "sim" | "nao" | null;

export default function ParqPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>(Array(PARQ_QUESTIONS.length).fill(null));
  const [step, setStep] = useState<"questions" | "warning" | "done">("questions");
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasYesAnswers = answers.some((a) => a === "sim");
  const allAnswered = answers.every((a) => a !== null);

  function setAnswer(idx: number, val: Answer) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  function handleContinue() {
    if (!allAnswered) return;
    if (hasYesAnswers) {
      setStep("warning");
    } else {
      handleAccept(false);
    }
  }

  async function handleAccept(withYes: boolean) {
    setSaving(true);
    try {
      await fetch("/api/atleta/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasYesAnswers: withYes }),
      });
      setStep("done");
      setTimeout(() => router.push("/atleta/teste-inicial"), 1500);
    } catch {
      setSaving(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="font-display text-xl font-bold text-text">PAR-Q concluído</h2>
          <p className="text-sm text-text-muted">Redirecionando para o teste inicial…</p>
        </div>
      </div>
    );
  }

  if (step === "warning") {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-4">
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-warning" />
              <div>
                <h2 className="font-display text-base font-bold text-text">Consulta médica recomendada</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Você respondeu <strong>SIM</strong> a uma ou mais perguntas. Recomendamos que consulte um médico
                  antes de iniciar ou intensificar qualquer programa de exercícios.
                </p>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-text-muted">
              <li>• Leve este questionário ao seu médico</li>
              <li>• Pergunte quais atividades são seguras para você</li>
              <li>• Obtenha liberação médica por escrito se necessário</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="font-display text-sm font-semibold text-text">
              Desejo continuar mesmo assim
            </h3>
            <p className="text-sm text-text-muted">
              Se você já possui liberação médica ou deseja continuar sob sua própria responsabilidade,
              marque a opção abaixo para prosseguir.
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card-hover/40 p-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-xs text-text-muted leading-relaxed">
                Declaro que estou ciente das recomendações médicas e assumo a responsabilidade
                por praticar atividade física, isentando a plataforma de quaisquer responsabilidades
                decorrentes desta decisão.
              </span>
            </label>
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                disabled={!accepted || saving}
                onClick={() => handleAccept(true)}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Prosseguir
              </Button>
              <Button variant="outline" onClick={() => setStep("questions")}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Heart className="h-4 w-4" />
          </span>
          <h1 className="font-display text-xl font-bold text-text">Questionário PAR-Q</h1>
        </div>
        <p className="text-sm text-text-muted">
          O PAR-Q (Physical Activity Readiness Questionnaire) é uma triagem de segurança reconhecida
          internacionalmente para atividade física. Responda com sinceridade — suas respostas são confidenciais.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {PARQ_QUESTIONS.map((q, idx) => (
          <Card key={idx} className={cn(
            "transition-colors",
            answers[idx] === "sim" && "border-warning/50 bg-warning/5",
            answers[idx] === "nao" && "border-success/30 bg-success/5",
          )}>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium text-text">
                <span className="mr-2 font-display text-xs font-bold text-text-muted">{idx + 1}.</span>
                {q}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAnswer(idx, "nao")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    answers[idx] === "nao"
                      ? "border-success bg-success/15 text-success"
                      : "border-border text-text-muted hover:border-success/50 hover:text-success",
                  )}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer(idx, "sim")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    answers[idx] === "sim"
                      ? "border-warning bg-warning/15 text-warning"
                      : "border-border text-text-muted hover:border-warning/50 hover:text-warning",
                  )}
                >
                  Sim
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>{answers.filter(Boolean).length} de {PARQ_QUESTIONS.length} respondidas</span>
      </div>

      <Button
        variant="primary"
        className="w-full gap-2"
        disabled={!allAnswered || saving}
        onClick={handleContinue}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Continuar
      </Button>
    </div>
  );
}
