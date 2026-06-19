"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Mail, MapPin, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { pendingApprovals } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter", pro: "Pro", assessoria: "Assessoria", "white-label": "White Label",
  "b2b-starter": "Starter", "b2b-pro": "Pro", "b2b-premium": "Assessoria", "b2b-unlimited": "White Label",
};
const PLAN_VARIANT = (p: string) => {
  if (p.includes("white") || p.includes("unlimited")) return "danger" as const;
  if (p.includes("assessoria") || p.includes("premium")) return "warning" as const;
  if (p.includes("pro")) return "primary" as const;
  return "outline" as const;
};

type ApprovalState = "pending" | "approved" | "refused";

export default function AprovacoesPage() {
  const [states, setStates] = useState<Record<string, ApprovalState>>(
    Object.fromEntries(pendingApprovals.map((a) => [a.id, "pending"]))
  );
  const [approving, setApproving] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setApproving(id);
    try {
      await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessoriaId: id, action: "approve" }),
      });
    } catch { /* continua mesmo com erro */ }
    setStates((s) => ({ ...s, [id]: "approved" }));
    setApproving(null);
  }

  async function handleRefuse(id: string) {
    setStates((s) => ({ ...s, [id]: "refused" }));
  }

  const pending = pendingApprovals.filter((a) => states[a.id] === "pending");
  const approved = pendingApprovals.filter((a) => states[a.id] === "approved");
  const refused = pendingApprovals.filter((a) => states[a.id] === "refused");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="warning" className="mb-2">
          <Clock className="h-3 w-3" /> Aprovações
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Assessorias aguardando aprovação</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Ao aprovar, a assessoria recebe acesso ao sistema e um e-mail de boas-vindas é enviado automaticamente.
        </p>
      </motion.div>

      {/* Pendentes */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
        {pending.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success mb-2" />
              <p className="text-sm font-semibold text-text">Nenhuma aprovação pendente</p>
              <p className="text-xs text-text-muted mt-1">Todas as solicitações foram processadas.</p>
            </CardContent>
          </Card>
        ) : (
          pending.map((a) => (
            <Card key={a.id} className="border-warning/20">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback>{a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display text-base font-bold text-text">{a.name}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.city}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.contact}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={PLAN_VARIANT(a.plan)}>{PLAN_LABEL[a.plan] ?? a.plan}</Badge>
                </div>

                <div className="mt-4 rounded-xl bg-card-hover p-3 text-xs text-text-muted">
                  <p className="font-semibold text-text mb-1">Ao aprovar, o sistema irá:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Ativar o acesso da assessoria ao painel</li>
                    <li>Iniciar trial de 14 dias no plano {PLAN_LABEL[a.plan] ?? a.plan}</li>
                    <li>Enviar e-mail de boas-vindas com credenciais</li>
                    <li>Registrar log administrativo com data e responsável</li>
                  </ul>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="success"
                    onClick={() => handleApprove(a.id)}
                    disabled={approving === a.id}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {approving === a.id ? "Aprovando..." : "Aprovar assessoria"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-danger hover:text-danger gap-1.5"
                    onClick={() => handleRefuse(a.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* Aprovadas */}
      {approved.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Aprovadas nesta sessão</p>
          <div className="space-y-2">
            {approved.map((a) => (
              <Card key={a.id} className="border-success/20 opacity-70">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm text-text">{a.name}</span>
                  <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Aprovado</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recusadas */}
      {refused.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Recusadas nesta sessão</p>
          <div className="space-y-2">
            {refused.map((a) => (
              <Card key={a.id} className="opacity-50">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm text-text-muted">{a.name}</span>
                  <Badge variant="danger">Recusado</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
