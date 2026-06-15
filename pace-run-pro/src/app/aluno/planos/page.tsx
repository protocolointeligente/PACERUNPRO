"use client";

import { motion } from "framer-motion";
import { CalendarRange, Flag, Layers, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { macrocycle, mesocycles, periodizationPhases } from "@/lib/mock-data";

export default function PlansPage() {
  const progress = (macrocycle.currentWeek / macrocycle.totalWeeks) * 100;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Planos &amp; periodização</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{macrocycle.name}</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Meta: <span className="text-text">{macrocycle.goal}</span> · {macrocycle.start} → {macrocycle.end}
        </p>
      </div>

      {/* Macrocycle progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-text">
              <CalendarRange className="h-4 w-4 text-primary" />
              Macrociclo — {macrocycle.totalWeeks} semanas
            </span>
            <span className="font-display text-sm font-bold text-text">
              Semana {macrocycle.currentWeek} de {macrocycle.totalWeeks}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="mt-2 text-xs text-text-muted">{Math.round(progress)}% do ciclo concluído rumo à prova-alvo</p>
        </CardContent>
      </Card>

      {/* Interactive timeline of phases */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Linha do tempo das fases</h2>
        <div className="relative space-y-4 pl-8">
          <div className="absolute bottom-2 left-[18px] top-2 w-0.5 bg-border" />
          {periodizationPhases.map((phase, i) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="relative"
            >
              <span
                className="absolute -left-8 top-4 flex h-9 w-9 items-center justify-center rounded-full border-4"
                style={{ borderColor: phase.current ? phase.color : "#1e2a40", backgroundColor: phase.current ? `${phase.color}33` : "#0b1220" }}
              >
                {phase.current ? (
                  <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full" style={{ backgroundColor: phase.color }} />
                ) : (
                  <Layers className="h-4 w-4 text-text-muted" />
                )}
              </span>
              <Card className={phase.current ? "border-primary/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-text">{phase.name}</h3>
                      <Badge style={{ borderColor: `${phase.color}55`, color: phase.color, backgroundColor: `${phase.color}1a` }} className="border">
                        Semanas {phase.weeks}
                      </Badge>
                    </div>
                    {phase.current && <Badge variant="primary">Fase atual</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm text-text-muted">{phase.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mesocycles */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-text">
          <Target className="h-4 w-4 text-primary" />
          Mesociclos do plano
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {mesocycles.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-2">{m.weeks}</Badge>
                <p className="font-display text-sm font-bold text-text">{m.name}</p>
                <p className="mt-1 text-xs text-text-muted">Foco: {m.focus}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
                  <Flag className="h-3 w-3" /> Fase: {m.phase}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-info/30 bg-info/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-text">Como funciona a periodização</h3>
            <p className="mt-1 text-sm text-text-muted">
              Seu plano é dividido em <span className="text-text">macrociclo</span> (objetivo de longo prazo),{" "}
              <span className="text-text">mesociclos</span> (blocos de 3-5 semanas com foco específico) e{" "}
              <span className="text-text">microciclos semanais</span> — sempre alternando estímulo e recuperação para
              maximizar sua evolução com segurança.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
