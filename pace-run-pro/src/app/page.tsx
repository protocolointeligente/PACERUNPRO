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

// ── Feature data ───────────────────────────────────────────────────────────────

const agencyFeatures = [
  {
    icon: Users,
    title: "Multi-treinadores",
    text: "Vários treinadores em uma conta, cada um com sua carteira de atletas e visão independente.",
  },
  {
    icon: Globe,
    title: "White-label completo",
    text: "Sua logo, seu domínio, suas cores. Atletas nunca saem da sua marca.",
  },
  {
    icon: Building2,
    title: "Painel administrativo",
    text: "Visão completa da assessoria: atletas ativos, MRR, inadimplência, aderência e saúde coletiva.",
  },
  {
    icon: ShoppingBag,
    title: "Biblioteca de equipe",
    text: "Templates de treino compartilhados entre todos os treinadores da assessoria.",
  },
];

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

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Cadastre o atleta",
    desc: "Perfil completo com histórico, metas, zonas de treino e preferências de modalidade.",
    color: "#C6F24E",
  },
  {
    step: "02",
    icon: CalendarDays,
    title: "Monte o plano semanal",
    desc: "Prescreva corrida e força com VDOT, zonas e carga calculada automaticamente.",
    color: "#46E0C8",
  },
  {
    step: "03",
    icon: Activity,
    title: "Acompanhe a execução",
    desc: "Check-ins diários, alertas de fadiga e sincronização com Strava em tempo real.",
    color: "#3FA7FF",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Ajuste pela carga",
    desc: "CTL, ATL e TSB para decisões inteligentes a cada semana. Menos lesão, mais resultado.",
    color: "#46E0A0",
  },
];

// ── Hero dashboard mockup ─────────────────────────────────────────────────────

function HeroDashboardMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
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
          className="ml-1 flex-1 truncate rounded px-2 py-0.5 text-center font-mono text-[10px]"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
        >
          app.pacerunpro.com.br/treinador/dashboard
        </div>
      </div>

      <div className="p-4">
        {/* Greeting */}
        <p className="mb-1 text-[10px]" style={{ color: "#64748b" }}>Painel do treinador</p>
        <p className="mb-4 text-sm font-bold" style={{ color: "#f8fafc" }}>
          Olá, Ricardo 👋{" "}
          <span style={{ color: "#64748b", fontWeight: 400 }}>· Semana 23 Jun</span>
        </p>

        {/* KPI row */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { val: "24", label: "Atletas", color: "#C6F24E" },
            { val: "94%", label: "Aderência", color: "#46E0C8" },
            { val: "2", label: "Alertas", color: "#FF5A4D" },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="font-mono text-lg font-bold leading-none" style={{ color: k.color }}>{k.val}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Athlete rows */}
        <div className="mb-3 space-y-1.5">
          {[
            { initials: "CA", name: "Camila Andrade", meta: "Meia · Sem. 18", badge: "94%", ok: true, grad: "linear-gradient(135deg,#C6F24E,#A6D43B)", tc: "#0A0C0F" },
            { initials: "BM", name: "Bruno Martins", meta: "10k · Sem. 12", badge: "⚠ Fadiga", ok: false, grad: "linear-gradient(135deg,#46E0C8,#2BC0A8)", tc: "#0A0C0F" },
            { initials: "RL", name: "Rafael Lima", meta: "Maratona · Sem. 24", badge: "98%", ok: true, grad: "linear-gradient(135deg,#3FA7FF,#1E6FCC)", tc: "#fff" },
          ].map((a) => (
            <div
              key={a.initials}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                style={{ background: a.grad, color: a.tc }}
              >
                {a.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>{a.name}</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>{a.meta}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={a.ok
                  ? { backgroundColor: "rgba(70,224,160,0.12)", color: "#46E0A0" }
                  : { backgroundColor: "rgba(249,115,22,0.12)", color: "#fb923c" }}
              >
                {a.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Prescription preview */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "rgba(198,242,78,0.06)", border: "1px solid rgba(198,242,78,0.12)" }}
        >
          <p className="mb-2 text-[10px] font-semibold" style={{ color: "#C6F24E" }}>
            Semana 18 → Camila Andrade
          </p>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Rodagem 12km Z2", run: true },
              { label: "Força A", run: false },
              { label: "Intervalado 8×400m", run: true },
              { label: "Força B", run: false },
              { label: "Longão 22km", run: true },
            ].map((t) => (
              <span
                key={t.label}
                className="rounded px-1.5 py-0.5 text-[9px]"
                style={t.run
                  ? { backgroundColor: "rgba(63,167,255,0.15)", color: "#60a5fa" }
                  : { backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
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

// ── Admin panel mockup ─────────────────────────────────────────────────────────

function AdminPanelMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-xl shadow-black/50"
      style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#14171C" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-bold" style={{ color: "#f8fafc" }}>Painel da Assessoria</p>
        <p className="font-mono text-xs" style={{ color: "#64748b" }}>Jun 2026</p>
      </div>

      {/* KPI row */}
      <div
        className="grid grid-cols-4 gap-0 divide-x divide-white/5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[
          { val: "79", label: "Atletas", color: "#C6F24E" },
          { val: "R$14.2k", label: "MRR", color: "#46E0A0" },
          { val: "94%", label: "Aderência", color: "#46E0C8" },
          { val: "3", label: "Inadimpl.", color: "#FF5A4D" },
        ].map((k) => (
          <div key={k.label} className="py-4 text-center">
            <p className="font-mono text-lg font-bold leading-none" style={{ color: k.color }}>{k.val}</p>
            <p className="mt-1 text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Health bars */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
          Saúde dos Atletas
        </p>
        <div className="space-y-2">
          {[
            { label: "Em dia", pct: 74, color: "#C6F24E" },
            { label: "Fadiga leve", pct: 18, color: "#FFB020" },
            { label: "Risco", pct: 8, color: "#FF5A4D" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <p className="w-20 text-[11px]" style={{ color: "#cbd5e1" }}>{b.label}</p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
              </div>
              <p className="w-8 text-right font-mono text-[11px] font-bold" style={{ color: b.color }}>{b.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team list */}
      <div className="space-y-2 px-5 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
          Equipe
        </p>
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "rgba(198,242,78,0.04)", border: "1px solid rgba(198,242,78,0.12)" }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold"
            style={{ background: "linear-gradient(135deg,#C6F24E,#A6D43B)", color: "#0A0C0F" }}
          >
            RP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Ricardo Pace</p>
            <p className="text-[10px]" style={{ color: "#64748b" }}>Gestor · 24 atletas</p>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ backgroundColor: "rgba(198,242,78,0.12)", color: "#C6F24E" }}
          >
            Gestor
          </span>
        </div>
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold"
            style={{ background: "linear-gradient(135deg,#46E0C8,#2BC0A8)", color: "#0A0C0F" }}
          >
            JF
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Julia Ferreira</p>
            <p className="text-[10px]" style={{ color: "#64748b" }}>Treinadora · 18 atletas</p>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ backgroundColor: "rgba(70,224,200,0.10)", color: "#46E0C8" }}
          >
            Treinadora
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Athlete roster mockup (for Treinadores section) ───────────────────────────

function RosterMock() {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-xl shadow-black/50"
      style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#111827" }}
    >
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
          className="ml-1 flex-1 truncate rounded px-2 py-0.5 text-center font-mono text-[10px]"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
        >
          /treinador/atletas
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Meus atletas</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: "rgba(198,242,78,0.12)", color: "#C6F24E" }}
          >
            24 ativos
          </span>
        </div>

        {[
          { initials: "CA", name: "Camila Andrade", meta: "Meia · Sem. 18", badge: "94%", ok: true, grad: "linear-gradient(135deg,#C6F24E,#A6D43B)", tc: "#0A0C0F" },
          { initials: "BM", name: "Bruno Martins", meta: "10k · Sem. 12", badge: "⚠ Fadiga", ok: false, grad: "linear-gradient(135deg,#46E0C8,#2BC0A8)", tc: "#0A0C0F" },
          { initials: "RL", name: "Rafael Lima", meta: "Maratona · Sem. 24", badge: "98%", ok: true, grad: "linear-gradient(135deg,#3FA7FF,#1E6FCC)", tc: "#fff" },
        ].map((a) => (
          <div
            key={a.initials}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
              style={{ background: a.grad, color: a.tc }}
            >
              {a.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>{a.name}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>{a.meta}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={a.ok
                ? { backgroundColor: "rgba(70,224,160,0.12)", color: "#46E0A0" }
                : { backgroundColor: "rgba(249,115,22,0.12)", color: "#fb923c" }}
            >
              {a.badge}
            </span>
          </div>
        ))}

        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "rgba(198,242,78,0.06)", border: "1px solid rgba(198,242,78,0.14)" }}
        >
          <p className="mb-2 text-[10px] font-semibold" style={{ color: "#C6F24E" }}>
            Semana 18 → Camila Andrade
          </p>
          <div className="flex flex-wrap gap-1">
            {[
              { label: "Rodagem 12km Z2", run: true },
              { label: "Força A", run: false },
              { label: "Intervalado 8×400m", run: true },
              { label: "Força B", run: false },
              { label: "Longão 22km", run: true },
            ].map((t) => (
              <span
                key={t.label}
                className="rounded px-1.5 py-0.5 text-[9px]"
                style={t.run
                  ? { backgroundColor: "rgba(63,167,255,0.15)", color: "#60a5fa" }
                  : { backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
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
              { label: "Para Assessorias", href: "#assessorias" },
              { label: "Para Treinadores", href: "#treinadores" },
              { label: "Para Atletas", href: "#atletas" },
              { label: "Como funciona", href: "#como-funciona" },
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
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Copy */}
            <div>
              <Badge variant="primary" className="mb-5 text-xs">
                Plataforma em português para corrida, força e gestão de atletas
              </Badge>

              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Performance, prescrição e gestão —{" "}
                <span className="gradient-text">em uma única plataforma.</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Prescrição com IA, periodização, check-ins, carga de treino, white-label e loja de planos.
                Para treinadores, atletas e assessorias.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cadastro?perfil=treinador">
                  <Button size="lg" className="gap-2">
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

              <div className="mt-10 flex flex-wrap gap-2">
                {[
                  { icon: Activity, label: "Corrida & VDOT" },
                  { icon: Dumbbell, label: "Treino de força" },
                  { icon: HeartPulse, label: "Check-ins inteligentes" },
                  { icon: BarChart2, label: "CTL / ATL / TSB" },
                  { icon: Zap, label: "Strava conectado" },
                  { icon: Globe, label: "White-label" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-text-muted"
                    style={{ borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.03)" }}
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="hidden lg:block">
              <HeroDashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Para Assessorias ──────────────────────────────────────────────────── */}
      <section
        id="assessorias"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <Badge variant="primary" className="mb-5">Para Assessorias Esportivas</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Escale sua assessoria.{" "}
                <span className="text-primary">De 2 a 200</span> treinadores.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Multi-treinadores em uma conta, white-label completo, painel administrativo com MRR e gestão de toda a equipe — em um único lugar.
              </p>

              <div className="mt-8 space-y-5">
                {agencyFeatures.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(198,242,78,0.10)" }}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-text">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/cadastro?perfil=assessoria">
                  <Button size="lg" className="gap-2">
                    Conhecer plano Assessoria
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#precos">
                  <Button size="lg" variant="outline" className="border-border/60">
                    Ver preços
                  </Button>
                </a>
              </div>
            </div>

            {/* Admin panel mockup */}
            <div>
              <AdminPanelMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <Badge variant="primary" className="mb-4">Como funciona</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Do cadastro ao resultado{" "}
              <span className="text-primary">em 4 passos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step}>
                <p className="font-mono text-5xl font-black leading-none" style={{ color }}>{step}</p>
                <div
                  className="my-4 h-1 rounded-full"
                  style={{ backgroundColor: color + "28" }}
                >
                  <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: color }} />
                </div>
                <h4 className="mb-2 font-display text-lg font-bold text-text">{title}</h4>
                <p className="text-sm leading-relaxed text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para Treinadores ──────────────────────────────────────────────────── */}
      <section
        id="treinadores"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            {/* Left: mockup */}
            <div>
              <RosterMock />
            </div>

            {/* Right: benefits */}
            <div>
              <Badge variant="primary" className="mb-5">Para Treinadores</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Prescreva mais rápido.{" "}
                <span className="text-primary">Monitore melhor.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Reduza o tempo de prescrição de horas para minutos. Fique por dentro da evolução de cada atleta sem precisar esperar o próximo treino.
              </p>

              <div className="mt-8 space-y-5">
                {coachBenefits.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(198,242,78,0.10)" }}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-text">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-8 rounded-2xl p-5"
                style={{ backgroundColor: "rgba(198,242,78,0.05)", border: "1px solid rgba(198,242,78,0.15)" }}
              >
                <p className="text-sm font-semibold text-text">
                  &ldquo;Treinadores relatam redução de 2–3 horas por semana no tempo de prescrição depois de implementar o PACE RUN PRO.&rdquo;
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
      <section id="atletas" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <Badge variant="info" className="mb-4">Para Atletas</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Seu melhor desempenho,{" "}
              <span style={{ color: "#46E0C8" }}>com dados reais.</span>
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-text-muted">
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
              <Card key={title} className="border-border/50 bg-card">
                <CardContent className="p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(70,224,200,0.10)", color: "#46E0C8" }}
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

      {/* ── Integrações ────────────────────────────────────────────────────────── */}
      <section
        id="integracoes"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="primary" className="mb-4">Integrações</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Conecte seus{" "}
              <span className="text-primary">dispositivos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Strava disponível agora. Garmin, Coros, Polar e Apple Watch em desenvolvimento.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {integrationLogos.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-border/80 hover:bg-card-hover"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: integration.color }}
                />
                {integration.name}
                {integration.id === "strava" ? (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(70,224,160,0.15)", color: "#46E0A0" }}
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
              <span style={{ color: "#46E0A0" }}>aprova</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => {
              const avatarStyle = i === 0
                ? { background: "linear-gradient(135deg,#C6F24E,#A6D43B)", color: "#0A0C0F" }
                : i === 1
                  ? { background: "linear-gradient(135deg,#46E0C8,#2BC0A8)", color: "#0A0C0F" }
                  : { background: "linear-gradient(135deg,#3FA7FF,#1E6FCC)", color: "#fff" };
              return (
                <Card
                  key={t.id}
                  className="border-border/40"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <CardContent className="p-7">
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold"
                        style={avatarStyle}
                      >
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-text">{t.name}</div>
                        <div className="text-xs text-text-muted">{t.role}</div>
                      </div>
                    </div>
                    <div className="mb-4 flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 text-warning" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm italic leading-relaxed text-text-muted">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div
            className="rounded-3xl p-10 text-center sm:p-16"
            style={{ backgroundColor: "rgba(198,242,78,0.06)", border: "1px solid rgba(198,242,78,0.15)" }}
          >
            <div className="mb-8 flex justify-center">
              <Logo size={40} />
            </div>
            <h2 className="font-display text-3xl font-extrabold sm:text-5xl">
              Pronto para treinar com{" "}
              <span className="text-primary">mais inteligência?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg leading-relaxed text-text-muted">
              Prescrição, CTL/ATL/TSB, check-ins com IA e loja de planos — em português, para quem leva corrida a sério.
            </p>

            <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/cadastro?perfil=treinador" className="block">
                <div
                  className="cursor-pointer rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "rgba(198,242,78,0.06)", border: "1px solid rgba(198,242,78,0.22)" }}
                >
                  <p className="font-semibold text-text">Sou treinador</p>
                  <p className="mt-1 text-xs text-text-muted">14 dias grátis, cancelo quando quiser</p>
                </div>
              </Link>
              <Link href="/cadastro?perfil=atleta_independente" className="block">
                <div
                  className="cursor-pointer rounded-2xl p-5 text-left transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <p className="font-semibold text-text">Sou atleta</p>
                  <p className="mt-1 text-xs text-text-muted">Começo grátis, sem cartão</p>
                </div>
              </Link>
            </div>

            <Link href="/cadastro?perfil=treinador">
              <Button size="lg" className="mt-8 gap-2 px-8 text-base">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <p className="mt-6 text-xs text-text-muted">
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
                Prescrição, periodização, check-ins, carga de treino, força e loja de planos — em português, para quem leva corrida a sério.
              </p>
              <p className="mt-2 text-xs text-text-muted">Performance · Ciência · Propósito</p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Para treinadores
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#treinadores" className="text-text-muted transition-colors hover:text-text">Funcionalidades</a></li>
                <li><a href="#precos" className="text-text-muted transition-colors hover:text-text">Planos e preços</a></li>
                <li><Link href="/cadastro?perfil=treinador" className="text-text-muted transition-colors hover:text-text">Começar 14 dias grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Para atletas
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#atletas" className="text-text-muted transition-colors hover:text-text">Funcionalidades</a></li>
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
