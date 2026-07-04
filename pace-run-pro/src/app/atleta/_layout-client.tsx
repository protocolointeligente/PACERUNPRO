"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MessageNotifier } from "@/components/messages/message-notifier";
import { LgpdConsentModal } from "@/components/shared/lgpd-consent-modal";
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
  const [roleLabel, setRoleLabel] = useState("Atleta");

  // Apply coach white-label branding (primary color + assessoria name) if available
  useEffect(() => {
    fetch("/api/atleta/coach-branding")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { primaryColor?: string; assessoriaName?: string | null } | null) => {
        if (!d) return;
        if (d.assessoriaName) setRoleLabel(d.assessoriaName);
        if (!d.primaryColor) return;
        document.documentElement.style.setProperty("--color-primary", d.primaryColor);
        const hex = d.primaryColor.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        document.documentElement.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);
      })
      .catch(() => null);
  }, []);

  return (
    <AppShell
      nav={athleteNav}
      moreNav={athleteMoreNav}
      roleLabel={roleLabel}
      userName={userName}
      userSubtitle={userSubtitle}
      avatarUrl={avatarUrl}
    >
      {children}
      <BottomNav items={athleteNav} showMore />
      <MessageNotifier role="ATHLETE" />
      <LgpdConsentModal />
    </AppShell>
  );
}
