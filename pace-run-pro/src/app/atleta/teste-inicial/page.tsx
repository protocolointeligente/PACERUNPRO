"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Timer,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TestType = "COOPER" | "CINCO_MINUTOS" | "TRES_KM";

interface TestOption {
  type: TestType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputLabel: string;
  inputType: "distance" | "time";
  badge: string;
}

const TEST_OPTIONS: TestOption[] = [
  {
    type: "COOPER",
    title: "Teste de Cooper",
    subtitle: "12 minutos",
    description:
      "Corra o máximo de distância possível em 12 minutos numa pista ou percurso plano. O teste mais utilizado no mundo para estimar o VO₂máx.",
    icon: Timer,
    inputLabel: "Distância percorrida (metros)",
    inputType: "distance",
    badge: "Mais popular",
  },
  {
    type: "CINCO_MINUTOS",
    title: "Teste de 5 Minutos",
    subtitle: "Balke adaptado",
    description:
      "Corra o máximo de distância possível em 5 minutos. Indicado para quem está retornando ao treino ou tem menor condicionamento.",
    icon: Clock,
    inputLabel: "Distância percorrida (metros)",
    inputType: "distance",
    badge: "Retorno ao treino",
  },
  {
    type: "TRES_KM",
    title: "Teste de 3 km",
    subtitle: "Pace máximo sustentado",
    description:
      "Corra 3 km no menor tempo possível. Ideal para atletas intermediários e avançados. Permite estimar o limiar anaeróbico com precisão.",
    icon: MapPin,
    inputLabel: "Tempo para completar 3 km",
    inputType: "time",
    badge: "Intermediário",
  },
];

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

type StepType = "intro" | "select" | "input" | "result" | "done";

export default function TesteInicialPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>("intro");
  const [selectedTest, setSelectedTest] = useState<TestOption | null>(null);
  const [distanceM, setDistanceM] = useState("");
  const [timeMin, setTimeMin] = useState("");
  const [timeSec, setTimeSec] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    vo2max?: number | null;
    vamKmh?: number | null;
    thresholdPaceSecPerKm?: number | null;
  } | null>(null);

  function getDurationSec(): number {
    return parseInt(timeMin || "0") * 60 + parseInt(timeSec || "0");
  }

  function isInputValid(): boolean {
    if (!selectedTest) return false;
    if (selectedTest.inputType === "distance") {
      const d = parseFloat(distanceM);
      return !isNaN(d) && d > 0;
    }
    const s = getDurationSec();
    return s > 0;
  }

  async function handleSave() {
    if (!selectedTest || !isInputValid()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { type: selectedTest.type };
      if (selectedTest.inputType === "distance") {
        body.distanceM = parseFloat(distanceM);
      } else {
        body.durationSec = getDurationSec();
        body.distanceM = 3000;
      }
      if (avgHr) body.avgHr = parseInt(avgHr);

      const res = await fetch("/api/atleta/performance-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      setSaving(false);
    }
  }

  async function handleFinish() {
    setStep("done");
    setTimeout(() => router.push("/atleta/dashboard"), 1500);
  }

  if (step === "done") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="font-display text-xl font-bold text-text">Teste registrado!</h2>
          <p className="text-sm text-text-muted">
            Suas zonas de treinamento foram calibradas. Redirecionando…
          </p>
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    const thresholdMin = result.thresholdPaceSecPerKm
      ? Math.floor(result.thresholdPaceSecPerKm / 60)
      : null;
    const thresholdSec = result.thresholdPaceSecPerKm
      ? result.thresholdPaceSecPerKm % 60
      : null;

    return (
      <div className="mx-auto max-w-xl space-y-6 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <h1 className="font-display text-xl font-bold text-text">Resultado do teste</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {result.vo2max != null && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">VO₂máx est.</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  {result.vo2max}
                </p>
                <p className="text-xs text-text-muted">ml/kg/min</p>
              </CardContent>
            </Card>
          )}
          {result.vamKmh != null && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">VAM</p>
                <p className="mt-1 font-display text-2xl font-bold text-info">
                  {result.vamKmh}
                </p>
                <p className="text-xs text-text-muted">km/h</p>
              </CardContent>
            </Card>
          )}
          {result.thresholdPaceSecPerKm != null && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">Pace limiar</p>
                <p className="mt-1 font-display text-2xl font-bold text-warning">
                  {thresholdMin}:{String(thresholdSec).padStart(2, "0")}
                </p>
                <p className="text-xs text-text-muted">/km</p>
              </CardContent>
            </Card>
          )}
        </div>

        {result.thresholdPaceSecPerKm && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <h3 className="font-display text-sm font-semibold text-text">
                Zonas de pace calibradas
              </h3>
              {[
                { zone: "Z1 — Recuperativo", pct: 0.76, color: "text-sky-400" },
                { zone: "Z2 — Aeróbico leve", pct: 0.85, color: "text-lime-500" },
                { zone: "Z3 — Aeróbico", pct: 0.92, color: "text-yellow-500" },
                { zone: "Z4 — Limiar", pct: 1.0, color: "text-orange-500" },
                { zone: "Z5 — VO₂máx", pct: 1.08, color: "text-red-500" },
              ].map(({ zone, pct, color }) => (
                <div key={zone} className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", color)}>{zone}</span>
                  <span className="font-display text-text">
                    {formatPace(Math.round((result.thresholdPaceSecPerKm ?? 300) / pct))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-text-muted">
          Estas são estimativas de campo baseadas em fórmulas validadas pela literatura científica.
          Não substituem avaliação laboratorial.
        </p>

        <Button variant="primary" className="w-full gap-2" onClick={handleFinish}>
          <Zap className="h-4 w-4" />
          Ir para o dashboard
        </Button>
      </div>
    );
  }

  if (step === "input" && selectedTest) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("select")}
            className="text-xs text-text-muted hover:text-text"
          >
            ← Voltar
          </button>
        </div>

        <div>
          <h1 className="font-display text-xl font-bold text-text">{selectedTest.title}</h1>
          <p className="mt-1 text-sm text-text-muted">{selectedTest.description}</p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            {selectedTest.inputType === "distance" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {selectedTest.inputLabel}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={distanceM}
                  onChange={(e) => setDistanceM(e.target.value)}
                  placeholder="Ex: 2800"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                <p className="mt-1 text-xs text-text-muted">Em metros</p>
              </label>
            ) : (
              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {selectedTest.inputLabel}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timeMin}
                      onChange={(e) => setTimeMin(e.target.value)}
                      placeholder="min"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                  <span className="text-text-muted font-bold">:</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timeSec}
                      onChange={(e) => setTimeSec(e.target.value)}
                      placeholder="seg"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-text-muted">Minutos : Segundos</p>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                FC média durante o teste (opcional)
              </span>
              <input
                type="number"
                min="0"
                max="220"
                value={avgHr}
                onChange={(e) => setAvgHr(e.target.value)}
                placeholder="Ex: 175"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <p className="mt-1 text-xs text-text-muted">Em bpm — melhora a calibração das zonas de FC</p>
            </label>
          </CardContent>
        </Card>

        <Button
          variant="primary"
          className="w-full gap-2"
          disabled={!isInputValid() || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
          Calcular e salvar
        </Button>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-4">
        <div>
          <h1 className="font-display text-xl font-bold text-text">Escolha o teste</h1>
          <p className="mt-1 text-sm text-text-muted">
            Selecione o protocolo que melhor se adapta à sua condição atual e ao espaço disponível.
          </p>
        </div>

        <div className="space-y-3">
          {TEST_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => { setSelectedTest(opt); setStep("input"); }}
              className="w-full text-left"
            >
              <Card className="transition-colors hover:border-primary/50 hover:bg-primary/5">
                <CardContent className="flex items-start gap-4 p-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <opt.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-sm font-bold text-text">{opt.title}</h3>
                      <Badge variant="default" className="text-[10px]">{opt.subtitle}</Badge>
                      <Badge variant="primary" className="text-[10px]">{opt.badge}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">{opt.description}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Intro step
  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Activity className="h-4 w-4" />
          </span>
          <h1 className="font-display text-xl font-bold text-text">Teste de avaliação inicial</h1>
        </div>
        <p className="text-sm text-text-muted">
          Para prescrever treinos com a intensidade certa, precisamos conhecer seu condicionamento atual.
          O teste leva de <strong>5 a 15 minutos</strong> e é feito por você mesmo — sem equipamento especial.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { icon: Zap, title: "Calibra suas zonas de pace", desc: "Treinos prescritos no ritmo exato para cada objetivo." },
          { icon: Activity, title: "Estima seu VO₂máx e VAM", desc: "Métricas científicas de condicionamento aeróbico." },
          { icon: Timer, title: "Acompanha sua evolução", desc: "Refaça o teste a cada 4–6 semanas para ver o progresso." },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-info/30 bg-info/5">
        <CardContent className="p-4 text-sm text-text-muted">
          <strong className="text-text">Dica:</strong> Faça o teste em dia de descanso ou após pelo menos
          24h sem treino intenso. Use um relógio ou aplicativo para medir a distância/tempo com precisão.
        </CardContent>
      </Card>

      <Button variant="primary" className="w-full gap-2" onClick={() => setStep("select")}>
        <ChevronRight className="h-4 w-4" />
        Escolher protocolo de teste
      </Button>
    </div>
  );
}
