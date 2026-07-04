"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, DollarSign, Loader2, Share2, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AffiliateData {
  id: string;
  code: string;
  commissionPct: number;
  totalSales: number;
  isActive: boolean;
  totalEarnings: number;
  pendingEarnings: number;
  recentReferrals: { earningCents: number; status: string; createdAt: string }[];
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors";

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AtletaAfiliadosPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");

  const load = () => {
    fetch("/api/atleta/affiliates")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { affiliate: AffiliateData | null } | null) => {
        if (d) setAffiliate(d.affiliate);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/atleta/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao criar"); setCreating(false); return; }
    setCode("");
    load();
    setCreating(false);
  }

  function copyLink() {
    if (!affiliate) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://pacerunpro.com.br";
    navigator.clipboard.writeText(`${origin}/marketplace?ref=${affiliate.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Afiliados</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Programa de afiliados</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Indique produtos do marketplace e ganhe 10% de comissão em cada venda realizada pelo seu link.
        </p>
      </div>

      {!affiliate ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-text">Quero ser afiliado!</h2>
            <p className="text-sm text-text-muted">
              Crie seu código exclusivo. Compartilhe o link e ganhe comissão automática em cada venda.
            </p>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="MEUCODIGO"
                maxLength={20}
                className={inputCls + " font-mono"}
              />
              <Button onClick={handleCreate} disabled={creating || code.length < 3} className="gap-2 shrink-0">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Ativar
              </Button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Vendas indicadas", value: String(affiliate.totalSales), icon: Users, color: "text-primary" },
              { label: "Ganhos totais", value: fmtCurrency(affiliate.totalEarnings), icon: TrendingUp, color: "text-success" },
              { label: "A receber", value: fmtCurrency(affiliate.pendingEarnings), icon: DollarSign, color: "text-warning" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3 w-3 text-text-muted" />
                    <p className="text-[11px] text-text-muted">{label}</p>
                  </div>
                  <p className={`font-display text-lg font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Link card */}
          <Card className="border-primary/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-text">Seu link</h2>
                <Badge variant={affiliate.isActive ? "success" : "outline"}>
                  {affiliate.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex gap-2 items-center rounded-xl border border-border bg-card-hover/40 px-4 py-3">
                <code className="flex-1 text-xs text-text-muted truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://pacerunpro.com.br"}/marketplace?ref={affiliate.code}
                </code>
                <Button size="sm" variant="secondary" onClick={copyLink} className="gap-1.5 shrink-0">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-text-muted">
                Código: <span className="font-mono font-bold text-text">{affiliate.code}</span>
                {" · "}Comissão: <span className="font-bold text-success">{(affiliate.commissionPct * 100).toFixed(0)}%</span>
              </p>
            </CardContent>
          </Card>

          {affiliate.recentReferrals.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-display text-base font-semibold text-text">Últimas indicações</h2>
                <div className="space-y-2">
                  {affiliate.recentReferrals.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                      <div>
                        <p className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                        <p className="text-[11px] text-text-muted/70">{r.status === "PENDING" ? "Aguardando confirmação" : "Confirmada"}</p>
                      </div>
                      <span className="font-semibold text-sm text-success">{fmtCurrency(r.earningCents)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-text">Como funciona</h2>
          <div className="space-y-3">
            {[
              "Compartilhe seu link nas redes sociais, grupos de corrida ou por WhatsApp.",
              "Quando alguém comprar um produto no marketplace usando seu link, você ganha 10% automático.",
              "Os ganhos são repassados mensalmente via PIX no dia 10 do mês seguinte.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                <p className="text-sm text-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
