"use client";

import Link from "next/link";
import { Plus, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MessageNotifier } from "@/components/messages/message-notifier";
import { CoachRoleProvider, useCoachRole } from "@/context/coach-role-context";
import { getCoachNav, getCoachNavGroups, ROLE_LABELS, ROLE_DESCRIPTIONS, type CoachRole } from "@/lib/coach-permissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLES: CoachRole[] = ["owner", "hired"];

function RoleSwitcher() {
  const { role, setRole } = useCoachRole();
  return (
    <div className="rounded-xl border border-border/60 bg-card-hover/40 p-2.5">
      <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">
        Simular perfil
      </p>
      <div className="space-y-1">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
              role === r
                ? "bg-primary/15 text-primary"
                : "text-text-muted hover:bg-card-hover hover:text-text"
            )}
          >
            <span
              className={cn(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full border",
                role === r ? "border-primary bg-primary" : "border-border bg-transparent"
              )}
            />
            <div className="min-w-0">
              <p className={cn("text-xs font-semibold leading-none", role === r ? "text-primary" : "text-text")}>
                {ROLE_LABELS[r]}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-text-muted">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface TreinadorLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userCredential: string;
  userAvatarUrl?: string;
  planId?: string;
}

function TreinadorLayoutInner({ children, userName, userCredential, userAvatarUrl, planId }: TreinadorLayoutClientProps) {
  const { role } = useCoachRole();
  const { main } = getCoachNav(role, planId ?? "b2b-free");
  const navGroups = getCoachNavGroups(role, planId ?? "b2b-free");

  return (
    <AppShell
      nav={main}
      navGroups={navGroups}
      topNav={[{ href: "/treinador/dashboard", label: "Dashboard", icon: LayoutDashboard }]}
      logoHref="/treinador/dashboard"
      roleLabel={ROLE_LABELS[role]}
      userName={userName}
      userSubtitle={userCredential || "Treinador"}
      avatarUrl={userAvatarUrl}
      notificationRole="COACH"
      sidebarFooterSlot={process.env.NODE_ENV !== "production" ? <RoleSwitcher /> : undefined}
      headerActions={
        <Link href="/treinador/prescricao/corrida">
          <Button size="sm" className="hidden gap-1.5 sm:inline-flex">
            <Plus className="h-3.5 w-3.5" />
            Prescrever
          </Button>
        </Link>
      }
    >
      {children}
      <BottomNav items={main.slice(0, 5)} showMore />
      <MessageNotifier role="COACH" />
    </AppShell>
  );
}

export default function TreinadorLayoutClient({ children, userName, userCredential, userAvatarUrl, planId }: TreinadorLayoutClientProps) {
  return (
    <CoachRoleProvider initialRole="owner" initialPlanId={planId ?? "b2b-free"}>
      <TreinadorLayoutInner userName={userName} userCredential={userCredential} userAvatarUrl={userAvatarUrl} planId={planId}>
        {children}
      </TreinadorLayoutInner>
    </CoachRoleProvider>
  );
}
