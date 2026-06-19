"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Mail, ShieldAlert, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pendencias, pendingApprovals, type PendenciaItem, type PendenciaType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const TYPE_CONFIG: Record<PendenciaType, { label: string; variant: "warning" | "danger" | "info" | "primary"; icon: React.ElementType }> = {
  "white-label-setup": { label: "White Label",   variant: "primary", icon: Zap          },
  "cobranca-falha":    { label: "Falha",          variant: "danger",  icon: AlertTriangle },
  "pix-expirado":      { label: "PIX pendente",   variant: "warning", icon: Clock        },
  "fraude":            { label: "Suspeita",        variant: "danger",  icon: ShieldAlert  },
};

function PendenciaCard({ item, onResolve }: { item: PendenciaItem; onResolve: (id: string) => void }) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              cfg.variant === "danger"  && "bg-danger/10",
              cfg.variant === "warning" && "bg-warning/10",
              cfg.variant === "primary" && "bg-primary/10",
              cfg.variant === "info"    && "bg-info/10",
            )}>
              <Icon className={cn(
                "h-4 w-4",
                cfg.variant === "danger"  && "text-danger",
                cfg.variant === "warning" && "text-warning",
                cfg.variant === "primary" && "text-primary",
                cfg.variant === "info"    && "text-info",
              )} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-sm font-bold text-text">{item.title}</p>
                <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs font-medium text-primary">{item.assessoria}</p>
              <p className="mt-1 max-w-lg text-xs text-text-muted">{item.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.contact}</span>
                {item.value && <span className="font-medium text-text">R$ {item.value}/mês</span>}
                <span>{item.createdAt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.type === "white-label-setup" && (
            <>
              <Button variant="primary" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Iniciar setup
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Contatar cliente
              </Button>
            </>
          )}
          {item.type === "cobranca-falha" && (
            <>
              <Button variant="primary" size="sm" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Tentar novamente
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Notificar cliente
              </Button>
            </>
          )}
          {item.type === "pix-expirado" && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Enviar lembrete
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-success hover:text-success gap-1.5"
            onClick={() => onResolve(item.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Marcar resolvido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WhiteLabelCard({ item, onResolve }: { item: typeof pendingApprovals[number]; onResolve: (id: string) => void }) {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-bold text-text">{item.name}</p>
              <Badge variant="primary" className="text-[10px]">White Label</Badge>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">{item.city} · {item.contact}</p>
            <p className="mt-1 text-xs text-text-muted">Plano pago — aguardando onboarding e setup de domínio dedicado.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Iniciar onboarding
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Contatar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-success hover:text-success gap-1.5"
            onClick={() => onResolve(item.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Concluir setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PendenciasPage() {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const resolve = (id: string) => setResolvedIds((prev) => new Set([...prev, id]));

  const activePendencias = pendencias.filter((p) => !resolvedIds.has(p.id));
  const activeWL = pendingApprovals.filter((a) => !resolvedIds.has(a.id));
  const total = activePendencias.length + activeWL.length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant={total > 0 ? "warning" : "success"} className="mb-2">
          <Clock className="h-3 w-3" /> Pendências operacionais
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Pendências</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Itens que exigem ação manual: setups White Label, cobranças com falha e PIX aguardando.
          Planos Starter, Pro e Assessoria são ativados automaticamente após confirmação de pagamento.
        </p>
      </motion.div>

      {total === 0 ? (
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show">
          <Card>
            <CardContent className="p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success mb-3" />
              <p className="font-display text-base font-bold text-text">Sem pendências</p>
              <p className="mt-1 text-sm text-text-muted">Nenhum item requer atenção manual no momento.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
          {/* White Label setup requests */}
          {activeWL.map((a) => (
            <WhiteLabelCard key={a.id} item={a} onResolve={resolve} />
          ))}

          {/* Operational issues */}
          {activePendencias.map((p) => (
            <PendenciaCard key={p.id} item={p} onResolve={resolve} />
          ))}
        </motion.div>
      )}

      {resolvedIds.size > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Resolvidos nesta sessão</p>
          <div className="space-y-1.5">
            {[...resolvedIds].map((id) => {
              const name = pendencias.find((p) => p.id === id)?.assessoria
                ?? pendingApprovals.find((a) => a.id === id)?.name
                ?? id;
              return (
                <Card key={id} className="opacity-50">
                  <CardContent className="flex items-center justify-between p-3">
                    <span className="text-sm text-text-muted">{name}</span>
                    <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Resolvido</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
