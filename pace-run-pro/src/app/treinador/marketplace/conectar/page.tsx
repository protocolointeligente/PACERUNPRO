"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  AlertTriangle,
  Banknote,
} from "lucide-react";

interface PagBankStatus {
  connected: boolean;
  pagbankAccountId?: string;
  authorizationStatus?: string;
  authorizedAt?: string;
}

export default function ConectarPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<PagBankStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "authorization_denied"
      ? "Autorização cancelada. Tente novamente."
      : errorParam === "token_exchange_failed"
      ? "Erro ao processar autorização. Tente novamente."
      : null
  );

  useEffect(() => {
    fetch("/api/coach/pagbank/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PagBankStatus | null) => { if (d) setStatus(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [success]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/pagbank/authorize");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao iniciar autorização"); return; }
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setConnecting(false);
    }
  }

  const isConnected = status?.connected === true;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/30">
          <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Conectar pagamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autorize o PACE RUN PRO a criar cobranças em seu nome via PagBank
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Conta PagBank conectada com sucesso!
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="border rounded-2xl overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between ${isConnected ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/50"}`}>
          <div className="flex items-center gap-3">
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {loading ? "Verificando…" : isConnected ? "Conta conectada" : "Conta não conectada"}
              </p>
              {isConnected && status?.pagbankAccountId && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {status.pagbankAccountId}
                </p>
              )}
            </div>
          </div>
          {isConnected && (
            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full px-2.5 py-1 font-medium">
              Ativo
            </span>
          )}
        </div>

        <div className="px-5 py-4 space-y-3 divide-y divide-border/50">
          <CheckItem done={isConnected} label="Conta PagBank autorizada" description="Permite criar cobranças PIX em seu nome" />
          <CheckItem done={isConnected} label="Repasses habilitados" description="90% do valor de cada venda enviado diretamente para sua conta PagBank" className="pt-3" />
          <CheckItem done={isConnected} label="Produtos disponíveis para venda" description="Seus produtos aprovados ficam visíveis após a conexão" className="pt-3" />
        </div>
      </div>

      {!isConnected && !loading && (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 px-4 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {connecting ? "Redirecionando para PagBank…" : "Autorizar conta PagBank"}
        </button>
      )}
      {isConnected && (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reconectar / atualizar autorização
        </button>
      )}

      <div className="border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Shield className="w-4 h-4 text-primary" />
          Modelo de repasse — PACE RUN PRO Marketplace
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Taxa da plataforma" value="10% por venda" />
          <InfoRow label="Repasse ao treinador" value="90% por venda" />
          <InfoRow label="Ciclo de repasses" value="Quinzenal" />
          <InfoRow label="Método" value="PIX split automático" />
        </div>
        <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
          O split é feito diretamente para sua conta PagBank no momento do pagamento — você recebe 90% automaticamente, sem solicitação manual.
        </p>
      </div>

      <div className="rounded-2xl bg-muted/50 px-5 py-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm mb-2">Pré-requisitos</p>
        <p>• Conta PagBank ativa (Sandbox para testes, Produção após homologação)</p>
        <p>• CPF ou CNPJ cadastrado no PagBank</p>
        <p>• Produtos com status <strong>Aprovado</strong> (revisados por um administrador)</p>
      </div>
    </div>
  );
}

function CheckItem({ done, label, description, className = "" }: { done: boolean; label: string; description: string; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {done ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
      ) : (
        <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
