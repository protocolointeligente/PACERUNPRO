"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Camera, Medal, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { SectionHeader } from "@/components/shared/section-header";
import { AreaTrend, BarTrend, LineTrend } from "@/components/charts/trend-chart";
import { CtlAtlTsbChart, type LoadDaySport } from "@/components/charts/multisport-load-chart";
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
  const [peakPace, setPeakPace] = useState<{ label: string; paceSec: number; paceStr: string }[]>([]);
  const [loadSeries, setLoadSeries] = useState<LoadDaySport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/evolucao")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setEvolucao(data); })
      .catch(() => null)
      .finally(() => setLoading(false));
    fetch("/api/atleta/peak-pace")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.data) setPeakPace(d.data); })
      .catch(() => null);
    fetch("/api/atleta/training-load")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { series?: { date: string; ctl: number; atl: number; tsb: number; tss: number }[] } | null) => {
        if (!d?.series) return;
        const converted: LoadDaySport[] = d.series.map((s) => {
          const [, mm, dd] = s.date.split("-");
          return {
            date: s.date,
            label: `${dd}/${mm}`,
            ctl: Math.round(s.ctl * 10) / 10,
            atl: Math.round(s.atl * 10) / 10,
            tsb: Math.round(s.tsb * 10) / 10,
            runTss: s.tss,
            bikeTss: 0,
            swimTss: 0,
            strengthTss: 0,
          };
        });
        // Keep one point every 3 days to reduce chart density
        setLoadSeries(converted.filter((_, i) => i % 3 === 0 || i === converted.length - 1));
      })
      .catch(() => null);
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

  // ── Derived trend labels (computed from real data) ──────────────────────
  function pctChange(prev: number, curr: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  function weeklyVolumeTrend(): { label: string; up: boolean } | null {
    const d = evolucao.weeklyVolume;
    if (d.length < 2) return null;
    const recent = d.slice(-4).reduce((s, x) => s + x.km, 0) / Math.min(d.length, 4);
    const older = d.slice(0, Math.max(1, d.length - 4)).reduce((s, x) => s + x.km, 0) / Math.max(1, d.length - 4);
    const pct = pctChange(older, recent);
    if (pct === null) return null;
    return { label: `${pct >= 0 ? "+" : ""}${pct}% nas últimas 4 semanas`, up: pct >= 0 };
  }

  function monthlyVolumeTrend(): string | null {
    const d = evolucao.monthlyVolume;
    if (d.length === 0) return null;
    const peak = d.reduce((a, b) => (b.km > a.km ? b : a));
    return `Recorde: ${peak.km} km em ${peak.label}`;
  }

  function paceTrend(): string | null {
    const d = evolucao.avgPace;
    if (d.length < 2) return null;
    const first = d[0].paceSec;
    const last = d[d.length - 1].paceSec;
    const diffSec = first - last; // positive = faster (improvement)
    if (Math.abs(diffSec) < 2) return "Pace estável no período";
    const abs = Math.abs(diffSec);
    const dir = diffSec > 0 ? "mais rápido" : "mais lento";
    return `${Math.floor(abs / 60) > 0 ? Math.floor(abs / 60) + "min " : ""}${abs % 60}s/km ${dir} em ${d.length} semanas`;
  }

  function hrTrend(): string | null {
    const d = evolucao.avgHr;
    if (d.length < 2) return null;
    const diff = d[d.length - 1].hr - d[0].hr;
    if (diff === 0) return "FC estável no período";
    return `${diff > 0 ? "+" : ""}${diff} bpm em ${d.length} semanas${diff < 0 ? " — melhora aeróbica" : ""}`;
  }

  function vo2Trend(): string | null {
    const d = evolucao.vo2History;
    if (d.length < 2) return null;
    const diff = Math.round((d[d.length - 1].vo2 - d[0].vo2) * 10) / 10;
    if (diff === 0) return "VO2 estável no período";
    return `${diff > 0 ? "+" : ""}${diff} ml/kg/min em ${d.length} meses`;
  }

  function weightTrend(): string | null {
    const d = evolucao.weightHistory;
    if (d.length < 2) return null;
    const diff = Math.round((d[d.length - 1].kg - d[0].kg) * 10) / 10;
    if (diff === 0) return "Peso estável no período";
    return `${diff > 0 ? "+" : ""}${diff} kg desde ${d[0].label}`;
  }

  function summaryBullets(): { text: string; positive: boolean }[] {
    const bullets: { text: string; positive: boolean }[] = [];

    const pace = evolucao.avgPace;
    if (pace.length >= 2) {
      const diffSec = pace[0].paceSec - pace[pace.length - 1].paceSec;
      const abs = Math.abs(diffSec);
      const improved = diffSec > 0;
      bullets.push({
        text: improved
          ? `Pace melhorou ${abs}s/km nas últimas ${pace.length} semanas.`
          : `Pace subiu ${abs}s/km nas últimas ${pace.length} semanas — revise a intensidade.`,
        positive: improved,
      });
    }

    const load = evolucao.trainingLoad;
    if (load.length >= 2) {
      const recent = load[load.length - 1].load;
      const prev = load[load.length - 2].load;
      const spike = prev > 0 ? recent / prev : 1;
      bullets.push({
        text: spike > 1.3
          ? `Carga subiu ${Math.round((spike - 1) * 100)}% em relação à semana anterior — risco de overtraining.`
          : "Carga dentro da faixa segura de progressão.",
        positive: spike <= 1.3,
      });
    }

    const hr = evolucao.avgHr;
    if (hr.length >= 2) {
      const diff = hr[hr.length - 1].hr - hr[0].hr;
      bullets.push({
        text: diff < 0
          ? `FC média caiu ${Math.abs(diff)} bpm — sinal claro de melhora aeróbica.`
          : diff > 5
          ? `FC média subiu ${diff} bpm — monitore fadiga e recuperação.`
          : "FC média estável. Boa adaptação ao estímulo atual.",
        positive: diff <= 0,
      });
    }

    if (bullets.length === 0 && evolucao.hasData) {
      bullets.push({ text: "Continue registrando treinos para ver insights personalizados aqui.", positive: true });
    }

    return bullets;
  }

  const wvTrend = weeklyVolumeTrend();
  const mthTrend = monthlyVolumeTrend();
  const pTrend = paceTrend();
  const hTrend = hrTrend();
  const v2Trend = vo2Trend();
  const wTrend = weightTrend();
  const bullets = summaryBullets();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="space-y-2">
          <SkeletonCard className="h-5 w-24" />
          <SkeletonCard className="h-8 w-64" />
          <SkeletonCard className="h-4 w-80" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Sua evolução</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Acompanhe seu progresso</h1>
        <p className="mt-1.5 text-sm text-text-muted">Volume, intensidade, fisiologia e composição corporal — tudo em um só lugar.</p>
      </div>

      {/* Resumo interpretativo */}
      {(evolucao.hasData || bullets.length > 0) && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-text">Resumo das últimas 4 semanas</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {bullets.map((item, i) => {
              const Icon = item.positive ? TrendingUp : TrendingDown;
              return (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-card-hover/60 p-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.positive ? "text-success" : "text-warning"}`} />
                  <p className="text-xs text-text-muted leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Volume semanal"
          description="Quilômetros percorridos por semana"
          trend={wvTrend ? (wvTrend.up ? "up" : "down") : undefined}
          trendLabel={wvTrend?.label}
        >
          {evolucao.weeklyVolume.length > 0
            ? <AreaTrend data={evolucao.weeklyVolume} dataKey="km" color="#38bdf8" unit=" km" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Volume mensal"
          description="Total de quilômetros por mês"
          trend={mthTrend ? "up" : undefined}
          trendLabel={mthTrend ?? undefined}
        >
          {evolucao.monthlyVolume.length > 0
            ? <BarTrend data={evolucao.monthlyVolume} dataKey="km" color="#C6F24E" unit=" km" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Pace médio"
          description="Evolução do ritmo médio semanal (min/km)"
          trend={pTrend ? "up" : undefined}
          trendLabel={pTrend ?? undefined}
        >
          {evolucao.avgPace.length > 0
            ? <LineTrend data={evolucao.avgPace} dataKey="paceSec" color="#84cc16" reverse formatValue={(v) => formatPace(v)} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Carga de treino"
          description="Carga semanal estimada (UA = duração × RPE)"
          tooltip="UA = Unidades Arbitrárias. Mede a carga de treino combinando duração (min) e percepção de esforço (RPE de 1 a 10) de cada sessão, somadas na semana — quanto maior, mais intenso foi o estímulo total."
        >
          {evolucao.trainingLoad.length > 0
            ? <AreaTrend data={evolucao.trainingLoad} dataKey="load" color="#facc15" unit=" UA" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Fitness · Fadiga · Forma"
          description="CTL (fitness), ATL (fadiga) e TSB (forma) dos últimos 90 dias"
          tooltip="CTL (Chronic Training Load) = fitness acumulado nos últimos ~42 dias. ATL (Acute Training Load) = fadiga recente (~7 dias). TSB (Training Stress Balance) = CTL − ATL: positivo significa forma, negativo significa fadiga. Ideal para decidir quando competir ou intensificar."
        >
          <CtlAtlTsbChart data={loadSeries} />
        </ChartCard>

        <ChartCard
          title="FC média"
          description="Frequência cardíaca média durante os treinos"
          trend={hTrend ? "down" : undefined}
          trendLabel={hTrend ?? undefined}
        >
          {evolucao.avgHr.length > 0
            ? <LineTrend data={evolucao.avgHr} dataKey="hr" color="#ef4444" unit=" bpm" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="VO2 estimado"
          description="Estimativa de consumo máximo de oxigênio (ml/kg/min)"
          trend={v2Trend ? "up" : undefined}
          trendLabel={v2Trend ?? undefined}
        >
          {evolucao.vo2History.length > 0
            ? <LineTrend data={evolucao.vo2History} dataKey="vo2" color="#38bdf8" unit=" ml/kg/min" />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Curva de pico de pace"
          description="Seu melhor pace sustentado em cada duração (últimos 6 meses)"
          tooltip="Mostra o pace mais rápido que você conseguiu manter por cada intervalo de tempo. Quanto mais baixo o valor, melhor. Útil para identificar seu perfil de esforço: atletas de sprint têm melhor pace nos tempos curtos; maratonistas sustentam bem os tempos longos."
        >
          {peakPace.length > 0
            ? <BarTrend data={peakPace} dataKey="paceSec" color="#FFB020" reverse formatValue={(v) => formatPace(v)} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Evolução do peso"
          description="Peso corporal ao longo dos meses (kg)"
          trend={wTrend ? "down" : undefined}
          trendLabel={wTrend ?? undefined}
        >
          {evolucao.weightHistory.length > 0
            ? <AreaTrend data={evolucao.weightHistory} dataKey="kg" color="#46E0C8" unit=" kg" />
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-text">Nenhuma conquista ainda</p>
            <p className="text-sm text-text-muted">Complete treinos e mantenha sua sequência para desbloquear medalhas.</p>
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
  trend?: "up" | "down";
  trendLabel?: string;
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
        {trend && (
          <Badge variant={trend === "up" ? "success" : "info"} className="shrink-0">
            <TrendIcon className="h-3 w-3" />
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-3">
        {children}
        {trendLabel && <p className="mt-1 text-xs text-text-muted">{trendLabel}</p>}
      </CardContent>
    </Card>
  );
}
