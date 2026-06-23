"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const COACH_PLANS = [
  { id: "b2b-free",        label: "Grátis (1 atleta)"       },
  { id: "b2b-starter",     label: "Starter (até 20 atletas)" },
  { id: "b2b-pro",         label: "Pro (até 80 atletas)"     },
  { id: "b2b-assessoria",  label: "Assessoria (até 200)"     },
  { id: "b2b-unlimited",   label: "Unlimited (ilimitado)"    },
];

type Mode = "coach" | "athlete";

interface CreatedUser {
  name: string;
  email: string;
  password: string;
  role: string;
  recommendedPlanId?: string | null;
}

function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary/50 focus:outline-none pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CoachForm({ onSuccess }: { onSuccess: (u: CreatedUser) => void }) {
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [plan, setPlan]               = useState("b2b-starter");
  const [studentCount, setStudentCount] = useState("10");
  const [freePartner, setFreePartner] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "COACH",
          studentCount: Number(studentCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conta.");
        return;
      }
      onSuccess({
        name,
        email,
        password,
        role: "COACH",
        recommendedPlanId: data.recommendedPlanId,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField label="Nome completo" id="coach-name" value={name} onChange={setName} placeholder="João Silva" required />
      <InputField label="E-mail" id="coach-email" type="email" value={email} onChange={setEmail} placeholder="joao@assessoria.com" required />
      <InputField label="Senha inicial" id="coach-password" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" required />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
          Plano <span className="ml-0.5 text-danger">*</span>
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          {COACH_PLANS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <InputField
        label="Qtd. estimada de atletas"
        id="coach-students"
        type="number"
        value={studentCount}
        onChange={setStudentCount}
        placeholder="10"
      />

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <span className="relative flex h-5 w-5 shrink-0">
          <input
            type="checkbox"
            checked={freePartner}
            onChange={(e) => setFreePartner(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-5 w-5 rounded border border-border bg-card transition-colors peer-checked:border-primary peer-checked:bg-primary/20" />
          {freePartner && (
            <CheckCircle2 className="absolute inset-0 h-5 w-5 text-primary" />
          )}
        </span>
        <span className="text-sm text-text">Parceiro gratuito (isento de cobrança)</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Criando conta…" : "Criar treinador / assessoria"}
      </Button>
    </form>
  );
}

function AthleteForm({ onSuccess }: { onSuccess: (u: CreatedUser) => void }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "ATHLETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conta.");
        return;
      }
      onSuccess({ name, email, password, role: "ATHLETE" });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField label="Nome completo" id="athlete-name" value={name} onChange={setName} placeholder="Maria Souza" required />
      <InputField label="E-mail" id="athlete-email" type="email" value={email} onChange={setEmail} placeholder="maria@email.com" required />
      <InputField label="Senha inicial" id="athlete-password" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" required />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Criando conta…" : "Criar atleta"}
      </Button>
    </form>
  );
}

function SuccessCard({ user, onReset }: { user: CreatedUser; onReset: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = `Nome: ${user.name}\nE-mail: ${user.email}\nSenha: ${user.password}\nPapel: ${user.role === "COACH" ? "Treinador" : "Atleta"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm font-semibold text-success">Conta criada com sucesso!</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Credenciais de acesso</p>
          <div className="space-y-2 rounded-xl border border-border bg-card-hover/40 p-3 font-mono text-sm text-text">
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Nome:</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">E-mail:</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Senha:</span>
              <span className="font-semibold">{user.password}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Papel:</span>
              <Badge variant={user.role === "COACH" ? "primary" : "info"}>
                {user.role === "COACH" ? "Treinador" : "Atleta"}
              </Badge>
            </div>
            {user.recommendedPlanId && (
              <div className="flex justify-between gap-2">
                <span className="text-text-muted">Plano sugerido:</span>
                <span className="font-semibold">{user.recommendedPlanId}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={copy} className="flex-1">
              {copied ? "Copiado!" : "Copiar credenciais"}
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
              Criar outro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsuariosPage() {
  const [mode, setMode] = useState<Mode>("coach");
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  function handleSuccess(user: CreatedUser) {
    setCreatedUser(user);
  }

  function handleReset() {
    setCreatedUser(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">Usuários</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Adicionar usuário
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Crie manualmente contas de treinadores, assessorias ou atletas.
        </p>
      </motion.div>

      {/* Mode toggle */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5">
          <button
            onClick={() => { setMode("coach"); setCreatedUser(null); }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "coach"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-text-muted hover:text-text"
            }`}
          >
            Treinador / Assessoria
          </button>
          <button
            onClick={() => { setMode("athlete"); setCreatedUser(null); }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "athlete"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-text-muted hover:text-text"
            }`}
          >
            Atleta
          </button>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {mode === "coach" ? "Novo treinador / assessoria" : "Novo atleta"}
                </CardTitle>
                <CardDescription>
                  {mode === "coach"
                    ? "Cria uma conta com papel COACH e acesso à área do treinador."
                    : "Cria uma conta com papel ATHLETE e acesso à área do atleta."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {createdUser ? (
              <SuccessCard user={createdUser} onReset={handleReset} />
            ) : mode === "coach" ? (
              <CoachForm onSuccess={handleSuccess} />
            ) : (
              <AthleteForm onSuccess={handleSuccess} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
