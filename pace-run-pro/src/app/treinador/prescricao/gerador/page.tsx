"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wand2,
  Activity,
  Bike,
  Waves,
  Trophy,
  Dumbbell,
  Star,
  CalendarDays,
  Target,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 6;

type SportId = "Corrida" | "Ciclismo" | "Natação" | "Triathlon" | "Força" | "Funcional";
type LevelId = "Iniciante" | "Intermediário" | "Avançado" | "PRO / Elite";

interface SportCard {
  id: SportId;
  emoji: string;
  label: string;
  subtitle: string;
  Icon: React.ElementType;
}

const SPORTS: SportCard[] = [
  { id: "Corrida",    emoji: "🏃", label: "Corrida",    subtitle: "VDOT · Pace · Zonas",          Icon: Activity },
  { id: "Ciclismo",  emoji: "🚴", label: "Ciclismo",   subtitle: "FTP · Potência",                Icon: Bike },
  { id: "Natação",   emoji: "🏊", label: "Natação",    subtitle: "CSS · Pace",                    Icon: Waves },
  { id: "Triathlon", emoji: "🏅", label: "Triathlon",  subtitle: "Multi-sport",                   Icon: Trophy },
  { id: "Força",     emoji: "💪", label: "Força",      subtitle: "Schoenfeld · 1RM",              Icon: Dumbbell },
  { id: "Funcional", emoji: "⭐", label: "Funcional",  subtitle: "Mobilidade · Core",             Icon: Star },
];

const GOALS_BY_SPORT: Record<SportId, string[]> = {
  Corrida:   ["5km", "10km", "Meia-Maratona", "Maratona", "Trail", "Ultratrail", "Saúde"],
  Ciclismo:  ["FTP máximo", "Endurance", "Granfondo", "Critério", "Saúde"],
  Natação:   ["400m", "1500m", "Ironman", "Open water", "Saúde"],
  Força:     ["Hipertrofia", "Força Máxima", "Emagrecimento", "Definição", "Saúde"],
  Triathlon: ["Sprint", "Olímpico", "70.3", "Ironman"],
  Funcional: ["Mobilidade", "Core", "Reabilitação", "Saúde Geral"],
};

interface LevelCard {
  id: LevelId;
  emoji: string;
  label: string;
  description: string;
  progression: string;
}

const LEVELS: LevelCard[] = [
  { id: "Iniciante",    emoji: "🌱", label: "Iniciante",    description: "Menos de 1 ano de treino estruturado.",          progression: "Progressão rápida" },
  { id: "Intermediário",emoji: "📈", label: "Intermediário",description: "1–3 anos. Progressão semanal/mensal.",            progression: "Progressão semanal" },
  { id: "Avançado",     emoji: "🏆", label: "Avançado",     description: "3+ anos. Periodização em blocos.",               progression: "Blocos de periodização" },
  { id: "PRO / Elite",  emoji: "⚡", label: "PRO / Elite",  description: "Atletas de alto rendimento.",                    progression: "Periodização ondulatória" },
];

const WEEK_DAYS_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"] as const;
const WEEK_DAYS_FULL  = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"] as const;

function defaultDaysFor(n: number): string[] {
  const defaults: Record<number, string[]> = {
    2: ["Segunda-feira", "Quinta-feira"],
    3: ["Segunda-feira", "Quarta-feira", "Sábado"],
    4: ["Segunda-feira", "Terça-feira", "Quinta-feira", "Sexta-feira"],
    5: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"],
    6: ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  };
  return defaults[n] ?? defaults[3];
}

function weeksUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, diff);
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function estimatedEnd(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function GeradorPeriodizacaoPage() {
  const router = useRouter();

  const [step, setStep]                     = useState(1);
  const [sport, setSport]                   = useState<SportId | "">("");
  const [goal, setGoal]                     = useState("");
  const [level, setLevel]                   = useState<LevelId | "">("");
  const [daysPerWeek, setDaysPerWeek]       = useState(3);
  const [trainingDays, setTrainingDays]     = useState<string[]>(defaultDaysFor(3));
  const [hasEvent, setHasEvent]             = useState(false);
  const [eventName, setEventName]           = useState("");
  const [eventDate, setEventDate]           = useState("");
  const [notes, setNotes]                   = useState("");
  const [generating, setGenerating]         = useState(false);
  const [generateError, setGenerateError]   = useState("");

  function canProceed(): boolean {
    if (step === 1) return sport !== "";
    if (step === 2) return goal !== "";
    if (step === 3) return level !== "";
    if (step === 4) return trainingDays.length > 0;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleGenerate() {
    if (sport === "Força") {
      router.push("/treinador/prescricao/forca");
      return;
    }
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/treinador/ia-gerador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          goal,
          level,
          daysPerWeek,
          trainingDays,
          weeks,
          hasEvent,
          eventName: hasEvent ? eventName : "",
          eventDate: hasEvent ? eventDate : "",
          notes,
        }),
      });
      if (!res.ok) throw new Error("Falha ao gerar plano");
      const data = await res.json();
      try {
        localStorage.setItem("gerador_periodizacao_config", JSON.stringify({
          sport, goal, level, daysPerWeek, trainingDays, weeks,
          hasEvent, eventName: hasEvent ? eventName : "",
          eventDate: hasEvent ? eventDate : "", notes,
        }));
        localStorage.setItem("gerador_ia_resultado", JSON.stringify({
          weeks: data.weeks,
          planName: data.planName,
          summary: data.summary,
          source: data.source,
          goal,
          level,
          totalWeeks: weeks,
          trainingDays,
          raceName: hasEvent ? (eventName || "") : "",
          raceDate: hasEvent ? eventDate : "",
        }));
      } catch { /* storage unavailable */ }
      router.push("/treinador/prescricao/periodizacao");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Erro ao gerar plano");
    } finally {
      setGenerating(false);
    }
  }

  function toggleDay(day: string) {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const weeks = hasEvent && eventDate ? weeksUntil(eventDate) : 12;
  const levelCard = LEVELS.find((l) => l.id === level);
  const sportCard = SPORTS.find((s) => s.id === sport);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/treinador/prescricao"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Prescrição
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-border" />
          <span className="text-sm text-text">Gerador de Periodização</span>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i + 1 <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="mb-8 text-xs text-text-muted">
          Etapa {step} de {TOTAL_STEPS}
        </p>

        {/* Step content */}
        <div
          key={step}
          className="animate-in fade-in duration-200"
        >
          {/* ── Step 1: Modalidade ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Qual é a modalidade?</h1>
                <p className="mt-1.5 text-sm text-text-muted">Selecione o esporte principal desta periodização.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SPORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSport(s.id); setGoal(""); }}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all text-center",
                      sport === s.id
                        ? "border-primary/60 bg-primary/15"
                        : "border-border bg-card hover:border-primary/30 hover:bg-card-hover"
                    )}
                  >
                    <span className="text-4xl">{s.emoji}</span>
                    <div>
                      <p className={cn("text-sm font-bold", sport === s.id ? "text-primary" : "text-text")}>{s.label}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted leading-snug">{s.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Objetivo ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Qual é o objetivo?</h1>
                <p className="mt-1.5 text-sm text-text-muted">
                  Escolha a meta principal para <span className="text-text font-medium">{sport}</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sport !== "" && GOALS_BY_SPORT[sport].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={cn(
                      "rounded-full border px-5 py-2.5 text-sm font-medium transition-all",
                      goal === g
                        ? "border-primary/60 bg-primary/15 text-primary font-bold"
                        : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Nível ───────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Qual é o nível de experiência?</h1>
                <p className="mt-1.5 text-sm text-text-muted">Isso define o modelo de progressão e intensidade da periodização.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                      level === l.id
                        ? "border-primary/60 bg-primary/15"
                        : "border-border bg-card hover:border-primary/30 hover:bg-card-hover"
                    )}
                  >
                    <span className="text-2xl">{l.emoji}</span>
                    <div>
                      <p className={cn("text-sm font-bold", level === l.id ? "text-primary" : "text-text")}>{l.label}</p>
                      <p className="mt-1 text-[11px] text-text-muted leading-snug">{l.description}</p>
                      <p className={cn(
                        "mt-1.5 text-[11px] font-semibold",
                        level === l.id ? "text-primary/80" : "text-text-muted"
                      )}>
                        {l.progression}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Disponibilidade ─────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Quanto tempo você tem para treinar?</h1>
                <p className="mt-1.5 text-sm text-text-muted">Configure os dias disponíveis para montar a semana de treino.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Dias por semana</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setDaysPerWeek(n);
                          setTrainingDays(defaultDaysFor(n));
                        }}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                          daysPerWeek === n
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Dias da semana</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS_FULL.map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                          trainingDays.includes(day)
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                        )}
                      >
                        {WEEK_DAYS_SHORT[i]}
                      </button>
                    ))}
                  </div>
                  {trainingDays.length === 0 && (
                    <p className="mt-2 text-xs text-danger">Selecione ao menos 1 dia.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Meta / Prova ────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Tem uma prova ou meta?</h1>
                <p className="mt-1.5 text-sm text-text-muted">Se tiver uma data-alvo, a periodização será retro-calculada.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasEvent(true)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
                    hasEvent
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                  )}
                >
                  <Target className="h-4 w-4" />
                  Sim, tenho uma prova
                </button>
                <button
                  type="button"
                  onClick={() => { setHasEvent(false); setEventName(""); setEventDate(""); }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
                    !hasEvent
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  Apenas treino geral
                </button>
              </div>

              {hasEvent && (
                <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Nome da prova / evento
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Ex: São Silvestre, Ironman Floripa…"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Data da prova
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {eventDate && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                      <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm text-text">
                        <span className="font-bold text-primary">{weeksUntil(eventDate)} semanas</span>
                        {" "}até a prova · {formatDateBR(eventDate)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Observações ou limitações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: lesão no joelho esquerdo, sem acesso a piscina nas quartas…"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 6: Confirmar & Gerar ───────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-text">Tudo pronto!</h1>
                <p className="mt-1.5 text-sm text-text-muted">Confirme as informações antes de gerar o plano de periodização.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <span className="text-3xl">{sportCard?.emoji}</span>
                  <div>
                    <p className="font-display text-lg font-bold text-text">{sport}</p>
                    <p className="text-sm text-text-muted">{goal}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <SummaryRow
                    icon={<Users className="h-4 w-4 text-primary" />}
                    label="Nível"
                    value={`${levelCard?.emoji} ${level}`}
                    sub={levelCard?.progression}
                  />
                  <SummaryRow
                    icon={<CalendarDays className="h-4 w-4 text-primary" />}
                    label="Frequência"
                    value={`${trainingDays.length} dias/semana`}
                    sub={trainingDays
                      .map((d) => WEEK_DAYS_SHORT[WEEK_DAYS_FULL.indexOf(d as typeof WEEK_DAYS_FULL[number])])
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  {hasEvent && eventDate ? (
                    <SummaryRow
                      icon={<Target className="h-4 w-4 text-primary" />}
                      label="Prova alvo"
                      value={eventName || "Prova sem nome"}
                      sub={`${formatDateBR(eventDate)} · ${weeksUntil(eventDate)} semanas`}
                    />
                  ) : (
                    <SummaryRow
                      icon={<Target className="h-4 w-4 text-primary" />}
                      label="Duração estimada"
                      value="12 semanas"
                      sub={`Previsão de término: ${estimatedEnd(12)}`}
                    />
                  )}
                  {notes && (
                    <div className="rounded-xl border border-border bg-background/50 px-3.5 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">Observações</p>
                      <p className="text-sm text-text leading-relaxed">{notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full gap-2 text-base"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Gerando com IA...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Gerar Periodização com IA
                    </>
                  )}
                </Button>

                {generateError && (
                  <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {generateError}
                  </p>
                )}

                {sport === "Força" && (
                  <Link
                    href="/treinador/prescricao/forca"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text-muted hover:border-primary/40 hover:text-text transition-colors"
                  >
                    Ver Prescrição de Força
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="mt-10 flex items-center justify-between gap-4">
          {step > 1 ? (
            <Button
              variant="secondary"
              size="md"
              className="gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              variant="primary"
              size="md"
              className="gap-2 ml-auto"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="gap-2 ml-auto"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {generating ? "Gerando..." : "Gerar agora"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-sm font-bold text-text">{value}</p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}
