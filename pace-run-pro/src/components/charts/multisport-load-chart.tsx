"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoadDaySport {
  date: string;      // YYYY-MM-DD
  label: string;     // "DD/MM"
  ctl: number;
  atl: number;
  tsb: number;
  runTss: number;
  bikeTss: number;
  swimTss: number;
  strengthTss: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "#0b1220",
  border: "1px solid #1e2a40",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

const SPORT_COLORS = {
  run:      "#3b82f6",
  bike:     "#f97316",
  swim:     "#06b6d4",
  strength: "#a855f7",
};

// ── CTL / ATL / TSB Chart ─────────────────────────────────────────────────────

export function CtlAtlTsbChart({ data }: { data: LoadDaySport[] }) {
  const hasTsb = data.some((d) => d.tsb !== 0 || d.ctl !== 0);

  if (!hasTsb || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-text-muted">
        Dados insuficientes para exibir a curva de forma.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v: string) => (({ ctl: "Fitness (CTL)", atl: "Fadiga (ATL)", tsb: "Forma (TSB)" } as Record<string, string>)[v] ?? v)}
        />
        <Line
          type="monotone" dataKey="ctl" name="ctl"
          stroke="#C6F24E" strokeWidth={2} dot={false}
        />
        <Line
          type="monotone" dataKey="atl" name="atl"
          stroke="#FF5A4D" strokeWidth={1.5} dot={false} strokeDasharray="4 2"
        />
        <Line
          type="monotone" dataKey="tsb" name="tsb"
          stroke="#46E0C8" strokeWidth={1.5} dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Stacked Bar Chart — carga por modalidade ──────────────────────────────────

export function SportLoadBarChart({ data }: { data: LoadDaySport[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-text-muted">
        Sem dados de carga por modalidade.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v: string) => (({ runTss: "🏃 Corrida", bikeTss: "🚴 Bike", swimTss: "🏊 Natação", strengthTss: "🏋️ Força" } as Record<string, string>)[v] ?? v)}
        />
        <Bar dataKey="runTss"      name="runTss"      stackId="a" fill={SPORT_COLORS.run}      radius={[0, 0, 0, 0]} />
        <Bar dataKey="bikeTss"     name="bikeTss"     stackId="a" fill={SPORT_COLORS.bike}     />
        <Bar dataKey="swimTss"     name="swimTss"     stackId="a" fill={SPORT_COLORS.swim}     />
        <Bar dataKey="strengthTss" name="strengthTss" stackId="a" fill={SPORT_COLORS.strength} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Area Chart — volume semanal por esporte ───────────────────────────────────

export function SportVolumeAreaChart({ data }: { data: LoadDaySport[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-text-muted">
        Sem dados de volume.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="grad-run"      x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={SPORT_COLORS.run}      stopOpacity={0.3} />
            <stop offset="95%" stopColor={SPORT_COLORS.run}      stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-bike"     x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={SPORT_COLORS.bike}     stopOpacity={0.3} />
            <stop offset="95%" stopColor={SPORT_COLORS.bike}     stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-swim"     x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={SPORT_COLORS.swim}     stopOpacity={0.3} />
            <stop offset="95%" stopColor={SPORT_COLORS.swim}     stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#5C636B" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v: string) => (({ runTss: "🏃 Corrida", bikeTss: "🚴 Bike", swimTss: "🏊 Natação" } as Record<string, string>)[v] ?? v)}
        />
        <Area type="monotone" dataKey="runTss"  name="runTss"  stroke={SPORT_COLORS.run}  fill="url(#grad-run)"  strokeWidth={1.5} />
        <Area type="monotone" dataKey="bikeTss" name="bikeTss" stroke={SPORT_COLORS.bike} fill="url(#grad-bike)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="swimTss" name="swimTss" stroke={SPORT_COLORS.swim} fill="url(#grad-swim)" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Combined multisport load panel ────────────────────────────────────────────

export function MultisportLoadCharts({ data, title }: { data: LoadDaySport[]; title?: string }) {
  return (
    <div className="space-y-4">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</p>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold text-text-muted">Fitness · Fadiga · Forma (CTL / ATL / TSB)</p>
        <CtlAtlTsbChart data={data} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold text-text-muted">Carga diária por modalidade (TSS)</p>
        <SportLoadBarChart data={data} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold text-text-muted">Volume acumulado por esporte</p>
        <SportVolumeAreaChart data={data} />
      </div>
    </div>
  );
}
