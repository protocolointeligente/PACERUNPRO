"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, accent, setTheme, setAccent } = useTheme();

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between gap-3.5 border-b bg-bg/80 px-4 py-3 backdrop-blur-xl sm:px-6"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Menu"
          className="hidden h-11 w-11 flex-none place-items-center rounded-[15px] border md:grid"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block h-[2px] w-[18px] rounded-full bg-current" />
            <span className="block h-[2px] w-[18px] rounded-full bg-current" />
            <span className="block h-[2px] w-[18px] rounded-full bg-current" />
          </span>
        </button>
        <div className="min-w-0">
          <b className="block tracking-tight">Futebol Coach</b>
          <small className="hidden font-bold sm:block" style={{ color: "var(--muted)" }}>
            Banco de exercícios, aulas e mesociclos
          </small>
        </div>
      </div>
      <div className="hidden flex-wrap justify-end gap-2 md:flex">
        <button className={`pill ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
          Escuro
        </button>
        <button className={`pill ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
          Claro
        </button>
        <button className={`pill ${accent === "blue" ? "active" : ""}`} onClick={() => setAccent("blue")}>
          Azul
        </button>
        <button className={`pill ${accent === "orange" ? "active" : ""}`} onClick={() => setAccent("orange")}>
          Laranja
        </button>
      </div>
    </div>
  );
}
