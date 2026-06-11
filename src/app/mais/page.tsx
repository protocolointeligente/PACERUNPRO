"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { NAV_ITEMS } from "@/components/layout/nav";

export default function MaisPage() {
  const { theme, accent, setTheme, setAccent } = useTheme();

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 text-[19px] font-bold tracking-tight">Mais</h2>

      <div className="mb-4">
        <p className="field-label">Aparência</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`pill ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            Escuro
          </button>
          <button type="button" className={`pill ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            Claro
          </button>
          <button type="button" className={`pill ${accent === "blue" ? "active" : ""}`} onClick={() => setAccent("blue")}>
            Azul
          </button>
          <button type="button" className={`pill ${accent === "orange" ? "active" : ""}`} onClick={() => setAccent("orange")}>
            Laranja
          </button>
        </div>
      </div>

      <p className="field-label">Navegação</p>
      <div className="grid gap-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="nav-link">
            <span className="ico">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
