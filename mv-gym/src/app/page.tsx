"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";

export default function SplashPage() {
  const router = useRouter();
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const usuario = useAppStore((s) => s.usuario);
  const onboardingCompleto = useAppStore((s) => s.onboardingCompleto);

  useEffect(() => {
    if (!hasHydrated || !usuario) return;

    if (usuario.role === "aluno" && !onboardingCompleto) {
      router.replace("/onboarding/objetivo");
    } else {
      router.replace(`/${usuario.role}/dashboard`);
    }
  }, [hasHydrated, usuario, onboardingCompleto, router]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16 safe-top safe-bottom">
        <Logo size={48} showTagline />

        <div className="mt-12 flex-1">
          <div className="animate-float">
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              Treinos inteligentes.
              <br />
              <span className="gradient-text">Resultados reais.</span>
            </h1>
          </div>

          <p className="mt-4 text-text-muted">
            Treinos gerados por IA, evolução completa e acompanhamento premium para
            musculação, emagrecimento e hipertrofia.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Coach</p>
                <p className="text-xs text-text-muted">Treino e nutrição adaptados a você</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Banco de exercícios</p>
                <p className="text-xs text-text-muted">Execução, erros comuns e progressão</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Evolução completa</p>
                <p className="text-xs text-text-muted">Medidas, fotos, gráficos e conquistas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/cadastro">
            <Button className="w-full" size="lg">
              Criar conta
            </Button>
          </Link>
          <Link href="/login">
            <Button className="w-full" size="lg" variant="secondary">
              Entrar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
