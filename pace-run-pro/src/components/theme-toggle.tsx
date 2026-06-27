"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** inline = renders as a regular button (no fixed positioning) */
  inline?: boolean;
  className?: string;
}

export function ThemeToggle({ inline = false, className }: ThemeToggleProps) {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("theme", next ? "light" : "dark"); } catch { /**/ }
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      title={isLight ? "Modo escuro" : "Modo claro"}
      className={cn(
        "flex items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text",
        inline
          ? "h-8 w-8"
          : "fixed top-4 right-4 z-[100] h-9 w-9 rounded-full border border-border bg-card/80 shadow-md backdrop-blur-sm",
        className
      )}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
