"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleMenuClick() {
    if (typeof window !== "undefined" && window.innerWidth <= 720) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "md:pl-[78px]" : "md:pl-[292px]"}`}>
        <Topbar onMenuClick={handleMenuClick} />
        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
