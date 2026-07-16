import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Package, ShoppingBag } from "lucide-react";
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

export default async function CoachStorePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      slug: true,
      planProducts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          sport: true,
          level: true,
          durationWeeks: true,
          priceCents: true,
          published: true,
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
  const grossSales = coach.planProducts.reduce((sum, product) => sum + product.priceCents * product.purchases, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Minha loja</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Produtos e planilhas</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Controle os produtos publicados para atletas independentes comprarem na loja.
          </p>
        </div>
        <a href={storeUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          Abrir loja <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Produtos" value={String(coach.planProducts.length)} />
        <Metric label="Publicados" value={String(published.length)} />
        <Metric label="Receita bruta" value={money(grossSales)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coach.planProducts.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-start gap-4 p-8">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-display text-xl font-bold text-text">Nenhum produto cadastrado</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Publique planilhas e modelos para transformar conhecimento em produto vendável.
                </p>
              </div>
              <Link href="/treinador/gestao#planos" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                Criar primeiro produto
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
                <Badge variant={product.published ? "success" : "outline"}>{product.published ? "Publicado" : "Rascunho"}</Badge>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-text">{product.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">{product.description || "Sem descrição."}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                <span>{product.sport}</span>
                <span>{product.level}</span>
                <span>{product.durationWeeks} semanas</span>
                <span>{product.purchases} venda(s)</span>
              </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold text-text">{value}</p>
      </CardContent>
    </Card>
  );
}
