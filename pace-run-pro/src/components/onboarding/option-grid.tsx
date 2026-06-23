"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function OptionGrid({
  options,
  value,
  onChange,
  multiple = false,
  columns = 2,
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3;
}) {
  function toggle(v: string) {
    if (multiple) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange([v]);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3"
      )}
    >
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              selected
                ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]"
                : "border-border bg-card hover:border-primary/30 hover:bg-card-hover"
            )}
          >
            {opt.icon && (
              <span className={cn("text-xl", selected ? "text-primary" : "text-text-muted")}>{opt.icon}</span>
            )}
            <span className="flex-1">
              <span className="block text-sm font-semibold text-text">{opt.label}</span>
              {opt.description && <span className="mt-0.5 block text-xs text-text-muted">{opt.description}</span>}
            </span>
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected ? "border-primary bg-primary text-white" : "border-border text-transparent"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
