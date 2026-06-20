"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Copy, Link2, Users, TrendingUp, AlertTriangle, UserPlus } from "lucide-react";
import { useCoachRole } from "@/context/coach-role-context";
import { canAccess } from "@/lib/coach-permissions";
import { AccessRestricted } from "@/components/shared/access-restricted";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coachRosterStats, athleteRosterList, paymentHistory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function GestaoContent() {
  const [inviteEnabled, setInviteEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const inviteUrl = "https://pacerunpro.com.br/convite/ricardo-pace";

  function handleCopy() {
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const slotPct = (coachRosterStats.usedSlots / coachRosterStats.totalSlots) * 100;

  const revenueByAthlete = [...athleteRosterList]
    .filter((a) => a.billingStatus === "em dia")
    .sort((a, b) => b.monthlyFee - a.monthlyFee);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="primary">Gestão &amp; Vendas</Badge>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Gestão financeira do roster
          </h1>
        </div>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="convite">Link de convite</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Roster ─────────────────────────────────────────────── */}
        <TabsContent value="roster">
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Slots usados"
                value={`${coachRosterStats.usedSlots}/${coachRosterStats.totalSlots}`}
                color="text-info"
                bgColor="bg-info/15"
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="MRR da base"
                value={`R$ ${coachRosterStats.mrr.toLocaleString("pt-BR")}`}
                color="text-success"
                bgColor="bg-success/15"
              />
              <StatCard
                icon={<UserPlus className="h-4 w-4" />}
                label="Novos 30d"
                value={`+${coachRosterStats.newAthletes30d}`}
                color="text-primary"
                bgColor="bg-primary/15"
              />
              <StatCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Inadimplentes"
                value={String(coachRosterStats.pendingInvoices)}
                color="text-danger"
                bgColor="bg-danger/15"
              />
            </div>

            {/* Slot progress */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    Capacidade do plano <span className="font-semibold text-text">{coachRosterStats.planName}</span>
                  </span>
                  <span className="font-display font-bold text-text">
                    {coachRosterStats.usedSlots} / {coachRosterStats.totalSlots} atletas
                  </span>
                </div>
                <Progress value={slotPct} />
                <p className="text-xs text-text-muted">
                  {coachRosterStats.totalSlots - coachRosterStats.usedSlots} slots disponíveis
                </p>
              </CardContent>
            </Card>

            {/* Athlete list */}
            <div className="space-y-2">
              {athleteRosterList.map((athlete) => (
                <Card key={athlete.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    {/* Name + plan */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-display text-sm font-semibold text-text">
                        {athlete.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">{athlete.plan}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          athlete.status === "ativo"
                            ? "success"
                            : athlete.status === "risco"
                            ? "danger"
                            : "default"
                        }
                      >
                        {athlete.status}
                      </Badge>
                      <Badge
                        variant={athlete.billingStatus === "em dia" ? "success" : "danger"}
                      >
                        {athlete.billingStatus}
                      </Badge>
                    </div>

                    {/* Billing info — always visible */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text">
                        R$ {athlete.monthlyFee}/mês
                      </p>
                      <p className="hidden text-xs text-text-muted sm:block">
                        Próx. {athlete.nextBilling}
                      </p>
                    </div>

                    {/* Joined — desktop only */}
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-text-muted">Desde {athlete.joinedAt}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          window.location.href = `/treinador/alunos/${athlete.id}`;
                        }}
                      >
                        Ver
                      </Button>
                      {athlete.billingStatus === "inadimplente" && (
                        <Button size="sm" variant="danger">
                          Cobrar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Financeiro ──────────────────────────────────────────── */}
        <TabsContent value="financeiro">
          <div className="space-y-4">
            {/* MRR card */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  Receita Recorrente Mensal (MRR)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-text">
                  R$ {coachRosterStats.mrr.toLocaleString("pt-BR")}
                  <span className="ml-1 text-base font-normal text-text-muted">/mês</span>
                </p>
                <p className="mt-1 text-sm text-success">
                  +{Math.round(coachRosterStats.mrrGrowth * 100)}% vs mês anterior
                </p>
              </CardContent>
            </Card>

            {/* Revenue breakdown */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-display text-sm font-semibold text-text">
                  Receita por atleta
                </h3>
                <div className="space-y-2">
                  {revenueByAthlete.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card-hover/30 px-3 py-2.5"
                    >
                      <span className="text-sm text-text">{athlete.name}</span>
                      <span className="font-display text-sm font-semibold text-success">
                        R$ {athlete.monthlyFee}/mês
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment history */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-display text-sm font-semibold text-text">
                  Histórico de pagamentos da plataforma
                </h3>
                <div className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card-hover/30 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-text">{payment.description}</p>
                        <p className="text-xs text-text-muted">
                          {payment.period} · {payment.date}
                        </p>
                      </div>
                      <span className="font-display text-sm font-semibold text-text">
                        R$ {payment.amount.toLocaleString("pt-BR")}
                      </span>
                      <Badge variant={payment.status === "pago" ? "success" : "warning"}>
                        {payment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Nota fiscal
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  Os repasses são processados automaticamente via Pagar.me · Próximo repasse: 15 jun 2026
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 3: Link de convite ─────────────────────────────────────── */}
        <TabsContent value="convite">
          <div className="space-y-4">
            {/* Explanation card */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-text">
                      Link de convite personalizado
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Compartilhe o link abaixo para que novos atletas se cadastrem diretamente
                      vinculados à sua conta.
                    </p>
                  </div>
                </div>

                {/* URL input + copy */}
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-card-hover px-3 py-2 text-sm text-text-muted focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-card-hover/30 px-4 py-3">
                  <span className="text-sm text-text">Aceitar novos cadastros via link</span>
                  <button
                    type="button"
                    onClick={() => setInviteEnabled((v) => !v)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      inviteEnabled ? "bg-primary" : "bg-card-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        inviteEnabled ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-text">1</p>
                  <p className="text-xs text-text-muted">atleta cadastrou-se via link</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-success">100%</p>
                  <p className="text-xs text-text-muted">taxa de conversão</p>
                </CardContent>
              </Card>
            </div>

            {/* QR Code */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <h3 className="font-display text-sm font-semibold text-text">QR Code do link de convite</h3>
                <div className="rounded-xl border border-border bg-white p-3">
                  <QRCode value={inviteUrl} size={160} />
                </div>
                <p className="text-center text-xs text-text-muted">
                  Imprima ou compartilhe para novos atletas se cadastrarem diretamente na sua conta
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const svg = document.querySelector("#invite-qr svg") as SVGElement | null;
                    if (!svg) return;
                    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "qrcode-convite.svg";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3.5 w-3.5" /> Baixar SVG
                </Button>
                <div id="invite-qr" className="sr-only" aria-hidden>
                  <QRCode value={inviteUrl} size={400} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", bgColor, color)}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
          <p className="font-display text-base font-bold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GestaoPage() {
  const { role } = useCoachRole();
  if (!canAccess(role, "gestao")) {
    return <AccessRestricted feature="Gestão & Vendas" currentRole={role} requiredRoles={["autonomo", "owner"]} />;
  }
  return <GestaoContent />;
}
