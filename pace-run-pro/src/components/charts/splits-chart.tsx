"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Split {
  km: number;
  pace: string;
  elev?: number;
}

function paceToSec(pace: string): number {
  const [m, s] = pace.split(":").map(Number);
  return m * 60 + (s ?? 0);
}

function secToPace(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

const tooltipStyle = {
  background: "#0b1220",
  border: "1px solid #1e2a40",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export function SplitsChart({ splits }: { splits: Split[] }) {
  if (!splits || splits.length === 0) return null;

  const data = splits.map((s) => ({
    km: `km ${s.km}`,
    paceSec: paceToSec(s.pace),
    pace: s.pace,
  }));

  const paceValues = data.map((d) => d.paceSec);
  const minPace = Math.min(...paceValues) - 15;
  const maxPace = Math.max(...paceValues) + 15;

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a40" />
          <XAxis dataKey="km" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis
            domain={[minPace, maxPace]}
            tickFormatter={(v: number) => secToPace(v)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            reversed
            width={44}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [secToPace(value), "Pace"]}
          />
          <Line
            type="monotone"
            dataKey="paceSec"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
