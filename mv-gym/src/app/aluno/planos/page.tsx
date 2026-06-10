"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TopBar } from "@/components/layout/top-bar";
import { useAppStore } from "@/lib/store/useAppStore";
import { PLANOS_ASSINATURA, METODOS_PAGAMENTO } from "@/lib/data/plans";
import type { MetodoPagamento, PlanoAssinaturaId } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PlanosPage() {
  const planoAssinatura = useAppStore((s) => s.planoAssinatura);
  const setPlanoAssinatura = useAppStore((s) => s.setPlanoAssinatura);

  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAssinaturaId | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const planoAtual = PLANOS_ASSINATURA.find((p) => p.id === planoAssinatura);
  const planoEmEdicao = PLANOS_ASSINATURA.find((p) => p.id === planoSelecionado);

  function abrirDialog(id: PlanoAssinaturaId) {
    setPlanoSelecionado(id);
    setMetodo(null);
  }

  function fecharDialog(open: boolean) {
    if (!open) {
      setPlanoSelecionado(null);
      setMetodo(null);
    }
  }

  function handleConfirmar() {
    if (!planoSelecionado || !metodo || !planoEmEdicao) return;

    setPlanoAssinatura(planoSelecionado);
    setPlanoSelecionado(null);
    setMetodo(null);

    setToast(
      `Assinatura atualizada para ${planoEmEdicao.nome}! (ambiente de demonstração — nenhuma cobrança real foi feita)`,
    );

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <TopBar title="Planos & Assinatura" showBack />

      {toast && (
        <Card className="border-success/40 bg-success/10 text-sm text-success">
          <div className="flex items-start justify-between gap-3">
            <p>{toast}</p>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 text-xs font-semibold text-success underline-offset-2 hover:underline"
            >
              Fechar
            </button>
          </div>
        </Card>
      )}

      <p className="text-sm text-text-muted">Escolha o plano ideal para sua jornada no MV GYM.</p>

      <div className="flex flex-col gap-4">
        {PLANOS_ASSINATURA.map((plano) => {
          const isAtual = plano.id === planoAssinatura;
          const precoAtual = planoAtual?.precoMensal ?? 0;
          const isUpgrade = plano.precoMensal > precoAtual;

          return (
            <Card
              key={plano.id}
              className={cn("relative flex flex-col gap-4", plano.destaque && "border-primary")}
            >
              {plano.destaque && (
                <Badge variant="default" className="absolute -top-3 right-4">
                  Mais popular
                </Badge>
              )}

              <div>
                <p className="font-display text-lg font-bold text-text">{plano.nome}</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-text">
                  {plano.precoMensal === 0
                    ? "Grátis"
                    : `${plano.precoMensal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}/mês`}
                </p>
              </div>

              <ul className="flex flex-col gap-2">
                {plano.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-2 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{recurso}</span>
                  </li>
                ))}
              </ul>

              {isAtual ? (
                <Badge variant="success" className="w-fit">
                  Plano atual
                </Badge>
              ) : (
                <Button
                  variant={plano.destaque ? "primary" : "secondary"}
                  className="w-full"
                  onClick={() => abrirDialog(plano.id)}
                >
                  {isUpgrade ? "Fazer upgrade" : "Mudar para este plano"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={planoSelecionado !== null} onOpenChange={fecharDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar assinatura — {planoEmEdicao?.nome ?? ""}</DialogTitle>
          </DialogHeader>

          <p className="mb-3 text-sm text-text-muted">Escolha a forma de pagamento:</p>

          <div className="flex flex-col gap-2">
            {METODOS_PAGAMENTO.map((metodoPagamento) => (
              <button
                key={metodoPagamento.id}
                type="button"
                onClick={() => setMetodo(metodoPagamento.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  metodo === metodoPagamento.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-card-hover",
                )}
              >
                <p className="text-sm font-semibold text-text">{metodoPagamento.nome}</p>
                <p className="mt-0.5 text-xs text-text-muted">{metodoPagamento.descricao}</p>
              </button>
            ))}
          </div>

          <Button
            className="mt-4 w-full"
            size="lg"
            variant="primary"
            disabled={!metodo}
            onClick={handleConfirmar}
          >
            Confirmar assinatura
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
