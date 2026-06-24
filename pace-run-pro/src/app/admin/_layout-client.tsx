"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { adminNav } from "@/components/layout/nav-config";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  avatarUrl?: string;
}

export default function AdminLayoutClient({ children, userName, avatarUrl }: AdminLayoutClientProps) {
  return (
    <AppShell
      nav={adminNav}
      roleLabel="Super Admin"
      userName={userName}
      userSubtitle="Super Admin"
      avatarUrl={avatarUrl}
    >
      {children}
      <BottomNav items={adminNav} />
    </AppShell>
  );
}
