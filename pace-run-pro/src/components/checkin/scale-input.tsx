"use client";

import { cn } from "@/lib/utils";

interface ScaleInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emojis: string[];
  lowLabel: string;
  highLabel: string;
  accent?: string;
}

export function ScaleInput({ label, value, onChange, emojis, lowLabel, highLabel, accent = "#8b5cf6" }: ScaleInputProps) {
  const emojiIndex = Math.min(emojis.length - 1, Math.floor((value / 10) * emojis.length));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-text">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card-hover text-lg">{emojis[emojiIndex]}</span>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
            className={cn(
              "h-8 flex-1 rounded-md border text-[11px] font-semibold transition-all",
              n <= value ? "text-text" : "border-border bg-background text-text-muted/50"
            )}
            style={n <= value ? { backgroundColor: accent, borderColor: accent } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
        <span>{lowLabel}</span>
        <span className="font-display text-sm font-bold text-text">{value}/10</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
