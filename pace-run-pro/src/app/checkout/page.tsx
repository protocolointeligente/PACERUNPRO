import Link from "next/link";
import { ArrowRight, CreditCard, Store, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const paths = [
  {
    href: "/loja",
    icon: Store,
    title: "Comprar plano de treinador",
    description:
      "Use a loja ou convite do treinador para abrir o checkout real, vincular o atleta e liberar o acesso apos pagamento.",
    cta: "Ver lojas publicas",
  },
  {
    href: "/cadastro",
    icon: UserPlus,
    title: "Criar conta de treinador",
    description:
      "Cadastre sua assessoria, publique seus planos e acompanhe pagamentos e contratos no painel de gestao.",
    cta: "Sou treinador",
  },
];

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-background text-text">
      <nav className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-[var(--on-primary)]">
              P
            </div>
            <span className="font-display text-lg font-extrabold tracking-wide">
              PACE RUN <span className="text-primary">PRO</span>
            </span>
          </Link>
          <Badge variant="info">Checkout seguro</Badge>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <section className="max-w-3xl">
          <Badge variant="warning" className="mb-5">
            Fluxo direto desativado
          </Badge>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-text sm:text-5xl">
            Finalize pelo plano publicado do treinador
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
            O checkout antigo com pagamento simulado foi removido para evitar
            venda sem cobranca real. A compra deve partir de um plano publicado
            no marketplace ou de um convite do treinador, usando a API de
            pagamento e webhooks de liberacao de acesso.
          </p>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {paths.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/35 hover:bg-card-hover"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-text">
                  {item.title}
                </h2>
                <p className="mt-2 min-h-20 text-sm leading-6 text-text-muted">
                  {item.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  {item.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text">Como fica o fluxo valido</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Plano publicado pelo treinador, checkout real, webhook confirma
                pagamento, atleta e vinculado ao treinador e o acesso e
                liberado automaticamente. Voucher/teste seguem como excecao
                administrativa auditavel.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
