import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ExternalLink, Package, ShoppingBag, Star } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function PlanStoreManagerPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      slug: true,
      planProducts: {
        orderBy: [{ published: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          sport: true,
          level: true,
          durationWeeks: true,
          weeklyHoursMin: true,
          weeklyHoursMax: true,
          goal: true,
          priceCents: true,
          currency: true,
          published: true,
          featured: true,
          purchases: true,
          rating: true,
          ratingCount: true,
          included: true,
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";
  const storeUrl = `${origin}/loja${coach.slug ? `?coach=${coach.slug}` : ""}`;
  const published = coach.planProducts.filter((product) => product.published);
  const revenue = coach.planProducts.reduce((sum, product) => sum + product.purchases * product.priceCents, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Loja de planos</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Planilhas e produtos digitais</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Esta area substitui o redirecionamento antigo e mostra o que esta publicado, vendido e pronto para ajustar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={storeUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Abrir loja <ExternalLink className="h-4 w-4" />
          </a>
          <Link href="/treinador/minha-loja" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            Gerenciar loja
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Produtos" value={String(coach.planProducts.length)} icon={<Package className="h-5 w-5" />} />
        <Metric label="Publicados" value={String(published.length)} icon={<ShoppingBag className="h-5 w-5" />} />
        <Metric label="Vendas" value={String(coach.planProducts.reduce((sum, product) => sum + product.purchases, 0))} icon={<Star className="h-5 w-5" />} />
        <Metric label="Receita bruta" value={money(revenue)} icon={<ShoppingBag className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coach.planProducts.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-start gap-4 p-8">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-display text-xl font-bold text-text">Nenhum produto na loja</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Crie produtos de corrida, ciclismo, natacao, triathlon ou forca para vender fora do acompanhamento individual.
                </p>
              </div>
              <Link href="/treinador/minha-loja" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                Configurar produto
              </Link>
            </CardContent>
          </Card>
        ) : coach.planProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                  {product.featured && <Badge variant="warning">Destaque</Badge>}
                  <Badge variant={product.published ? "success" : "outline"}>{product.published ? "Publicado" : "Rascunho"}</Badge>
                </div>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-text">{product.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">{product.description || "Sem descricao."}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                <span>{product.sport}</span>
                <span>{product.level}</span>
                <span>{product.durationWeeks} semanas</span>
                <span>{product.weeklyHoursMin ?? 0}-{product.weeklyHoursMax ?? 0} h/sem</span>
                <span>{product.purchases} venda(s)</span>
                <span>{product.rating ? `${product.rating.toFixed(1)} (${product.ratingCount})` : "sem avaliacao"}</span>
              </div>
              {product.included.length > 0 && (
                <ul className="space-y-1 text-xs text-text-muted">
                  {product.included.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-bold text-text">{money(product.priceCents)}</p>
                <a href={`${origin}/loja/${product.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary">
                  Ver <ExternalLink className="inline h-3.5 w-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
