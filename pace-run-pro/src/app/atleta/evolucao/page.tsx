"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Camera, Medal, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { SectionHeader } from "@/components/shared/section-header";
import { AreaTrend, BarTrend, LineTrend } from "@/components/charts/trend-chart";
import { achievements, personalRecords } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";

const BODY_PHOTO_LABELS = ["Jan 2026", "Mar 2026", "Jun 2026"];

function EmptyChart() {
  return (
    <div className="flex h-[140px] items-center justify-center text-center text-sm text-text-muted">
      Nenhum dado ainda —<br />registre treinos para ver o gráfico.
    </div>
  );
}

export default function EvolutionPage() {
  const [bodyPhotos, setBodyPhotos] = useState<(string | null)[]>([null, null, null]);
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [evolucao, setEvolucao] = useState<{
    weeklyVolume: { label: string; km: number }[];
    monthlyVolume: { label: string; km: number }[];
    avgPace: { label: string; paceSec: number }[];
    avgHr: { label: string; hr: number }[];
    trainingLoad: { label: string; load: number }[];
    weightHistory: { label: string; kg: number }[];
    vo2History: { label: string; vo2: number }[];
    races: { distance: string; date: string; time: string; pace: string }[];
    hasData: boolean;
  }>({
    weeklyVolume: [], monthlyVolume: [], avgPace: [], avgHr: [],
    trainingLoad: [], weightHistory: [], vo2History: [], races: [], hasData: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/evolucao")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setEvolucao(data); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function handlePhotoChange(idx: number, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string | undefined;
      if (url) setBodyPhotos((prev) => prev.map((p, i) => (i === idx ? url : p)));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Sua evolução</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Acompanhe seu progresso</h1>
        <p className="mt-1.5 text-sm text-text-muted">Volume, intensidade, fisiologia e composição corporal — tudo em um só lugar.</p>
      </div>

      {/* Resumo interpretativo */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-text">Resumo das últimas 4 semanas</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Você está correndo 28s/km mais rápido do que há 7 semanas.", positive: true },
            { label: "Sua carga subiu dentro da zona segura — sem picos de overtraining.", positive: true },
            { label: "Risco atual baixo. Boa janela para avançar na periodização.", positive: true },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-card-hover/60 p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-xs text-text-muted leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Volume semanal" description="Quilômetros percorridos por semana" trend="up" trendLabel="+8% nas últimas 4 semanas">
          {evolucao.weeklyVolume.length > 0
            ? <AreaTrend data={evolucao.weeklyVolume} dataKey="km" color="#38bdf8" unit=" km" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Volume mensal" description="Total de quilômetros por mês" trend="up" trendLabel="Recorde em maio: 168 km">
          {evolucao.monthlyVolume.length > 0
            ? <BarTrend data={evolucao.monthlyVolume} dataKey="km" color="#8b5cf6" unit=" km" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Pace médio" description="Evolução do ritmo médio semanal (min/km)" trend="up" trendLabel="28s/km mais rápido em 7 semanas">
          {evolucao.avgPace.length > 0
            ? <LineTrend data={evolucao.avgPace} dataKey="paceSec" color="#84cc16" reverse formatValue={(v) => formatPace(v)} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Carga de treino"
          description="Carga semanal estimada (UA = duração × RPE)"
          trend="up"
          trendLabel="Dentro da faixa segura de progressão"
          tooltip="UA = Unidades Arbitrárias. Mede a carga de treino combinando duração (min) e percepção de esforço (RPE de 1 a 10) de cada sessão, somadas na semana — quanto maior, mais intenso foi o estímulo total."
        >
          {evolucao.trainingLoad.length > 0
            ? <AreaTrend data={evolucao.trainingLoad} dataKey="load" color="#facc15" unit=" UA" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="FC média" description="Frequência cardíaca média durante os treinos" trend="down" trendLabel="-7 bpm — sinal de melhora aeróbica">
          {evolucao.avgHr.length > 0
            ? <LineTrend data={evolucao.avgHr} dataKey="hr" color="#ef4444" unit=" bpm" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="VO2 estimado" description="Estimativa de consumo máximo de oxigênio (ml/kg/min)" trend="up" trendLabel="+3.5 pontos em 6 meses">
          {evolucao.vo2History.length > 0
            ? <LineTrend data={evolucao.vo2History} dataKey="vo2" color="#38bdf8" unit=" ml/kg/min" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Evolução do peso" description="Peso corporal ao longo dos meses (kg)" trend="down" trendLabel="-2.8 kg desde janeiro">
          {evolucao.weightHistory.length > 0
            ? <AreaTrend data={evolucao.weightHistory} dataKey="kg" color="#a855f7" unit=" kg" />
            : <EmptyChart />}
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Evolução corporal</CardTitle>
            <CardDescription>Tire ou anexe fotos de progresso para cada período de treino</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 pt-4">
            {BODY_PHOTO_LABELS.map((label, i) => (
              <div key={label} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  className="relative aspect-[3/4] w-full overflow-hidden bg-card-hover/40 transition-opacity hover:opacity-80"
                  onClick={() => fileRefs[i].current?.click()}
                  title={`Adicionar foto — ${label}`}
                >
                  {bodyPhotos[i] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={bodyPhotos[i]!} alt={`Foto ${label}`} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
                      <Camera className="h-6 w-6 opacity-50" />
                      <span className="text-[10px] text-center px-1 opacity-60">Toque para adicionar foto</span>
                    </div>
                  )}
                </button>
                <p className="bg-card-hover/60 py-1.5 text-center text-[11px] text-text-muted">{label}</p>
                <input
                  ref={fileRefs[i]}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(i, e.target.files?.[0])}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Records & achievements */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionHeader title="Recordes pessoais" subtitle="Seus melhores tempos por distância" />
          <div className="space-y-2.5">
            {evolucao.races.length > 0
              ? evolucao.races.map((r, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <Medal className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-display text-base font-bold text-text">{r.distance}</p>
                          <p className="text-xs text-text-muted">{r.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-stat text-lg font-bold text-text">{r.time}</p>
                        <p className="text-xs text-text-muted">{r.pace}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : <p className="text-sm text-text-muted">Nenhuma prova registrada ainda.</p>
            }
          </div>
        </div>

        <div>
          <SectionHeader title="Conquistas" subtitle="Medalhas desbloqueadas pela sua consistência" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a) => (
              <Card key={a.id} className={`p-4 text-center ${!a.earned ? "opacity-40 grayscale" : ""}`}>
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-card-hover text-2xl ${
                    a.earned ? "animate-glow-pulse" : ""
                  }`}
                >
                  {a.icon}
                </div>
                <p className="mt-2 text-sm font-semibold text-text">{a.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{a.description}</p>
                {a.earned && (
                  <Badge variant="success" className="mt-2">
                    <Award className="h-3 w-3" />
                    Conquistado
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  trend,
  trendLabel,
  tooltip,
  children,
}: {
  title: string;
  description: string;
  trend: "up" | "down";
  trendLabel: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            {title}
            {tooltip && <InfoTooltip text={tooltip} />}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant={trend === "up" ? "success" : "info"} className="shrink-0">
          <TrendIcon className="h-3 w-3" />
        </Badge>
      </CardHeader>
      <CardContent className="pt-3">
        {children}
        <p className="mt-1 text-xs text-text-muted">{trendLabel}</p>
      </CardContent>
    </Card>
  );
}
