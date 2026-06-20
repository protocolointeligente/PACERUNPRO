"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { coachOverview } from "@/lib/mock-data";
import { CoachRoleProvider, useCoachRole } from "@/context/coach-role-context";
import { getCoachNav, ROLE_LABELS, ROLE_DESCRIPTIONS, type CoachRole } from "@/lib/coach-permissions";
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

function TreinadorLayoutInner({ children }: { children: React.ReactNode }) {
  const { role } = useCoachRole();
  const { main, more } = getCoachNav(role, coachOverview.currentPlanId);

  return (
    <AppShell
      nav={main}
      moreNav={more}
      roleLabel={ROLE_LABELS[role]}
      userName={coachOverview.name}
      userSubtitle={coachOverview.credential}
sidebarFooterSlot={process.env.NODE_ENV !== "production" ? <RoleSwitcher /> : undefined}
    >
      {children}
      <BottomNav items={main.slice(0, 5)} />
    </AppShell>
  );
}

export default function TreinadorLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <CoachRoleProvider initialRole="owner">
      <TreinadorLayoutInner>{children}</TreinadorLayoutInner>
    </CoachRoleProvider>
  );
}
