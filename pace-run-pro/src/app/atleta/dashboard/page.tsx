"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarCheck2,
  CalendarClock,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AthleteDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Atleta";
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">{greeting}, {firstName} 👋</p>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Bem-vindo ao Pace Run Pro!
          </h1>
        </div>
        <Badge variant="primary" className="px-3 py-1.5 text-xs">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          Início do programa
        </Badge>
      </motion.div>

      {/* Treino do dia — aguardando */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <CalendarClock className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="primary" className="mb-3">Treino de hoje</Badge>
              <h2 className="font-display text-xl font-bold text-text">
                Aguardando prescrição do treinador
              </h2>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Seu treinador ainda está preparando seu plano de treinamento personalizado.
                Fique de olho — você receberá uma notificação assim que os treinos forem liberados.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Check-in */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-text">Check-in diário</h3>
                  <p className="text-xs text-text-muted">Leva menos de 1 minuto</p>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                Registre como você está se sentindo hoje. Seu treinador usa essas informações para ajustar seus treinos.
              </p>
              <Link href="/atleta/checkin">
                <Button className="w-full">Fazer check-in agora</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-semibold text-text">Status de hoje</h3>
              </div>
              <p className="text-sm text-text-muted">
                Complete seu check-in para que seu status de prontidão seja calculado automaticamente.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximas sessões */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-5 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-text">Próximas sessões</h3>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <p className="text-sm text-text-muted">Nenhuma sessão agendada ainda.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-text">Complete seu perfil</h3>
              <p className="mb-4 text-sm text-text-muted">
                Mantenha seu perfil atualizado para que seu treinador possa personalizar melhor seus treinos.
              </p>
              <Link href="/atleta/perfil">
                <Button variant="secondary" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  Ver meu perfil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
