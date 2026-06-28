"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Star, Clock, Users, MessageCircle, Package, Award, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StoreProduct {
  id: string;
  type: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  coverUrl: string | null;
  featured: boolean;
  purchases: number;
  rating: number | null;
  ratingCount: number;
  level: string | null;
  sport: string | null;
  durationWeeks: number | null;
  included: string[];
}

interface PlanProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  sport: string;
  level: string;
  durationWeeks: number;
  priceCents: number;
  featured: boolean;
  purchases: number;
  included: string[];
}

interface AssessoriaStore {
  id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor?: string;
  coach: {
    slug: string | null;
    user: { name: string | null; avatarUrl: string | null };
    publicBio: string | null;
    whatsapp: string | null;
  };
  products: StoreProduct[];
  planProducts: PlanProduct[];
}

const TYPE_LABELS: Record<string, string> = {
  PLANILHA: "Planilha", EBOOK: "E-book", CURSO: "Curso",
  EVENTO: "Evento", CONSULTORIA: "Consultoria", AVALIACAO: "Avaliação",
  TESTE: "Teste", ASSINATURA: "Assinatura", TREINAMENTO: "Treinamento",
};

const SPORT_EMOJI: Record<string, string> = {
  CORRIDA: "🏃", CICLISMO: "🚴", NATACAO: "🏊", FORCA: "🏋️", GERAL: "⚡",
};

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProductCard({ title, slug, type, priceCents, sport, level, durationWeeks, featured, purchases, rating, ratingCount, isPlan }: {
  title: string; slug: string; type?: string; priceCents: number; sport?: string | null;
  level?: string | null; durationWeeks?: number | null; featured: boolean; purchases: number;
  rating?: number | null; ratingCount?: number; isPlan?: boolean;
}) {
  const href = isPlan ? `/loja/${slug}` : `/marketplace/${slug}`;
  return (
    <Card className={cn("flex flex-col overflow-hidden transition-shadow hover:shadow-md", featured && "ring-1 ring-primary/40")}>
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        {featured && <Badge variant="primary" className="absolute left-3 top-3 text-[10px]">Destaque</Badge>}
        {type && <Badge variant="outline" className="absolute right-3 top-3 text-[10px]">{TYPE_LABELS[type] ?? type}</Badge>}
        <span className="text-4xl">{sport ? (SPORT_EMOJI[sport] ?? "📋") : "📦"}</span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-display text-sm font-bold text-text leading-tight">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {level && <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">{level}</span>}
          {durationWeeks && (
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">
              <Clock className="mr-0.5 inline h-2.5 w-2.5" />{durationWeeks}sem
            </span>
          )}
        </div>
        {(purchases > 0 || rating != null) && (
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            {purchases > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{purchases}</span>}
            {rating != null && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="h-3 w-3 fill-amber-400" />{rating.toFixed(1)}
                <span className="text-text-muted font-normal">({ratingCount})</span>
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
          <span className="font-display font-bold text-sm text-primary">{fmtPrice(priceCents)}</span>
          <Link href={href}>
            <Button size="sm" className="gap-1.5 text-xs px-3 h-7">
              <ShoppingCart className="h-3 w-3" />
              {priceCents === 0 ? "Grátis" : "Comprar"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssessoriaStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [store, setStore] = useState<AssessoriaStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/assessoria/${slug}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) setStore(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
        <Package className="h-16 w-16 text-text-muted/30" />
        <h1 className="font-display text-2xl font-bold text-text">Assessoria não encontrada</h1>
        <p className="text-sm text-text-muted max-w-md">Esta assessoria não possui uma loja pública ou o link está incorreto.</p>
        <Link href="/loja"><Button>Ver loja da plataforma</Button></Link>
      </div>
    );
  }

  const allProducts = store.products ?? [];
  const planProducts = store.planProducts ?? [];
  const hasContent = allProducts.length > 0 || planProducts.length > 0;
  const coachName = store.coach.user.name ?? store.name;
  const initials = coachName.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-card to-card-hover border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <Link href="/loja" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar à loja
          </Link>
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 border-2 border-primary/30 shrink-0">
              <AvatarImage src={store.logoUrl ?? store.coach.user.avatarUrl ?? undefined} />
              <AvatarFallback className="font-display text-2xl font-bold gradient-primary text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Badge variant="primary" className="mb-2 text-[10px]"><Award className="h-2.5 w-2.5 mr-1" />Assessoria certificada</Badge>
              <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{store.name}</h1>
              {store.description && (
                <p className="mt-2 text-sm text-text-muted max-w-2xl leading-relaxed">{store.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                {planProducts.length + allProducts.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Package className="h-3.5 w-3.5" />
                    {planProducts.length + allProducts.length} produto{planProducts.length + allProducts.length !== 1 ? "s" : ""}
                  </span>
                )}
                {store.coach.whatsapp && (
                  <a
                    href={`https://wa.me/${store.coach.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Falar com o treinador
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {!hasContent ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-text-muted/30" />
            <p className="font-semibold text-text">Nenhum produto publicado ainda</p>
            <p className="text-sm text-text-muted mt-1">Volte em breve para novidades desta assessoria.</p>
          </div>
        ) : (
          <>
            {allProducts.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-bold text-text">Produtos e serviços</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {allProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      title={p.title}
                      slug={p.slug}
                      type={p.type}
                      priceCents={p.priceCents}
                      sport={p.sport}
                      level={p.level}
                      durationWeeks={p.durationWeeks}
                      featured={p.featured}
                      purchases={p.purchases}
                      rating={p.rating}
                      ratingCount={p.ratingCount}
                    />
                  ))}
                </div>
              </section>
            )}

            {planProducts.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-bold text-text">Planilhas de treino</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {planProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      title={p.title}
                      slug={p.slug}
                      priceCents={p.priceCents}
                      sport={p.sport}
                      level={p.level}
                      durationWeeks={p.durationWeeks}
                      featured={p.featured}
                      purchases={p.purchases}
                      isPlan
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
