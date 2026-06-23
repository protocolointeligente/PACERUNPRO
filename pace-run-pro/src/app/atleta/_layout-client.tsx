"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { athleteNav, athleteMoreNav } from "@/components/layout/nav-config";

export default function AtletaLayoutClient({
  userName,
  userSubtitle,
  avatarUrl,
  children,
}: {
  userName: string;
  userSubtitle: string;
  avatarUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      nav={athleteNav}
      moreNav={athleteMoreNav}
      roleLabel="Atleta"
      userName={userName}
      userSubtitle={userSubtitle}
      avatarUrl={avatarUrl}
    >
      {children}
      <BottomNav items={athleteNav} />
    </AppShell>
  );
}
