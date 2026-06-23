import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

const B2B_PLANS = [
  {
    id: "b2b-starter",
    name: "Starter",
    price: 97,
    maxAthletes: 20,
    badge: null,
    highlight: false,
    features: [
      "Até 20 atletas",
      "1 treinador",
      "Prescrição de corrida com VDOT",
      "Periodização automática",
      "Calendário do atleta",
      "Check-in semanal",
      "Relatórios de performance",
      "Suporte por e-mail",
    ],
  },
  {
    id: "b2b-pro",
    name: "Pro",
    price: 197,
    maxAthletes: 80,
    badge: "Mais popular",
    highlight: true,
    features: [
      "Até 80 atletas",
      "Até 3 treinadores",
      "Tudo do Starter",
      "Treino de força para corredores",
      "Check-ins com IA e alertas automáticos",
      "Central de alertas inteligentes",
      "Relatórios PDF profissionais",
      "Painel financeiro do roster",
      "Suporte WhatsApp",
    ],
  },
  {
    id: "b2b-assessoria",
    name: "Assessoria",
    price: 397,
    maxAthletes: 250,
    badge: null,
    highlight: false,
    features: [
      "Até 250 atletas",
      "Até 10 treinadores",
      "Tudo do Pro",
      "CRM de retenção",
      "Painel financeiro multi-treinador",
      "Link de convite personalizado",
      "API básica para integrações",
      "Gerente de conta dedicado",
      "Suporte prioritário",
    ],
  },
  {
    id: "b2b-unlimited",
    name: "White Label",
    price: 997,
    maxAthletes: null,
    badge: "Sob consulta",
    highlight: false,
    features: [
      "Atletas ilimitados",
      "Treinadores ilimitados",
      "Tudo do Assessoria",
      "Marca própria (logo e domínio)",
      "App com a identidade da sua assessoria",
      "API completa",
      "SLA 99,9% com suporte 24 h",
      "Onboarding dedicado",
      "Contrato anual com desconto",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="precos" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="warning" className="mb-4">Preços</Badge>
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
            Planos para{" "}
            <span className="gradient-text">cada tamanho de assessoria</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Comece grátis. Escale conforme sua assessoria cresce.
            Sem taxa de setup, cancele quando quiser.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {B2B_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200",
                plan.highlight
                  ? "border-accent/60 bg-accent/8 backdrop-blur-sm"
                  : "border-border bg-card",
              ].join(" ")}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    variant={plan.highlight ? "primary" : "default"}
                    className="shadow-lg whitespace-nowrap"
                  >
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
                <p className="mt-1 text-xs text-text-muted">
                  {plan.maxAthletes === null ? "Atletas ilimitados" : `até ${plan.maxAthletes} atletas`}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="font-display text-3xl font-extrabold text-text">
                    R$ {formatBRL(plan.price)}
                  </span>
                  <span className="mb-1 text-sm text-text-muted">/mês</span>
                </div>
                {plan.id === "white-label" && (
                  <p className="mt-1 text-xs text-text-muted">A partir de — consulte plano anual</p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/onboarding/assessoria?plano=${plan.id}`}>
                <Button
                  variant={plan.highlight ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                >
                  {plan.id === "b2b-unlimited" ? "Solicitar proposta" : "Começar agora"}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          Pagamento via cartão ou PIX · Acesso imediato · Sem taxa de setup
        </p>
      </div>
    </section>
  );
}
