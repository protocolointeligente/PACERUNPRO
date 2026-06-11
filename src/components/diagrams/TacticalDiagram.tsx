import { useId, useMemo } from "react";
import type { DiagramElement } from "@/lib/diagrams/types";

interface TacticalDiagramProps {
  elements: DiagramElement[];
  title?: string;
  structureLabel?: string;
  positionLabel?: string;
  className?: string;
}

const FIELD_TOP = "#0f7a44";
const FIELD_BOTTOM = "#075b34";

function sanitize(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Renders a tactical pitch diagram from a declarative element list.
 *
 * Each instance gets unique gradient/marker ids via useId() (fixes the
 * duplicate `id="grass"`/`id="arrow"` collision from the legacy version,
 * where every diagram resolved to the first one's <defs>). Arrow markers
 * use markerUnits="userSpaceOnUse" with a small fixed size so they no
 * longer balloon on thick/short strokes, and each marker is colored to
 * match its arrow.
 */
export function TacticalDiagram({
  elements,
  title,
  structureLabel,
  positionLabel,
  className,
}: TacticalDiagramProps) {
  const rawId = useId();
  const uid = sanitize(rawId);
  const grassId = `grass-${uid}`;

  const arrowColors = useMemo(() => {
    const colors = new Set<string>();
    for (const el of elements) {
      if (el.type === "arrow") colors.add(el.color || "#ffd166");
    }
    return Array.from(colors);
  }, [elements]);

  const markerId = (color: string) => `arrow-${uid}-${sanitize(color)}`;

  return (
    <svg
      className={className ?? "diagram"}
      viewBox="0 0 160 105"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ? `Prancha tática: ${title}` : "Prancha tática"}
    >
      <defs>
        <linearGradient id={grassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FIELD_TOP} />
          <stop offset="1" stopColor={FIELD_BOTTOM} />
        </linearGradient>
        {arrowColors.map((color) => (
          <marker
            key={color}
            id={markerId(color)}
            markerWidth="5"
            markerHeight="5"
            refX="4.3"
            refY="2.5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 z" fill={color} />
          </marker>
        ))}
      </defs>

      <FieldBase grassId={grassId} />

      {elements.map((el, i) => (
        <ElementShape key={i} el={el} markerId={markerId} />
      ))}

      {(structureLabel || positionLabel) && (
        <g>
          <rect x="6" y="89" width="78" height="10" rx="4" fill="rgba(0,0,0,.25)" />
          <text x="10" y="96" fontSize="5" fill="#fff" fontWeight="900">
            {[structureLabel, positionLabel].filter(Boolean).join(" • ")}
          </text>
        </g>
      )}
    </svg>
  );
}

function FieldBase({ grassId }: { grassId: string }) {
  return (
    <>
      <rect x="4" y="4" width="152" height="97" rx="5" fill="#0b6a3b" stroke="#ecfff5" strokeWidth="1.4" />
      <rect x="4" y="4" width="152" height="97" rx="5" fill={`url(#${grassId})`} opacity=".35" />
      <line x1="80" y1="4" x2="80" y2="101" stroke="#ecfff5" strokeWidth="1" />
      <circle cx="80" cy="52.5" r="13" fill="none" stroke="#ecfff5" />
      <rect x="4" y="28" width="20" height="49" fill="none" stroke="#ecfff5" />
      <rect x="136" y="28" width="20" height="49" fill="none" stroke="#ecfff5" />
      <rect x="4" y="39" width="8" height="27" fill="none" stroke="#ecfff5" />
      <rect x="148" y="39" width="8" height="27" fill="none" stroke="#ecfff5" />
      <path d="M24 36a19 19 0 0 1 0 33M136 36a19 19 0 0 0 0 33" fill="none" stroke="#ecfff5" opacity=".8" />
    </>
  );
}

function ElementShape({ el, markerId }: { el: DiagramElement; markerId: (color: string) => string }) {
  switch (el.type) {
    case "player":
      return (
        <g>
          <circle cx={el.x} cy={el.y} r="4.8" fill={el.color} stroke="#051018" strokeWidth="1.1" />
          <text x={el.x} y={el.y + 1.6} textAnchor="middle" fontSize="4.3" fontWeight="1000" fill="#061018">
            {el.label}
          </text>
        </g>
      );
    case "ball":
      return (
        <g>
          <circle cx={el.x} cy={el.y} r="3" fill="#fff" stroke="#111" />
          <path d={`M${el.x - 2},${el.y} h4 M${el.x},${el.y - 2} v4`} stroke="#111" strokeWidth=".6" />
        </g>
      );
    case "cone":
      return <path d={`M${el.x},${el.y - 4} l4,8 h-8 z`} fill="#ff9f1c" stroke="#111" strokeWidth=".6" />;
    case "arrow": {
      const color = el.color || "#ffd166";
      return (
        <g>
          <line
            x1={el.x1}
            y1={el.y1}
            x2={el.x2}
            y2={el.y2}
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={el.dash ? "5 4" : undefined}
            markerEnd={`url(#${markerId(color)})`}
          />
          {el.label && (
            <text
              x={(el.x1 + el.x2) / 2}
              y={(el.y1 + el.y2) / 2 - 2}
              fontSize="5"
              fontWeight="900"
              fill="#fff"
              stroke="#082014"
              strokeWidth=".35"
            >
              {el.label}
            </text>
          )}
        </g>
      );
    }
    case "zone":
      return (
        <g>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx="4" fill={el.color} stroke="#dff" strokeDasharray="4 3" opacity=".9" />
          <text x={el.x + el.w / 2} y={el.y + 8} textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff">
            {el.label}
          </text>
        </g>
      );
    case "miniGoal":
      return <rect x={el.x} y={el.y} width="3" height="16" fill="none" stroke="#fff" strokeWidth="1.4" />;
    default:
      return null;
  }
}
