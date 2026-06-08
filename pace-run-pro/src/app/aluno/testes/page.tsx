"use client";

import { useState } from "react";
import { Activity, Calculator, History, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { performanceTests } from "@/lib/mock-data";
import {
  calculateRast,
  paceFromKmh,
  thresholdPaceFromTest,
  vamFromDistanceTime,
  vo2From2400m,
  vo2From3km,
  vo2From5MinTest,
  vo2FromCooper,
  vo2FromVam,
} from "@/lib/calculations";
import { cn, formatPace } from "@/lib/utils";

function parseClock(input: string) {
  const parts = input.split(":").map((p) => Number(p.trim()));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

export default function PerformanceTestsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">
          <Sparkles className="h-3 w-3" /> Cálculos automáticos
        </Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Testes de performance</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Registre seus protocolos de campo e receba estimativas automáticas de VO2máx, VAM, limiar e potência —
          os mesmos dados usados pelo motor de prescrição inteligente para calibrar o seu plano.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <CooperCard />
        <FiveMinCard />
        <ThreeKmCard />
        <TwentyFourHundredCard />
        <VamCard />
        <RastCard />
        <ThresholdCard />
      </div>

      {/* History */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <History className="h-4 w-4 text-text-muted" />
          Histórico de testes
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {performanceTests.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
                  <Activity className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t.type}</p>
                  <p className="text-xs text-text-muted">{t.description}</p>
                  <p className="mt-1.5 text-xs text-text-muted">Última realização: <span className="text-white">{t.date}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Calculator className="h-4 w-4" />
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  );
}

function ResultBox({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label}>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">{it.label}</p>
          <p className="font-display text-base font-bold text-white">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function CooperCard() {
  const [distance, setDistance] = useState("2600");
  const d = Number(distance);
  const vo2 = Number.isFinite(d) && d > 0 ? vo2FromCooper(d) : null;
  return (
    <TestCard title="Teste de Cooper" subtitle="Distância máxima percorrida em 12 minutos">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Distância percorrida (m)</span>
        <input className={inputClass} value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="numeric" />
      </label>
      {vo2 != null && (
        <ResultBox
          items={[
            { label: "VO2máx estimado", value: `${vo2.toFixed(1)} ml/kg/min` },
            { label: "Classificação", value: classifyVo2(vo2) },
          ]}
        />
      )}
    </TestCard>
  );
}

function FiveMinCard() {
  const [distance, setDistance] = useState("1450");
  const d = Number(distance);
  const vo2 = Number.isFinite(d) && d > 0 ? vo2From5MinTest(d) : null;
  return (
    <TestCard title="Teste de 5 minutos" subtitle="Distância máxima em 5 minutos de corrida contínua">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Distância percorrida (m)</span>
        <input className={inputClass} value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="numeric" />
      </label>
      {vo2 != null && (
        <ResultBox
          items={[
            { label: "VO2máx estimado", value: `${vo2.toFixed(1)} ml/kg/min` },
            { label: "Velocidade média", value: `${(d / 1000 / (5 / 60)).toFixed(1)} km/h` },
          ]}
        />
      )}
    </TestCard>
  );
}

function ThreeKmCard() {
  const [time, setTime] = useState("13:40");
  const sec = parseClock(time);
  const vo2 = sec ? vo2From3km(sec) : null;
  return (
    <TestCard title="Teste de 3 km" subtitle="Tempo para completar 3.000 m em ritmo máximo sustentável">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Tempo (mm:ss)</span>
        <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} placeholder="13:40" />
      </label>
      {vo2 != null && (
        <ResultBox
          items={[
            { label: "VO2máx estimado", value: `${vo2.toFixed(1)} ml/kg/min` },
            { label: "Pace médio", value: formatPace(Math.round(sec! / 3)) },
          ]}
        />
      )}
    </TestCard>
  );
}

function TwentyFourHundredCard() {
  const [time, setTime] = useState("10:30");
  const sec = parseClock(time);
  const vo2 = sec ? vo2From2400m(sec) : null;
  return (
    <TestCard title="Teste de 2.400 m" subtitle="Protocolo de campo clássico — tempo para 2.400 m">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Tempo (mm:ss)</span>
        <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:30" />
      </label>
      {vo2 != null && (
        <ResultBox
          items={[
            { label: "VO2máx estimado", value: `${vo2.toFixed(1)} ml/kg/min` },
            { label: "Pace médio", value: formatPace(Math.round((sec! / 2400) * 1000)) },
          ]}
        />
      )}
    </TestCard>
  );
}

function VamCard() {
  const [distance, setDistance] = useState("2000");
  const [time, setTime] = useState("8:00");
  const d = Number(distance);
  const sec = parseClock(time);
  const vam = d > 0 && sec ? vamFromDistanceTime(d, sec) : null;
  return (
    <TestCard title="VAM — Velocidade Aeróbica Máxima" subtitle="Base para definir zonas de treino e paces alvo">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Distância (m)</span>
          <input className={inputClass} value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="numeric" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Tempo (mm:ss)</span>
          <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} placeholder="8:00" />
        </label>
      </div>
      {vam != null && (
        <ResultBox
          items={[
            { label: "VAM", value: `${vam.toFixed(1)} km/h` },
            { label: "Pace na VAM", value: formatPace(paceFromKmh(vam)) },
            { label: "VO2máx estimado", value: `${vo2FromVam(vam).toFixed(1)} ml/kg/min` },
          ]}
        />
      )}
    </TestCard>
  );
}

function RastCard() {
  const [times, setTimes] = useState(["5.2", "5.4", "5.5", "5.7", "5.8", "6.0"]);
  const [mass, setMass] = useState("70");
  const massNum = Number(mass);
  const splits = times.map((t) => ({ timeSec: Number(t) })).filter((s) => Number.isFinite(s.timeSec) && s.timeSec > 0);
  const result = massNum > 0 && splits.length === 6 ? calculateRast(splits, massNum) : null;

  return (
    <TestCard title="RAST" subtitle="Running-based Anaerobic Sprint Test — 6 tiros de 35 m">
      <label className="mb-3 block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Massa corporal (kg)</span>
        <input className={cn(inputClass, "max-w-[140px]")} value={mass} onChange={(e) => setMass(e.target.value)} inputMode="decimal" />
      </label>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Tempo de cada tiro (s)</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {times.map((t, i) => (
          <input
            key={i}
            className={cn(inputClass, "text-center")}
            value={t}
            onChange={(e) => {
              const next = [...times];
              next[i] = e.target.value;
              setTimes(next);
            }}
            inputMode="decimal"
          />
        ))}
      </div>
      {result && (
        <ResultBox
          items={[
            { label: "Potência pico", value: `${result.peakPowerW.toFixed(0)} W` },
            { label: "Potência mínima", value: `${result.minPowerW.toFixed(0)} W` },
            { label: "Potência média", value: `${result.avgPowerW.toFixed(0)} W` },
            { label: "Índice de fadiga", value: `${result.fatigueIndexWPerS.toFixed(2)} W/s` },
          ]}
        />
      )}
    </TestCard>
  );
}

function ThresholdCard() {
  const [distance, setDistance] = useState("5000");
  const [time, setTime] = useState("25:00");
  const d = Number(distance);
  const sec = parseClock(time);
  const pace = d > 0 && sec ? thresholdPaceFromTest(d, sec) : null;
  return (
    <TestCard title="Limiar anaeróbico" subtitle="Estimativa de campo via teste contínuo de 20–30 minutos">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Distância (m)</span>
          <input className={inputClass} value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="numeric" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Tempo (mm:ss)</span>
          <input className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} placeholder="25:00" />
        </label>
      </div>
      {pace != null && (
        <ResultBox
          items={[
            { label: "Pace de limiar estimado", value: formatPace(pace) },
            { label: "Faixa de treino sugerida", value: `${formatPace(pace - 10)} – ${formatPace(pace + 5)}` },
          ]}
        />
      )}
    </TestCard>
  );
}

function classifyVo2(vo2: number) {
  if (vo2 < 35) return "Fraco";
  if (vo2 < 42) return "Regular";
  if (vo2 < 50) return "Bom";
  if (vo2 < 58) return "Muito bom";
  return "Excelente";
}
