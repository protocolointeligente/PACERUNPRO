"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2, Clock, ShoppingCart, Star, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProductDetail {
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
  included: string[];
  store: { name: string; slug: string | null; logoUrl: string | null; description: string | null };
  coach: {
    slug: string | null;
    bio: string | null;
    specialties: string[];
    user: { name: string | null; avatarUrl: string | null };
  };
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso",
  EVENTO: "Evento", CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação",
  TESTE: "Teste", ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

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

export default function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/marketplace/products/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setProduct(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleBuy() {
    if (!product) return;
    setBuying(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?next=/marketplace/${slug}`;
          return;
        }
        setError(data.error ?? "Erro ao processar compra.");
        return;
      }
      if (data.free) {
        setSuccess(true);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-card-hover" />)}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <BookOpen className="mx-auto mb-4 h-10 w-10 text-text-muted/30" />
        <h1 className="font-display text-xl font-bold text-text">Produto não encontrado</h1>
        <p className="mt-2 text-sm text-text-muted">Este produto não está disponível ou foi removido.</p>
        <Link href="/loja">
          <Button className="mt-6">Ver todos os produtos</Button>
        </Link>
      </div>
    );
  }

  const emoji = product.sport
    ? (SPORT_EMOJI[product.sport] ?? TYPE_EMOJI[product.type] ?? "📋")
    : (TYPE_EMOJI[product.type] ?? "📋");
  const coachName = product.coach.user.name ?? product.store.name ?? "Treinador";
  const initials = coachName.split(" ").slice(0, 2).map((n: string) => n[0]).join("");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao marketplace
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <span className="text-7xl">{emoji}</span>
        </div>
        <div className="p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{TYPE_LABELS[product.type] ?? product.type}</Badge>
            {product.featured && <Badge variant="primary">Destaque</Badge>}
            {product.level && <Badge variant="outline">{product.level}</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{product.title}</h1>
          <p className="mt-2 text-sm text-text-muted">{product.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-muted">
            {product.durationWeeks && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />{product.durationWeeks} semanas
              </span>
            )}
            {product.purchases > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />{product.purchases} compraram
              </span>
            )}
            {product.rating != null && (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Star className="h-4 w-4 fill-amber-400" />
                {product.rating.toFixed(1)}
                <span className="text-text-muted font-normal">({product.ratingCount} avaliações)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {product.included.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 font-display text-base font-semibold text-text">O que está incluído</h2>
                <ul className="space-y-2">
                  {product.included.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Coach info */}
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 font-display text-base font-semibold text-text">Sobre o treinador</h2>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={product.coach.user.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-text">{coachName}</p>
                  <p className="text-xs text-text-muted">{product.store.name}</p>
                  {product.coach.bio && (
                    <p className="mt-2 text-sm text-text-muted">{product.coach.bio}</p>
                  )}
                  {product.coach.specialties?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.coach.specialties.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky buy panel */}
        <div>
          <div className="sticky top-20">
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="font-display text-3xl font-bold text-primary">{fmtPrice(product.priceCents)}</p>
                  {product.priceCents > 0 && (
                    <p className="text-xs text-text-muted mt-0.5">Pagamento único</p>
                  )}
                </div>

                {success ? (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Produto liberado!
                  </div>
                ) : (
                  <Button className="w-full gap-2" disabled={buying} onClick={handleBuy}>
                    {buying ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    {product.priceCents === 0 ? "Acessar grátis" : "Comprar agora"}
                  </Button>
                )}

                {error && (
                  <p className="text-xs text-danger">{error}</p>
                )}

                {success && (
                  <Link href="/atleta/compras">
                    <Button variant="secondary" className="w-full">
                      Ver minhas compras
                    </Button>
                  </Link>
                )}

                <p className="text-center text-xs text-text-muted">
                  Pagamento seguro via Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
