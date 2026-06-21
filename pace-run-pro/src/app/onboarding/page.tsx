"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  Flame,
  HeartPulse,
  Medal,
  Mountain,
  RotateCcw,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OptionGrid } from "@/components/onboarding/option-grid";
import { cn } from "@/lib/utils";

const goalOptions = [
  { value: "5km", label: "5 km", description: "Completar ou melhorar tempo nos 5 km", icon: <Flag className="h-5 w-5" /> },
  { value: "10km", label: "10 km", description: "Completar ou melhorar tempo nos 10 km", icon: <Flag className="h-5 w-5" /> },
  { value: "21km", label: "21 km", description: "Meia maratona", icon: <Medal className="h-5 w-5" /> },
  { value: "42km", label: "42 km", description: "Maratona completa", icon: <Medal className="h-5 w-5" /> },
  { value: "ultra", label: "Ultramaratona", description: "Provas acima de 42 km", icon: <Mountain className="h-5 w-5" /> },
  { value: "emagrecimento", label: "Emagrecimento", description: "Perder peso com saúde e consistência", icon: <Flame className="h-5 w-5" /> },
  { value: "performance", label: "Performance", description: "Evoluir tempos e recordes pessoais", icon: <TrendingUp className="h-5 w-5" /> },
  { value: "retorno", label: "Retorno às corridas", description: "Voltar a treinar após uma pausa ou lesão", icon: <RotateCcw className="h-5 w-5" /> },
];

const levelOptions = [
  { value: "iniciante", label: "Iniciante", description: "Comecei a correr há pouco tempo" },
  { value: "intermediario", label: "Intermediário", description: "Corro com regularidade há alguns meses" },
  { value: "avancado", label: "Avançado", description: "Treino estruturado há anos" },
  { value: "pro", label: "Pro", description: "Atleta competitivo / federado" },
];

const sexOptions = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "outro", label: "Prefiro não informar" },
];

const weekdays = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

const sessionTimes = [
  { value: "30", label: "Até 30 min" },
  { value: "45", label: "30–45 min" },
  { value: "60", label: "45–60 min" },
  { value: "90", label: "Mais de 1h" },
];

interface FormState {
  name: string;
  age: string;
  sex: string[];
  weight: string;
  height: string;
  goal: string[];
  weekdaysAvailable: string[];
  sessionTime: string[];
  level: string[];
  injuryHistory: string;
  raceDate: string;
  recentTime: string;
}

const initialState: FormState = {
  name: "",
  age: "",
  sex: [],
  weight: "",
  height: "",
  goal: [],
  weekdaysAvailable: [],
  sessionTime: [],
  level: [],
  injuryHistory: "",
  raceDate: "",
  recentTime: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [direction, setDirection] = useState(1);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const steps = useMemo(
    () => [
      {
        title: "Como podemos te chamar?",
        subtitle: "Vamos personalizar sua experiência no Pace Run Pro.",
        valid: form.name.trim().length > 1,
        content: (
          <div className="space-y-4">
            <Field label="Nome completo">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ex.: Camila Andrade"
                className={inputClass}
              />
            </Field>
            <Field label="Idade">
              <input
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="Ex.: 29"
                className={inputClass}
              />
            </Field>
            <Field label="Sexo">
              <OptionGrid options={sexOptions} value={form.sex} onChange={(v) => update("sex", v)} columns={1} />
            </Field>
          </div>
        ),
      },
      {
        title: "Suas medidas",
        subtitle: "Usamos esses dados para calcular cargas, zonas e estimativas de performance.",
        valid: form.weight.trim().length > 0 && form.height.trim().length > 0,
        content: (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Peso (kg)">
              <input
                type="number"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                placeholder="Ex.: 61.5"
                className={inputClass}
              />
            </Field>
            <Field label="Altura (cm)">
              <input
                type="number"
                inputMode="numeric"
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder="Ex.: 167"
                className={inputClass}
              />
            </Field>
          </div>
        ),
      },
      {
        title: "Qual seu objetivo principal?",
        subtitle: "Isso define o foco do seu plano de treinos.",
        valid: form.goal.length > 0,
        content: <OptionGrid options={goalOptions} value={form.goal} onChange={(v) => update("goal", v)} columns={2} />,
      },
      {
        title: "Sua disponibilidade",
        subtitle: "Vamos montar sua semana de treinos com base no seu tempo real.",
        valid: form.weekdaysAvailable.length > 0 && form.sessionTime.length > 0,
        content: (
          <div className="space-y-5">
            <Field label="Em quais dias você consegue treinar?">
              <div className="flex flex-wrap gap-2">
                {weekdays.map((d) => {
                  const selected = form.weekdaysAvailable.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        update(
                          "weekdaysAvailable",
                          selected
                            ? form.weekdaysAvailable.filter((x) => x !== d.value)
                            : [...form.weekdaysAvailable, d.value]
                        )
                      }
                      className={cn(
                        "h-12 w-14 rounded-xl border text-sm font-semibold transition-colors",
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-text-muted hover:border-primary/30"
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Tempo disponível por sessão">
              <OptionGrid options={sessionTimes} value={form.sessionTime} onChange={(v) => update("sessionTime", v)} columns={2} />
            </Field>
          </div>
        ),
      },
      {
        title: "Qual seu nível atual?",
        subtitle: "Seja honesto — isso ajuda o algoritmo a calibrar a carga inicial com segurança.",
        valid: form.level.length > 0,
        content: <OptionGrid options={levelOptions} value={form.level} onChange={(v) => update("level", v)} columns={1} />,
      },
      {
        title: "Histórico de lesões",
        subtitle: "Compartilhe lesões recentes ou recorrentes — o motor de prescrição leva isso em conta.",
        valid: true,
        content: (
          <Field label="Descreva (opcional)">
            <textarea
              value={form.injuryHistory}
              onChange={(e) => update("injuryHistory", e.target.value)}
              placeholder="Ex.: Tendinite no tendão de Aquiles em 2024, sem sintomas atualmente."
              rows={5}
              className={cn(inputClass, "resize-none")}
            />
          </Field>
        ),
      },
      {
        title: "Sua próxima prova",
        subtitle: "Se já tiver uma prova-alvo, usamos a data para construir seu macrociclo.",
        valid: true,
        content: (
          <div className="space-y-4">
            <Field label="Data da prova (opcional)">
              <input
                type="date"
                value={form.raceDate}
                onChange={(e) => update("raceDate", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Melhor tempo recente (opcional)">
              <input
                value={form.recentTime}
                onChange={(e) => update("recentTime", e.target.value)}
                placeholder="Ex.: 10 km em 47:52"
                className={inputClass}
              />
            </Field>
          </div>
        ),
      },
    ],
    [form]
  );

  const total = steps.length;
  const current = steps[step];
  const progress = ((step + 1) / total) * 100;
  const isLast = step === total - 1;
  const [saving, setSaving] = useState(false);

  const GOAL_MAP: Record<string, string> = {
    "5km": "CINCO_KM",
    "10km": "DEZ_KM",
    "21km": "VINTE_E_UM_KM",
    "42km": "QUARENTA_E_DOIS_KM",
    "ultra": "ULTRAMARATONA",
    "emagrecimento": "EMAGRECIMENTO",
    "performance": "PERFORMANCE",
    "retorno": "RETORNO_AS_CORRIDAS",
  };

  const LEVEL_MAP: Record<string, string> = {
    "iniciante": "INICIANTE",
    "intermediario": "INTERMEDIARIO",
    "avancado": "AVANCADO",
    "pro": "PRO",
  };

  const SEX_MAP: Record<string, string> = {
    "feminino": "FEMININO",
    "masculino": "MASCULINO",
    "outro": "OUTRO",
  };

  async function next() {
    if (!current.valid) return;
    if (isLast) {
      setSaving(true);
      try {
        await fetch("/api/atleta/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(form.name.trim() && { name: form.name.trim() }),
            ...(form.weight && { weightKg: parseFloat(form.weight) }),
            ...(form.height && { heightCm: parseFloat(form.height) }),
            ...(form.goal[0] && { goal: GOAL_MAP[form.goal[0]] ?? null }),
            ...(form.level[0] && { level: LEVEL_MAP[form.level[0]] ?? null }),
            ...(form.sex[0] && { sex: SEX_MAP[form.sex[0]] ?? null }),
            weeklyAvailability: form.weekdaysAvailable.length || null,
            ...(form.sessionTime[0] && { availableMinutes: parseInt(form.sessionTime[0]) }),
            ...(form.injuryHistory && { injuryHistory: form.injuryHistory }),
            ...(form.raceDate && { raceDate: form.raceDate }),
            ...(form.recentTime && { recentBestTime: form.recentTime }),
          }),
        });
      } catch {
        // Non-fatal: proceed to dashboard even if save fails
      } finally {
        setSaving(false);
      }
      router.push("/atleta/dashboard");
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(total - 1, s + 1));
  }

  function back() {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8 sm:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
          <Zap className="h-5 w-5 text-white" fill="white" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Passo {step + 1} de {total}
          </p>
          <Progress value={progress} className="mt-1.5" />
        </div>
        <HeartPulse className="h-5 w-5 text-primary" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 48 : -48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -48 : 48 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{current.title}</h1>
            <p className="mt-2 text-sm text-text-muted">{current.subtitle}</p>
            <div className="mt-7">{current.content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={back} className="px-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Button size="lg" className="flex-1" onClick={next} disabled={!current.valid || saving}>
          {isLast ? (
            saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando…
              </>
            ) : (
              <>
                <Timer className="h-4 w-4" />
                Concluir e ver meu plano
              </>
            )
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  );
}
