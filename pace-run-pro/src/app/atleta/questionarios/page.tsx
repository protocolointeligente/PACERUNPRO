"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, ListChecks, Star } from "lucide-react";

type QuestionType = "scale" | "select";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  min?: number;
  max?: number;
}

interface QuestionnaireTemplate {
  type: string;
  title: string;
  description: string;
  questions: Question[];
  scoreLabel?: string;
  computeScore?: (responses: Record<string, number | string>) => number;
}

const READINESS_QUESTIONS: Question[] = [
  { id: "sono", text: "Como foi seu sono esta noite?", type: "scale", min: 1, max: 10 },
  { id: "energia", text: "Qual seu nível de energia agora?", type: "scale", min: 1, max: 10 },
  { id: "fadiga", text: "Nível de fadiga muscular?", type: "scale", min: 1, max: 10 },
  { id: "humor", text: "Como está seu humor?", type: "scale", min: 1, max: 10 },
  { id: "motivacao", text: "Motivação para treinar hoje?", type: "scale", min: 1, max: 10 },
  { id: "dor", text: "Algum ponto de dor ou desconforto?", type: "scale", min: 1, max: 10 },
];

const WELLNESS_QUESTIONS: Question[] = [
  { id: "sono", text: "Qualidade do sono nos últimos 7 dias (1 = péssimo, 10 = excelente)", type: "scale", min: 1, max: 10 },
  { id: "nutricao", text: "Como está sua alimentação esta semana?", type: "scale", min: 1, max: 10 },
  { id: "hidratacao", text: "Hidratação adequada esta semana?", type: "scale", min: 1, max: 10 },
  { id: "estresse", text: "Nível de estresse geral (1 = muito estressado, 10 = muito tranquilo)", type: "scale", min: 1, max: 10 },
  { id: "carga", text: "Como você avaliou a carga de treino esta semana?", type: "scale", min: 1, max: 10 },
  { id: "recuperacao", text: "Você está se recuperando bem?", type: "scale", min: 1, max: 10 },
  { id: "lesao", text: "Alguma dor, desconforto ou sintoma a relatar?", type: "select", options: ["Nenhum", "Dor leve", "Dor moderada", "Dor forte", "Lesão ativa"] },
];

const SF36_QUESTIONS: Question[] = [
  { id: "saude_geral", text: "Em geral, você diria que sua saúde é:", type: "select", options: ["Excelente", "Muito boa", "Boa", "Razoável", "Ruim"] },
  { id: "limitacao_moderada", text: "Atividades moderadas (ex.: mover mesa, varrer) — você fica limitado por algum problema de saúde?", type: "select", options: ["Sim, muito limitado(a)", "Sim, um pouco limitado(a)", "Não, de jeito nenhum"] },
  { id: "limitacao_leve", text: "Subir vários lances de escada — você fica limitado?", type: "select", options: ["Sim, muito limitado(a)", "Sim, um pouco limitado(a)", "Não, de jeito nenhum"] },
  { id: "trabalho_fisico", text: "Reduziu o tempo de trabalho ou atividades por problemas físicos?", type: "select", options: ["Sim", "Não"] },
  { id: "trabalho_emocional", text: "Reduziu o tempo por problemas emocionais?", type: "select", options: ["Sim", "Não"] },
  { id: "dor", text: "Quanta dor no corpo você teve nas últimas 4 semanas?", type: "select", options: ["Nenhuma", "Muito leve", "Leve", "Moderada", "Intensa", "Muito intensa"] },
  { id: "energia", text: "O quanto você se sentiu cheio(a) de energia nas últimas 4 semanas?", type: "select", options: ["Todo tempo", "A maior parte", "Boa parte", "Alguma parte", "Pequena parte", "Nunca"] },
  { id: "feliz", text: "O quanto você se sentiu feliz nas últimas 4 semanas?", type: "select", options: ["Todo tempo", "A maior parte", "Boa parte", "Alguma parte", "Pequena parte", "Nunca"] },
];

const TEMPLATES: QuestionnaireTemplate[] = [
  {
    type: "READINESS",
    title: "Prontidão para o treino",
    description: "Avalie como você está antes do treino de hoje. Rápido — 6 perguntas.",
    questions: READINESS_QUESTIONS,
    scoreLabel: "Score de prontidão",
    computeScore: (r) => {
      const vals = ["sono", "energia", "humor", "motivacao"].map((k) => Number(r[k] ?? 5));
      const fatigaInv = 11 - Number(r["fadiga"] ?? 5);
      const dorInv = 11 - Number(r["dor"] ?? 5);
      return Math.round(([...vals, fatigaInv, dorInv].reduce((a, b) => a + b, 0) / 6) * 10) / 10;
    },
  },
  {
    type: "WELLNESS",
    title: "Bem-estar semanal",
    description: "Check-in semanal para acompanhar sua saúde geral e recuperação.",
    questions: WELLNESS_QUESTIONS,
    scoreLabel: "Score de bem-estar",
    computeScore: (r) => {
      const scales = ["sono", "nutricao", "hidratacao", "estresse", "carga", "recuperacao"].map((k) => Number(r[k] ?? 5));
      return Math.round((scales.reduce((a, b) => a + b, 0) / scales.length) * 10) / 10;
    },
  },
  {
    type: "SF36",
    title: "SF-36 — Qualidade de Vida",
    description: "Questionário validado internacionalmente para medir qualidade de vida relacionada à saúde.",
    questions: SF36_QUESTIONS,
    scoreLabel: "Score SF-36 (estimativa)",
    computeScore: (r) => {
      const saude: Record<string, number> = { "Excelente": 10, "Muito boa": 8, "Boa": 6, "Razoável": 4, "Ruim": 2 };
      const s = saude[r.saude_geral as string] ?? 6;
      const dor: Record<string, number> = { "Nenhuma": 10, "Muito leve": 8, "Leve": 7, "Moderada": 5, "Intensa": 3, "Muito intensa": 1 };
      const d = dor[r.dor as string] ?? 5;
      return Math.round(((s + d) / 2) * 10) / 10;
    },
  },
];

export default function QuestionariosPage() {
  const [activeTemplate, setActiveTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ title: string; score?: number; scoreLabel?: string } | null>(null);

  function startQuestionnaire(t: QuestionnaireTemplate) {
    setActiveTemplate(t);
    setStep(0);
    setResponses({});
    setDone(null);
  }

  function answer(questionId: string, value: number | string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  async function next() {
    if (!activeTemplate) return;
    if (step < activeTemplate.questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Submit
      setSaving(true);
      const score = activeTemplate.computeScore?.(responses);
      try {
        await fetch("/api/atleta/questionarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: activeTemplate.type, title: activeTemplate.title, responses, score }),
        });
        setDone({ title: activeTemplate.title, score, scoreLabel: activeTemplate.scoreLabel });
        setActiveTemplate(null);
      } catch {
        setSaving(false);
      } finally {
        setSaving(false);
      }
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-12">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-xl font-bold text-text">Questionário salvo!</h2>
        <p className="text-text-muted text-sm">{done.title}</p>
        {done.score != null && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">{done.scoreLabel ?? "Score"}</p>
            <p className="text-4xl font-extrabold text-primary mt-1">{done.score}/10</p>
          </div>
        )}
        <button onClick={() => setDone(null)} className="mx-auto block rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-text hover:bg-card-hover transition-colors">
          Ver outros questionários
        </button>
      </div>
    );
  }

  if (activeTemplate) {
    const q = activeTemplate.questions[step];
    const currentAnswer = responses[q.id];
    const total = activeTemplate.questions.length;

    return (
      <div className="mx-auto max-w-lg space-y-6">
        {/* Progress */}
        <div>
          <div className="mb-2 flex justify-between text-xs text-text-muted">
            <span>{activeTemplate.title}</span>
            <span>{step + 1}/{total}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border">
            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <p className="text-base font-semibold text-text leading-snug">{q.text}</p>

          {q.type === "scale" && q.min != null && q.max != null && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: q.max - q.min + 1 }, (_, i) => i + q.min!).map((val) => (
                  <button
                    key={val}
                    onClick={() => answer(q.id, val)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                      currentAnswer === val
                        ? "border-primary bg-primary text-background"
                        : "border-border bg-background text-text-muted hover:border-primary/50 hover:text-text"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              {q.min === 1 && q.max === 10 && (
                <div className="flex justify-between text-xs text-text-muted/60">
                  <span>Muito baixo</span><span>Muito alto</span>
                </div>
              )}
            </div>
          )}

          {q.type === "select" && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => answer(q.id, opt)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    currentAnswer === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-text hover:border-primary/40"
                  }`}
                >
                  {opt}
                  {currentAnswer === opt && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { if (step > 0) setStep((s) => s - 1); else setActiveTemplate(null); }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:bg-card-hover transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={next}
            disabled={currentAnswer === undefined || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step < total - 1 ? "Próxima →" : "Finalizar →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-text">Questionários de saúde</h1>
        </div>
        <p className="text-sm text-text-muted">Monitore seu bem-estar, prontidão e qualidade de vida.</p>
      </div>

      <div className="space-y-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.type}
            onClick={() => startQuestionnaire(t)}
            className="flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:bg-card-hover transition-all"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text">{t.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{t.description}</p>
              <p className="mt-2 text-xs text-primary">{t.questions.length} perguntas</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
