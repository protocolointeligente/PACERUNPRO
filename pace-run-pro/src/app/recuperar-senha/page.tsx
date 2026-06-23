"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível processar sua solicitação. Tente novamente.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Não foi possível processar sua solicitação. Tente novamente.");
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
                Recuperar senha
              </h1>
              <p className="mt-2 text-sm text-text-muted">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {sent ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3.5 text-sm text-primary">
                Se este e-mail estiver cadastrado, você receberá em breve uma mensagem com
                instruções para criar uma nova senha.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
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
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-text-muted">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
