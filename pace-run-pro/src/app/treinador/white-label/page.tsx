import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Globe2, Palette, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CoachWhiteLabelPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      slug: true,
      logoUrl: true,
      publicBio: true,
      specialties: true,
      whatsapp: true,
      user: {
        select: {
          name: true,
          billingSettings: {
            select: { receivingMethod: true, asaasAccountId: true, asaasWalletId: true },
          },
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const checks = [
    { label: "Slug público configurado", done: Boolean(coach.slug), icon: <Globe2 className="h-4 w-4" /> },
    { label: "Logo ou marca cadastrada", done: Boolean(coach.logoUrl), icon: <Palette className="h-4 w-4" /> },
    { label: "Bio pública preenchida", done: Boolean(coach.publicBio), icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Especialidades definidas", done: coach.specialties.length > 0, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Contato comercial informado", done: Boolean(coach.whatsapp), icon: <CheckCircle2 className="h-4 w-4" /> },
    {
      label: "Recebimento Asaas pronto",
      done: Boolean(coach.user.billingSettings?.receivingMethod === "ASAAS" && coach.user.billingSettings.asaasAccountId && coach.user.billingSettings.asaasWalletId),
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];
  const ready = checks.filter((check) => check.done).length;
  const percent = Math.round((ready / checks.length) * 100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Badge variant="primary">White Label</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Prontidão da marca própria</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Checklist operacional para publicar a experiência com identidade da assessoria.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Prontidão</p>
              <p className="mt-1 font-display text-4xl font-bold text-text">{percent}%</p>
            </div>
            <Link href="/treinador/perfil" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              Completar perfil
            </Link>
          </div>
          <span className="block h-2 rounded-full bg-card-hover">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <Card key={check.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", check.done ? "bg-success/12 text-success" : "bg-warning/12 text-warning")}>
                {check.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text">{check.label}</p>
                <p className="text-xs text-text-muted">{check.done ? "Concluído" : "Pendente"}</p>
              </div>
              <Badge variant={check.done ? "success" : "warning"}>{check.done ? "OK" : "Falta"}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
