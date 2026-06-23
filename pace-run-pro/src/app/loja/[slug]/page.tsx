"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Dumbbell,
  Loader2,
  ShoppingCart,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  sport: string;
  level: string;
  durationWeeks: number;
  weeklyHoursMin: number | null;
  weeklyHoursMax: number | null;
  goal: string;
  priceCents: number;
  coverUrl: string | null;
  featured: boolean;
  purchases: number;
  rating: number | null;
  ratingCount: number;
  included: string[];
  coach: { slug: string | null; user: { name: string; avatarUrl: string | null } };
}

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const SPORT_LABELS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  FORCA: "Força",
  GERAL: "Geral",
};

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "Meia maratona",
  QUARENTA_E_DOIS_KM: "Maratona",
  ULTRAMARATONA: "Ultramaratona",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  useEffect(() => {
    fetch(`/api/loja/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.product) setProduct(d.product);
        if (d?.alreadyOwned) setAlreadyOwned(true);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleBuy() {
    if (!product) return;
    setBuying(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar compra");
        setBuying(false);
        return;
      }
      if (data.free) {
        router.push(data.redirectUrl);
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-text">Produto não encontrado</p>
        <Link href="/loja"><Button variant="outline">Voltar à loja</Button></Link>
      </div>
    );
  }

  const initials = product.coach.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      {/* Back */}
      <Link href="/loja" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar à loja
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Cover */}
          {product.coverUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.coverUrl} alt={product.title} className="w-full rounded-2xl object-cover" style={{ maxHeight: 280 }} />
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="primary">{SPORT_LABELS[product.sport] ?? product.sport}</Badge>
              <Badge variant="outline">{product.level}</Badge>
              {product.goal && <Badge variant="outline">{GOAL_LABELS[product.goal] ?? product.goal}</Badge>}
              {product.featured && <Badge variant="success">Destaque</Badge>}
            </div>
            <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{product.title}</h1>
            {product.description && (
              <p className="mt-3 text-text-muted leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Clock, label: "Duração", value: `${product.durationWeeks} semanas` },
              { icon: Dumbbell, label: "Horas/semana", value: product.weeklyHoursMin ? `${product.weeklyHoursMin}–${product.weeklyHoursMax ?? product.weeklyHoursMin}h` : "—" },
              { icon: Users, label: "Compradores", value: String(product.purchases) },
              { icon: Trophy, label: "Avaliação", value: product.rating ? `${product.rating.toFixed(1)} ★` : "Novo" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-text">{value}</p>
              </div>
            ))}
          </div>

          {/* What's included */}
          {product.included.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-text">O que está incluído</h2>
              <ul className="space-y-2">
                {product.included.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column — purchase card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardContent className="space-y-4 p-5">
              {/* Price */}
              <div>
                <p className="font-display text-3xl font-extrabold text-primary">{fmtPrice(product.priceCents)}</p>
                {product.priceCents > 0 && <p className="text-xs text-text-muted mt-0.5">pagamento único · acesso permanente</p>}
              </div>

              {/* CTA */}
              {alreadyOwned ? (
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                  <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-success" />
                  <p className="text-sm font-semibold text-success">Você já possui este plano</p>
                </div>
              ) : (
                <>
                  <Button className="w-full gap-2" size="lg" onClick={handleBuy} disabled={buying}>
                    {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {buying ? "Redirecionando…" : product.priceCents === 0 ? "Acessar grátis" : "Comprar agora"}
                  </Button>
                  {error && <p className="text-xs text-destructive text-center">{error}</p>}
                  {product.priceCents > 0 && (
                    <p className="text-center text-[11px] text-text-muted">Pagamento seguro via Stripe</p>
                  )}
                </>
              )}

              {/* Coach */}
              <div className="border-t border-border pt-4 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={product.coach.user.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-text-muted">Criado por</p>
                  <p className="text-sm font-semibold text-text">{product.coach.user.name}</p>
                </div>
              </div>

              {product.rating != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-text-muted">({product.ratingCount} avaliações)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
