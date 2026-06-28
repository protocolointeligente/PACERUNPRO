"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  createdAt: string;
  athleteName: string | null;
  athleteEmail: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  paidOut: boolean;
  items: { title: string; type: string; priceCents: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "outline" }> = {
  PAID:       { label: "Pago", variant: "success" },
  PENDING:    { label: "Pendente", variant: "warning" },
  FULFILLED:  { label: "Entregue", variant: "success" },
  CANCELLED:  { label: "Cancelado", variant: "danger" },
  REFUNDED:   { label: "Reembolsado", variant: "danger" },
  PROCESSING: { label: "Processando", variant: "warning" },
};

function fmtPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/marketplace/orders")
      .then((r) => r.ok ? r.json() : [])
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const totalNet = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED")
    .reduce((s, o) => s + o.netCents, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Pedidos</h1>
        <p className="text-sm text-text-muted mt-1">Histórico de compras dos seus produtos no marketplace.</p>
      </div>

      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-text-muted">Total de pedidos</p>
              <p className="font-display text-2xl font-bold text-text mt-1">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-text-muted">Receita líquida</p>
              <p className="font-display text-2xl font-bold text-success mt-1">{fmtPrice(totalNet)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-text-muted">Pendente repasse</p>
              <p className="font-display text-2xl font-bold text-warning mt-1">
                {fmtPrice(orders.filter((o) => !o.paidOut && (o.status === "PAID" || o.status === "FULFILLED")).reduce((s, o) => s + o.netCents, 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-text-muted/30" />
          <p className="font-semibold text-text">Nenhum pedido ainda</p>
          <p className="text-sm text-text-muted mt-1">Quando atletas comprarem seus produtos, os pedidos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cfg = STATUS_CONFIG[o.status] ?? { label: o.status, variant: "outline" as const };
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text text-sm">{o.athleteName ?? o.athleteEmail}</p>
                      <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                      {o.paidOut && (
                        <span className="flex items-center gap-1 text-[10px] text-success"><CheckCircle className="h-3 w-3" />Repassado</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.items.map((item, i) => (
                        <span key={i} className="rounded-full border border-border bg-card-hover px-2.5 py-0.5 text-[11px] text-text-muted">{item.title}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg font-bold text-success">{fmtPrice(o.netCents)}</p>
                    <p className="text-[11px] text-text-muted">líquido</p>
                    <p className={cn("text-[10px] mt-0.5", o.paidOut ? "text-success" : "text-warning")}>
                      {o.paidOut ? <><CheckCircle className="inline h-2.5 w-2.5 mr-0.5" />Pago</> : <><Clock className="inline h-2.5 w-2.5 mr-0.5" />Aguardando repasse</>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
