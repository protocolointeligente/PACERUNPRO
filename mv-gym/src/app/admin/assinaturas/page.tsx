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
import { Check } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANOS_ASSINATURA } from "@/lib/data/plans";
import { USUARIOS_ADMIN } from "@/lib/data/mock-admin";

export default function AdminAssinaturasPage() {
  const distribuicaoPlanos = PLANOS_ASSINATURA.map((plano) => ({
    label: plano.nome,
    quantidade: USUARIOS_ADMIN.filter((u) => u.plano === plano.id).length,
  }));

  return (
    <>
      <TopBar title="Assinaturas" subtitle="Planos e assinantes" />

      <div className="flex flex-col gap-4 px-4 py-4">
        {PLANOS_ASSINATURA.map((plano) => {
          const assinantes = USUARIOS_ADMIN.filter((u) => u.plano === plano.id).length;
          const precoFormatado =
            plano.precoMensal === 0
              ? "Grátis"
              : plano.precoMensal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                });
          const recursosVisiveis = plano.recursos.slice(0, 3);
          const recursosRestantes = plano.recursos.length - recursosVisiveis.length;

          return (
            <Card key={plano.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{plano.nome}</CardTitle>
                  {plano.destaque && <Badge variant="default">Mais popular</Badge>}
                </div>
                <span className="font-display text-base font-bold text-text">
                  {precoFormatado}
                  {plano.precoMensal > 0 && (
                    <span className="text-xs font-normal text-text-muted">/mês</span>
                  )}
                </span>
              </CardHeader>

              <p className="mb-3 text-xs text-text-muted">
                {assinantes} {assinantes === 1 ? "assinante" : "assinantes"}
              </p>

              <ul className="flex flex-col gap-1.5">
                {recursosVisiveis.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-2 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{recurso}</span>
                  </li>
                ))}
              </ul>

              {recursosRestantes > 0 && (
                <p className="mt-2 text-xs text-text-muted">+{recursosRestantes} recursos</p>
              )}
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle>Assinantes por plano</CardTitle>
          </CardHeader>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={distribuicaoPlanos}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#AAB3C5", fontSize: 11 }} />
                <YAxis tick={{ fill: "#AAB3C5", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#121923",
                    border: "1px solid #1F2937",
                    borderRadius: 12,
                    color: "#FFFFFF",
                  }}
                />
                <Bar dataKey="quantidade" fill="#C6FF00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
