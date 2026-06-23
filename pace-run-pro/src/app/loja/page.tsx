"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Clock, Filter, Loader2, Search, ShoppingCart, Star, Trophy, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Product {
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
  coach: {
    slug: string | null;
    user: { name: string | null; avatarUrl: string | null };
  };
}

const SPORT_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "CORRIDA", label: "Corrida" },
  { value: "CICLISMO", label: "Ciclismo" },
  { value: "NATACAO", label: "Natação" },
  { value: "FORCA", label: "Força" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "Todos os níveis" },
  { value: "Iniciante", label: "Iniciante" },
  { value: "Intermediário", label: "Intermediário" },
  { value: "Avançado", label: "Avançado" },
];

const SPORT_EMOJI: Record<string, string> = {
  CORRIDA: "🏃", CICLISMO: "🚴", NATACAO: "🏊", FORCA: "🏋️", GERAL: "⚡",
};

function fmtPrice(cents: number) {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProductCard({ p }: { p: Product }) {
  const coachName = p.coach.user.name ?? "Treinador";
  const initials = coachName.split(" ").slice(0, 2).map((n) => n[0]).join("");

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-shadow hover:shadow-md", p.featured && "ring-1 ring-primary/40")}>
      {/* Cover / placeholder */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        {p.featured && (
          <Badge variant="primary" className="absolute left-3 top-3 text-[10px]">Destaque</Badge>
        )}
        <span className="text-5xl">{SPORT_EMOJI[p.sport] ?? "📋"}</span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="font-display text-sm font-bold text-text leading-tight">{p.title}</p>
          <p className="mt-1 text-[11px] text-text-muted line-clamp-2">{p.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">{p.level}</span>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">
            <Clock className="mr-0.5 inline h-2.5 w-2.5" />{p.durationWeeks} semanas
          </span>
          {p.weeklyHoursMin && (
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-text-muted">
              {p.weeklyHoursMin}{p.weeklyHoursMax ? `–${p.weeklyHoursMax}` : ""}h/sem
            </span>
          )}
        </div>

        {/* Stats */}
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

        {/* Coach */}
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={p.coach.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-[11px] text-text-muted truncate">{coachName}</span>
          <span className="font-display font-bold text-sm text-primary">{fmtPrice(p.priceCents)}</span>
        </div>

        <Button size="sm" className="w-full gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5" />
          {p.priceCents === 0 ? "Acessar grátis" : "Comprar plano"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LojaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (level) params.set("level", level);
    setLoading(true);
    fetch(`/api/loja?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [sport, level]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.coach.user.name ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const featured = filtered.filter((p) => p.featured);
  const rest     = filtered.filter((p) => !p.featured);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <Badge variant="primary">Loja de planilhas</Badge>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-text sm:text-4xl">
          Treine com planilhas de especialistas
        </h1>
        <p className="mt-3 text-sm text-text-muted max-w-lg mx-auto">
          Compre planos de treino criados por treinadores certificados. Conecte o Strava e acompanhe
          sua evolução automaticamente.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/cadastro?perfil=atleta_independente">
            <Button>Criar conta grátis</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Já tenho conta</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Filter className="h-4 w-4 text-text-muted shrink-0" />
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar planos ou treinadores…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-sm text-text outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex gap-2">
          {SPORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSport(o.value)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                sport === o.value
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card text-text-muted hover:border-primary/30 hover:text-text"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-text outline-none focus:border-primary/60"
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-card">{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-text-muted/40" />
          <p className="text-sm font-semibold text-text">Nenhum plano encontrado</p>
          <p className="text-xs text-text-muted mt-1">Tente outros filtros ou volte em breve.</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-text">Em destaque</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="mb-4 font-display text-lg font-bold text-text">Todos os planos</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
