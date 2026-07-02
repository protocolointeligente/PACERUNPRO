"use client";

import type { SportType } from "@prisma/client";

export const SPORT_CONFIG: Record<SportType | "OTHER", {
  label: string;
  emoji: string;
  color: string;        // Tailwind bg class
  textColor: string;    // Tailwind text class
  borderColor: string;  // Tailwind border class
}> = {
  RUN:      { label: "Corrida",    emoji: "🏃",  color: "bg-blue-100",   textColor: "text-blue-700",   borderColor: "border-blue-300" },
  BIKE:     { label: "Ciclismo",   emoji: "🚴",  color: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-300" },
  SWIM:     { label: "Natação",    emoji: "🏊",  color: "bg-cyan-100",   textColor: "text-cyan-700",   borderColor: "border-cyan-300" },
  STRENGTH: { label: "Força",      emoji: "🏋️",  color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  MOBILITY: { label: "Mobilidade", emoji: "🧘",  color: "bg-green-100",  textColor: "text-green-700",  borderColor: "border-green-300" },
  TRIATHLON:{ label: "Triathlon",  emoji: "🏅",  color: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-300" },
  BRICK:    { label: "Brick",      emoji: "⚡",  color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  OTHER:    { label: "Outro",      emoji: "⚙️",  color: "bg-gray-100",   textColor: "text-gray-700",   borderColor: "border-gray-300" },
};

interface SportBadgeProps {
  sport: SportType | "OTHER";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SportBadge({ sport, showLabel = true, size = "md" }: SportBadgeProps) {
  const config = SPORT_CONFIG[sport] ?? SPORT_CONFIG.OTHER;
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : size === "lg" ? "text-base px-3 py-1.5" : "text-sm px-2 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.color} ${config.textColor} ${config.borderColor} ${sizeClass}`}>
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface SportIconProps {
  sport: SportType | "OTHER";
  size?: number;
}

export function SportIcon({ sport, size = 20 }: SportIconProps) {
  const config = SPORT_CONFIG[sport] ?? SPORT_CONFIG.OTHER;
  return (
    <span style={{ fontSize: size }} title={config.label} role="img" aria-label={config.label}>
      {config.emoji}
    </span>
  );
}
