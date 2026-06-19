import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  platformStats,
  testimonials,
  landingFeatures,
  integrationLogos,
} from "@/lib/mock-data";
import { PricingSection } from "@/components/landing/pricing-section";
import { PlatformShowcase } from "@/components/landing/platform-showcase";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { AboutCoachSection } from "@/components/landing/about-coach";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size={34} />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#funcionalidades" className="text-sm text-text-muted transition-colors hover:text-text">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm text-text-muted transition-colors hover:text-text">
              Preços
            </a>
            <a href="#integracoes" className="text-sm text-text-muted transition-colors hover:text-text">
              Integrações
            </a>
          </div>
          <Link href="/login">
            <Button variant="primary" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_1000px_600px_at_50%_-10%,rgba(124,58,237,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_700px_500px_at_100%_30%,rgba(255,107,53,0.08),transparent_55%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Badge variant="primary" className="mb-6 text-xs">
            <Star className="h-3 w-3" fill="currentColor" />
            Sistema operacional para assessorias esportivas
          </Badge>
          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            A plataforma para assessorias{" "}
            <span className="gradient-text">escalarem com menos trabalho.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
            Crie treinos em minutos, monitore atletas automaticamente, detecte riscos antes das
            lesões e controle alunos, cobrança e evolução em um único sistema.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/cadastro?perfil=treinador">
              <Button variant="primary" size="lg" className="gap-2">
                Testar como treinador <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/treinador/dashboard">
              <Button variant="outline" size="lg">
                Ver demonstração
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: `${platformStats.coaches}+`, label: "Treinadores ativos" },
              { value: `${(platformStats.athletes / 1000).toFixed(1)}k`, label: "Atletas gerenciados" },
              { value: `${(platformStats.workoutsPrescribed / 1000).toFixed(0)}k+`, label: "Treinos prescritos" },
              { value: `${platformStats.countriesActive}`, label: "Países ativos" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center">
                <div className="font-display text-3xl font-extrabold gradient-text">{stat.value}</div>
                <div className="mt-1 text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform showcase */}
      <PlatformShowcase />

      {/* Features */}
      <section id="funcionalidades" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="info" className="mb-4">Funcionalidades</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Tudo que sua assessoria{" "}
              <span className="gradient-text">precisa em um lugar</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Do treinador solo à grande assessoria — cada módulo foi pensado para reduzir
              trabalho repetitivo e aumentar a qualidade da prescrição.
            </p>
          </div>

          <div className="space-y-16">
            {landingFeatures.map((l) => (
              <div key={l.persona}>
                <div className="mb-8 flex items-center gap-3">
                  <div
                    className="h-1.5 w-8 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <h3 className="font-display text-2xl font-bold" style={{ color: l.color }}>
                    {l.persona}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {l.items.map((item) => (
                    <Card key={item.title} className="glass border-border/50">
                      <CardContent className="p-6">
                        <div className="mb-3 text-3xl">{item.icon}</div>
                        <h4 className="mb-1 font-display font-semibold text-text">{item.title}</h4>
                        <p className="text-sm text-text-muted">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <ComparisonTable />

      {/* Integrations */}
      <section id="integracoes" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">Integrações</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Preparado para seus{" "}
              <span className="gradient-text">dispositivos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Integração nativa com Strava já disponível. Suporte a Garmin, Polar, Coros e Apple
              Watch em desenvolvimento — os dados chegarão automaticamente, sem ação manual.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {integrationLogos.map((integration) => (
              <div
                key={integration.id}
                className="glass flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium text-text"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: integration.color }}
                />
                {integration.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About the coach */}
      <AboutCoachSection />

      {/* Pricing */}
      <PricingSection />

      {/* Testimonials */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="success" className="mb-4">Depoimentos</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Quem usa,{" "}
              <span className="gradient-text">aprova</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.id} className="glass border-border/50">
                <CardContent className="p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full gradient-primary font-display text-sm font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-text">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-warning" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-text-muted">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="glass rounded-3xl border border-primary/20 p-12 text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/brand/pace-run-pro-logo.jpg"
                alt="Pace Run Pro"
                width={1179}
                height={622}
                className="h-auto w-full max-w-sm rounded-2xl"
              />
            </div>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Pare de perder tempo em planilhas.{" "}
              <span className="gradient-text">Escale sua assessoria.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-text-muted">
              {platformStats.coaches}+ treinadores já gerenciam seus atletas com o Pace Run Pro.
              Comece grátis e veja a diferença na primeira semana.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/cadastro?perfil=treinador">
                <Button variant="primary" size="lg" className="gap-2">
                  Testar como treinador <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/treinador/dashboard">
                <Button variant="outline" size="lg">
                  Agendar demonstração
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link href="/">
                <Logo size={30} />
              </Link>
              <p className="mt-3 text-sm text-text-muted">
                Performance · Ciência · Propósito
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Produto
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#funcionalidades" className="text-text-muted hover:text-text transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="text-text-muted hover:text-text transition-colors">Preços</a></li>
                <li><a href="#integracoes" className="text-text-muted hover:text-text transition-colors">Integrações</a></li>
                <li><Link href="/treinador/dashboard" className="text-text-muted hover:text-text transition-colors">Demonstração</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Empresa
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Sobre nós</a></li>
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Blog</a></li>
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Carreiras</a></li>
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Parceiros</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
                Suporte
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Central de ajuda</a></li>
                <li><a href="#" className="text-text-muted hover:text-text transition-colors">Contato</a></li>
                <li><Link href="/termos" className="text-text-muted hover:text-text transition-colors">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="text-text-muted hover:text-text transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-8 text-xs text-text-muted sm:flex-row">
            <span>© 2026 PACE RUN PRO — CREF 014626-G/MG</span>
            <span>Responsável técnico: Ricardo Luiz Pace Júnior</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
