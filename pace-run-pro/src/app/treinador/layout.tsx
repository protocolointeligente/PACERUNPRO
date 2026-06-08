"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { coachNav } from "@/components/layout/nav-config";
import { coachOverview } from "@/lib/mock-data";

export default function TreinadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      nav={coachNav}
      roleLabel="Treinador"
      userName={coachOverview.name}
      userSubtitle={coachOverview.credential}
      switchHref="/aluno/dashboard"
      switchLabel="Acessar área do aluno"
    >
      {children}
      <BottomNav items={coachNav.slice(0, 5)} />
    </AppShell>
  );
}
