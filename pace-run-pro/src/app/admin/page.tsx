import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FileClock,
  KeyRound,
  LineChart,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const adminAreas = [
  {
    href: "/admin/dashboard",
    icon: LineChart,
    title: "Cockpit do SaaS",
    text: "MRR, assessorias ativas, risco de churn, aprovacoes e saude operacional.",
  },
  {
    href: "/admin/usuarios",
    icon: Users,
    title: "Usuarios e papeis",
    text: "Criar, editar e revisar administradores, treinadores e atletas.",
  },
  {
    href: "/admin/planos",
    icon: SlidersHorizontal,
    title: "Planos e limites",
    text: "Configurar Starter, Pro, Assessoria, limites, precos e recursos liberados.",
  },
  {
    href: "/admin/financeiro",
    icon: WalletCards,
    title: "Financeiro e split",
    text: "Acompanhar assinatura do treinador, mensalidades dos atletas e repasse 90/10.",
  },
  {
    href: "/admin/aprovacoes",
    icon: BadgeCheck,
    title: "Aprovacoes",
    text: "Validar novas assessorias, contas de recebimento e pendencias de ativacao.",
  },
  {
    href: "/admin/assessorias",
    icon: CreditCard,
    title: "Assessorias",
    text: "Entrar na visao de cada treinador, editar status e acompanhar carteira.",
  },
  {
    href: "/admin/logs",
    icon: FileClock,
    title: "Logs e auditoria",
    text: "Rastrear acoes criticas, falhas de webhook, alteracoes e seguranca.",
  },
  {
    href: "/admin/pendencias",
    icon: ShieldCheck,
    title: "Fila operacional",
    text: "Resolver cobrancas, convites, integracoes e problemas que bloqueiam o MVP.",
  },
];

const noCodeControls = [
  "Editar precos, limites de atletas e recursos por plano.",
  "Ativar, suspender ou reatribuir treinador/atleta.",
  "Configurar checkout, split Asaas e status de pagamento.",
  "Reenviar convite seguro para atleta por treinador.",
  "Auditar rotas antigas, webhooks e logs de erro.",
  "Controlar cursos Pace University e conteudos padrao.",
];

export default function AdminRootPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Badge variant="primary">Super admin</Badge>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
              Central de controle do Pace Run Pro
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
              O super admin precisa operar o SaaS sem programacao: configurar planos, usuarios,
              pagamentos, convites, conteudos, logs e seguranca em rotas pre-definidas.
            </p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <KeyRound className="h-4 w-4 text-primary" />
              Regra de ouro
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Toda rota admin deve validar sessao ADMIN no servidor e nunca depender apenas de menu,
              middleware ou interface escondida.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminAreas.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="group block">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-base font-bold text-text">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Abrir controle <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-text">Controles sem programacao esperados no MVP</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {noCodeControls.map((item) => (
              <div key={item} className="rounded-xl border border-border bg-background/60 p-3 text-sm text-text-muted">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
