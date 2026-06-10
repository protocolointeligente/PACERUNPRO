"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import type { UserRole } from "@/lib/types";
import { Logo } from "@/components/ui/logo";

interface AuthGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const usuario = useAppStore((s) => s.usuario);
  const onboardingCompleto = useAppStore((s) => s.onboardingCompleto);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!usuario) {
      router.replace("/login");
      return;
    }

    if (usuario.role === "aluno" && !onboardingCompleto) {
      router.replace("/onboarding/objetivo");
      return;
    }

    if (!allowedRoles.includes(usuario.role)) {
      router.replace(`/${usuario.role}/dashboard`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, usuario, onboardingCompleto]);

  if (!hasHydrated || !usuario || !allowedRoles.includes(usuario.role)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <Logo size={56} showTagline />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse-soft gradient-primary" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
