"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, Mail, ShoppingBag, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

interface PendingCoach {
  id: string; name: string; email: string; createdAt: string; plan: string; status: string;
}
interface PastDueSub {
  id: string; userName: string; userEmail: string; plan: string; renewsAt: string | null;
}
interface StaleMktOrder {
  id: string; athleteName: string; athleteEmail: string; totalCents: number; productTitle: string; createdAt: string;
}
interface FailedPayment {
  id: string; userName: string; userEmail: string; amountCents: number; method: string | null; createdAt: string;
}

interface PendenciasData {
  pendingCoaches: PendingCoach[];
  pastDueSubs: PastDueSub[];
  staleMktOrders: StaleMktOrder[];
  failedPayments: FailedPayment[];
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PendenciasPage() {
  const [data, setData] = useState<PendenciasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pendencias");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = (id: string) => setResolvedIds((prev) => new Set([...prev, id]));

  const total = data
    ? data.pendingCoaches.filter((c) => !resolvedIds.has(c.id)).length +
      data.pastDueSubs.filter((s) => !resolvedIds.has(s.id)).length +
      data.staleMktOrders.filter((o) => !resolvedIds.has(o.id)).length +
      data.failedPayments.filter((p) => !resolvedIds.has(p.id)).length
    : 0;

  if (loading) return <div className="p-8 text-center text-text-muted">Carregando…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant={total > 0 ? "warning" : "success"} className="mb-2">
          <Clock className="h-3 w-3" /> Pendências operacionais
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Pendências</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Itens que exigem atenção: ativações de treinador, cobranças com falha, pedidos parados e pagamentos não confirmados.
        </p>
      </motion.div>

      {total === 0 ? (
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show">
          <Card><CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success mb-3" />
            <p className="font-display text-base font-bold text-text">Sem pendências</p>
            <p className="mt-1 text-sm text-text-muted">Nenhum item requer atenção manual no momento.</p>
          </CardContent></Card>
        </motion.div>
      ) : (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="space-y-6">

          {/* Pending coaches */}
          {(data?.pendingCoaches.filter((c) => !resolvedIds.has(c.id)).length ?? 0) > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Treinadores aguardando</p>
              <div className="space-y-3">
                {data!.pendingCoaches.filter((c) => !resolvedIds.has(c.id)).map((c) => (
                  <Card key={c.id} className="border-border/60">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">{c.name}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>
                        <p className="text-xs text-text-muted">Cadastrado em {fmtDate(c.createdAt)} · Plano {c.plan}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/assessorias`}>
                          <Button variant="primary" size="sm">Gerenciar</Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-success hover:text-success gap-1" onClick={() => resolve(c.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> OK
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Past-due subscriptions */}
          {(data?.pastDueSubs.filter((s) => !resolvedIds.has(s.id)).length ?? 0) > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Assinaturas com falha</p>
              <div className="space-y-3">
                {data!.pastDueSubs.filter((s) => !resolvedIds.has(s.id)).map((s) => (
                  <Card key={s.id} className={cn("border-border/60")}>
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                        <AlertTriangle className="h-4 w-4 text-danger" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">{s.userName}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="h-3 w-3" />{s.userEmail}</p>
                        <p className="text-xs text-text-muted">
                          Plano {s.plan} · Renova em {s.renewsAt ? fmtDate(s.renewsAt) : "—"}
                        </p>
                      </div>
                      <Badge variant="danger">Falha</Badge>
                      <Button variant="ghost" size="sm" className="text-success hover:text-success gap-1" onClick={() => resolve(s.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolvido
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Stale marketplace orders */}
          {(data?.staleMktOrders.filter((o) => !resolvedIds.has(o.id)).length ?? 0) > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Pedidos parados (+24h)</p>
              <div className="space-y-3">
                {data!.staleMktOrders.filter((o) => !resolvedIds.has(o.id)).map((o) => (
                  <Card key={o.id} className="border-border/60">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                        <ShoppingBag className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">{o.athleteName} — {o.productTitle}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="h-3 w-3" />{o.athleteEmail}</p>
                        <p className="text-xs text-text-muted">{formatBRL(o.totalCents)} · Criado {fmtDate(o.createdAt)}</p>
                      </div>
                      <Badge variant="warning">Pendente</Badge>
                      <Button variant="ghost" size="sm" className="text-success hover:text-success gap-1" onClick={() => resolve(o.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolvido
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Failed payments */}
          {(data?.failedPayments.filter((p) => !resolvedIds.has(p.id)).length ?? 0) > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Pagamentos recusados (7 dias)</p>
              <div className="space-y-3">
                {data!.failedPayments.filter((p) => !resolvedIds.has(p.id)).map((p) => (
                  <Card key={p.id} className="border-border/60">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                        <AlertTriangle className="h-4 w-4 text-danger" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">{p.userName}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="h-3 w-3" />{p.userEmail}</p>
                        <p className="text-xs text-text-muted">
                          {formatBRL(p.amountCents)} · {p.method ?? "—"} · {fmtDate(p.createdAt)}
                        </p>
                      </div>
                      <Badge variant="danger">Recusado</Badge>
                      <Button variant="ghost" size="sm" className="text-success hover:text-success gap-1" onClick={() => resolve(p.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolvido
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      )}
    </div>
  );
}
