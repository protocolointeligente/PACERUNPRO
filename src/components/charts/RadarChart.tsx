export interface RadarSeries {
  label: string;
  values: number[];
  color: string;
  dashed?: boolean;
}

interface RadarChartProps {
  labels: string[];
  series: RadarSeries[];
  max?: number;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 92;
const RINGS = [0.2, 0.4, 0.6, 0.8, 1];

function pointAt(index: number, total: number, fraction: number) {
  const angle = -Math.PI / 2 + index * ((2 * Math.PI) / total);
  return {
    x: CENTER + RADIUS * fraction * Math.cos(angle),
    y: CENTER + RADIUS * fraction * Math.sin(angle),
  };
}

function polygonPoints(values: number[], max: number) {
  return values.map((v, i) => pointAt(i, values.length, Math.max(0, Math.min(1, v / max)))).map((p) => `${p.x},${p.y}`).join(" ");
}

export function RadarChart({ labels, series, max = 10 }: RadarChartProps) {
  const n = labels.length;

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" role="img" aria-label="Gráfico radar de avaliação">
        {RINGS.map((r) => (
          <polygon
            key={r}
            points={polygonPoints(
              labels.map(() => max * r),
              max
            )}
            fill="none"
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}
        {labels.map((_, i) => {
          const p = pointAt(i, n, 1);
          return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth={1} />;
        })}
        {series.map((s) => (
          <polygon
            key={s.label}
            points={polygonPoints(s.values, max)}
            fill={s.color}
            fillOpacity={0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
          />
        ))}
        {labels.map((_, i) => {
          const p = pointAt(i, n, 1.14);
          let anchor: "start" | "middle" | "end" = "middle";
          const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
          if (Math.cos(angle) > 0.3) anchor = "start";
          else if (Math.cos(angle) < -0.3) anchor = "end";
          return (
            <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fontWeight={800} fill="var(--accent2)">
              {i + 1}
            </text>
          );
        })}
      </svg>
      <div className="mt-3 grid gap-1.5 text-[12px]">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="grid h-5 w-5 flex-none place-items-center rounded-full text-[10px] font-black text-white"
              style={{ background: "var(--accent)" }}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate" style={{ color: "var(--text)" }}>
              {label}
            </span>
            {series.map((s) => (
              <span key={s.label} className="chip flex-none" style={{ borderColor: s.color, color: s.color }}>
                {s.values[i]?.toFixed(1) ?? "—"}
              </span>
            ))}
          </div>
        ))}
      </div>
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {series.map((s) => (
            <span key={s.label} className="chip" style={{ borderColor: s.color, color: s.color }}>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
