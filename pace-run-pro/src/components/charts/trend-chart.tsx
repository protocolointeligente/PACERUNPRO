"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SeriesDatum {
  label: string;
  [key: string]: string | number;
}

const tooltipStyle = {
  background: "#0b1220",
  border: "1px solid #1e2a40",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export function AreaTrend({
  data,
  dataKey,
  color = "#8b5cf6",
  unit = "",
  formatValue,
}: {
  data: SeriesDatum[];
  dataKey: string;
  color?: string;
  unit?: string;
  formatValue?: (v: number) => string;
}) {
  const gradientId = `grad-${dataKey}-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e2a40" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={42} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value) => [formatValue ? formatValue(Number(value)) : `${value}${unit}`, ""]}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data,
  dataKey,
  color = "#38bdf8",
  unit = "",
  formatValue,
  reverse = false,
}: {
  data: SeriesDatum[];
  dataKey: string;
  color?: string;
  unit?: string;
  formatValue?: (v: number) => string;
  reverse?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="#1e2a40" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={46} reversed={reverse} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value) => [formatValue ? formatValue(Number(value)) : `${value}${unit}`, ""]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({
  data,
  dataKey,
  color = "#a855f7",
  unit = "",
}: {
  data: SeriesDatum[];
  dataKey: string;
  color?: string;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="#1e2a40" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={42} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} formatter={(value) => [`${value}${unit}`, ""]} cursor={{ fill: "rgba(139,92,246,0.08)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
