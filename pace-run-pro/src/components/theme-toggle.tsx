"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "system" | "light" | "dark";

const modes: Array<{ mode: ThemeMode; label: string; icon: typeof Laptop }> = [
  { mode: "system", label: "Sistema", icon: Laptop },
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Escuro", icon: Moon },
];

function systemPrefersLight() {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false;
}

function applyTheme(mode: ThemeMode) {
  const light = mode === "light" || (mode === "system" && systemPrefersLight());
  document.documentElement.classList.toggle("light", light);
  document.documentElement.classList.toggle("dark", !light);
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setMode(initial);
    applyTheme(initial);
    setMounted(true);

    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const onChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") applyTheme("system");
    };
    media?.addEventListener?.("change", onChange);
    return () => media?.removeEventListener?.("change", onChange);
  }, []);

  function select(next: ThemeMode) {
    setMode(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-20 right-3 z-40 flex rounded-full border border-border bg-card/85 p-1 shadow-lg shadow-black/20 backdrop-blur-xl lg:bottom-4 lg:right-4"
      aria-label="Selecionar tema"
      role="group"
    >
      {modes.map((item) => {
        const Icon = item.icon;
        const selected = mode === item.mode;
        return (
          <button
            key={item.mode}
            type="button"
            onClick={() => select(item.mode)}
            aria-label={`Tema ${item.label}`}
            title={`Tema ${item.label}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors",
              selected ? "bg-primary text-[#0A0C0F]" : "hover:bg-card-hover hover:text-text"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
