"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2, Clock, MessageSquare, Send, ShoppingCart, Star, Users,
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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  athlete: { name: string | null; avatarUrl: string | null };
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const s = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} className={`${s} ${v <= rating ? "fill-amber-400 text-amber-400" : "text-text-muted/30"}`} />
      ))}
    </span>
  );
}

export default function MarketplaceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSent, setReviewSent] = useState(false);

  // PIX payment
  const [pix, setPix] = useState<{ copyPaste: string; qrCodeUrl: string | null; expiresAt: string } | null>(null);
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  const loadReviews = useCallback((productId: string) => {
    fetch(`/api/marketplace/reviews?productId=${productId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { reviews: Review[] } | null) => { if (d) setReviews(d.reviews); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`/api/marketplace/products/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: ProductDetail | null) => {
        if (d) {
          setProduct(d);
          loadReviews(d.id);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug, loadReviews]);

  async function submitReview() {
    if (!product || myRating < 1) return;
    setSubmittingReview(true);
    setReviewError(null);
    const res = await fetch("/api/marketplace/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating: myRating, comment: myComment.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setReviewError(data.error ?? "Erro ao enviar avaliação"); setSubmittingReview(false); return; }
    setReviewSent(true);
    setMyRating(0);
    setMyComment("");
    loadReviews(product.id);
    setSubmittingReview(false);
  }

  async function validateCoupon() {
    if (!product || !couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    const res = await fetch("/api/marketplace/coupon-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim(), productId: product.id }),
    });
    const data = await res.json();
    if (data.valid) {
      setCouponDiscount(data.discountCents);
      setCouponApplied(true);
    } else {
      setCouponError(data.error ?? "Cupom inválido");
      setCouponDiscount(0);
      setCouponApplied(false);
    }
    setValidatingCoupon(false);
  }

  async function handleBuy() {
    if (!product) return;
    setBuying(true);
    setError(null);
    setPix(null);
    setPixOrderId(null);
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ...(couponApplied && couponCode ? { couponCode: couponCode.toUpperCase() } : {}) }),
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
      } else if (data.pix) {
        setPix(data.pix);
        setPixOrderId(data.orderId);
        // Poll for payment confirmation every 4 seconds
        const interval = setInterval(async () => {
          try {
            const r = await fetch(`/api/marketplace/orders/${data.orderId}/status`);
            const s = await r.json();
            if (s.status === "PAID" || s.status === "FULFILLED") {
              clearInterval(interval);
              setPix(null);
              setSuccess(true);
            }
          } catch { /* ignore polling errors */ }
        }, 4000);
        // Auto-clear polling after 30 minutes
        setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setBuying(false);
    }
  }

  async function handleCopyPix() {
    if (!pix?.copyPaste) return;
    await navigator.clipboard.writeText(pix.copyPaste).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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

          {/* Reviews */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-text-muted" />
              <h2 className="font-display text-base font-semibold text-text">
                Avaliações{reviews.length > 0 && ` (${reviews.length})`}
              </h2>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const rInitials = (r.athlete.name ?? "?").split(" ").slice(0, 2).map((n: string) => n[0]).join("");
                  return (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={r.athlete.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[10px]">{rInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text">{r.athlete.name ?? "Atleta"}</span>
                            <StarRow rating={r.rating} />
                            <span className="text-xs text-text-muted ml-auto">
                              {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {r.comment && <p className="mt-1.5 text-sm text-text-muted">{r.comment}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhuma avaliação ainda. Seja o primeiro!</p>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-text">Deixar avaliação</h3>
                {reviewSent ? (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> Avaliação enviada com sucesso!
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} onClick={() => setMyRating(v)} className="p-0.5">
                          <Star className={`h-6 w-6 transition-colors ${v <= myRating ? "fill-amber-400 text-amber-400" : "text-text-muted/30 hover:text-amber-300"}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      placeholder="Conte sua experiência (opcional)..."
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                    />
                    {reviewError && <p className="text-xs text-danger">{reviewError}</p>}
                    <Button
                      onClick={submitReview}
                      disabled={submittingReview || myRating < 1}
                      className="gap-2"
                      size="sm"
                    >
                      {submittingReview ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Enviar avaliação
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky buy panel */}
        <div>
          <div className="sticky top-20">
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-4">
                <div>
                  {couponDiscount > 0 ? (
                    <>
                      <p className="text-sm line-through text-text-muted">{fmtPrice(product.priceCents)}</p>
                      <p className="font-display text-3xl font-bold text-success">{fmtPrice(product.priceCents - couponDiscount)}</p>
                      <p className="text-xs text-success mt-0.5">Desconto: -{fmtPrice(couponDiscount)}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-3xl font-bold text-primary">{fmtPrice(product.priceCents)}</p>
                      {product.priceCents > 0 && <p className="text-xs text-text-muted mt-0.5">Pagamento único</p>}
                    </>
                  )}
                </div>

                {product.priceCents > 0 && !success && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          setCouponCode(v);
                          if (couponApplied) { setCouponApplied(false); setCouponDiscount(0); }
                          setCouponError(null);
                        }}
                        placeholder="CUPOM"
                        maxLength={32}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 transition-colors"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={validateCoupon}
                        disabled={validatingCoupon || !couponCode.trim() || couponApplied}
                        className="shrink-0"
                      >
                        {validatingCoupon
                          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-text-muted/30 border-t-text-muted" />
                          : couponApplied
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            : "Aplicar"}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-danger">{couponError}</p>}
                    {couponApplied && <p className="text-xs text-success">Cupom aplicado com sucesso!</p>}
                  </div>
                )}

                {success ? (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Produto liberado!
                  </div>
                ) : pix ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                      <p className="mb-2 text-xs font-semibold text-primary">PIX gerado — aguardando pagamento</p>
                      {pix.qrCodeUrl && (
                        <img src={pix.qrCodeUrl} alt="QR Code PIX" className="mx-auto h-40 w-40 rounded-lg" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-text-muted">Ou copie o código PIX copia e cola:</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={pix.copyPaste}
                          className="flex-1 truncate rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-text"
                        />
                        <Button variant="secondary" size="sm" onClick={handleCopyPix} className="shrink-0">
                          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : "Copiar"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                      Aguardando confirmação do pagamento...
                    </div>
                    <p className="text-xs text-text-muted">
                      Válido até{" "}
                      {new Date(pix.expiresAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    {pixOrderId && (
                      <p className="text-center text-xs text-text-muted/40">#{pixOrderId.slice(-8).toUpperCase()}</p>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => { setPix(null); setPixOrderId(null); }}
                    >
                      Cancelar
                    </Button>
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
                  Pagamento seguro via PIX (PagBank)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
