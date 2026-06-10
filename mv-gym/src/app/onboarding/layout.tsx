"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

const STEPS = ["/onboarding/objetivo", "/onboarding/avaliacao", "/onboarding/preferencias"];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const usuario = useAppStore((s) => s.usuario);

  useEffect(() => {
    if (hasHydrated && !usuario) {
      router.replace("/login");
    }
  }, [hasHydrated, usuario, router]);

  if (!hasHydrated || !usuario) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <Logo size={56} showTagline />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse-soft gradient-primary" />
        </div>
      </div>
    );
  }

  const currentStep = Math.max(0, STEPS.indexOf(pathname));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="sticky top-0 z-30 bg-background px-6 pt-6 safe-top">
        <div className="flex gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= currentStep ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <p className="mt-2 pb-4 text-xs font-medium text-text-muted">
          Passo {currentStep + 1} de {STEPS.length}
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-10">{children}</div>
    </div>
  );
}
