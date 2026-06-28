"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { ArrowLeft, Check, Copy, DollarSign, Link2, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConvidarAtletaClientProps {
  coachUserId: string;
}

interface CoachPlan {
  id: string;
  name: string;
  priceCents: number;
  period: string;
}

const PERIOD_LABEL: Record<string, string> = {
  MENSAL: "/mês",
  TRIMESTRAL: "/trim.",
  SEMESTRAL: "/sem.",
  ANUAL: "/ano",
};

export default function ConvidarAtletaClient({ coachUserId: _coachUserId }: ConvidarAtletaClientProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState<CoachPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState<{ tempPassword?: string; existing?: boolean } | null>(null);

  const inviteUrl = inviteToken ? `${baseUrl}/convite/${inviteToken}` : null;

  async function generateInvite() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/coach/invites", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setInviteToken(data.token);
      }
    } catch {
      // silent
    } finally {
      setGeneratingToken(false);
    }
  }

  useEffect(() => {
    // Load most recent active invite first, generate one if none
    fetch("/api/coach/invites")
      .then((r) => r.ok ? r.json() : { invites: [] })
      .then((data: { invites: { token: string }[] }) => {
        if (data.invites.length > 0) {
          setInviteToken(data.invites[0].token);
        } else {
          generateInvite();
        }
      })
      .catch(() => generateInvite());

    fetch("/api/coach/plans")
      .then((r) => r.ok ? r.json() : [])
      .then((data: CoachPlan[]) => {
        setPlans(data);
        if (data.length > 0) setPlanId(data[0].id);
      })
      .catch(() => null)
      .finally(() => setLoadingPlans(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    setManualError("");
    setManualSuccess(null);
    setManualLoading(true);

    try {
      const res = await fetch("/api/coach/athletes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, planId: planId || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setManualError(data.error ?? "Erro ao adicionar atleta.");
        setManualLoading(false);
        return;
      }

      setManualSuccess({ tempPassword: data.tempPassword, existing: data.existing });
      setName("");
      setEmail("");
    } catch {
      setManualError("Erro ao conectar ao servidor. Tente novamente.");
    } finally {
      setManualLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/treinador/atletas"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para atletas
        </Link>
        <Badge variant="primary" className="mb-2 block w-fit">
          <Link2 className="mr-1 inline h-3 w-3" />
          Compartilhar link de convite
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Convidar atleta</h1>
        <p className="mt-1 text-sm text-text-muted">
          Adicione atletas compartilhando um link seguro ou inserindo os dados manualmente.
        </p>
      </div>

      {/* Invite link + QR code */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Link de convite seguro</p>
              <p className="text-xs text-text-muted">O atleta cria conta → é vinculado a você automaticamente</p>
            </div>
          </div>

          {generatingToken || !inviteUrl ? (
            <div className="flex items-center gap-2 py-4 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando link seguro…
            </div>
          ) : (
            <>
              {/* QR code */}
              <div className="flex justify-center rounded-xl border border-border bg-white p-4">
                <QRCode value={inviteUrl} size={180} />
              </div>

              {/* Copy link row */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
                <span className="flex-1 truncate text-xs font-mono text-text-muted">{inviteUrl}</span>
                <button
                  onClick={handleCopy}
                  className="ml-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-card-hover"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {/* Regenerate */}
              <button
                onClick={generateInvite}
                disabled={generatingToken}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Gerar novo link (invalida o anterior)
              </button>
            </>
          )}

          <div className="rounded-xl border border-border/50 bg-card-hover/30 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-text">Como funciona</p>
            <p className="text-xs text-text-muted">
              O atleta acessa o link, cria conta ou faz login, e fica vinculado a você automaticamente. O link expira em 30 dias.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual add section */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card-hover text-text-muted">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Ou adicione manualmente</p>
              <p className="text-xs text-text-muted">Crie uma conta para o atleta com uma senha temporária</p>
            </div>
          </div>

          {manualSuccess ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-green-400">
                {manualSuccess.existing ? "Atleta vinculado com sucesso!" : "Atleta adicionado com sucesso!"}
              </p>
              {!manualSuccess.existing && manualSuccess.tempPassword && (
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">Senha temporária gerada:</p>
                  <code className="block rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-text">
                    {manualSuccess.tempPassword}
                  </code>
                  <p className="text-xs text-text-muted">Compartilhe esta senha com o atleta para o primeiro acesso.</p>
                </div>
              )}
              {selectedPlan && (
                <p className="text-xs text-success">
                  Plano atribuído: <strong>{selectedPlan.name}</strong> — R${(selectedPlan.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{PERIOD_LABEL[selectedPlan.period] ?? "/mês"}
                </p>
              )}
              <button
                onClick={() => setManualSuccess(null)}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Adicionar outro atleta
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nome completo
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: João Silva"
                  required
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="atleta@email.com"
                  required
                  className={inputClass}
                />
              </label>

              {/* Plan selection */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <DollarSign className="h-3 w-3" /> Plano de cobrança
                </span>
                {loadingPlans ? (
                  <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando planos…
                  </div>
                ) : plans.length === 0 ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3">
                    <p className="text-xs font-semibold text-warning">Sem planos de cobrança criados</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      O atleta será adicionado sem plano. Configure seus planos de venda para cobrar automaticamente.
                    </p>
                    <a href="/treinador/planos-venda" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
                      Criar planos de venda →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sem plano (gratuito / definir depois)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — R${(p.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{PERIOD_LABEL[p.period] ?? "/mês"}
                        </option>
                      ))}
                    </select>
                    {selectedPlan && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                        <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-xs text-primary">
                          O atleta será registrado no plano <strong>{selectedPlan.name}</strong>. Você precisará cobrar manualmente ou via link de pagamento.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {manualError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                  {manualError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={manualLoading}
                className="w-full"
              >
                {manualLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Adicionar atleta"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
