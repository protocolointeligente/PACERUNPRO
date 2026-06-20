"use client";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { adminNav } from "@/components/layout/nav-config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      nav={adminNav}
      roleLabel="Super Admin"
      userName="Ricardo Pace Júnior"
      userSubtitle="CREF 014626-G/MG"
    >
      {children}
      <BottomNav items={adminNav} />
    </AppShell>
  );
}
