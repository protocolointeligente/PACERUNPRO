import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  MailPlus,
  Send,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: CalendarDays,
    title: "Calendário Dinâmico",
    text: "Organize treinos por atleta, semana, mês ou lista. Copie, cole, edite e acompanhe tudo por modalidade.",
  },
  {
    icon: Brain,
    title: "Periodização Inteligente",
    text: "Crie macrociclos visuais com volume, intensidade, fases, provas e sugestões de sessões para revisar antes de enviar.",
  },
  {
    icon: ClipboardList,
    title: "Prescrição Otimizada",
    text: "Um único modal para corrida, ciclismo, natação, triatlo, funcional e musculação, com zonas, carga e biblioteca de exercícios.",
  },
];

const differentiators = [
  "Treinos por modalidade com ícones, cores e leitura rápida para treinador e atleta.",
  "Biblioteca com modelos prontos para acelerar a rotina da assessoria.",
  "Força integrada ao mesmo fluxo de prescrição, com exercícios e GIFs no celular.",
  "Alertas para risco, aderência, carga planejada versus realizada e check-ins.",
  "CRM simples para convites, atletas, planos e acompanhamento da carteira.",
  "PWA responsivo para o atleta acessar os treinos com experiência premium no mobile.",
];

const steps = [
  {
    icon: BadgeCheck,
    title: "Crie sua conta",
    text: "Configure sua assessoria, perfil profissional, modalidades e primeiros atletas em poucos minutos.",
  },
  {
    icon: MailPlus,
    title: "Convide atletas",
    text: "Envie convites individuais e acompanhe quem entrou, quem precisa ativar e quem já está pronto para treinar.",
  },
  {
    icon: CalendarDays,
    title: "Prescreva",
    text: "Monte a semana no calendário ou gere uma periodização com sugestões para aceitar, editar ou recusar.",
  },
  {
    icon: Send,
    title: "Envie e acompanhe",
    text: "Libere os treinos para o atleta e acompanhe execução, feedbacks, carga e progresso em um único painel.",
  },
];

const screenshots = [
  {
    title: "Painel do treinador",
    text: "Ações rápidas, indicadores da assessoria e atalhos para prescrever sem perder tempo.",
    src: "/marketing/trainer-dashboard.png",
  },
  {
    title: "Calendário visual",
    text: "Seleção de atleta, modalidades, biblioteca lateral e prescrição direta no calendário.",
    src: "/marketing/coach-calendar.png",
  },
  {
    title: "Periodização Intelligence",
    text: "Macrociclo com volume, intensidade e sugestões de sessões antes de liberar para o atleta.",
    src: "/marketing/periodization.png",
  },
  {
    title: "Biblioteca de treinos",
    text: "Modelos prontos por modalidade para reutilizar, adaptar e padronizar a entrega.",
    src: "/marketing/training-library.png",
  },
];

const plans = [
  {
    id: "b2b-free",
    name: "Grátis",
    price: "R$ 0",
    description: "Para testar a plataforma com um atleta e sentir o fluxo completo.",
    features: ["1 atleta", "Calendário básico", "Prescrição simples", "App do atleta"],
    highlight: false,
  },
  {
    id: "b2b-starter",
    name: "Starter",
    price: "R$ 97",
    description: "Para treinadores iniciando a gestão digital dos atletas.",
    features: ["Calendário e prescrição", "Biblioteca de treinos", "Alertas essenciais", "App do atleta"],
    highlight: false,
  },
  {
    id: "b2b-pro",
    name: "Pro",
    price: "R$ 197",
    description: "Para treinadores que querem escalar a rotina com mais controle.",
    features: ["Periodização Intelligence", "Modelos por modalidade", "Gestão de grupos", "Relatórios e evolução"],
    highlight: true,
  },
  {
    id: "b2b-assessoria",
    name: "Assessoria",
    price: "R$ 397",
    description: "Para equipes com operação, carteira de atletas e planos ativos.",
    features: ["CRM da assessoria", "Planos para atletas", "Equipe e permissão", "Suporte prioritário"],
    highlight: false,
  },
];

const primaryCta = "bg-[#c6f24e] text-[#0a0c0f] shadow-lg shadow-[#9dbf32]/25 hover:bg-[#d4ff5e]";
const accentText = "text-[#46e0c8]";
const accentSoft = "bg-[#c6f24e]/12 text-[#9dbd3d] dark:text-[#c6f24e]";

export default function LandingPage() {
  return (
    <main className="marketing-page min-h-dvh bg-[#f7f8fa] text-[#17212b] dark:bg-[#05090f] dark:text-white">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur dark:border-white/10 dark:bg-[#05090f]/92">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Pace Run Pro">
            <Logo size={34} />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#produto" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
              Produto
            </a>
            <a href="#telas" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
              Telas
            </a>
            <a href="#passos" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
              Como funciona
            </a>
            <a href="#planos" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
              Planos
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white sm:block">
              Entrar
            </Link>
            <Link href="#planos">
              <Button size="sm" className={primaryCta}>
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[#eef3f7] dark:border-white/10 dark:bg-[#05090f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(198,242,78,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,244,249,0.98)_55%,rgba(226,234,242,0.95))] dark:bg-[radial-gradient(circle_at_70%_10%,rgba(198,242,78,0.12),transparent_34%),linear-gradient(135deg,rgba(8,18,28,0.95),rgba(5,9,15,1)_55%,rgba(3,8,14,1))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-24">
          <div>
            <Badge variant="primary" className={`mb-5 ${accentSoft}`}>
              SaaS para treinadores e assessorias
            </Badge>
            <h1 className="font-display text-4xl font-black leading-tight text-slate-950 sm:text-6xl dark:text-white">
              Venda planos, prescreva melhor e acompanhe cada atleta com dados reais.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              O PACERUNPRO centraliza calendário, periodização, biblioteca, alertas, CRM, planos de venda e experiência do atleta
              em uma plataforma feita para treinadores que querem escalar a assessoria sem perder precisão técnica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#planos">
                <Button size="lg" className={primaryCta}>
                  Começar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#telas">
                <Button size="lg" variant="outline" className="border-slate-300 bg-white/70 text-slate-900 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  Ver a plataforma
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Atletas" value="Carteira em um painel" />
              <Metric icon={Dumbbell} label="Modalidades" value="Corrida, ciclismo, natação, triatlo, funcional e musculação" />
              <Metric icon={Bell} label="Alertas" value="Risco e aderência" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/40">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5a1f]" />
              <span className="h-3 w-3 rounded-full bg-[#c6f24e]" />
              <span className="h-3 w-3 rounded-full bg-[#46e0c8]" />
              <span className="ml-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Pace Run Pro em uso real</span>
            </div>
            <Image
              src="/marketing/trainer-dashboard.png"
              alt="Painel real do treinador no Pace Run Pro"
              width={1600}
              height={900}
              priority
              className="rounded-xl border border-slate-200 object-cover dark:border-white/10"
            />
          </div>
        </div>
      </section>

      <section id="produto" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="info" className="mb-4">
            Produto
          </Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">
            Três pilares para uma rotina de treino mais profissional.
          </h2>
          <p className="mt-4 text-slate-700 dark:text-slate-300">
            Menos planilhas soltas, menos mensagens perdidas e mais clareza para transformar planejamento em treino entregue.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b121a]">
              <CardContent className="p-6">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accentSoft}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-400">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="telas" className="border-y border-slate-200 bg-slate-50 py-16 dark:border-white/10 dark:bg-[#07111d]">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <Badge variant="success" className="mb-4">
                Plataforma real
              </Badge>
              <h2 className="font-display text-3xl font-black sm:text-5xl">
                O treinador vê exatamente onde cada atleta está.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-700 dark:text-slate-400">
              Prints reais da plataforma para mostrar a experiência que o treinador usa no dia a dia.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {screenshots.map((screen) => (
              <div key={screen.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b121a]">
                <Image
                  src={screen.src}
                  alt={screen.title}
                  width={1600}
                  height={900}
                  className="aspect-video w-full object-cover object-top"
                />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{screen.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">{screen.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="passos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="primary" className={`mb-4 ${accentSoft}`}>
            Comece em 4 passos
          </Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">
            Do primeiro cadastro ao atleta treinando.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-5 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 ${accentText}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="warning" className="mb-4 bg-orange-500/15 text-orange-700 dark:text-orange-300">
              Diferenciais
            </Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Uma operação mais clara para o treinador e mais premium para o atleta.
            </h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300">
              A plataforma foi pensada para entregar treino com contexto, visual forte e menos retrabalho na rotina da assessoria.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm dark:border-white/10 dark:bg-[#0b121a] dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="success" className="mb-4">
            Planos
          </Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">
            Escolha o plano ideal para sua assessoria crescer.
          </h2>
          <p className="mt-4 text-slate-700 dark:text-slate-300">
            Comece simples e evolua conforme sua carteira de atletas, equipe e necessidade de gestão.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-[#2563eb]/55 bg-[#2563eb]/12 shadow-xl shadow-[#2563eb]/10"
                  : "border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b121a]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-black">{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">{plan.description}</p>
                </div>
                {plan.highlight ? <Badge variant="primary">Popular</Badge> : null}
              </div>
              <div className="mt-6">
                <span className="font-display text-4xl font-black">{plan.price}</span>
                <span className="ml-1 text-sm text-slate-700 dark:text-slate-400">/mês</span>
              </div>
              <div className="mt-6 space-y-3">
                {plan.features.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#46e0c8]" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href={`/cadastro?perfil=treinador&plano=${plan.id}`} className="mt-7 block">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? primaryCta
                      : "border-slate-300 bg-slate-100 text-slate-950 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  }`}
                  variant={plan.highlight ? "primary" : "outline"}
                >
                  Começar com {plan.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#07111d] py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="primary" className={`mb-4 ${accentSoft}`}>
              Pronto para profissionalizar sua entrega?
            </Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Transforme sua assessoria em uma experiência digital completa.
            </h2>
          </div>
          <Link href="#planos">
            <Button size="lg" className={primaryCta}>
              Começar agora <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <Logo size={30} />
          <div className="flex flex-wrap gap-4">
            <Link href="/termos" className="text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
              Termos
            </Link>
            <Link href="/privacidade" className="text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
              Privacidade
            </Link>
            <Link href="/login" className="text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6f24e]/12 text-[#78951f] dark:text-[#c6f24e]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
