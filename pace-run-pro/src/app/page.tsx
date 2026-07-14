import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const starterPrice = 97;
const athleteCount = 20;
const athleteMonthlyFee = 150;
const grossRevenue = athleteCount * athleteMonthlyFee;
const platformSplit = grossRevenue * 0.1;
const coachNet = grossRevenue - platformSplit;
const totalPlatformRevenue = starterPrice + platformSplit;

const trainerFlow = [
  {
    icon: BadgeCheck,
    title: "Treinador assina o Starter",
    text: `Simulacao: plano Starter de R$ ${starterPrice}/mes para ativar calendario, periodizacao, biblioteca, alertas e CRM.`,
  },
  {
    icon: WalletCards,
    title: "Conta Asaas vinculada",
    text: "No onboarding, ele informa os dados de recebimento. A plataforma cria/valida a conta para split de pagamento.",
  },
  {
    icon: Mail,
    title: "Convite isolado por treinador",
    text: "Cada atleta recebe um link unico do treinador. O pagamento nunca deve cair no treinador errado.",
  },
  {
    icon: CreditCard,
    title: "Atleta paga a mensalidade",
    text: `Com 20 atletas a R$ ${athleteMonthlyFee}/mes, a assessoria movimenta R$ ${grossRevenue.toLocaleString("pt-BR")}/mes.`,
  },
  {
    icon: ShieldCheck,
    title: "Split automatico 90/10",
    text: `Treinador recebe R$ ${coachNet.toLocaleString("pt-BR")}/mes e a plataforma recebe R$ ${platformSplit.toLocaleString("pt-BR")}/mes em split.`,
  },
  {
    icon: CalendarDays,
    title: "Entrega do treino",
    text: "Treinador prescreve no calendario ou edita sugestoes da periodizacao. O atleta recebe tudo no app premium.",
  },
];

const productBlocks = [
  {
    icon: CalendarDays,
    title: "Calendario estilo TrainingPeaks",
    text: "Selecao do atleta, visao semana/mes/lista, copiar e colar treino ou semana, drag and drop e modalidades por icone.",
  },
  {
    icon: Brain,
    title: "Periodizacao Intelligence",
    text: "Macrociclo visual com volume em colunas, intensidade em linha, tapering, eventos A/B/C e sugestoes de sessoes.",
  },
  {
    icon: Dumbbell,
    title: "Modal unico de prescricao",
    text: "Corrida, ciclismo, natacao e forca no mesmo fluxo. Forca busca exercicios da biblioteca com GIF e estrutura series x reps x carga.",
  },
  {
    icon: Bell,
    title: "Alertas e previsto x realizado",
    text: "Carga planejada versus executada, Strava quando sincronizado, check-ins e sinais de fadiga para o treinador agir rapido.",
  },
  {
    icon: Users,
    title: "CRM da assessoria",
    text: "Atletas, leads, planos contratados, pagantes, convites e link de pagamento por treinador.",
  },
  {
    icon: LockKeyhole,
    title: "Super admin operacional",
    text: "Controle de planos, treinadores, pagamentos, convites, configuracoes e rotas criticas sem depender de programacao.",
  },
];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function MiniCalendar() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const sessions = [
    ["Corrida Z2", "Forca A"],
    ["Bike Sweet"],
    ["Natacao CSS"],
    ["Forca B"],
    ["Tempo Run"],
    ["Longao"],
    ["Off"],
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111d] p-4 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-500" />
          <div>
            <p className="text-sm font-bold text-white">Joao Silva</p>
            <p className="text-xs text-slate-400">Triatleta - Semana 12</p>
          </div>
        </div>
        <Badge variant="primary">Semana</Badge>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-white/10">
        {days.map((day, index) => (
          <div key={day} className="min-h-44 border-r border-white/10 bg-white/[0.03] p-2 last:border-r-0">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase text-slate-400">{day}</p>
            <div className="space-y-2">
              {sessions[index].map((session) => (
                <div
                  key={session}
                  className="rounded-lg border border-white/10 px-2 py-2 text-[11px] font-semibold text-white"
                  style={{
                    background:
                      session.includes("Forca") ? "linear-gradient(135deg, rgba(124,58,237,.42), rgba(124,58,237,.18))" :
                      session.includes("Bike") ? "linear-gradient(135deg, rgba(34,197,94,.38), rgba(34,197,94,.16))" :
                      session.includes("Natacao") ? "linear-gradient(135deg, rgba(14,165,233,.38), rgba(14,165,233,.16))" :
                      session === "Off" ? "rgba(148,163,184,.12)" :
                      "linear-gradient(135deg, rgba(249,115,22,.42), rgba(249,115,22,.18))",
                  }}
                >
                  {session}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[#050b12] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050b12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={34} />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <a href="#produto" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Produto</a>
            <a href="#fluxo" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Fluxo SaaS</a>
            <a href="#financeiro" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Simulacao</a>
            <a href="#mvp" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">MVP</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-300 hover:text-white sm:block">Entrar</Link>
            <Link href="/cadastro?perfil=treinador">
              <Button size="sm" className="bg-orange-500 text-white hover:bg-orange-400">
                Comecar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div>
          <Badge variant="primary" className="mb-5 bg-orange-500/15 text-orange-300">SaaS para treinadores e assessorias</Badge>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-6xl">
            Prescricao, periodizacao e gestao financeira em um unico sistema.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            O Pace Run Pro organiza a rotina do treinador: calendario premium, periodizacao com Intelligence,
            modal unico de treino, CRM de atletas e pagamentos com split via Asaas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro?perfil=treinador">
              <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-400">
                Assinar Starter <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#financeiro">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                Ver simulacao financeira
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Metric label="Atletas exemplo" value={`${athleteCount}`} />
            <Metric label="Mensalidade" value={money(athleteMonthlyFee)} />
            <Metric label="Receita treinador" value={money(coachNet)} />
          </div>
        </div>
        <MiniCalendar />
      </section>

      <section id="produto" className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-3xl">
            <Badge variant="info" className="mb-4">Produto</Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">O coracao do MVP e a entrega do treino.</h2>
            <p className="mt-4 text-slate-300">
              A experiencia foi reorganizada para evitar rotas duplicadas: calendario e periodizacao usam o mesmo modal de prescricao.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productBlocks.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-white/10 bg-[#07111d]">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="fluxo" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="success" className="mb-4">Fluxo completo</Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">Do interesse do treinador ao atleta treinando.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trainerFlow.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-orange-300">
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

      <section id="financeiro" className="border-y border-white/10 bg-[#07111d] py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge variant="warning" className="mb-4">Simulacao financeira</Badge>
            <h2 className="font-display text-3xl font-black sm:text-5xl">Treinador Starter com 20 atletas.</h2>
            <p className="mt-4 text-slate-300">
              Exemplo para visualizar a economia do SaaS: o treinador paga a assinatura e cobra mensalidades dos atletas com split automatico.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-5">
            <FinancialRow label="Assinatura Starter paga pelo treinador" value={money(starterPrice)} />
            <FinancialRow label={`${athleteCount} atletas x ${money(athleteMonthlyFee)}/mes`} value={money(grossRevenue)} />
            <FinancialRow label="Split plataforma sobre mensalidades (10%)" value={money(platformSplit)} />
            <FinancialRow label="Repasse para treinador (90%)" value={money(coachNet)} />
            <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-sm text-orange-200">Receita total Pace Run Pro neste exemplo</p>
              <p className="font-display text-3xl font-black text-white">{money(totalPlatformRevenue)}/mes</p>
              <p className="mt-1 text-xs text-slate-400">Starter + split da carteira deste treinador.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="mvp" className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <Badge variant="primary" className="mb-4">MVP</Badge>
          <h2 className="font-display text-3xl font-black sm:text-5xl">O que precisa estar redondo para vender.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Treinador cria conta, assina Starter e cadastra dados Asaas.",
            "Treinador convida atleta por link isolado e acompanha status no CRM.",
            "Atleta paga, entra no app e recebe treinos liberados no calendario.",
            "Treinador cria periodizacao, aceita/edita sugestoes e envia para o atleta.",
            "Treinos de forca usam biblioteca com GIF e execucao mobile premium.",
            "Super admin controla planos, usuarios, cobranças, split e configuracoes criticas.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <Logo size={30} />
          <div className="flex flex-wrap gap-4">
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/login" className="hover:text-white">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
    </div>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="font-display text-lg font-bold text-white">{value}</span>
    </div>
  );
}
