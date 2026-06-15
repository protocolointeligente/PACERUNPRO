"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link inválido. Solicite uma nova recuperação de senha.");
      return;
    }
    if (senha.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir sua senha. Tente novamente.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Não foi possível redefinir sua senha. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-wide text-text">
              PACE RUN <span className="gradient-text">PRO</span>
            </span>
          </Link>
        </div>
      </nav>

      <main className="flex min-h-[calc(100dvh-65px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-extrabold text-text">
                Criar nova senha
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Escolha uma nova senha para sua conta.
              </p>
            </div>

            {success ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3.5 text-sm text-primary">
                Senha redefinida com sucesso! Redirecionando para o login...
              </div>
            ) : !token ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                Link inválido ou incompleto. Solicite uma nova recuperação de senha.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Nova senha
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Confirmar nova senha
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </label>

                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="mt-2 w-full"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4" />
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-text-muted">
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Voltar para o login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
