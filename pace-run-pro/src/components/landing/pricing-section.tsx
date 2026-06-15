"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { b2cPlans, b2cIncludes, b2bPlans } from "@/lib/mock-data";
import { formatBRL } from "@/lib/utils";

export function PricingSection() {
  const [activeTab, setActiveTab] = useState<"atletas" | "assessorias">("atletas");

  return (
    <section id="precos" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="warning" className="mb-4">
            Preços
          </Badge>
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
            Escolha seu{" "}
            <span className="gradient-text">caminho</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Para atletas que buscam evolução ou assessorias que querem gerenciar com tecnologia de elite.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-12 flex justify-center">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "atletas" | "assessorias")}
          >
            <TabsList className="h-12">
              <TabsTrigger value="atletas" className="px-6 py-2.5 text-sm font-semibold">
                Para atletas
              </TabsTrigger>
              <TabsTrigger value="assessorias" className="px-6 py-2.5 text-sm font-semibold">
                Para assessorias / treinadores
              </TabsTrigger>
            </TabsList>

            {/* ── B2C Track ─────────────────────────────────────────── */}
            <TabsContent value="atletas" className="mt-10">
              <div className="mb-10 text-center">
                <h3 className="font-display text-2xl font-bold text-text">
                  Treine com o Ricardo Pace e equipe
                </h3>
                <p className="mt-3 text-sm text-text-muted">Todos os planos incluem:</p>
                <ul className="mx-auto mt-4 inline-flex max-w-xl flex-col items-start gap-2">
                  {b2cIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {b2cPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={[
                      "relative flex flex-col rounded-2xl border p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200",
                      plan.highlight
                        ? "border-primary/60 bg-primary/10 backdrop-blur-sm"
                        : "border-border bg-card",
                    ].join(" ")}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary" className="shadow-lg shadow-primary/25 whitespace-nowrap">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
                      <p className="mt-1 text-xs text-text-muted">{plan.description}</p>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-end gap-1">
                        <span className="font-display text-3xl font-extrabold text-text">
                          R$ {formatBRL(plan.pricePerMonth)}
                        </span>
                        <span className="mb-1 text-sm text-text-muted">/mês</span>
                      </div>
                      {plan.months > 1 && (
                        <p className="mt-1 text-xs text-text-muted">
                          Total: R$ {formatBRL(plan.totalPrice)} em {plan.months}x
                        </p>
                      )}
                      {plan.discountPct > 0 && (
                        <span className="mt-2 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                          {plan.discountPct}% de desconto
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-6">
                      <Link href={`/assinar?plano=${plan.id}`}>
                        <Button
                          variant={plan.highlight ? "primary" : "outline"}
                          size="md"
                          className="w-full"
                        >
                          Assinar agora →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-text-muted">
                Pagamento via cartão, PIX ou boleto · Cancele quando quiser
              </p>
            </TabsContent>

            {/* ── B2B Track ─────────────────────────────────────────── */}
            <TabsContent value="assessorias" className="mt-10">
              <div className="mb-10 text-center">
                <h3 className="font-display text-2xl font-bold text-text">
                  Para assessorias e treinadores
                </h3>
                <p className="mt-2 text-sm text-text-muted">
                  Gerencie seus atletas com tecnologia de elite
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {b2bPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={[
                      "relative flex flex-col rounded-2xl border p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200",
                      plan.highlight
                        ? "border-primary/60 bg-primary/10 backdrop-blur-sm"
                        : "border-border bg-card",
                    ].join(" ")}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary" className="shadow-lg shadow-primary/25 whitespace-nowrap">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-display text-lg font-bold text-text">{plan.name}</h4>
                      <p className="mt-1 text-xs text-text-muted">
                        {plan.maxAthletes === null ? "Ilimitado" : `até ${plan.maxAthletes} atletas`}
                        {" · "}
                        {plan.maxCoaches === null ? "Ilimitado" : `${plan.maxCoaches} treinadores`}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-end gap-1">
                        <span className="font-display text-3xl font-extrabold text-text">
                          {plan.price === 0 ? "Grátis" : `R$ ${formatBRL(plan.price)}`}
                        </span>
                        {plan.price > 0 && <span className="mb-1 text-sm text-text-muted">/mês</span>}
                      </div>
                    </div>

                    <ul className="mb-6 flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-text-muted">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={
                        plan.price === 0
                          ? "/cadastro?perfil=treinador"
                          : `/onboarding/assessoria?plano=${plan.id}`
                      }
                    >
                      <Button
                        variant={plan.highlight ? "primary" : "outline"}
                        size="md"
                        className="w-full"
                      >
                        {plan.price === 0 ? "Começar grátis" : "Solicitar acesso"}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-text-muted">
                Acesso imediato após aprovação · Sem taxa de setup
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
