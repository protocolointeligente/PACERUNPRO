"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { athleteNav, athleteMoreNav } from "@/components/layout/nav-config";
import { currentAthlete } from "@/lib/mock-data";

export default function AtletaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      nav={athleteNav}
      moreNav={athleteMoreNav}
      roleLabel="Atleta"
      userName={currentAthlete.name}
      userSubtitle={currentAthlete.goal}
      avatarUrl={currentAthlete.avatarUrl}
    >
      {children}
      <BottomNav items={athleteNav} />
    </AppShell>
  );
}
