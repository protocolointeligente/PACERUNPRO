"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/useAppStore";
import type { UserRole } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const usuario = useAppStore((s) => s.usuario);
  const onboardingCompleto = useAppStore((s) => s.onboardingCompleto);
  const carregarDemo = useAppStore((s) => s.carregarDemo);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleEntrar() {
    if (usuario) {
      if (usuario.role === "aluno" && !onboardingCompleto) {
        router.push("/onboarding/objetivo");
      } else {
        router.push(`/${usuario.role}/dashboard`);
      }
      return;
    }

    carregarDemo("aluno");
    router.push("/aluno/dashboard");
  }

  function handleDemo(role: UserRole) {
    carregarDemo(role);
    router.push(`/${role}/dashboard`);
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16 safe-top safe-bottom">
        <Logo size={48} showTagline />

        <div className="mt-12">
          <h1 className="font-display text-2xl font-extrabold leading-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-text-muted">
            Entre para continuar sua jornada de performance.
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleEntrar();
          }}
        >
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Button type="submit" size="lg" className="mt-2 w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-text-muted">Modo demonstração</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="mt-3 text-center text-xs text-text-muted">
          Explore o app sem precisar criar uma conta. Escolha um perfil de demonstração
          abaixo.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Button variant="secondary" size="lg" className="w-full" onClick={() => handleDemo("aluno")}>
            Entrar como Aluno
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => handleDemo("personal")}>
            Entrar como Personal Trainer
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => handleDemo("admin")}>
            Entrar como Administrador
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-primary">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
