"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

// ── Shared input style ────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

// ── Inner content (reads searchParams) ───────────────────────────────────
function roleDestination(role?: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "COACH") return "/treinador/dashboard";
  return "/atleta/dashboard";
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect already-authenticated users by role
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as { role?: string }).role;
      router.replace(roleDestination(role));
    }
  }, [status, session, router]);

  // Validate callbackUrl to prevent open-redirect attacks
  const raw = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Fetch updated session to read the role and redirect accordingly
    const newSession = await getSession();
    const role = (newSession?.user as { role?: string })?.role;
    window.location.assign(callbackUrl || roleDestination(role));
  }

  function handleGoogle() {
    // /auth/redirect checks role server-side and bounces to the right dashboard
    signIn("google", { callbackUrl: callbackUrl || "/auth/redirect" });
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="animate-spin border-2 border-primary/30 border-t-primary rounded-full h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-16 px-6 pb-16">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <Logo size={40} />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-text">
            Entrar na sua conta
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Bem-vindo de volta! Continue sua jornada.
          </p>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-text hover:border-primary/40 hover:bg-card-hover transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar com Google
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <hr className="flex-1 border-border" />
          <span className="text-xs text-text-muted">ou</span>
          <hr className="flex-1 border-border" />
        </div>

        {/* Credentials form */}
        <form onSubmit={handleCredentials} className="space-y-4">
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
              Senha
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          {/* Error message */}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4" />
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Forgot password */}
        <p className="mt-4 text-center text-sm text-text-muted">
          Esqueceu a senha?{" "}
          <Link
            href="/recuperar-senha"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Recuperar
          </Link>
        </p>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Sign up link */}
        <p className="text-center text-sm text-text-muted">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Criar conta gratuita →
          </Link>
        </p>

        {/* Legal small print */}
        <p className="mt-6 text-center text-xs text-text-muted/60">
          Ao entrar, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-text-muted transition-colors">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-text-muted transition-colors">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size={32} />
          </Link>
        </div>
      </nav>

      <main>
        <Suspense fallback={null}>
          <LoginContent />
        </Suspense>
      </main>
    </>
  );
}
