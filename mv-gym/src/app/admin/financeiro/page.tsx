"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { METRICAS_ADMIN, TRANSACOES_ADMIN } from "@/lib/data/mock-admin";
import { getPlanoById } from "@/lib/data/plans";
import { formatDate } from "@/lib/utils";
import type { MetodoPagamento } from "@/lib/data/plans";

const METODO_LABELS: Record<MetodoPagamento, string> = {
  cartao: "Cartão",
  pix: "Pix",
  mercadopago: "Mercado Pago",
};

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  pago: { label: "Pago", variant: "success" },
  pendente: { label: "Pendente", variant: "warning" },
  falhou: { label: "Falhou", variant: "danger" },
};

export default function AdminFinanceiroPage() {
  const mrrFormatado = METRICAS_ADMIN.mrr.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <TopBar title="Financeiro" subtitle="Receita e transações" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="col-span-2">
            <p className="text-xs text-text-muted">MRR</p>
            <p className="font-display text-2xl font-extrabold text-primary">{mrrFormatado}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Churn rate</p>
            <p className="font-display text-2xl font-extrabold text-danger">
              {METRICAS_ADMIN.churnRatePct}%
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted">Novos assinantes/mês</p>
            <p className="font-display text-2xl font-extrabold text-success">
              {METRICAS_ADMIN.novosAssinantesMes}
            </p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receita mensal</CardTitle>
          </CardHeader>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={METRICAS_ADMIN.receitaMensal}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <YAxis tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#121923",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    color: "#FFFFFF",
                  }}
                  formatter={(value) =>
                    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Bar dataKey="receita" fill="#C6FF00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-text">
            Transações recentes
          </h2>
          <div className="flex flex-col gap-3">
            {TRANSACOES_ADMIN.map((tx) => {
              const planoNome = getPlanoById(tx.plano)?.nome ?? tx.plano;
              const statusBadge = STATUS_BADGE[tx.status];
              const valorFormatado = tx.valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });

              return (
                <Card key={tx.id}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-text">
                        {tx.usuario}
                      </p>
                      <p className="text-xs text-text-muted">{planoNome}</p>
                    </div>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {METODO_LABELS[tx.metodo]} · {formatDate(tx.data)}
                    </span>
                    <span className="font-display text-sm font-bold text-text">
                      {valorFormatado}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
