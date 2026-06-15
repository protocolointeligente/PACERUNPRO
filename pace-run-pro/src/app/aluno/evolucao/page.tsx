"use client";

import { Award, Medal, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { AreaTrend, BarTrend, LineTrend } from "@/components/charts/trend-chart";
import {
  achievements,
  avgHrSeries,
  avgPaceSeries,
  monthlyVolumeSeries,
  personalRecords,
  trainingLoadSeries,
  vo2Series,
  weeklyVolumeSeries,
  weightSeries,
} from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";

export default function EvolutionPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Sua evolução</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Acompanhe seu progresso</h1>
        <p className="mt-1.5 text-sm text-text-muted">Volume, intensidade, fisiologia e composição corporal — tudo em um só lugar.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Volume semanal" description="Quilômetros percorridos por semana" trend="up" trendLabel="+8% nas últimas 4 semanas">
          <AreaTrend data={weeklyVolumeSeries} dataKey="km" color="#38bdf8" unit=" km" />
        </ChartCard>

        <ChartCard title="Volume mensal" description="Total de quilômetros por mês" trend="up" trendLabel="Recorde em maio: 168 km">
          <BarTrend data={monthlyVolumeSeries} dataKey="km" color="#8b5cf6" unit=" km" />
        </ChartCard>

        <ChartCard title="Pace médio" description="Evolução do ritmo médio semanal (min/km)" trend="up" trendLabel="28s/km mais rápido em 7 semanas">
          <LineTrend data={avgPaceSeries} dataKey="paceSec" color="#84cc16" reverse formatValue={(v) => formatPace(v)} />
        </ChartCard>

        <ChartCard title="Carga de treino" description="Carga semanal estimada (UA = duração × RPE)" trend="up" trendLabel="Dentro da faixa segura de progressão">
          <AreaTrend data={trainingLoadSeries} dataKey="load" color="#facc15" unit=" UA" />
        </ChartCard>

        <ChartCard title="FC média" description="Frequência cardíaca média durante os treinos" trend="down" trendLabel="-7 bpm — sinal de melhora aeróbica">
          <LineTrend data={avgHrSeries} dataKey="hr" color="#ef4444" unit=" bpm" />
        </ChartCard>

        <ChartCard title="VO2 estimado" description="Estimativa de consumo máximo de oxigênio (ml/kg/min)" trend="up" trendLabel="+3.5 pontos em 6 meses">
          <LineTrend data={vo2Series} dataKey="vo2" color="#38bdf8" unit=" ml/kg/min" />
        </ChartCard>

        <ChartCard title="Evolução do peso" description="Peso corporal ao longo dos meses (kg)" trend="down" trendLabel="-2.8 kg desde janeiro">
          <AreaTrend data={weightSeries} dataKey="kg" color="#a855f7" unit=" kg" />
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Evolução corporal</CardTitle>
            <CardDescription>Fotos de progresso e medidas registradas com seu treinador</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 pt-4">
            {["Jan 2026", "Mar 2026", "Jun 2026"].map((label, i) => (
              <div key={label} className="overflow-hidden rounded-xl border border-border">
                <div
                  className="aspect-[3/4] bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-${
                      ["1517836357463-d25dfeac3438", "1571019613454-1cb2f99b2d8b", "1483721310020-03333e577078"][i]
                    }?w=400&h=560&fit=crop')`,
                  }}
                />
                <p className="bg-card-hover/60 py-1.5 text-center text-[11px] text-text-muted">{label}</p>
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
            {personalRecords.map((r) => (
              <Card key={r.distance}>
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
            ))}
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
  children,
}: {
  title: string;
  description: string;
  trend: "up" | "down";
  trendLabel: string;
  children: React.ReactNode;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
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
