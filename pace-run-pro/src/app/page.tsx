import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart2,
  Bell,
  Bike,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  Clock,
  Dumbbell,
  Globe,
  HeartPulse,
  Link2,
  LogIn,
  MessageSquare,
  ShoppingBag,
  Star,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Waves,
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

const SPORTS = [
  { icon: Activity, label: "Corrida", color: "#3FA7FF", desc: "VDOT, zonas de pace, longão, intervalados" },
  { icon: Bike, label: "Ciclismo", color: "#C6F24E", desc: "FTP, zonas de potência, TSS, VAM" },
  { icon: Waves, label: "Natação", color: "#46E0C8", desc: "CSS, tempos por 100m, volume e descanso" },
  { icon: Trophy, label: "Triathlon", color: "#FFB020", desc: "Periodização multi-esporte integrada" },
  { icon: Dumbbell, label: "Musculação", color: "#FF5A4D", desc: "RPE, 1RM estimado, blocos de força" },
];

const SOCIAL_PROOF = [
  { val: "3h", unit: "/semana", label: "economizadas na prescrição" },
  { val: "90%", label: "do valor da venda direto ao treinador" },
  { val: "+1.200", label: "atletas ativos na plataforma" },
  { val: "94%", label: "de aderência média nos planos" },
];

const agencyFeatures = [
  {
    icon: Users,
    title: "Multi-treinadores",
    text: "Vários treinadores em uma conta, cada um com sua carteira e visão independente. Escale sem bagunça.",
  },
  {
    icon: Globe,
    title: "White-label completo",
    text: "Sua logo, seu domínio, suas cores. Seus atletas nunca saem da sua marca — o nome Pace Run Pro fica nos bastidores.",
  },
  {
    icon: Building2,
    title: "Painel com MRR e aderência",
    text: "Dashboard em tempo real: atletas ativos, inadimplência, MRR e saúde coletiva de toda a base.",
  },
  {
    icon: UserPlus,
    title: "CRM de leads integrado",
    text: "Pipeline de prospecção dentro da plataforma. Capture leads, acompanhe o funil e converta atletas sem sair do app.",
  },
];

const coachBenefits = [
  {
    icon: Brain,
    title: "IA sugere, você decide",
    text: "Sugestões de pace, volume e RPE baseadas no histórico real de cada atleta. Prescrição em minutos, não em horas de planilha.",
  },
  {
    icon: Bell,
    title: "Alerta de overtraining em 48h",
    text: "A plataforma detecta sinais de fadiga antes do atleta reclamar — e recomenda a ação certa, automaticamente.",
  },
  {
    icon: CalendarDays,
    title: "Periodização completa",
    text: "Macrociclo, mesociclo, microciclo. VDOT para corrida, RPE/1RM para força — tudo calibrado por atleta.",
  },
  {
    icon: Link2,
    title: "Convide por link",
    text: "Compartilhe um link personalizado. O atleta preenche o questionário de saúde e já está vinculado a você — sem formulários externos.",
  },
];

const athleteFeatures = [
  {
    icon: CalendarDays,
    title: "Calendário semanal claro",
    text: "Você vê só o que importa agora — a semana liberada pelo treinador, com objetivo e contexto em cada sessão.",
  },
  {
    icon: HeartPulse,
    title: "Check-in pós-treino em 60s",
    text: "Como foi? O motor lê sua resposta e já ajusta a próxima sessão. Sem precisar escrever parágrafos.",
  },
  {
    icon: BarChart2,
    title: "CTL, ATL e TSB em gráfico",
    text: "Fitness, fadiga e forma num só lugar. Veja sua evolução real — pace, FC, VO2máx e pico de carga.",
  },
  {
    icon: Clock,
    title: "Agende consultas no app",
    text: "Sem WhatsApp, sem confusão. Reserve uma sessão com o treinador direto pelo app e apareça preparado.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Link2,
    title: "Convide o atleta",
    desc: "Link personalizado → questionário de saúde → vinculado em menos de 2 minutos.",
    color: "#C6F24E",
  },
  {
    step: "02",
    icon: CalendarDays,
    title: "Monte a periodização",
    desc: "Macrociclo, mesociclo, microciclo — corrida, ciclismo, natação, força ou triathlon.",
    color: "#46E0C8",
  },
  {
    step: "03",
    icon: Activity,
    title: "Atleta executa e registra",
    desc: "Check-in pós-treino, sync com Strava e alertas automáticos de fadiga em 48h.",
    color: "#3FA7FF",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Ajuste pela carga",
    desc: "CTL, ATL e TSB para decisões baseadas em ciência — para toda a base de uma vez.",
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

      {/* CRM pipeline mini */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
          CRM de Leads
        </p>
        <div className="flex gap-2">
          {[
            { label: "Contato", n: 5, color: "#64748b" },
            { label: "Proposta", n: 3, color: "#FFB020" },
            { label: "Fechado", n: 2, color: "#C6F24E" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg px-2 py-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="font-mono text-base font-bold leading-none" style={{ color: s.color }}>{s.n}</p>
              <p className="mt-1 text-[9px]" style={{ color: "#64748b" }}>{s.label}</p>
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
          { initials: "CA", name: "Camila Andrade", meta: "Corrida · Sem. 18", badge: "94%", ok: true, grad: "linear-gradient(135deg,#C6F24E,#A6D43B)", tc: "#0A0C0F" },
          { initials: "BM", name: "Bruno Martins", meta: "Triathlon · Sem. 12", badge: "⚠ Fadiga", ok: false, grad: "linear-gradient(135deg,#46E0C8,#2BC0A8)", tc: "#0A0C0F" },
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
            IA — Semana 18 → Camila Andrade
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

// ── Marketplace mockup ─────────────────────────────────────────────────────────

function MarketplaceMock() {
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
          app.pacerunpro.com.br/loja
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "#f8fafc" }}>Marketplace de Planos</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: "rgba(198,242,78,0.12)", color: "#C6F24E" }}
          >
            48 planos
          </span>
        </div>

        {/* Plan card */}
        <div
          className="rounded-xl p-3.5"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Coach header */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
              style={{ background: "linear-gradient(135deg,#C6F24E,#A6D43B)", color: "#0A0C0F" }}
            >
              RP
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Ricardo Pace</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>CREF 014626-G/MG · Corrida &amp; Triathlon</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
            >
              ★ 4.9
            </span>
          </div>

          <p className="text-sm font-bold" style={{ color: "#f8fafc" }}>Maratona em 16 Semanas</p>
          <p className="mt-1 text-[10px]" style={{ color: "#94a3b8" }}>
            Do rodagem base à linha de chegada. VDOT calibrado + força complementar.
          </p>

          <div className="mt-2 flex flex-wrap gap-1">
            {[
              { label: "Corrida", bc: "rgba(63,167,255,0.15)", tc: "#60a5fa" },
              { label: "Força", bc: "rgba(124,58,237,0.15)", tc: "#a78bfa" },
              { label: "16 semanas", bc: "rgba(70,224,200,0.12)", tc: "#46E0C8" },
            ].map((t) => (
              <span
                key={t.label}
                className="rounded px-1.5 py-0.5 text-[9px]"
                style={{ backgroundColor: t.bc, color: t.tc }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-base font-extrabold leading-none" style={{ color: "#f8fafc" }}>
                R$ 197<span className="text-[11px] font-normal" style={{ color: "#64748b" }}>,00</span>
              </p>
              <p className="mt-0.5 text-[9px]" style={{ color: "#64748b" }}>127 atletas compraram</p>
            </div>
            <div
              className="rounded-lg px-3 py-1.5 text-[10px] font-bold"
              style={{ backgroundColor: "#C6F24E", color: "#0A0C0F" }}
            >
              Comprar via PIX
            </div>
          </div>
        </div>

        {/* PIX Split info */}
        <div
          className="mt-3 rounded-xl p-3"
          style={{ backgroundColor: "rgba(198,242,78,0.04)", border: "1px solid rgba(198,242,78,0.12)" }}
        >
          <p className="mb-2.5 text-[10px] font-semibold" style={{ color: "#C6F24E" }}>
            Split automático via PagBank Connect
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="font-mono text-xl font-extrabold leading-none" style={{ color: "#C6F24E" }}>90%</p>
              <p className="mt-1 text-[9px]" style={{ color: "#64748b" }}>Para o treinador</p>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 text-center">
              <p className="font-mono text-xl font-extrabold leading-none" style={{ color: "#94a3b8" }}>10%</p>
              <p className="mt-1 text-[9px]" style={{ color: "#64748b" }}>Taxa da plataforma</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Messaging mockup ───────────────────────────────────────────────────────────

function MessagingMock() {
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
          className="ml-1 flex-1 truncate rounded px-2 py-0.5 text-center font-mono text-[10px]"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
        >
          /mensagens
        </div>
      </div>

      {/* Two-column chat layout */}
      <div className="flex" style={{ height: "296px" }}>
        {/* Sidebar */}
        <div
          className="flex flex-col p-3"
          style={{ width: "148px", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
        >
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
            Conversas
          </p>
          {[
            { initials: "CA", name: "Camila A.", msg: "Treino feito! 💪", active: true, grad: "linear-gradient(135deg,#C6F24E,#A6D43B)", tc: "#0A0C0F" },
            { initials: "BM", name: "Bruno M.", msg: "Dói o joelho...", active: false, grad: "linear-gradient(135deg,#46E0C8,#2BC0A8)", tc: "#0A0C0F" },
            { initials: "RL", name: "Rafael L.", msg: "Ok, amanhã 6h!", active: false, grad: "linear-gradient(135deg,#3FA7FF,#1E6FCC)", tc: "#fff" },
            { initials: "MS", name: "Marina S.", msg: "Prova domingo", active: false, grad: "linear-gradient(135deg,#FFB020,#e07010)", tc: "#0A0C0F" },
          ].map((a) => (
            <div
              key={a.initials}
              className="mb-1 flex items-center gap-1.5 rounded-lg p-2"
              style={{ backgroundColor: a.active ? "rgba(198,242,78,0.06)" : "transparent" }}
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold"
                style={{ background: a.grad, color: a.tc }}
              >
                {a.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold" style={{ color: "#f8fafc" }}>{a.name}</p>
                <p className="truncate text-[9px]" style={{ color: "#64748b" }}>{a.msg}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat window */}
        <div className="flex min-w-0 flex-1 flex-col p-3">
          {/* Chat header */}
          <div className="mb-2 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>Camila Andrade</p>
            <p className="text-[9px]" style={{ color: "#46E0A0" }}>● online agora</p>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            {/* Coach message */}
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-xl rounded-tl-none p-2.5"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] leading-relaxed" style={{ color: "#f8fafc" }}>
                  Camila, liberei a sem. 19. Foco no longão de sábado 💪
                </p>
                <p className="mt-0.5 text-[8px]" style={{ color: "#64748b" }}>09:15</p>
              </div>
            </div>

            {/* Athlete message */}
            <div className="flex justify-end">
              <div
                className="max-w-[85%] rounded-xl rounded-tr-none p-2.5"
                style={{ backgroundColor: "rgba(198,242,78,0.10)", border: "1px solid rgba(198,242,78,0.15)" }}
              >
                <p className="text-[10px] leading-relaxed" style={{ color: "#f8fafc" }}>
                  Feito! Pace 5:42 hoje 🏃‍♀️ Senti bem!
                </p>
                <p className="mt-0.5 text-[8px]" style={{ color: "#64748b" }}>agora</p>
              </div>
            </div>

            {/* Scheduled consultation card */}
            <div className="flex justify-start">
              <div
                className="rounded-xl rounded-tl-none p-2.5"
                style={{ backgroundColor: "rgba(70,224,200,0.06)", border: "1px solid rgba(70,224,200,0.12)" }}
              >
                <p className="text-[9px] font-semibold" style={{ color: "#46E0C8" }}>📅 Consulta agendada</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "#f8fafc" }}>Sexta 15h — Revisão de metas</p>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div
            className="mt-2 rounded-lg px-3 py-2 text-[10px]"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#64748b" }}
          >
            Escreva uma mensagem...
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
              { label: "Marketplace", href: "#marketplace" },
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
                Corrida · Ciclismo · Natação · Triathlon · Musculação — Multi-esporte em português
              </Badge>

              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Chega de planilha.{" "}
                <span className="gradient-text">Seus atletas merecem mais.</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Prescrição com IA, marketplace de planos, mensagens em tempo real, periodização completa
                e painel administrativo com MRR — em um único lugar, em português.
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
                  { icon: Bike, label: "Ciclismo" },
                  { icon: Waves, label: "Natação" },
                  { icon: Trophy, label: "Triathlon" },
                  { icon: Dumbbell, label: "Musculação" },
                  { icon: ShoppingBag, label: "Marketplace" },
                  { icon: MessageSquare, label: "Mensagens" },
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

      {/* ── Social Proof Bar ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#0B1020", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {SOCIAL_PROOF.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-2xl font-extrabold leading-none text-primary">
                  {s.val}
                  {"unit" in s && s.unit ? (
                    <span className="text-base font-medium text-text-muted">{s.unit}</span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Multi-sport ───────────────────────────────────────────────────────── */}
      <section id="multi-esporte" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="primary" className="mb-4">Multi-esporte</Badge>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Uma plataforma para{" "}
              <span className="text-primary">todas as modalidades.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Prescreva corrida, ciclismo, natação, triathlon e musculação no mesmo lugar.
              Chega de ter uma ferramenta para cada esporte.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {SPORTS.map(({ icon: Icon, label, color, desc }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl p-6 text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon className="h-7 w-7" style={{ color }} />
                </div>
                <p className="mb-2 font-display text-base font-bold text-text">{label}</p>
                <p className="text-xs leading-relaxed text-text-muted">{desc}</p>
              </div>
            ))}
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
                Multi-treinadores, white-label completo, CRM de leads e painel administrativo com MRR —
                tudo o que uma assessoria moderna precisa para crescer sem virar caos.
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

              {/* Highlight */}
              <div
                className="mt-8 rounded-2xl p-5"
                style={{ backgroundColor: "rgba(198,242,78,0.05)", border: "1px solid rgba(198,242,78,0.15)" }}
              >
                <p className="text-sm font-semibold text-text">
                  &ldquo;Assessorias que migraram para o Pace Run Pro reduziram custo operacional em 60% e centralizaram prescrição, check-in e relatórios em um único painel.&rdquo;
                </p>
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
              Do convite ao resultado{" "}
              <span className="text-primary">em 4 passos</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Sem configuração interminável, sem curva de aprendizado. Em menos de 10 minutos você já
              está prescrevendo com inteligência.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step}>
                <p className="font-mono text-5xl font-black leading-none" style={{ color }}>{step}</p>
                <div
                  className="my-4 h-1 rounded-full"
                  style={{ backgroundColor: color + "28" }}
                >
                  <div className="h-full w-full rounded-full" style={{ backgroundColor: color }} />
                </div>
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
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
                Prescreva em minutos.{" "}
                <span className="text-primary">Monitore 24/7.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Treinadores relatam redução de <strong className="text-text">3 horas por semana</strong> no tempo de
                prescrição. IA sugere, você valida — e o atleta recebe um plano calibrado de verdade.
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

      {/* ── Marketplace ───────────────────────────────────────────────────────── */}
      <section id="marketplace" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <Badge variant="primary" className="mb-5">Marketplace</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Venda seus planos.{" "}
                <span className="text-primary">90% é seu.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Crie planos de treino uma vez e venda para quantos atletas quiser — sem treinamento
                adicional, sem atendimento extra. O marketplace cuida da vitrine, do pagamento via PIX
                e do split automático via PagBank Connect.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: ShoppingBag,
                    title: "Crie e publique no marketplace",
                    text: "Monte o plano dentro da plataforma, defina o preço e publique. Atletas do Brasil inteiro podem comprar.",
                  },
                  {
                    icon: Zap,
                    title: "PIX split automático 90/10",
                    text: "Ao confirmar o pagamento, 90% cai na sua conta via PagBank Connect — sem esperar 30 dias, sem taxa surpresa.",
                  },
                  {
                    icon: Award,
                    title: "Programa de afiliados",
                    text: "Outros treinadores e influenciadores divulgam seu plano e recebem comissão. Você cresce sem investir em ads.",
                  },
                ].map(({ icon: Icon, title, text }) => (
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
                <Link href="/cadastro?perfil=treinador">
                  <Button size="lg" className="gap-2">
                    Quero vender no marketplace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/loja">
                  <Button size="lg" variant="outline" className="border-border/60">
                    Ver planos disponíveis
                  </Button>
                </Link>
              </div>
            </div>

            {/* Marketplace mockup */}
            <div>
              <MarketplaceMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comunicação e Relacionamento ──────────────────────────────────────── */}
      <section
        id="comunicacao"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            {/* Messaging mockup */}
            <div>
              <MessagingMock />
            </div>

            {/* Copy */}
            <div>
              <Badge variant="info" className="mb-5">Comunicação &amp; Relacionamento</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Chega de WhatsApp.{" "}
                <span style={{ color: "#46E0C8" }}>Tudo dentro da plataforma.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Mensagens em tempo real, agenda de consultas integrada e questionários de saúde — tudo num
                canal dedicado ao relacionamento treinador-atleta.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: MessageSquare,
                    title: "Mensagens em tempo real",
                    text: "Chat dedicado entre treinador e atleta. Histórico completo, notificações e contexto do plano sempre acessíveis.",
                    color: "#46E0C8",
                  },
                  {
                    icon: CalendarDays,
                    title: "Agenda de consultas integrada",
                    text: "Atleta agenda, treinador confirma — direto pelo app. Sem links externos, sem conflito de horários.",
                    color: "#3FA7FF",
                  },
                  {
                    icon: HeartPulse,
                    title: "Questionários de saúde",
                    text: "Anamnese digital enviada no momento do convite. Respostas ficam no perfil do atleta para referência contínua.",
                    color: "#C6F24E",
                  },
                  {
                    icon: Link2,
                    title: "Convite por link personalizado",
                    text: "Compartilhe um link único nas redes ou por mensagem. O atleta vincula-se a você em menos de 2 minutos.",
                    color: "#FFB020",
                  },
                ].map(({ icon: Icon, title, text, color }) => (
                  <div key={title} className="flex gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}14` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-text">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{text}</p>
                    </div>
                  </div>
                ))}
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
              Treine com dados reais.{" "}
              <span style={{ color: "#46E0C8" }}>Evolua de verdade.</span>
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-text-muted">
              Seja com treinador ou comprando um plano no marketplace, você tem tudo para
              treinar com inteligência — check-ins, sync com Strava, CTL/ATL/TSB e agenda de consultas.
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

          {/* Strava highlight */}
          <div
            className="mt-8 flex flex-col items-center gap-4 rounded-2xl p-6 sm:flex-row sm:gap-6"
            style={{ backgroundColor: "rgba(70,224,200,0.04)", border: "1px solid rgba(70,224,200,0.12)" }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(70,224,200,0.12)" }}
            >
              <Zap className="h-6 w-6" style={{ color: "#46E0C8" }} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-text">Sync automático com Strava</p>
              <p className="mt-1 text-sm text-text-muted">
                Conecte uma vez. Cada atividade importada automaticamente — sem copiar e colar dados,
                sem perder nenhum treino.
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "rgba(70,224,160,0.15)", color: "#46E0A0" }}
            >
              Disponível agora
            </span>
          </div>
        </div>
      </section>

      {/* ── PACE University ───────────────────────────────────────────────────── */}
      <section
        id="universidade"
        className="py-24 sm:py-32"
        style={{ backgroundColor: "#0B1020" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <div>
              <Badge variant="primary" className="mb-5">PACE University</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Conhecimento aplicado{" "}
                <span className="text-primary">dentro da plataforma.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted">
                Glossário técnico, cursos por modalidade e base de conhecimento para treinadores e atletas
                — sem precisar abrir o YouTube ou procurar no Google.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: BookOpen, title: "Glossário esportivo completo", text: "VDOT, CTL, RPE, FTP, CSS — cada conceito explicado com contexto prático para o seu esporte." },
                  { icon: Trophy, title: "Cursos por modalidade", text: "Conteúdo de corrida, ciclismo, natação, triathlon e musculação. Feito por especialistas, organizado por nível." },
                  { icon: Brain, title: "IA contextualiza os dados", text: "Nos relatórios e check-ins, a IA explica o que cada número significa — em linguagem que faz sentido." },
                ].map(({ icon: Icon, title, text }) => (
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
            </div>

            {/* Course cards mockup */}
            <div
              className="overflow-hidden rounded-2xl shadow-xl shadow-black/50"
              style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#111827" }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-sm font-bold" style={{ color: "#f8fafc" }}>PACE University</p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "rgba(198,242,78,0.12)", color: "#C6F24E" }}
                >
                  24 cursos
                </span>
              </div>
              <div className="space-y-2 p-4">
                {[
                  { title: "Fisiologia da Corrida", tag: "Corrida", color: "#3FA7FF", progress: 72 },
                  { title: "Periodização de Força", tag: "Musculação", color: "#FF5A4D", progress: 45 },
                  { title: "Nutrição para Triathlon", tag: "Triathlon", color: "#FFB020", progress: 20 },
                  { title: "Zonas de Treino no Ciclismo", tag: "Ciclismo", color: "#C6F24E", progress: 100 },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl px-3 py-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ backgroundColor: `${c.color}18`, color: c.color }}
                      >
                        {c.tag}
                      </span>
                      <p className="text-xs font-semibold" style={{ color: "#f8fafc" }}>{c.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${c.progress}%`, backgroundColor: c.color }} />
                      </div>
                      <p className="w-8 text-right font-mono text-[10px]" style={{ color: c.progress === 100 ? "#46E0A0" : "#64748b" }}>
                        {c.progress}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrações ────────────────────────────────────────────────────────── */}
      <section
        id="integracoes"
        className="py-24 sm:py-32"
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
              Prescrição com IA, marketplace, mensagens, CTL/ATL/TSB, PACE University e white-label —
              em português, para quem leva esporte a sério.
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
                Corrida, ciclismo, natação, triathlon e musculação — prescrição com IA, marketplace,
                mensagens e white-label em português.
              </p>
              <p className="mt-2 text-xs text-text-muted">Performance · Ciência · Propósito</p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Para treinadores
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#treinadores" className="text-text-muted transition-colors hover:text-text">Funcionalidades</a></li>
                <li><a href="#marketplace" className="text-text-muted transition-colors hover:text-text">Marketplace</a></li>
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
                <li><a href="#universidade" className="text-text-muted transition-colors hover:text-text">PACE University</a></li>
                <li><Link href="/cadastro?perfil=atleta_independente" className="text-text-muted transition-colors hover:text-text">Criar conta grátis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Empresa
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#integracoes" className="text-text-muted transition-colors hover:text-text">Integrações</a></li>
                <li><a href="#assessorias" className="text-text-muted transition-colors hover:text-text">Para assessorias</a></li>
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
