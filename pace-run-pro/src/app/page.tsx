import Link from "next/link";
import {
  Activity,
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
  LogIn,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { integrationLogos, testimonials } from "@/lib/mock-data";
import { PricingSection } from "@/components/landing/pricing-section";
import { PlatformShowcase } from "@/components/landing/platform-showcase";
import { ComparisonTable } from "@/components/landing/comparison-table";

// ── Feature data ───────────────────────────────────────────────────────────────

const coachBenefits = [
  {
    icon: Brain,
    title: "Prescrição inteligente com IA",
    text: "Sugestões de pace, volume e RPE baseadas no histórico de cada atleta. Reduza horas de planejamento para minutos.",
  },
  {
    icon: Bell,
    title: "Alertas de risco automáticos",
    text: "Saiba antes do atleta se algo vai sair dos trilhos. Overtraining detectado em 48 horas com ação recomendada.",
  },
  {
    icon: CalendarDays,
    title: "Liberação semanal controlada",
    text: "O atleta só vê o que você liberar — controle total sobre o planejamento, sem spoiler de ciclos longos.",
  },
  {
    icon: BarChart2,
    title: "Carga calculada automaticamente",
    text: "CTL, ATL e TSB para toda a sua base, atualizados em tempo real. Decisões baseadas em ciência, não em intuição.",
  },
];

const athleteFeatures = [
  {
    icon: CalendarDays,
    title: "Plano liberado semana a semana",
    text: "Sem ansiedade de ver o ciclo todo. Você vê só o que importa agora — com contexto e objetivo claros.",
  },
  {
    icon: HeartPulse,
    title: "Check-in inteligente pós-treino",
    text: "60 segundos de resposta. O motor ajusta a próxima sessão automaticamente com base no que você sentiu.",
  },
  {
    icon: BarChart2,
    title: "Evolução em gráficos reais",
    text: "Pace, FC, VO2máx, curva de pico de pace — tudo num só lugar para você acompanhar o progresso.",
  },
  {
    icon: ShoppingBag,
    title: "Loja de planos de treino",
    text: "Compre planos de treinadores certificados sem precisar de um treinador fixo. Acesso imediato e vitalício.",
  },
];

const agencyFeatures = [
  {
    icon: Users,
    title: "Multi-treinadores",
    text: "Vários treinadores em uma conta, cada um com sua equipe e visão separada.",
  },
  {
    icon: Globe,
    title: "White-label",
    text: "Sua logo e seu domínio — seus atletas nunca saem da sua marca.",
  },
  {
    icon: Building2,
    title: "Painel administrativo",
    text: "Visão completa da saúde da assessoria: atletas ativos, MRR, inadimplência.",
  },
  {
    icon: ShoppingBag,
    title: "Biblioteca de equipe",
    text: "Templates de treino compartilhados entre todos os treinadores da assessoria.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Cadastre o atleta",
    desc: "Perfil completo com histórico, metas, zonas de treino e preferências de modalidade.",
    color: "#2563EB",
  },
  {
    step: "02",
    icon: CalendarDays,
    title: "Monte o plano semanal",
    desc: "Prescreva corrida e força com VDOT, zonas e carga calculada automaticamente.",
    color: "#C6F24E",
  },
  {
    step: "03",
    icon: Activity,
    title: "Acompanhe a execução",
    desc: "Check-ins diários, alertas de fadiga e sincronização com Strava em tempo real.",
    color: "#0891b2",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Ajuste pela carga",
    desc: "CTL, ATL e TSB para decisões inteligentes a cada semana. Menos lesão, mais resultado.",
    color: "#22c55e",
  },
];

// ── Inline product mockup — real dashboard layout ───────────────────────────

function HeroDashboardMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "#111827",
        display: "flex",
        height: "460px",
      }}
    >
      {/* Collapsed sidebar */}
      <div
        className="flex shrink-0 flex-col"
        style={{
          width: "52px",
          backgroundColor: "#0B1020",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center p-3 pb-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: "#2563EB" }}>
            <span className="font-display text-[8px] font-black text-white">P</span>
          </div>
        </div>
        {/* Nav icon slots */}
        <div className="flex-1 space-y-1 px-2 pt-3">
          {[true, false, false, false, false, false].map((active, i) => (
            <div
              key={i}
              className="flex h-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: active ? "rgba(37,99,235,0.18)" : "transparent" }}
            >
              <div
                className="h-3.5 w-3.5 rounded-sm"
                style={{ backgroundColor: active ? "#60a5fa" : "#334155" }}
              />
            </div>
          ))}
        </div>
        {/* Avatar */}
        <div className="p-2.5">
          <div
            className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ backgroundColor: "#2563EB" }}
          >
            R
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Browser chrome */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ backgroundColor: "#0B1020", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.45)" }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(234,179,8,0.45)" }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.45)" }} />
          </div>
          <div
            className="ml-1 flex-1 truncate rounded px-2 py-0.5 text-center text-[10px]"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
          >
            app.pacerunpro.com.br/treinador/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex-1 overflow-hidden p-4">
          {/* Greeting */}
          <div className="mb-4">
            <p className="text-[10px]" style={{ color: "#64748b" }}>Painel do treinador</p>
            <p className="text-sm font-bold leading-snug" style={{ color: "#f8fafc" }}>
              Olá, Ricardo 👋{" "}
              <span style={{ color: "#64748b", fontWeight: 400 }}>· Semana de 23 Jun</span>
            </p>
          </div>

          {/* Ações rápidas */}
          <div className="mb-3">
            <p
              className="mb-2 text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: "#475569" }}
            >
              Ações rápidas
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Criar treino", accent: "#2563EB" },
                { label: "Criar semana", accent: "#C6F24E" },
                { label: "Prescrever força", accent: "#0891b2" },
                { label: "Usar modelo", accent: "#059669" },
              ].map((a) => (
                <div
                  key={a.label}
                  className="rounded-lg p-2.5"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="mb-1.5 h-3.5 w-3.5 rounded-sm"
                    style={{ backgroundColor: a.accent + "40" }}
                  />
                  <p className="text-[9px] font-semibold" style={{ color: "#e2e8f0" }}>
                    {a.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* O que precisa de ação */}
          <div>
            <p
              className="mb-2 text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: "#475569" }}
            >
              O que precisa de ação hoje
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Sem treino esta semana", value: "3 atletas", color: "#FFB020" },
                { label: "Check-ins com alerta", value: "2", color: "#FFB020" },
                { label: "Treinos cumpridos", value: "18 / 21", color: "#22c55e" },
                { label: "Atletas totais", value: "24", color: "#60a5fa" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <p className="text-[9px]" style={{ color: "#94a3b8" }}>{item.label}</p>
                  <span className="text-[9px] font-bold" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Athlete list mockup ──────────────────────────────────────────────────────

function PrescriptionMock() {
  const ATHLETES = [
    { initials: "CA", name: "Camila Andrade", meta: "Meia · Sem. 18", adherence: 94, alert: false },
    { initials: "BM", name: "Bruno Martins", meta: "10k · Sem. 12", adherence: 81, alert: true },
    { initials: "RL", name: "Rafael Lima", meta: "Maratona · Sem. 24", adherence: 98, alert: false },
  ];

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-xl shadow-black/50"
      style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#111827" }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#0B1020", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.45)" }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(234,179,8,0.45)" }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.45)" }} />
        </div>
        <div
          className="ml-1 flex-1 truncate rounded px-2 py-0.5 text-center text-[10px]"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
        >
          /treinador/atletas
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Meus atletas</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: "rgba(37,99,235,0.15)", color: "#60a5fa" }}
          >
            24 ativos
          </span>
        </div>

        {/* Athlete rows */}
        {ATHLETES.map((a) => (
          <div
            key={a.initials}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2563eb, #3FA7FF)" }}
            >
              {a.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>{a.name}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>{a.meta}</p>
            </div>
            <div>
              {a.alert ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c" }}
                >
                  ⚠ Fadiga
                </span>
              ) : (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#4ade80" }}
                >
                  {a.adherence}%
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Prescription preview */}
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: "rgba(37,99,235,0.06)",
            border: "1px solid rgba(37,99,235,0.18)",
          }}
        >
          <p className="mb-1.5 text-[10px] font-semibold" style={{ color: "#60a5fa" }}>
            Semana 18 → Camila Andrade
          </p>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Rodagem 12km Z2", type: "run" },
              { label: "Força A", type: "strength" },
              { label: "Intervalado 8×400m", type: "run" },
              { label: "Força B", type: "strength" },
              { label: "Longão 22km", type: "run" },
            ].map((t) => (
              <span
                key={t.label}
                className="rounded px-1.5 py-0.5 text-[9px]"
                style={{
                  backgroundColor: t.type === "run"
                    ? "rgba(37,99,235,0.15)"
                    : "rgba(124,58,237,0.15)",
                  color: t.type === "run" ? "#60a5fa" : "#a78bfa",
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-text">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: "Para Treinadores", href: "#para-treinadores" },
              { label: "Para Atletas", href: "#para-atletas" },
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Loja", href: "/loja" },
              { label: "Preços", href: "#precos" },
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

          <div className="flex items-center gap-2">
            <ThemeToggle inline />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-text-muted transition-colors hover:text-text md:block"
            >
              Entrar
            </Link>
            {/* Mobile login icon */}
            <Link
              href="/login"
              aria-label="Entrar"
              className="flex items-center justify-center rounded-lg p-2 text-text-muted transition-colors hover:bg-card-hover hover:text-text md:hidden"
            >
              <LogIn className="h-5 w-5" />
            </Link>
            <Link href="/cadastro?perfil=treinador">
              <Button size="sm" className="gap-1.5">
                <span className="hidden sm:inline">Começar grátis</span>
                <span className="sm:hidden">Começar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-24">
        {/* Subtle directional light — blue only, no orange */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 800px 500px at 10% 0%, rgba(37,99,235,0.09) 0%, transparent 65%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div>
              <Badge variant="primary" className="mb-5 text-xs">
                Plataforma em português para corrida, força e gestão de atletas
              </Badge>

              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Performance, prescrição e{" "}
                <span style={{ color: "#2563eb" }}>gestão de atletas</span>{" "}
                em uma única plataforma.
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Prescrição, periodização, check-ins, carga de treino, força, relatórios e loja de planos — em um único ecossistema em português.
              </p>

              {/* CTAs — clear hierarchy */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cadastro?perfil=treinador">
                  <Button
                    size="lg"
                    className="gap-2"
                    style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                  >
                    Começar como treinador
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/cadastro?perfil=atleta_independente">
                  <Button size="lg" variant="outline" className="gap-2 border-border/60">
                    Ver experiência do atleta
                  </Button>
                </Link>
              </div>

              {/* Feature trust row */}
              <div className="mt-10 flex flex-wrap gap-2">
                {[
                  { icon: Activity, label: "Corrida & VDOT" },
                  { icon: Dumbbell, label: "Treino de força" },
                  { icon: HeartPulse, label: "Check-ins inteligentes" },
                  { icon: BarChart2, label: "CTL / ATL / TSB" },
                  { icon: Zap, label: "Strava conectado" },
                  { icon: ShoppingBag, label: "Loja de planos" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-text-muted"
                    style={{
                      borderColor: "rgba(255,255,255,0.09)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Real dashboard mockup */}
            <div className="hidden lg:block">
              <HeroDashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────────────── */}
      <section
        id="como-funciona"
        className="py-20 sm:py-24"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-xl">
            <Badge variant="default" className="mb-4">Como funciona</Badge>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Do cadastro ao resultado{" "}
              <span style={{ color: "#2563eb" }}>em 4 passos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative">
                {/* Step number + connector */}
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold"
                    style={{ backgroundColor: color + "18", color }}
                  >
                    {step}
                  </div>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  />
                </div>

                {/* Mini screen mockup per step */}
                <div
                  className="mb-4 flex h-16 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${color}20`,
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>

                <h4 className="mb-1.5 font-display font-semibold text-text">{title}</h4>
                <p className="text-sm leading-relaxed text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform showcase ──────────────────────────────────────────────────── */}
      <PlatformShowcase />

      {/* ── Para Treinadores ──────────────────────────────────────────────────── */}
      <section
        id="para-treinadores"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            {/* Left: prescription mockup */}
            <div>
              <PrescriptionMock />
            </div>

            {/* Right: benefits — 4, not 6 */}
            <div>
              <Badge variant="primary" className="mb-5">Para Treinadores</Badge>
              <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
                Prescreva mais rápido.{" "}
                <span style={{ color: "#2563eb" }}>Monitore melhor.</span>
              </h2>
              <p className="mt-4 leading-relaxed text-text-muted">
                Reduza o tempo de prescrição de horas para minutos. Fique por dentro da evolução de cada atleta sem precisar esperar o próximo treino.
              </p>

              <div className="mt-8 space-y-5">
                {coachBenefits.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#60a5fa" }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-text">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Callout */}
              <div
                className="mt-8 rounded-2xl p-5"
                style={{
                  backgroundColor: "rgba(37,99,235,0.06)",
                  border: "1px solid rgba(37,99,235,0.18)",
                }}
              >
                <p className="text-sm font-semibold text-text">
                  &ldquo;Treinadores relatam redução de 2–3 horas por semana no tempo de prescrição depois de implementar o Pace Run Pro.&rdquo;
                </p>
              </div>

              <div className="mt-8">
                <Link href="/cadastro?perfil=treinador">
                  <Button size="lg" className="gap-2">
                    Testar gratuitamente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Para Atletas ──────────────────────────────────────────────────────── */}
      <section id="para-atletas" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <Badge variant="info" className="mb-4">Para Atletas</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Seu melhor desempenho,{" "}
              <span style={{ color: "#38bdf8" }}>com dados reais</span>
            </h2>
            <p className="mt-4 leading-relaxed text-text-muted">
              Seja com ou sem treinador, a plataforma adapta o plano ao seu ritmo, percebe sinais de overtraining antes de você e mostra sua evolução em gráficos claros.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/cadastro?perfil=atleta_independente">
                <Button size="sm" className="gap-2">
                  Criar conta grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/loja">
                <Button variant="outline" size="sm" className="border-border/60">
                  Ver loja de planos
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {athleteFeatures.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="glass border-border/50">
                <CardContent className="p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(56,189,248,0.10)", color: "#38bdf8" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-2 font-display font-semibold text-text">{title}</h4>
                  <p className="text-sm leading-relaxed text-text-muted">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Assessorias ──────────────────────────────────────────────────── */}
      <section
        id="para-assessorias"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <Badge variant="success" className="mb-4">Para Assessorias</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Escale sua equipe.{" "}
              <span style={{ color: "#22c55e" }}>Centralize tudo.</span>
            </h2>
            <p className="mt-4 leading-relaxed text-text-muted">
              De 2 a 200 treinadores, o Pace Run Pro mantém sua assessoria organizada — com white-label, biblioteca compartilhada e painel de gestão completo.
            </p>
            <div className="mt-6">
              <Link href="/cadastro?perfil=assessoria">
                <Button size="sm" className="gap-2">
                  Conhecer o plano Assessoria <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {agencyFeatures.map(({ icon: Icon, title, text }) => (
              <Card
                key={title}
                className="border-border/50"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <CardContent className="p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(34,197,94,0.10)", color: "#22c55e" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-2 font-display font-semibold text-text">{title}</h4>
                  <p className="text-sm leading-relaxed text-text-muted">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparativo ────────────────────────────────────────────────────────── */}
      <ComparisonTable />

      {/* ── Integrações ────────────────────────────────────────────────────────── */}
      <section id="integracoes" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">Integrações</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Conecte seus{" "}
              <span style={{ color: "#2563eb" }}>dispositivos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Strava disponível agora. Garmin, Coros, Polar e Apple Watch em desenvolvimento.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {integrationLogos.map((integration) => (
              <div
                key={integration.id}
                className="glass flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium text-text"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: integration.color }}
                />
                {integration.name}
                {integration.id === "strava" ? (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}
                  >
                    Disponível
                  </span>
                ) : (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }}
                  >
                    Em breve
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ─────────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Depoimentos ────────────────────────────────────────────────────────── */}
      <section
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <Badge variant="success" className="mb-4">Depoimentos</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Quem usa,{" "}
              <span style={{ color: "#22c55e" }}>aprova</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                className="border-border/40"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <CardContent className="p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #2563eb, #3FA7FF)" }}>
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

      {/* ── CTA Final ──────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div
            className="rounded-3xl p-10 text-center sm:p-16"
            style={{
              backgroundColor: "rgba(37,99,235,0.06)",
              border: "1px solid rgba(37,99,235,0.18)",
            }}
          >
            <h2 className="font-display text-3xl font-extrabold sm:text-5xl">
              Pronto para treinar com{" "}
              <span style={{ color: "#2563eb" }}>mais inteligência?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-text-muted">
              Prescrição de corrida e força, check-ins com IA, carga de treino e loja de planos — tudo em uma plataforma em português.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/cadastro?perfil=treinador" className="block">
                <div
                  className="cursor-pointer rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                  style={{
                    border: "1px solid rgba(37,99,235,0.35)",
                    backgroundColor: "rgba(37,99,235,0.08)",
                  }}
                >
                  <Users className="mb-2 h-6 w-6" style={{ color: "#60a5fa" }} />
                  <p className="font-semibold text-text">Sou treinador</p>
                  <p className="mt-0.5 text-xs text-text-muted">14 dias grátis, cancelo quando quiser</p>
                </div>
              </Link>
              <Link href="/cadastro?perfil=atleta_independente" className="block">
                <div
                  className="cursor-pointer rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                  }}
                >
                  <HeartPulse className="mb-2 h-6 w-6" style={{ color: "#94a3b8" }} />
                  <p className="font-semibold text-text">Sou atleta</p>
                  <p className="mt-0.5 text-xs text-text-muted">Começo grátis, sem cartão</p>
                </div>
              </Link>
            </div>

            <p className="mt-8 text-xs text-text-muted">
              Pagamento via cartão ou PIX · Acesso imediato · Sem taxa de setup
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border/50 py-14"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/">
                <Logo size={30} />
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
                Prescrição, periodização, check-ins, carga de treino, força e loja de planos — em um único ecossistema para corrida.
              </p>
              <p className="mt-2 text-xs text-text-muted">Performance · Ciência · Propósito</p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Para treinadores
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#para-treinadores" className="text-text-muted transition-colors hover:text-text">Funcionalidades</a></li>
                <li><a href="#precos" className="text-text-muted transition-colors hover:text-text">Planos e preços</a></li>
                <li><Link href="/cadastro?perfil=treinador" className="text-text-muted transition-colors hover:text-text">Começar 14 dias grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Para atletas
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#para-atletas" className="text-text-muted transition-colors hover:text-text">Funcionalidades</a></li>
                <li><Link href="/loja" className="text-text-muted transition-colors hover:text-text">Loja de planos</Link></li>
                <li><Link href="/cadastro?perfil=atleta_independente" className="text-text-muted transition-colors hover:text-text">Criar conta grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Empresa
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#integracoes" className="text-text-muted transition-colors hover:text-text">Integrações</a></li>
                <li><Link href="/termos" className="text-text-muted transition-colors hover:text-text">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="text-text-muted transition-colors hover:text-text">Privacidade</Link></li>
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
