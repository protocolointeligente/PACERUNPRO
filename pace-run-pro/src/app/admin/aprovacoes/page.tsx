"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Mail,
  MapPin,
  Shield,
  ShieldOff,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter", pro: "Pro", assessoria: "Assessoria", "white-label": "White Label",
  "b2b-starter": "Starter", "b2b-pro": "Pro", "b2b-assessoria": "Assessoria", "b2b-unlimited": "White Label",
  "b2b-free": "Grátis", free: "Grátis",
};

const STATUS_VARIANT = (s: string) =>
  s === "ativo" ? "success" : s === "suspenso" ? "danger" : "warning";

interface CoachItem {
  id: string;
  name: string;
  city: string;
  plan: string;
  contact: string;
  status: string;
  athleteCount?: number;
}

type ConfirmAction =
  | { type: "delete"; item: CoachItem }
  | { type: "block"; item: CoachItem }
  | null;

export default function AprovacoesPage() {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  useEffect(() => {
    fetch("/api/admin/coaches")
      .then((r) => r.ok ? r.json() : [])
      .then((data: CoachItem[]) => setCoaches(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(item: CoachItem) {
    setActing(item.id);
    setError(null);
    setConfirm(null);
    try {
      const res = await fetch(`/api/admin/coaches/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Erro ao excluir.");
        return;
      }
      setCoaches((prev) => prev.filter((c) => c.id !== item.id));
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setActing(null);
    }
  }

  async function handleBlock(item: CoachItem) {
    const isBlocked = item.status === "suspenso";
    setActing(item.id);
    setError(null);
    setConfirm(null);
    try {
      const res = await fetch(`/api/admin/coaches/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isBlocked ? "unblock" : "block" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Erro ao alterar status.");
        return;
      }
      setCoaches((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, status: isBlocked ? "ativo" : "suspenso" }
            : c
        )
      );
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setActing(null);
    }
  }

  const active = coaches.filter((c) => c.status === "ativo");
  const blocked = coaches.filter((c) => c.status === "suspenso");
  const other = coaches.filter((c) => c.status !== "ativo" && c.status !== "suspenso");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-2">
          <Users className="h-3 w-3" /> Gestão de treinadores
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Treinadores & Assessorias</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Planos gratuitos e pagos são ativados automaticamente. Use esta tela para bloquear ou excluir contas.
        </p>
      </motion.div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </span>
              <div>
                <p className="font-semibold text-text">
                  {confirm.type === "delete" ? "Excluir treinador?" : "Bloquear treinador?"}
                </p>
                <p className="text-xs text-text-muted">{confirm.item.name}</p>
              </div>
            </div>
            <p className="text-sm text-text-muted">
              {confirm.type === "delete"
                ? "Todos os dados do treinador e atletas vinculados serão excluídos permanentemente. Esta ação não pode ser desfeita."
                : "O treinador perderá acesso imediatamente. Você poderá desbloquear depois."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={acting === confirm.item.id}
                onClick={() =>
                  confirm.type === "delete"
                    ? handleDelete(confirm.item)
                    : handleBlock(confirm.item)
                }
              >
                {acting === confirm.item.id ? "Processando..." : confirm.type === "delete" ? "Excluir" : "Bloquear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : coaches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success mb-2" />
            <p className="text-sm font-semibold text-text">Nenhum treinador cadastrado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active coaches */}
          {active.length > 0 && (
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Ativos ({active.length})
              </p>
              {active.map((a) => (
                <CoachRow
                  key={a.id}
                  item={a}
                  acting={acting}
                  onBlock={() => setConfirm({ type: "block", item: a })}
                  onDelete={() => setConfirm({ type: "delete", item: a })}
                />
              ))}
            </motion.div>
          )}

          {/* Other status (pending, etc.) */}
          {other.length > 0 && (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Pendentes ({other.length})
              </p>
              {other.map((a) => (
                <CoachRow
                  key={a.id}
                  item={a}
                  acting={acting}
                  onBlock={() => setConfirm({ type: "block", item: a })}
                  onDelete={() => setConfirm({ type: "delete", item: a })}
                />
              ))}
            </motion.div>
          )}

          {/* Blocked coaches */}
          {blocked.length > 0 && (
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Bloqueados ({blocked.length})
              </p>
              {blocked.map((a) => (
                <CoachRow
                  key={a.id}
                  item={a}
                  acting={acting}
                  onBlock={() => handleBlock(a)}
                  onDelete={() => setConfirm({ type: "delete", item: a })}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function CoachRow({
  item,
  acting,
  onBlock,
  onDelete,
}: {
  item: CoachItem;
  acting: string | null;
  onBlock: () => void;
  onDelete: () => void;
}) {
  const isBlocked = item.status === "suspenso";
  return (
    <Card className={isBlocked ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback>
                {item.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text truncate">{item.name}</p>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-0.5">
                {item.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>
                )}
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.contact}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">
              {PLAN_LABEL[item.plan] ?? item.plan}
            </Badge>
            <Badge variant={STATUS_VARIANT(item.status)} className="text-[10px]">
              {item.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className={isBlocked ? "text-success hover:text-success gap-1" : "text-warning hover:text-warning gap-1"}
              onClick={onBlock}
              disabled={acting === item.id}
              title={isBlocked ? "Desbloquear acesso" : "Bloquear acesso"}
            >
              {isBlocked
                ? <><Shield className="h-3.5 w-3.5" />Desbloquear</>
                : <><ShieldOff className="h-3.5 w-3.5" />Bloquear</>
              }
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger gap-1"
              onClick={onDelete}
              disabled={acting === item.id}
              title="Excluir permanentemente"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
