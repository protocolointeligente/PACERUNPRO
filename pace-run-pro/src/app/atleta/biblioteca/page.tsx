"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  ShoppingBag,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  sport: string;
  level: string;
  goal: string;
  durationWeeks: number;
  priceCents: number;
  coverUrl: string | null;
  coach: { user: { name: string; avatarUrl: string | null } };
}

interface PurchaseItem {
  id: string;
  createdAt: string;
  product: Product;
  activatedPlanId: string | null;
}

const SPORT_LABELS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  FORCA: "Força",
  GERAL: "Geral",
};

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
  ELITE: "Elite",
};

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultramaratona",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

// ─── Activate Modal ───────────────────────────────────────────────────────────

function ActivateModal({
  purchase,
  onClose,
  onActivated,
}: {
  purchase: PurchaseItem;
  onClose: () => void;
  onActivated: (planId: string) => void;
}) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Default to next Monday
    const day = d.getDay();
    const daysUntilMon = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + daysUntilMon);
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/atleta/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId: purchase.id, startDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao ativar plano");
        return;
      }
      onActivated(data.planId);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="activate-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="activate-modal-title" className="font-display text-lg font-bold text-text">Ativar plano</h2>
            <p className="text-sm text-text-muted mt-0.5">{purchase.product.title}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-text-muted hover:text-text p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-text-muted">
          Escolha a data de início. O plano de{" "}
          <strong>{purchase.product.durationWeeks} semanas</strong> será carregado no seu
          calendário a partir dessa data.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Data de início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button className="flex-1 gap-1.5" onClick={handleActivate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            {loading ? "Ativando…" : "Ativar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BibliotecaPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<PurchaseItem | null>(null);

  useEffect(() => {
    fetch("/api/atleta/biblioteca")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.purchases) setPurchases(d.purchases); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function handleActivated(planId: string) {
    setActivating(null);
    router.push(`/atleta/planos?planId=${planId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-text">Minha biblioteca</h1>
        </div>
        <Link href="/loja">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            Explorar loja
          </Button>
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <BookOpen className="h-10 w-10 text-text-muted/50" />
          <div>
            <p className="font-semibold text-text">Nenhum plano adquirido ainda</p>
            <p className="mt-1 text-sm text-text-muted">
              Visite a loja para encontrar planos de treino de especialistas.
            </p>
          </div>
          <Link href="/loja">
            <Button className="gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Ir para a loja
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {/* Cover */}
                  <div className="shrink-0">
                    {p.product.coverUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.product.coverUrl}
                        alt={p.product.title}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="primary" className="text-[10px]">
                        {SPORT_LABELS[p.product.sport] ?? p.product.sport}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{LEVEL_LABELS[p.product.level] ?? p.product.level}</Badge>
                      {p.product.goal && (
                        <Badge variant="outline" className="text-[10px]">
                          {GOAL_LABELS[p.product.goal] ?? p.product.goal}
                        </Badge>
                      )}
                    </div>

                    <p className="font-semibold text-text leading-tight truncate">{p.product.title}</p>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.product.durationWeeks} semanas
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted">por {p.product.coach.user.name}</p>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                    {p.activatedPlanId ? (
                      <>
                        <div className="flex items-center gap-1 text-xs text-success font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ativado
                        </div>
                        <Link href="/atleta/planos">
                          <Button size="sm" variant="outline" className="text-xs">
                            Ver plano
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setActivating(p)}
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activating && (
        <ActivateModal
          purchase={activating}
          onClose={() => setActivating(null)}
          onActivated={handleActivated}
        />
      )}
    </div>
  );
}
