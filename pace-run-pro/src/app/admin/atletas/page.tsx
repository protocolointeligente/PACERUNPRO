import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, BadgeCheck, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default async function AdminAthletesPage() {
  const [totalAthletes, activeAthletes, linkedAthletes, paidPurchases, athletes] = await Promise.all([
    prisma.athlete.count({ where: { deletedAt: null } }),
    prisma.athlete.count({ where: { deletedAt: null, status: "ativo" } }),
    prisma.athlete.count({ where: { deletedAt: null, coachId: { not: null } } }),
    prisma.planPurchase.count({ where: { status: "paid" } }),
    prisma.athlete.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        adherenceRate: true,
        recoveryScore: true,
        createdAt: true,
        user: { select: { name: true, email: true, city: true, state: true, avatarUrl: true } },
        coach: { select: { id: true, user: { select: { name: true } } } },
        planPurchases: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            pricePaidCents: true,
            product: { select: { title: true, priceCents: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Badge variant="info">Atletas</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Controle de atletas</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Visao operacional para o super admin acompanhar atletas, vinculo com treinador e status de pagamento.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric icon={<Users className="h-5 w-5" />} label="Total" value={String(totalAthletes)} />
        <Metric icon={<Activity className="h-5 w-5" />} label="Ativos" value={String(activeAthletes)} />
        <Metric icon={<UserCheck className="h-5 w-5" />} label="Com treinador" value={String(linkedAthletes)} />
        <Metric icon={<BadgeCheck className="h-5 w-5" />} label="Pagantes" value={String(paidPurchases)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold text-text">Ultimos atletas cadastrados</h2>
            <p className="text-sm text-text-muted">Sem dados simulados. Lista limitada aos 30 mais recentes.</p>
          </div>
          <div className="divide-y divide-border">
            {athletes.length === 0 ? (
              <div className="px-5 py-10 text-sm text-text-muted">Nenhum atleta cadastrado.</div>
            ) : (
              athletes.map((athlete) => {
                const purchase = athlete.planPurchases[0];
                return (
                  <div key={athlete.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      {athlete.user.avatarUrl ? (
                        <img src={athlete.user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {initials(athlete.user.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">{athlete.user.name}</p>
                        <p className="truncate text-xs text-text-muted">{athlete.user.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-muted">Treinador</p>
                      <p className="text-sm font-semibold text-text">{athlete.coach?.user.name ?? "Sem treinador"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-muted">Plano</p>
                      <p className="text-sm font-semibold text-text">{purchase?.product.title ?? "Sem plano"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-muted">Pagamento</p>
                      <Badge variant={purchase?.status === "paid" ? "success" : purchase ? "warning" : "outline"}>
                        {purchase?.status === "paid" ? money(purchase.pricePaidCents || purchase.product.priceCents) : purchase?.status ?? "Nao iniciado"}
                      </Badge>
                    </div>
                    <Link href={`/admin/usuarios?athlete=${athlete.id}`} className="text-sm font-semibold text-primary">
                      Gerenciar
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
