import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  period: string;
  features: string[];
  highlight: boolean;
  maxSlots: number | null;
  usedSlots: number;
}

interface PublicProfile {
  name: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  credential: string | null;
  specialties: string[];
  logoUrl: string | null;
  whatsapp: string | null;
  slug: string | null;
  plans: PublicPlan[];
}

const PERIOD_LABELS: Record<string, string> = {
  MENSAL: "/mês",
  TRIMESTRAL: "/trimestre",
  SEMESTRAL: "/semestre",
  ANUAL: "/ano",
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getProfile(slug: string): Promise<PublicProfile | null> {
  // Demo fallback — returns mock data for "ricardo-pace" during development
  if (slug === "ricardo-pace") {
    return {
      name: "Ricardo Luiz Pace Júnior",
      city: "Belo Horizonte",
      state: "MG",
      bio: "Treinador de corrida há mais de 10 anos. Especialista em provas de rua e triathlon. Metodologia baseada em ciência do esporte e periodização inteligente.",
      credential: "CREF 014626-G/MG",
      specialties: ["Corrida de rua", "Meia maratona", "Maratona", "Triathlon"],
      logoUrl: null,
      whatsapp: "5531999999999",
      slug: "ricardo-pace",
      plans: [
        { id: "p1", name: "Corrida Iniciante", description: "Para quem está começando ou voltando às corridas.", priceCents: 14900, period: "MENSAL", features: ["Planilha semanal personalizada", "Check-in quinzenal", "1 ajuste/mês", "Suporte WhatsApp"], highlight: false, maxSlots: 20, usedSlots: 13 },
        { id: "p2", name: "Performance 10K / Meia", description: "Para corredores com base que querem melhorar o tempo.", priceCents: 19900, period: "MENSAL", features: ["Prescrição VDOT avançada", "Check-in semanal com análise", "Treino de força integrado", "Relatório mensal PDF", "Suporte prioritário"], highlight: true, maxSlots: null, usedSlots: 0 },
        { id: "p3", name: "Assessoria Premium", description: "Acompanhamento completo para maratonistas.", priceCents: 29900, period: "MENSAL", features: ["Tudo do plano Performance", "Análise de GPS pós-treino", "Videochamada mensal", "Preparação específica para provas"], highlight: false, maxSlots: 10, usedSlots: 7 },
      ],
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const coach = await prisma.coach.findUnique({
      where: { slug },
      include: {
        user: { select: { name: true, city: true, state: true } },
        plans: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!coach) return null;
    return {
      name: coach.user.name,
      city: coach.user.city,
      state: coach.user.state,
      bio: coach.publicBio ?? coach.bio,
      credential: coach.credential,
      specialties: coach.specialties,
      logoUrl: coach.logoUrl,
      whatsapp: coach.whatsapp,
      slug: coach.slug,
      plans: coach.plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        period: p.period,
        features: p.features,
        highlight: p.highlight,
        maxSlots: p.maxSlots,
        usedSlots: p.usedSlots,
      })),
    };
  } catch {
    return null;
  }
}

export default async function PublicAssessoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const initials = profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="min-h-screen bg-bg">
      {/* Header bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="font-display text-sm font-bold text-primary">PACE RUN PRO</Link>
          <Badge variant="outline" className="text-[10px]">Powered by Pace Run Pro</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-5 py-10">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-white shadow-lg">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt={profile.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              initials
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-extrabold text-text sm:text-4xl">{profile.name}</h1>
            {profile.credential && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-text-muted sm:justify-start">
                <ShieldCheck className="h-4 w-4 text-success" />{profile.credential}
              </p>
            )}
            {(profile.city || profile.state) && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-text-muted sm:justify-start">
                <MapPin className="h-3.5 w-3.5" />{[profile.city, profile.state].filter(Boolean).join(", ")}
              </p>
            )}
            {profile.bio && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">{profile.bio}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.specialties.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section>
          <h2 className="mb-6 font-display text-xl font-bold text-text">Planos disponíveis</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.plans.map((plan) => {
              const isFull = plan.maxSlots !== null && plan.usedSlots >= plan.maxSlots;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all",
                    plan.highlight ? "border-accent/50 bg-accent/5 shadow-accent/10" : "border-border bg-card"
                  )}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" className="gap-1 shadow whitespace-nowrap">
                        <Star className="h-2.5 w-2.5" /> Mais popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="font-display text-lg font-bold text-text">{plan.name}</h3>
                    {plan.description && <p className="mt-1 text-xs text-text-muted">{plan.description}</p>}
                  </div>

                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="font-display text-3xl font-extrabold text-text">R$ {formatBRL(plan.priceCents)}</span>
                      <span className="mb-0.5 text-sm text-text-muted">{PERIOD_LABELS[plan.period] ?? "/mês"}</span>
                    </div>
                    {plan.maxSlots !== null && (
                      <p className={cn("mt-1 text-xs font-medium", isFull ? "text-danger" : "text-text-muted")}>
                        {isFull ? "Vagas esgotadas" : `${plan.maxSlots - plan.usedSlots} vagas disponíveis`}
                      </p>
                    )}
                  </div>

                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/onboarding/assessoria?plano=${slug}-${plan.id}`}>
                    <Button
                      variant={plan.highlight ? "primary" : "outline"}
                      className="w-full"
                      disabled={isFull}
                    >
                      {isFull ? "Vagas esgotadas" : "Quero começar"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* WhatsApp CTA */}
        {profile.whatsapp && (
          <section className="rounded-2xl border border-success/20 bg-success/5 p-6 text-center">
            <p className="mb-1 font-display text-lg font-bold text-text">Tem dúvidas?</p>
            <p className="mb-4 text-sm text-text-muted">Fale diretamente comigo antes de assinar.</p>
            <a
              href={`https://wa.me/${profile.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="success" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </Button>
            </a>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-text-muted">
        Plataforma de corrida gerenciada pelo{" "}
        <Link href="/" className="text-primary hover:underline">Pace Run Pro</Link>
      </footer>
    </div>
  );
}
