import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ExternalLink, Link2, MessageCircle, User } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CoachPublicPageManager() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      credential: true,
      bio: true,
      publicBio: true,
      specialties: true,
      whatsapp: true,
      logoUrl: true,
      user: { select: { name: true, email: true, avatarUrl: true } },
      plans: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: { id: true, name: true, priceCents: true, period: true },
      },
    },
  });

  if (!coach) redirect("/login");

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";
  const publicUrl = `${origin}/p/${coach.slug ?? coach.id}`;
  const inviteUrl = `${origin}/convite/${coach.slug ?? coach.id}`;
  const imageUrl = coach.logoUrl ?? coach.user.avatarUrl;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Minha página</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Página pública da assessoria</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Revise como sua assessoria aparece para atletas antes do convite ou contratação.
          </p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          Abrir pública <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <User className="h-7 w-7" />
                </span>
              )}
              <div>
                <h2 className="font-display text-xl font-bold text-text">{coach.user.name}</h2>
                <p className="text-sm text-text-muted">{coach.credential ?? coach.user.email}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-muted">
              {coach.publicBio ?? coach.bio ?? "Adicione uma bio pública no perfil para explicar sua assessoria."}
            </p>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.length === 0 ? (
                <Badge variant="outline">Sem especialidades cadastradas</Badge>
              ) : coach.specialties.map((specialty) => <Badge key={specialty} variant="outline">{specialty}</Badge>)}
            </div>
            {coach.whatsapp && (
              <p className="inline-flex items-center gap-2 text-sm text-text-muted">
                <MessageCircle className="h-4 w-4 text-primary" />
                {coach.whatsapp}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-bold text-text">Links de aquisição</h2>
            <LinkBox icon={<Link2 className="h-4 w-4" />} label="Página pública" value={publicUrl} />
            <LinkBox icon={<Link2 className="h-4 w-4" />} label="Convite direto" value={inviteUrl} />
            <div className="rounded-xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-info">
              O convite mantém o coachId isolado para evitar atleta e pagamento caindo na assessoria errada.
            </div>
            <Link href="/treinador/perfil" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              Editar dados públicos
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-display text-lg font-bold text-text">Planos ativos exibidos</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {coach.plans.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum plano ativo. Crie planos de venda para aparecerem no convite.</p>
            ) : coach.plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border bg-card-hover/60 p-4">
                <p className="font-semibold text-text">{plan.name}</p>
                <p className="mt-1 text-sm text-text-muted">{plan.period.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LinkBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">{icon}{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
