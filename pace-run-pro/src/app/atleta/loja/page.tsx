"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Clock, Filter, PartyPopper, Search, ShoppingCart, Star, Users, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SkeletonCard } from "@/components/ui/skeleton";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  sport: string | null;
  level: string | null;
  durationWeeks: number | null;
  priceCents: number;
  coverUrl: string | null;
  featured: boolean;
  purchases: number;
  rating: number | null;
  ratingCount: number;
  store: { name: string; slug: string | null; logoUrl: string | null };
  coach: {
    slug: string | null;
    user: { name: string | null; avatarUrl: string | null };
  };
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso",
  EVENTO: "Evento", CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação",
  TESTE: "Teste", ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

const TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "PLANILHA", label: "Planilha" },
  { value: "EBOOK", label: "E-book" },
  { value: "CURSO", label: "Curso" },
  { value: "EVENTO", label: "Evento" },
  { value: "CONSULTORIA", label: "Consultoria" },
  { value: "TREINAMENTO", label: "Treinamento" },
];

const SPORT_EMOJI: Record<string, string> = {
  CORRIDA: "🏃", CICLISMO: "🚴", NATACAO: "🏊", FORCA: "🏋️", GERAL: "⚡",
};

const TYPE_EMOJI: Record<string, string> = {
  PLANILHA: "📋", EBOOK: "📖", CURSO: "🎓", EVENTO: "🏁",
  CONSULTORIA: "💬", AVALIACAO: "📊", TESTE: "⚡", ASSINATURA: "🔄", TREINAMENTO: "🎯",
};

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProductCard({ p, onBuy, buying }: { p: Product; onBuy: (id: string) => void; buying: string | null }) {
  const coachName = p.coach.user.name ?? p.store.name ?? "Treinador";
  const initials = coachName.split(" ").slice(0, 2).map((n: string) => n[0]).join("");
  const emoji = p.sport ? (SPORT_EMOJI[p.sport] ?? TYPE_EMOJI[p.type] ?? "📋") : (TYPE_EMOJI[p.type] ?? "📋");

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden transition-shadow hover:shadow-md",
      p.featured && "ring-1 ring-primary/40"
    )}>
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        {p.featured && (
          <Badge variant="primary" className="absolute left-3 top-3 text-[10px]">Destaque</Badge>
        )}
        <span className="text-5xl">{emoji}</span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[p.type] ?? p.type}</Badge>
          </div>
          <p className="font-display text-sm font-bold text-text leading-tight">{p.title}</p>
          <p className="mt-1 text-[11px] text-text-muted line-clamp-2">{p.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {p.level && (
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">{p.level}</span>
          )}
          {p.durationWeeks && (
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">
              <Clock className="mr-0.5 inline h-2.5 w-2.5" />{p.durationWeeks} semanas
            </span>
          )}
        </div>

        {(p.purchases > 0 || p.rating != null) && (
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            {p.purchases > 0 && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.purchases}</span>
            )}
            {p.rating != null && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="h-3 w-3 fill-amber-400" />{p.rating.toFixed(1)}
                <span className="text-text-muted font-normal">({p.ratingCount})</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={p.coach.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-[11px] text-text-muted truncate">{coachName}</span>
          <span className="font-display font-bold text-sm text-primary">{fmtPrice(p.priceCents)}</span>
        </div>

        <Button
          size="sm"
          className="w-full gap-1.5"
          disabled={buying === p.id}
          onClick={() => onBuy(p.id)}
        >
          {buying === p.id ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ShoppingCart className="h-3.5 w-3.5" />
          )}
          {p.priceCents === 0 ? "Acessar grátis" : "Comprar"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AtletaLojaContent() {
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";
  const coachSlug = searchParams.get("coach") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (coachSlug) params.set("coach", coachSlug);
    setLoading(true);
    fetch(`/api/marketplace/products?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [type, coachSlug]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.coach.user.name ?? "").toLowerCase().includes(q) ||
        (p.store.name ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const welcomeCoachName = useMemo(() => {
    if (!coachSlug || products.length === 0) return null;
    return products.find((p) => p.coach.slug === coachSlug)?.coach.user.name ?? null;
  }, [products, coachSlug]);

  async function handleBuy(productId: string) {
    setBuying(productId);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar compra.");
        return;
      }
      if (data.free) {
        setSuccessId(productId);
        setProducts((prev) =>
          prev.map((p) => p.id === productId ? { ...p, purchases: p.purchases + 1 } : p)
        );
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBuying(null);
    }
  }

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {welcome && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold text-text">
              {welcomeCoachName
                ? `Você agora faz parte da assessoria de ${welcomeCoachName}!`
                : "Bem-vindo à sua nova assessoria!"}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Escolha um plano de treinamento abaixo para começar.
            </p>
          </div>
        </div>
      )}

      <div>
        <Badge variant="primary" className="mb-2">Loja de treinos</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          {coachSlug && welcomeCoachName ? `Planos de ${welcomeCoachName}` : "Marketplace"}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {coachSlug
            ? "Produtos disponíveis para assinantes desta assessoria."
            : "Compre planilhas, e-books, cursos e muito mais dos melhores treinadores."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {successId && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-success">Produto liberado!</p>
            <p className="text-xs text-text-muted">Acesse em <Link href="/atleta/biblioteca" className="text-primary underline">Minha biblioteca</Link>.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Filter className="h-4 w-4 text-text-muted shrink-0" />
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos ou treinadores…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-sm text-text outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setType(o.value)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                type === o.value
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
          <p className="text-sm font-semibold text-text">Nenhum produto encontrado</p>
          <p className="text-xs text-text-muted mt-1">Tente outros filtros ou volte em breve.</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-text">Em destaque</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProductCard key={p.id} p={p} onBuy={handleBuy} buying={buying} />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="mb-4 font-display text-lg font-bold text-text">Todos os produtos</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <ProductCard key={p.id} p={p} onBuy={handleBuy} buying={buying} />
                ))}
              </div>
            </section>
          )}

          {!coachSlug && (
            <div className="pt-4 text-center">
              <p className="text-xs text-text-muted">
                Quer ver mais? Acesse a{" "}
                <Link href="/loja" className="text-primary hover:underline">loja pública</Link>{" "}
                para descobrir todos os treinadores.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AtletaLojaPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      </div>
    }>
      <AtletaLojaContent />
    </Suspense>
  );
}
