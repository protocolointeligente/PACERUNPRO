"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  sport: string | null;
  level: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  priceCents: number;
  store: { name: string; slug: string | null; logoUrl: string | null } | null;
  coach: { user: { name: string | null; avatarUrl: string | null } } | null;
}

interface OrderItem {
  id: string;
  status: string;
  priceCents: number;
  fileUrl: string | null;
  fulfilledAt: string | null;
  product: Product;
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso",
  EVENTO: "Evento", CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação",
  TESTE: "Teste", ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

const TYPE_EMOJI: Record<string, string> = {
  PLANILHA: "📋", EBOOK: "📖", CURSO: "🎓", EVENTO: "🏁",
  CONSULTORIA: "💬", AVALIACAO: "📊", TESTE: "⚡", ASSINATURA: "🔄", TREINAMENTO: "🎯",
};

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ItemCard({ item }: { item: OrderItem }) {
  const { product } = item;
  const coachName = product.coach?.user.name ?? product.store?.name ?? "Treinador";
  const initials = coachName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const typeEmoji = TYPE_EMOJI[product.type] ?? "📦";
  const typeLabel = TYPE_LABELS[product.type] ?? product.type;
  const hasDownload = !!item.fileUrl;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
      {/* Cover */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
        {product.coverUrl ? (
          <img src={product.coverUrl} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl">{typeEmoji}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
          <Badge variant={item.status === "FULFILLED" || item.status === "PAID" ? "success" : "warning"} className="text-[10px]">
            {item.status === "FULFILLED" ? "Entregue" : item.status === "PAID" ? "Pago" : item.status}
          </Badge>
        </div>
        <h3 className="font-semibold text-text text-sm leading-snug truncate">{product.title}</h3>
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={product.coach?.user.avatarUrl ?? product.store?.logoUrl ?? undefined} />
            <AvatarFallback className="text-[8px] font-bold">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-text-muted">{coachName}</span>
        </div>
        <p className="text-xs font-semibold text-primary">{fmtPrice(item.priceCents)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        {hasDownload ? (
          <a href={item.fileUrl!} target="_blank" rel="noopener noreferrer" download>
            <Button size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Baixar
            </Button>
          </a>
        ) : (
          <Link href={`/marketplace/${product.slug}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/atleta/marketplace/orders")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.orders) setOrders(d.orders); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allItems = orders.flatMap((o) => o.items);
  const totalSpent = orders.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="primary" className="mb-2">Marketplace</Badge>
          <h1 className="font-display text-2xl font-bold text-text">Minhas compras</h1>
          <p className="text-sm text-text-muted mt-0.5">Produtos e serviços adquiridos no marketplace.</p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            Explorar
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <Package className="h-12 w-12 text-text-muted/30" />
          <div>
            <p className="font-semibold text-text">Nenhuma compra ainda</p>
            <p className="mt-1 text-sm text-text-muted">Explore o marketplace para encontrar planilhas, e-books e consultorias.</p>
          </div>
          <Link href="/marketplace">
            <Button className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Ir ao marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Compras", value: String(allItems.length), icon: Package },
              { label: "Total investido", value: fmtPrice(totalSpent), icon: ShoppingBag },
              { label: "Para baixar", value: String(allItems.filter((i) => i.fileUrl).length), icon: Download },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-text-muted" />
                    <p className="text-xs text-text-muted">{stat.label}</p>
                  </div>
                  <p className="font-display text-lg font-bold text-text">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Orders */}
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span>Pedido {order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link href="/marketplace" className="text-xs text-primary hover:underline">
              <BookOpen className="inline h-3.5 w-3.5 mr-1" />
              Explorar mais produtos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
