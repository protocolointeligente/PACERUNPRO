"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "md:pl-[78px]" : "md:pl-[292px]"}`}>
        <Topbar onMenuClick={() => setCollapsed((value) => !value)} />
        <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 md:pb-16">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
