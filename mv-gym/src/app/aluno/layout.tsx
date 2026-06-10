"use client";

import { AuthGuard } from "@/components/layout/auth-guard";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ALUNO_NAV } from "@/components/layout/nav-items";

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["aluno"]}>
      <div className="mx-auto min-h-dvh max-w-md pb-24">{children}</div>
      <BottomNav items={ALUNO_NAV} />
    </AuthGuard>
  );
}
