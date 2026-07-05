"use client";

import { useEffect, useState, use } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, UserCheck, Loader2, AlertCircle, CheckCircle2, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/logo";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

interface CoachInfo {
  coachId: string;
  coachSlug: string | null;
  coachName: string | null;
  coachAvatar: string | null;
  coachCity: string | null;
  coachBio: string | null;
  coachSpecialties: string[];
}

type Step = "loading" | "invalid" | "expired" | "coach-info" | "register" | "login" | "linking" | "plans" | "done";

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<Step>("loading");
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [error, setError] = useState("");

  // Registration form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  async function validateToken() {
    const res = await fetch(`/api/invites/${token}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 410) setStep(data.error?.includes("expirado") ? "expired" : "expired");
      else setStep("invalid");
      return;
    }
    const data = await res.json();
    setCoach(data);
    setStep("coach-info");
  }

  // On mount, validate the token
  useEffect(() => {
    validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // If authenticated, auto-redeem the invite
  useEffect(() => {
    if (status === "loading" || step === "loading" || step === "invalid" || step === "expired" || step === "done") return;
    if (session?.user?.role === "ATHLETE") {
      redeemInvite();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, step]);

  async function redeemInvite() {
    setStep("linking");
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    if (res.ok) {
      // Redirect athlete to the marketplace to choose and pay for the coach's plan
      const coachParam = coach?.coachSlug ? `&coach=${coach.coachSlug}` : "";
      router.replace(`/atleta/loja?welcome=1${coachParam}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao vincular");
      setStep("coach-info");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "ATHLETE", tosAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro no cadastro"); setSubmitting(false); return; }

      // Sign in after registration
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("Cadastro ok, mas falha ao entrar. Tente fazer login."); setSubmitting(false); return; }
      // useEffect will trigger redeemInvite once session is set
    } catch {
      setError("Erro de rede. Tente novamente.");
      setSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await signIn("credentials", { email: loginEmail, password: loginPw, redirect: false });
    if (result?.error) { setError("E-mail ou senha incorretos."); setSubmitting(false); return; }
    // useEffect will trigger redeemInvite once session is set
  }

  if (step === "loading") return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (step === "invalid") return (
    <StatusScreen icon={<AlertCircle className="h-12 w-12 text-red-400" />} title="Convite inválido" body="Este link de convite não existe. Peça ao seu treinador um novo link." />
  );

  if (step === "expired") return (
    <StatusScreen icon={<AlertCircle className="h-12 w-12 text-yellow-400" />} title="Convite expirado" body="Este link expirou. Peça ao seu treinador um novo link de convite." />
  );

  if (step === "linking") return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-text-muted text-sm">Vinculando você ao seu treinador…</p>
    </div>
  );

  if (step === "plans") return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-primary" />
      <div>
        <h1 className="text-xl font-bold text-text">Você está na assessoria de {coach?.coachName ?? "seu treinador"}!</h1>
        <p className="mt-2 max-w-sm text-sm text-text-muted">Próximo passo: escolha um plano de treinamento e finalize o pagamento para liberar acesso ao conteúdo.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a
          href="/atleta/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30"
        >
          <ShoppingBag className="h-4 w-4" />
          Ver planos disponíveis
        </a>
        <a href="/atleta/dashboard" className="text-sm text-text-muted hover:text-text">
          Ir para o painel primeiro →
        </a>
      </div>
    </div>
  );

  if (step === "done") return (
    <StatusScreen icon={<CheckCircle2 className="h-12 w-12 text-primary" />} title="Tudo certo!" body="Você foi vinculado ao seu treinador. Redirecionando para o seu painel…" />
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/"><Logo size={32} /></Link>
        </div>
      </nav>

      <main className="mx-auto max-w-md px-6 py-12">
        {/* Coach card */}
        {coach && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-center">
            {coach.coachAvatar ? (
              <Image src={coach.coachAvatar} alt={coach.coachName ?? "Treinador"} width={72} height={72} className="mx-auto mb-3 rounded-full object-cover" />
            ) : (
              <div className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {(coach.coachName ?? "T")[0].toUpperCase()}
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Convite de</p>
            <h1 className="mt-1 text-xl font-extrabold text-text">{coach.coachName ?? "Seu Treinador"}</h1>
            {coach.coachCity && <p className="text-sm text-text-muted">{coach.coachCity}</p>}
            {coach.coachBio && <p className="mt-2 text-sm text-text-muted/80 line-clamp-3">{coach.coachBio}</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {coach.coachSpecialties.slice(0, 4).map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s}</span>
              ))}
            </div>
          </div>
        )}

        {step === "coach-info" && (
          <div className="space-y-3">
            <h2 className="text-center text-lg font-bold text-text">Como você quer entrar?</h2>
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400 text-center">{error}</p>}
            <button onClick={() => setStep("register")} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90">
              Criar minha conta
            </button>
            <button onClick={() => setStep("login")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-text hover:bg-card-hover transition-colors">
              <UserCheck className="h-4 w-4" />
              Já tenho conta — entrar
            </button>
          </div>
        )}

        {step === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-center text-lg font-bold text-text">Criar minha conta</h2>
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Seu nome</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">E-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Senha</span>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta e entrar →"}
            </button>
            <button type="button" onClick={() => setStep("coach-info")} className="w-full text-center text-sm text-text-muted hover:text-text">← Voltar</button>
          </form>
        )}

        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-center text-lg font-bold text-text">Entrar na minha conta</h2>
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</p>}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">E-mail</span>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Senha</span>
              <div className="relative">
                <input type={showLoginPw ? "text" : "password"} value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="Sua senha" required className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowLoginPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar →"}
            </button>
            <button type="button" onClick={() => setStep("coach-info")} className="w-full text-center text-sm text-text-muted hover:text-text">← Voltar</button>
          </form>
        )}
      </main>
    </div>
  );
}

function StatusScreen({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {icon}
      <h1 className="text-xl font-bold text-text">{title}</h1>
      <p className="max-w-sm text-sm text-text-muted">{body}</p>
      <Link href="/" className="mt-4 text-sm font-semibold text-primary hover:text-primary/80">← Página inicial</Link>
    </div>
  );
}
