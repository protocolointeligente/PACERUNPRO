"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-20 flex h-screen flex-col gap-3.5 overflow-y-auto border-r p-3.5 transition-transform duration-200 ${
        collapsed ? "w-[78px]" : "w-[292px]"
      } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      style={{
        borderColor: "var(--line)",
        background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.012)), #05070b",
      }}
    >
      <div className="flex items-center gap-3 border-b pb-4 pt-1.5" style={{ borderColor: "var(--line)" }}>
        <Logo className="h-12 w-12 flex-none" />
        {!collapsed && (
          <div className="min-w-0">
            <b className="block text-[20px] leading-[0.95] tracking-tight">
              Futebol
              <br />
              Coach
            </b>
            <small
              className="mt-1.5 block text-[10px] font-black uppercase tracking-[.11em]"
              style={{ color: "var(--muted)" }}
            >
              treino • tática • base
            </small>
          </div>
        )}
      </div>

      <nav className="grid gap-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={`nav-link ${active ? "active" : ""}`}>
              <span className="ico">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto border-t pt-3 text-[11px] leading-[1.42]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          Elaborado por Ricardo Pace
          <br />
          Profissional de Educação Física
          <br />
          Treinador Licença B ATFA CONMEBOL
        </div>
      )}
    </aside>
  );
}
