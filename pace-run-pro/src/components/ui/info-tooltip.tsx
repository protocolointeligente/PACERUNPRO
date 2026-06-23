"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        aria-label="Mais informações"
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-text-muted/70 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-card p-2.5 text-left text-xs font-normal normal-case leading-relaxed text-text-muted shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
