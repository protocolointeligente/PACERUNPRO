"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Package, PauseCircle, RotateCcw, Star, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListingStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "SUSPENDED";

interface Product {
  id: string;
  title: string;
  type: string;
  priceCents: number;
  published: boolean;
  featured: boolean;
  listingStatus: ListingStatus;
  createdAt: string;
  purchases: number;
  coach: { user: { name: string | null } };
  store: { name: string };
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso", EVENTO: "Evento",
  CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação", TESTE: "Teste",
  ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; variant: "outline" | "warning" | "success" | "danger" }> = {
  DRAFT:          { label: "Rascunho",   variant: "outline"  },
  PENDING_REVIEW: { label: "Em revisão", variant: "warning"  },
  APPROVED:       { label: "Aprovado",   variant: "success"  },
  SUSPENDED:      { label: "Suspenso",   variant: "danger"   },
};

type FilterTab = "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "all";

const FILTER_LABELS: Record<FilterTab, string> = {
  PENDING_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovados",
  SUSPENDED: "Suspensos",
  all: "Todos",
};

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModerarPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("PENDING_REVIEW");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/marketplace/moderar")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { products: Product[] } | null) => { if (d) setProducts(d.products); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function patch(id: string, body: { listingStatus?: ListingStatus; featured?: boolean }) {
    setUpdating(id);
    await fetch("/api/admin/marketplace/moderar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setUpdating(null);
    load();
  }

  const visible = filter === "all" ? products : products.filter((p) => p.listingStatus === filter);
  const pendingCount = products.filter((p) => p.listingStatus === "PENDING_REVIEW").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Badge variant="primary" className="mb-2">Admin · Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text">Moderação de produtos</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Aprovar, suspender ou devolver rascunhos para correção.
          {pendingCount > 0 && (
            <span className="ml-2 font-semibold text-warning">{pendingCount} aguardando revisão</span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["PENDING_REVIEW", "APPROVED", "SUSPENDED", "all"] as FilterTab[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-primary text-white" : "bg-card-hover text-text-muted hover:bg-card",
              f === "PENDING_REVIEW" && pendingCount > 0 && filter !== f && "ring-1 ring-warning/50"
            )}
          >
            {FILTER_LABELS[f]}
            {f === "PENDING_REVIEW" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-text-muted/30" />
          <p className="font-semibold text-text">
            {filter === "PENDING_REVIEW" ? "Nenhum produto aguardando revisão" : "Nenhum produto encontrado"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {visible.map((p) => {
                const statusCfg = STATUS_CONFIG[p.listingStatus ?? "DRAFT"];
                return (
                  <div key={p.id} className={cn("flex items-start gap-4 px-5 py-4", p.listingStatus === "PENDING_REVIEW" && "bg-warning/5")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-text truncate">{p.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                        <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">{statusCfg.label}</Badge>
                        {p.featured && <Badge variant="primary" className="text-[10px] shrink-0">Destaque</Badge>}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {p.coach.user.name} · {p.store.name} · {fmtPrice(p.priceCents)}
                        {" · "}{p.purchases} vendas
                        {" · "}{new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Featured toggle */}
                      <button
                        onClick={() => patch(p.id, { featured: !p.featured })}
                        disabled={updating === p.id}
                        className={cn(
                          "rounded-full p-1.5 transition-colors",
                          p.featured ? "text-amber-400 hover:text-amber-300" : "text-text-muted/40 hover:text-amber-400"
                        )}
                        title={p.featured ? "Remover destaque" : "Destacar"}
                      >
                        <Star className={cn("h-4 w-4", p.featured && "fill-amber-400")} />
                      </button>

                      {/* Status actions */}
                      {p.listingStatus !== "APPROVED" && (
                        <Button size="sm" disabled={updating === p.id} onClick={() => patch(p.id, { listingStatus: "APPROVED" })} className="gap-1.5">
                          {updating === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Aprovar
                        </Button>
                      )}
                      {p.listingStatus === "APPROVED" && (
                        <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => patch(p.id, { listingStatus: "SUSPENDED" })} className="gap-1.5 text-danger hover:text-danger hover:bg-danger/10">
                          {updating === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
                          Suspender
                        </Button>
                      )}
                      {(p.listingStatus === "PENDING_REVIEW" || p.listingStatus === "SUSPENDED") && (
                        <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => patch(p.id, { listingStatus: "DRAFT" })} className="gap-1.5 text-text-muted">
                          {updating === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          Rascunho
                        </Button>
                      )}
                      {p.listingStatus === "APPROVED" && (
                        <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => patch(p.id, { listingStatus: "DRAFT" })} className="gap-1.5 text-text-muted">
                          {updating === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                          Rejeitar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
