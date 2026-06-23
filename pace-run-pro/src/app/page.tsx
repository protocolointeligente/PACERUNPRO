import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart2,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Globe,
  HeartPulse,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { platformStats, testimonials, integrationLogos } from "@/lib/mock-data";
import { PricingSection } from "@/components/landing/pricing-section";
import { PlatformShowcase } from "@/components/landing/platform-showcase";
import { ComparisonTable } from "@/components/landing/comparison-table";

// ── Feature data by persona ────────────────────────────────────────────────
const athleteFeatures = [
  { icon: CalendarDays, title: "Plano liberado semana a semana", text: "Sem ansiedade de ver o ciclo todo. Você vê só o que importa agora." },
  { icon: HeartPulse, title: "Check-in inteligente pós-treino", text: "60 segundos de resposta. O motor ajusta a próxima sessão automaticamente." },
  { icon: BarChart2, title: "Evolução em gráficos", text: "Pace, FC, VO2máx, peso, curva de pico de pace — tudo num só lugar." },
  { icon: Zap, title: "Sincroniza com seu relógio", text: "Strava, Garmin, Polar, Coros, Apple Watch — dados automáticos sem ação manual." },
  { icon: ShoppingBag, title: "Loja de planilhas", text: "Compre planos de treinadores certificados sem precisar de um treinador fixo." },
  { icon: Brain, title: "IA Treinadora", text: "Tire dúvidas de treino a qualquer hora com uma IA que conhece seu perfil." },
];

const coachFeatures = [
  { icon: Brain, title: "Prescrição inteligente com IA", text: "Sugestões de pace, volume e RPE baseadas no histórico de cada atleta." },
  { icon: Bell, title: "Alertas de risco automáticos", text: "Saiba antes do atleta se algo vai sair dos trilhos. Overtraining detectado em 48h." },
  { icon: CalendarDays, title: "Liberação semanal controlada", text: "O atleta só vê o que você liberar — controle total sobre o planejamento." },
  { icon: BarChart2, title: "Relatórios PDF profissionais", text: "Prontos para enviar em 1 clique, com design premium e dados reais." },
  { icon: Dumbbell, title: "Prescrição de força integrada", text: "Exercícios, séries, repetições, GIFs de execução — tudo na mesma plataforma." },
  { icon: TrendingUp, title: "Análise de carga semanal", text: "CTL, ATL e TSB calculados automaticamente para toda a sua base de atletas." },
];

const agencyFeatures = [
  { icon: Users, title: "Multi-treinadores", text: "Vários treinadores em uma conta, cada um com sua equipe e visão separada." },
  { icon: Globe, title: "White-label", text: "Sua logo e seu domínio — seus atletas nunca saem da sua marca." },
  { icon: Building2, title: "Painel administrativo", text: "Visão completa da saúde da assessoria: atletas ativos, MRR, inadimplência." },
  { icon: ShoppingBag, title: "Biblioteca de equipe", text: "Templates de treino compartilhados entre todos os treinadores da assessoria." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-text">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
          </Link>

          {/* Center links */}
          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: "Para Atletas", href: "#para-atletas" },
              { label: "Para Treinadores", href: "#para-treinadores" },
              { label: "Loja", href: "/loja" },
              { label: "Preços", href: "#precos" },
              { label: "Integrações", href: "#integracoes" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm text-text-muted transition-colors hover:bg-card-hover hover:text-text"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-text-muted hover:text-text transition-colors md:block">
              Entrar
            </Link>
            <Link href="/cadastro">
              <Button variant="primary" size="sm" className="gap-1.5">
                Começar grátis <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-8 sm:pt-28 sm:pb-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_1000px_600px_at_50%_-10%,rgba(124,58,237,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_400px_at_90%_40%,rgba(255,107,53,0.07),transparent_55%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 text-center">
          <Badge variant="primary" className="mb-5 text-xs">
            <Star className="h-3 w-3" fill="currentColor" />
            A plataforma de treino mais completa do Brasil
          </Badge>

          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Treine mais inteligente.{" "}
            <span className="gradient-text">Alcance mais longe.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-muted">
            A plataforma que conecta atletas e treinadores com tecnologia, dados e inteligência artificial — para quem quer resultados reais.
          </p>

          {/* ── Persona split (core TrainingPeaks element) ─────────────────── */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Atleta */}
            <Link href="/cadastro?perfil=atleta_independente" className="group block">
              <div className="relative rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/8 to-card p-7 text-left transition-all duration-300 hover:border-sky-500/60 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-0.5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl font-bold text-text">Sou atleta</h2>
                <p className="mt-1.5 text-sm text-text-muted">Acompanhe sua evolução, siga seu plano e alcance seu próximo recorde.</p>
                <ul className="mt-4 space-y-1.5">
                  {["Plano personalizado semana a semana", "Check-in pós-treino inteligente", "Gráficos de evolução em tempo real", "Loja de planilhas de treinadores"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:gap-3 transition-all">
                  Começar como atleta <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Treinador / Assessoria */}
            <Link href="/cadastro?perfil=treinador" className="group block">
              <div className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/8 to-card p-7 text-left transition-all duration-300 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                  <Users className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl font-bold text-text">Sou treinador</h2>
                <p className="mt-1.5 text-sm text-text-muted">Prescreva treinos, monitore atletas e escale sua assessoria com inteligência.</p>
                <ul className="mt-4 space-y-1.5">
                  {["Prescrição de corrida e força com IA", "Alertas de risco automáticos", "Liberação semanal controlada", "Relatórios PDF profissionais"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-violet-400 group-hover:gap-3 transition-all">
                  Começar como treinador <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: `${platformStats.coaches}+`, label: "Treinadores ativos" },
              { value: `${(platformStats.athletes / 1000).toFixed(1)}k`, label: "Atletas gerenciados" },
              { value: `${(platformStats.workoutsPrescribed / 1000).toFixed(0)}k+`, label: "Treinos prescritos" },
              { value: `${platformStats.countriesActive}`, label: "Países ativos" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-5 text-center">
                <div className="font-display text-2xl font-extrabold gradient-text sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform showcase ──────────────────────────────────────────────── */}
      <PlatformShowcase />

      {/* ── Para Atletas ───────────────────────────────────────────────────── */}
      <section id="para-atletas" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <Badge variant="info" className="mb-4">Para Atletas</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Seu melhor desempenho,{" "}
              <span className="text-sky-400">com dados reais</span>
            </h2>
            <p className="mt-4 text-text-muted">
              Seja com ou sem treinador, a plataforma adapta o plano ao seu ritmo, percebe sinais de overtraining antes de você e mostra sua evolução em gráficos claros.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/cadastro?perfil=atleta_independente">
                <Button variant="primary" size="sm" className="gap-2">
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/loja">
                <Button variant="outline" size="sm">Ver loja de planilhas</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {athleteFeatures.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="glass border-border/50">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-1.5 font-display font-semibold text-text">{title}</h4>
                  <p className="text-sm text-text-muted">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Treinadores ───────────────────────────────────────────────── */}
      <section id="para-treinadores" className="py-24 sm:py-32 bg-card/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <Badge variant="primary" className="mb-4">Para Treinadores</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Prescreva mais rápido.{" "}
              <span className="gradient-text">Monitore melhor.</span>
            </h2>
            <p className="mt-4 text-text-muted">
              Reduza o tempo de prescrição de horas para minutos. Fique por dentro da evolução de cada atleta sem precisar esperar o próximo treino.
            </p>
            <div className="mt-6">
              <Link href="/cadastro?perfil=treinador">
                <Button variant="primary" size="sm" className="gap-2">
                  Testar gratuitamente <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coachFeatures.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="glass border-border/50">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-1.5 font-display font-semibold text-text">{title}</h4>
                  <p className="text-sm text-text-muted">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Assessorias ───────────────────────────────────────────────── */}
      <section id="para-assessorias" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <Badge variant="success" className="mb-4">Para Assessorias</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Escale sua equipe.{" "}
              <span className="text-lime-400">Centralize tudo.</span>
            </h2>
            <p className="mt-4 text-text-muted">
              De 2 a 200 treinadores, o Pace Run Pro mantém sua assessoria organizada, com white-label, biblioteca compartilhada e painel de gestão completo.
            </p>
            <div className="mt-6">
              <Link href="/cadastro?perfil=assessoria">
                <Button variant="primary" size="sm" className="gap-2">
                  Conhecer o plano Assessoria <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agencyFeatures.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="glass border-border/50">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/10 text-lime-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-1.5 font-display font-semibold text-text">{title}</h4>
                  <p className="text-sm text-text-muted">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparativo ────────────────────────────────────────────────────── */}
      <ComparisonTable />

      {/* ── Integrações ────────────────────────────────────────────────────── */}
      <section id="integracoes" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">Integrações</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Conecte seus{" "}
              <span className="gradient-text">dispositivos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Integração nativa com Strava já disponível. Garmin, Polar, Coros e Apple Watch chegam automaticamente — sem ação manual.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {integrationLogos.map((integration) => (
              <div
                key={integration.id}
                className="glass flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium text-text"
              >
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: integration.color }} />
                {integration.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ─────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Depoimentos ────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
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
                  <div className="mb-4 flex gap-0.5">
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

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="glass rounded-3xl border border-primary/20 p-10 text-center sm:p-16">
            <div className="mb-6 flex justify-center">
              <Image
                src="/brand/pace-run-pro-logo.jpg"
                alt="Pace Run Pro"
                width={1179}
                height={622}
                className="h-auto w-full max-w-xs rounded-2xl"
              />
            </div>
            <h2 className="font-display text-3xl font-extrabold sm:text-5xl">
              Pronto para treinar com{" "}
              <span className="gradient-text">mais inteligência?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-text-muted">
              {platformStats.coaches}+ treinadores e {(platformStats.athletes / 1000).toFixed(1)}k atletas já usam o Pace Run Pro.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/cadastro?perfil=atleta_independente" className="block">
                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/8 p-5 text-left transition-colors hover:border-sky-500/60 cursor-pointer">
                  <HeartPulse className="mb-2 h-6 w-6 text-sky-400" />
                  <p className="font-semibold text-text">Sou atleta</p>
                  <p className="text-xs text-text-muted mt-0.5">Começo grátis, sem cartão</p>
                </div>
              </Link>
              <Link href="/cadastro?perfil=treinador" className="block">
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/8 p-5 text-left transition-colors hover:border-violet-500/60 cursor-pointer">
                  <Users className="mb-2 h-6 w-6 text-violet-400" />
                  <p className="font-semibold text-text">Sou treinador</p>
                  <p className="text-xs text-text-muted mt-0.5">14 dias grátis, cancelo quando quiser</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/">
                <Logo size={30} />
              </Link>
              <p className="mt-3 max-w-xs text-sm text-text-muted">
                A plataforma que conecta atletas e treinadores com tecnologia, dados e inteligência artificial.
              </p>
              <p className="mt-2 text-xs text-text-muted">Performance · Ciência · Propósito</p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Para atletas</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#para-atletas" className="text-text-muted hover:text-text transition-colors">Funcionalidades</a></li>
                <li><Link href="/loja" className="text-text-muted hover:text-text transition-colors">Loja de planilhas</Link></li>
                <li><Link href="/cadastro?perfil=atleta_independente" className="text-text-muted hover:text-text transition-colors">Criar conta grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Para treinadores</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#para-treinadores" className="text-text-muted hover:text-text transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="text-text-muted hover:text-text transition-colors">Planos e preços</a></li>
                <li><Link href="/cadastro?perfil=treinador" className="text-text-muted hover:text-text transition-colors">Começar 14 dias grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#integracoes" className="text-text-muted hover:text-text transition-colors">Integrações</a></li>
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
