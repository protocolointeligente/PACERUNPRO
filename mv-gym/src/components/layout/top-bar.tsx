"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, showBack, onBack, right, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header className={cn("sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-4 backdrop-blur safe-top", className)}>
      {showBack && (
        <button
          onClick={() => (onBack ? onBack() : router.back())}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text hover:bg-card"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {title && <h1 className="truncate font-display text-lg font-bold text-text">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
