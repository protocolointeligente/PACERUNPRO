"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ShoppingBag, Star, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  sport: string | null;
  level: string | null;
  priceCents: number;
  coverUrl: string | null;
  featured: boolean;
  purchases: number;
  rating: number | null;
  ratingCount: number;
  store: { name: string; slug: string | null; logoUrl: string | null } | null;
  coach: { slug: string | null; user: { name: string | null; avatarUrl: string | null } } | null;
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

const SPORT_OPTS = [
  { value: "", label: "Todos os esportes" },
  { value: "CORRIDA", label: "🏃 Corrida" },
  { value: "CICLISMO", label: "🚴 Ciclismo" },
  { value: "NATACAO", label: "🏊 Natação" },
  { value: "FORCA", label: "🏋️ Força" },
  { value: "GERAL", label: "⚡ Geral" },
];

const TYPE_OPTS = [
  { value: "", label: "Todos os tipos" },
  { value: "PLANILHA", label: "Planilha" },
  { value: "EBOOK", label: "E-book" },
  { value: "CURSO", label: "Curso" },
  { value: "CONSULTORIA", label: "Consultoria" },
  { value: "TREINAMENTO", label: "Treinamento" },
  { value: "EVENTO", label: "Evento" },
  { value: "ASSINATURA", label: "Assinatura" },
];

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProductCard({ p }: { p: Product }) {
  const initials = (p.coach?.user.name ?? p.store?.name ?? "?")
    .split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <Link href={`/marketplace/${p.slug}`}>
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* Cover */}
        <div className="relative h-36 shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {p.coverUrl ? (
            <img src={p.coverUrl} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              {TYPE_EMOJI[p.type] ?? "📦"}
            </div>
          )}
          {p.featured && (
            <div className="absolute left-2 top-2">
              <Badge variant="primary" className="text-[10px]">⭐ Destaque</Badge>
            </div>
          )}
          <div className="absolute right-2 top-2">
            <Badge className="border border-border bg-background/90 text-xs text-text">
              {TYPE_LABELS[p.type] ?? p.type}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text group-hover:text-primary transition-colors">
            {p.title}
          </h3>
          <p className="line-clamp-2 text-xs text-text-muted">{p.description}</p>

          {/* Coach info */}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={p.coach?.user.avatarUrl ?? p.store?.logoUrl ?? undefined} />
              <AvatarFallback className="text-[9px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-text-muted">
              {p.coach?.user.name ?? p.store?.name ?? "Treinador"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {p.rating ? (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {p.rating.toFixed(1)}
                <span className="text-text-muted/60">({p.ratingCount})</span>
              </span>
            ) : null}
            {p.purchases > 0 && <span>{p.purchases} vendas</span>}
          </div>
          <span className="font-display text-sm font-bold text-primary">{fmtPrice(p.priceCents)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [type, setType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (type) params.set("type", type);
    fetch(`/api/marketplace/products?${params.toString()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Product[]) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sport, type]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = search
    ? products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.coach?.user.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const featured = filtered.filter((p) => p.featured);
  const regular = filtered.filter((p) => !p.featured);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="primary" className="mb-2">Marketplace</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Produtos e serviços esportivos
        </h1>
        <p className="text-sm text-text-muted">
          Planilhas de treino, e-books, cursos online e consultorias dos melhores treinadores.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar produtos, treinadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-muted/60 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            showFilters || sport || type
              ? "border-primary/60 bg-primary/10 text-primary"
              : "border-border bg-card text-text-muted hover:border-primary/30"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {(sport || type) && <span className="text-xs">·{[sport, type].filter(Boolean).length}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card/50 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Esporte</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text outline-none focus:border-primary/60"
            >
              {SPORT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Tipo de produto</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text outline-none focus:border-primary/60"
            >
              {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {(sport || type) && (
            <button
              onClick={() => { setSport(""); setType(""); }}
              className="self-end rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-danger/40 hover:text-danger transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando produtos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-text-muted/30" />
          <p className="text-sm text-text-muted">Nenhum produto encontrado.</p>
          {(search || sport || type) && (
            <button
              onClick={() => { setSearch(""); setSport(""); setType(""); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {featured.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                ⭐ Em destaque
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Todos os produtos
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regular.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </section>
          )}

          <p className="text-center text-xs text-text-muted">
            {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </p>
        </div>
      )}
    </div>
  );
}
