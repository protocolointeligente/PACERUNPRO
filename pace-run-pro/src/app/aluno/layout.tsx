"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { athleteNav, athleteMoreNav } from "@/components/layout/nav-config";
import { currentAthlete } from "@/lib/mock-data";

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      nav={athleteNav}
      moreNav={athleteMoreNav}
      roleLabel="Aluno"
      userName={currentAthlete.name}
      userSubtitle={currentAthlete.goal}
      avatarUrl={currentAthlete.avatarUrl}
      switchHref="/treinador/dashboard"
      switchLabel="Acessar área do treinador"
    >
      {children}
      <BottomNav items={athleteNav} />
    </AppShell>
  );
}
