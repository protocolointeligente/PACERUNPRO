"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
}

export default function ConectarPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isSuccess = params?.get("success") === "1";
  const isRefresh = params?.get("refresh") === "1";

  useEffect(() => {
    fetch("/api/coach/stripe-connect/status")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStatus(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/stripe-connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao conectar"); return; }
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isFullyConnected = status?.connected && status?.payoutsEnabled;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-2">Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Conectar pagamentos</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Configure sua conta Stripe para receber pagamentos diretamente quando atletas compram seus produtos.
        </p>
      </div>

      {/* Return banners */}
      {isSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Conta Stripe conectada com sucesso! Você já pode receber pagamentos.
        </div>
      )}
      {isRefresh && (
        <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Sessão expirada. Por favor, reinicie o processo de conexão.
        </div>
      )}

      {/* Status card */}
      <Card className={cn("border-2", isFullyConnected ? "border-success/30 bg-success/5" : "border-border")}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", isFullyConnected ? "bg-success/20" : "bg-primary/10")}>
              <CreditCard className={cn("h-6 w-6", isFullyConnected ? "text-success" : "text-primary")} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display text-base font-semibold text-text">Stripe Connect</p>
                <Badge variant={isFullyConnected ? "success" : status?.connected ? "warning" : "outline"}>
                  {isFullyConnected ? "Ativo" : status?.connected ? "Pendente verificação" : "Não conectado"}
                </Badge>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  {status?.connected
                    ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : <div className="h-4 w-4 rounded-full border-2 border-text-muted/30" />}
                  <span className={status?.connected ? "text-text" : "text-text-muted"}>Conta criada e verificada</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {status?.payoutsEnabled
                    ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : <div className="h-4 w-4 rounded-full border-2 border-text-muted/30" />}
                  <span className={status?.payoutsEnabled ? "text-text" : "text-text-muted"}>Repasses habilitados</span>
                </div>
              </div>
              {status?.accountId && (
                <p className="mt-2 text-[11px] font-mono text-text-muted/60">{status.accountId}</p>
              )}
            </div>
          </div>

          {!isFullyConnected && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleConnect} disabled={connecting} className="gap-2 sm:w-auto">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {status?.connected ? "Continuar configuração" : "Conectar com Stripe"}
              </Button>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-text">Como funciona</h2>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, title: "Pagamento seguro", desc: "O atleta paga via Stripe. Os dados do cartão nunca passam pelos nossos servidores." },
              { icon: Zap, title: "Repasse automático", desc: "Após o pagamento, 85% do valor é transferido para sua conta Stripe automaticamente." },
              { icon: CreditCard, title: "Saque quando quiser", desc: "Com Stripe Connect, você controla quando transferir o saldo para sua conta bancária." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/40 bg-card-hover/30 px-4 py-3 text-xs text-text-muted">
        Sem Stripe Connect ativo, os pagamentos são coletados pela PACE e repassados manualmente via PIX no dia 10 do mês seguinte.
      </div>
    </div>
  );
}
