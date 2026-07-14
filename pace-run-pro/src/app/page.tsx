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
    title: "Calendario Dinamico",
    text: "Organize treinos por atleta, semana, mes ou lista. Copie, cole, edite e acompanhe tudo por modalidade.",
  },
  {
    icon: Brain,
    title: "Periodizacao Inteligente",
    text: "Crie macrociclos visuais com volume, intensidade, fases, provas e sugestoes de sessoes para revisar antes de enviar.",
  },
  {
    icon: ClipboardList,
    title: "Prescricao Otimizada",
    text: "Um unico modal para corrida, ciclismo, natacao, triathlon e forca, com zonas, carga e biblioteca de exercicios.",
  },
];

const differentiators = [
  "Treinos por modalidade com icones, cores e leitura rapida para treinador e atleta.",
  "Biblioteca com modelos prontos para acelerar a rotina da assessoria.",
  "Forca integrada ao mesmo fluxo de prescricao, com exercicios e GIFs no celular.",
  "Alertas para risco, aderencia, carga planejada versus realizada e check-ins.",
  "CRM simples para convites, atletas, planos e acompanhamento da carteira.",
  "PWA responsivo para o atleta acessar os treinos com experiencia premium no mobile.",
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
    text: "Envie convites individuais e acompanhe quem entrou, quem precisa ativar e quem ja esta pronto para treinar.",
  },
  {
    icon: CalendarDays,
    title: "Prescreva",
    text: "Monte a semana no calendario ou gere uma periodizacao com sugestoes para aceitar, editar ou recusar.",
  },
  {
    icon: Send,
    title: "Envie e acompanhe",
    text: "Libere os treinos para o atleta e acompanhe execucao, feedbacks, carga e progresso em um unico painel.",
  },
];

const screenshots = [
  {
    title: "Painel do treinador",
    text: "Acoes rapidas, indicadores da assessoria e atalhos para prescrever sem perder tempo.",
    src: "/marketing/trainer-dashboard.png",
  },
  {
    title: "Calendario visual",
    text: "Selecao de atleta, modalidades, biblioteca lateral e prescricao direta no calendario.",
    src: "/marketing/coach-calendar.png",
  },
  {
    title: "Periodizacao Intelligence",
    text: "Macrociclo com volume, intensidade e sugestoes de sessoes antes de liberar para o atleta.",
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
    name: "Starter",
    price: "R$ 97",
    description: "Para treinadores iniciando a gestao digital dos atletas.",
    features: ["Calendario e prescricao", "Biblioteca de treinos", "Alertas essenciais", "App do atleta"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    description: "Para treinadores que querem escalar a rotina com mais controle.",
    features: ["Periodizacao Intelligence", "Modelos por modalidade", "Gestao de grupos", "Relatorios e evolucao"],
    highlight: true,
  },
  {
    name: "Assessoria",
    price: "R$ 397",
    description: "Para equipes com operacao, carteira de atletas e planos ativos.",
    features: ["CRM da assessoria", "Planos para atletas", "Equipe e permissao", "Suporte prioritario"],
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[#05090f] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#05090f]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Pace Run Pro">
            <Logo size={34} />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#produto" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Produto
            </a>
            <a href="#telas" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Telas
            </a>
            <a href="#passos" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Como funciona
            </a>
            <a href="#planos" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Planos
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-300 hover:text-white sm:block">
              Entrar
            </Link>
            <Link href="/cadastro?perfil=treinador">
              <Button size="sm" className="bg-[#c6ff3d] text-black shadow-lg shadow-[#c6ff3d]/20 hover:bg-[#aef12f]">
                Comecar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(198,255,61,0.16),transparent_34%),linear-gradient(135deg,rgba(8,20,16,0.95),rgba(5,9,15,1)_55%,rgba(3,8,14,1))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-24">
          <div>
            <Badge variant="primary" className="mb-5 bg-[#c6ff3d]/15 text-[#c6ff3d]">
              SaaS para treinadores e assessorias
            </Badge>
            <h1 className="font-display text-4xl font-black leading-tight sm:text-6xl">
              Receba, gerencie, prescreva e controle tudo em um unico lugar.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              O Pace Run Pro centraliza calendario, periodizacao, biblioteca, alertas, CRM e experiencia do atleta
              em uma plataforma feita para treinadores que querem vender melhor e entregar treino com excelencia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro?perfil=treinador">
                <Button size="lg" className="bg-[#c6ff3d] text-black shadow-xl shadow-[#c6ff3d]/20 hover:bg-[#aef12f]">
                  Comecar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#telas">
                <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  Ver a plataforma
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <Metric icon={Users} label="Atletas" value="Carteira em um painel" />
              <Metric icon={Dumbbell} label="Modalidades" value="Endurance e forca" />
              <Metric icon={Bell} label="Alertas" value="Risco e aderencia" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/40">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5a1f]" />
              <span className="h-3 w-3 rounded-full bg-[#c6ff3d]" />
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              <span className="ml-3 text-xs font-semibold text-slate-400">Pace Run Pro em uso real</span>
            </div>
            <Image
              src="/marketing/trainer-dashboard.png"
              alt="Painel real do treinador no Pace Run Pro"
              width={1600}
              height={900}
              priority
              className="rounded-xl border border-white/10 object-cover"
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
            Tres pilares para uma rotina de treino mais profissional.
          </h2>
          <p className="mt-4 text-slate-300">
            Menos planilhas soltas, menos mensagens perdidas e mais clareza para transformar planejamento em treino entregue.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-white/10 bg-[#0b121a]">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#c6ff3d]/12 text-[#c6ff3d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="telas" className="border-y border-white/10 bg-[#07111d] py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <Badge variant="success" className="mb-4">
                Plataforma real
              </Badge>
              <h2 className="font-display text-3xl font-black sm:text-5xl">
                O treinador ve exatamente onde cada atleta esta.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Prints reais da plataforma para mostrar a experiencia que o treinador usa no dia a dia.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {screenshots.map((screen) => (
              <div key={screen.title} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b121a]">
                <Image
                  src={screen.src}
                  alt={screen.title}
                  width={1600}
                  height={900}
                  className="aspect-video w-full object-cover object-top"
                />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{screen.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{screen.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="passos" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="primary" className="mb-4 bg-[#c6ff3d]/15 text-[#c6ff3d]">
            Comece em 4 passos
          </Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">
            Do primeiro cadastro ao atleta treinando.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-[#c6ff3d]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Badge variant="warning" className="mb-4 bg-orange-500/15 text-orange-300">
              Diferenciais
            </Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Uma operacao mais clara para o treinador e mais premium para o atleta.
            </h2>
            <p className="mt-4 text-slate-300">
              A plataforma foi pensada para entregar treino com contexto, visual forte e menos retrabalho na rotina da assessoria.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-[#0b121a] p-4 text-sm text-slate-300">
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
          <p className="mt-4 text-slate-300">
            Comece simples e evolua conforme sua carteira de atletas, equipe e necessidade de gestao.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-[#c6ff3d]/50 bg-[#c6ff3d]/10 shadow-xl shadow-[#c6ff3d]/10"
                  : "border-white/10 bg-[#0b121a]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-black">{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                </div>
                {plan.highlight ? <Badge variant="primary">Popular</Badge> : null}
              </div>
              <div className="mt-6">
                <span className="font-display text-4xl font-black">{plan.price}</span>
                <span className="ml-1 text-sm text-slate-400">/mes</span>
              </div>
              <div className="mt-6 space-y-3">
                {plan.features.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#c6ff3d]" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/cadastro?perfil=treinador" className="mt-7 block">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-[#c6ff3d] text-black hover:bg-[#aef12f]"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  variant={plan.highlight ? "primary" : "outline"}
                >
                  Comecar com {plan.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#07111d] py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Badge variant="primary" className="mb-4 bg-[#c6ff3d]/15 text-[#c6ff3d]">
              Pronto para profissionalizar sua entrega?
            </Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Transforme sua assessoria em uma experiencia digital completa.
            </h2>
          </div>
          <Link href="/cadastro?perfil=treinador">
            <Button size="lg" className="bg-[#c6ff3d] text-black shadow-xl shadow-[#c6ff3d]/20 hover:bg-[#aef12f]">
              Comecar agora <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <Logo size={30} />
          <div className="flex flex-wrap gap-4">
            <Link href="/termos" className="hover:text-white">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link href="/login" className="hover:text-white">
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
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6ff3d]/12 text-[#c6ff3d]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
