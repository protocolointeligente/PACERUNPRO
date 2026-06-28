"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  CalendarDays,
  Compass,
  DollarSign,
  Dumbbell,
  FileBarChart,
  Flame,
  Gauge,
  GraduationCap,
  HeartPulse,
  Info,
  Kanban,
  LayoutDashboard,
  Layers,
  Lock,
  Moon,
  Palette,
  Settings,
  Share2,
  ShieldAlert,
  Smile,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateVDOT, getTrainingPaces, parseRaceTime, TRAINING_ZONES } from "@/lib/vdot";
import { formatPace } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

// Minimum plan tier required to access each path (0 = free)
const PLAN_TIER: Record<string, number> = {
  "b2b-free": 0,
  "b2b-starter": 1,
  "b2b-pro": 2,
  "b2b-assessoria": 3,
  "b2b-unlimited": 4,
};

const PLAN_LABEL: Record<number, string> = {
  1: "Starter",
  2: "Pro",
  3: "Assessoria",
  4: "Unlimited",
};

const PATH_MIN_TIER: Record<string, number> = {
  "/treinador/gestao": 1,
  "/treinador/planos-venda": 1,
  "/treinador/financeiro": 1,
  "/treinador/minha-pagina": 1,
  "/treinador/crm": 1,
  "/treinador/vouchers": 2,
  "/treinador/admin": 3,
  "/treinador/white-label": 4,
};

export default function ConhecaOSistemaClient({ planId = "b2b-free" }: { planId?: string }) {
  const currentTier = PLAN_TIER[planId] ?? 0;
  const exampleVdot = Math.round(calculateVDOT(10000, parseRaceTime("47:52")));
  const examplePaces = getTrainingPaces(exampleVdot);

  function isLocked(href: string) {
    const minTier = PATH_MIN_TIER[href] ?? 0;
    return currentTier < minTier;
  }

  function requiredPlan(href: string) {
    return PLAN_LABEL[PATH_MIN_TIER[href] ?? 0] ?? "";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Badge variant="primary" className="mb-3">
          <GraduationCap className="h-3 w-3" />
          Central de ajuda
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Conheça o sistema</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Um guia rápido para tirar o máximo proveito da plataforma — do cadastro do atleta até a
          prescrição com VDOT, a periodização do treino, o acompanhamento de carga e as ferramentas
          de gestão, vendas e força.
        </p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Tabs defaultValue="comecando">
          <TabsList>
            <TabsTrigger value="comecando">Primeiros passos</TabsTrigger>
            <TabsTrigger value="vdot">VDOT &amp; zonas</TabsTrigger>
            <TabsTrigger value="periodizacao">Periodização</TabsTrigger>
            <TabsTrigger value="carga">Carga &amp; check-in</TabsTrigger>
            <TabsTrigger value="gestao">Gestão, vendas &amp; força</TabsTrigger>
          </TabsList>

          {/* Primeiros passos */}
          <TabsContent value="comecando" className="space-y-5">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text">
                  <Compass className="h-4 w-4 text-primary" />
                  Fluxo de trabalho recomendado
                </h2>
                <div className="space-y-4">
                  <Step
                    number={1}
                    title="Cadastre seus atletas"
                    description="Compartilhe o link ou QR code de convite, disponível em Gestão & vendas — o atleta entra automaticamente vinculado à sua conta."
                  />
                  <Step
                    number={2}
                    title="Avalie o nível de cada atleta"
                    description="Registre o resultado de uma prova recente em Prescrição de corrida para calcular o VDOT, a base dos paces de treino personalizados."
                  />
                  <Step
                    number={3}
                    title="Monte a periodização"
                    description="Em Periodização, defina objetivo, nível e duração do ciclo. O sistema gera mesociclos, microciclos e semanas de descarga automaticamente."
                  />
                  <Step
                    number={4}
                    title="Prescreva os treinos da semana"
                    description="Use o motor inteligente baseado em VDOT na Prescrição de corrida e monte as sessões de força na Prescrição de força."
                  />
                  <Step
                    number={5}
                    title="Acompanhe check-ins e carga"
                    description="Monitore RPE, dor, sono e fadiga. O motor de check-in inteligente ajusta a carga da próxima semana automaticamente quando detecta sinais de risco."
                  />
                  <Step
                    number={6}
                    title="Analise e gere relatórios"
                    description="Use Análise semanal e Alertas para agir rápido, e exporte relatórios em PDF, Excel ou CSV para seus atletas."
                  />
                  <Step
                    number={7}
                    title="Conecte o Strava para sincronização automática"
                    description="Em Perfil → Integrações, conecte a conta Strava do atleta. Toda atividade registrada automaticamente vira WorkoutLog e atualiza a taxa de adesão em tempo real."
                  />
                  <Step
                    number={8}
                    title="Capture leads com a isca digital"
                    description="No CRM de leads, copie o link de isca e divulgue no Instagram. Quem preencher o formulário entra automaticamente no seu funil de vendas."
                  />
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 font-display text-base font-semibold text-text">Atalhos rápidos</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureLink href="/treinador/dashboard" icon={LayoutDashboard} title="Dashboard" description="Visão geral da equipe, alertas e carga semanal." />
                <FeatureLink href="/treinador/atletas" icon={Users} title="Atletas" description="Lista completa com adesão, carga e status de cada atleta." />
                <FeatureLink href="/treinador/prescricao/corrida" icon={Activity} title="Prescrição de corrida" description="Motor inteligente baseado em VDOT e zonas de Daniels." />
                <FeatureLink href="/treinador/prescricao/forca" icon={Dumbbell} title="Prescrição de força" description="Monte sessões de força com a biblioteca de exercícios." />
                <FeatureLink href="/treinador/prescricao/periodizacao" icon={CalendarDays} title="Periodização" description="Gere macrociclos, mesociclos e microciclos automaticamente." />
                <FeatureLink href="/treinador/alertas" icon={Bell} title="Alertas" description="Sinais automáticos de risco — fadiga, dor, queda de adesão." />
                <FeatureLink href="/treinador/analise-semanal" icon={BarChart2} title="Análise semanal" description="Volume, pace, aderência e recomendações por atleta." />
                <FeatureLink href="/treinador/relatorios" icon={FileBarChart} title="Relatórios" description="Exporte PDFs, planilhas e dados brutos." />
                <FeatureLink href="/treinador/gestao" icon={DollarSign} title="Gestão & vendas" description="MRR, slots, despesas, resultado líquido e convites." locked={isLocked("/treinador/gestao")} requiredPlan={requiredPlan("/treinador/gestao")} />
                <FeatureLink href="/treinador/crm" icon={Kanban} title="CRM + isca digital" description="Funil de vendas, taxa de conversão e link de captação automática." locked={isLocked("/treinador/crm")} requiredPlan={requiredPlan("/treinador/crm")} />
                <FeatureLink href="/treinador/white-label" icon={Palette} title="White-label" description="Marca, cores e módulos da sua assessoria." locked={isLocked("/treinador/white-label")} requiredPlan={requiredPlan("/treinador/white-label")} />
                <FeatureLink href="/treinador/admin" icon={Settings} title="Admin" description="Visão consolidada da plataforma e assinaturas." locked={isLocked("/treinador/admin")} requiredPlan={requiredPlan("/treinador/admin")} />
                <FeatureLink href="/atleta/calendario" icon={Trophy} title="Calendário de provas" description="Atletas cadastram suas provas e distâncias; treinador planeja em torno delas." />
                <FeatureLink href="/treinador/minha-pagina" icon={Share2} title="Página pública" description="Link + QR code para atrair novos atletas; foto e banner do treinador." locked={isLocked("/treinador/minha-pagina")} requiredPlan={requiredPlan("/treinador/minha-pagina")} />
              </div>
            </div>
          </TabsContent>

          {/* VDOT & zonas */}
          <TabsContent value="vdot" className="space-y-5">
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
                  <Gauge className="h-4 w-4 text-primary" />
                  O que é VDOT?
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  VDOT é um índice de capacidade aeróbica criado pelo treinador e fisiologista Jack Daniels
                  (metodologia <span className="text-text">&quot;Daniels&apos; Running Formula&quot;</span>). Ele resume, em um
                  único número, o quão eficiente é o atleta em consumir oxigênio durante a corrida — funciona
                  como um &quot;VO2máx equivalente&quot;, calculado a partir do desempenho real em prova, e não de
                  testes de laboratório.
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Em <span className="font-semibold text-text">Prescrição de corrida</span>, informe a distância
                  e o tempo de uma prova recente do atleta (por exemplo, 10 km em 47:52) — o sistema aplica as
                  fórmulas de Daniels &amp; Gilbert e calcula o VDOT automaticamente, sem precisar de planilhas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
                    <Activity className="h-4 w-4 text-primary" />
                    Zonas de treino (E · M · T · I · R)
                  </h2>
                  <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
                    A partir do VDOT, o sistema calcula faixas de pace (min/km) para cada zona de intensidade da
                    metodologia Daniels. Exemplo com VDOT ≈ {exampleVdot} (equivalente a 10 km em 47:52):
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TRAINING_ZONES.map((zone) => {
                    const paces = examplePaces[zone.id];
                    return (
                      <div key={zone.id} className="rounded-xl border border-border bg-card-hover/30 p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: zone.color }} />
                          <p className="text-sm font-semibold text-text">{zone.label}</p>
                          <span className="ml-auto text-xs text-text-muted">
                            {Math.round(zone.intensityMin * 100)}–{Math.round(zone.intensityMax * 100)}% VDOT
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{zone.description}</p>
                        <p className="mt-1.5 text-xs font-semibold text-text">
                          Pace: {formatPace(paces.fastSecPerKm)} a {formatPace(paces.slowSecPerKm)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <FeatureLink
              href="/treinador/prescricao/corrida"
              icon={Activity}
              title="Ir para Prescrição de corrida"
              description="Calcule o VDOT do seu atleta e veja as faixas de pace na prática."
            />
          </TabsContent>

          {/* Periodização */}
          <TabsContent value="periodizacao" className="space-y-5">
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
                  <Layers className="h-4 w-4 text-primary" />
                  Macrociclo, mesociclos e microciclos
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">Macrociclo</span> é o ciclo completo de treinamento —
                  geralmente de 8 a 24 semanas — construído em torno de um objetivo, como uma prova ou uma meta
                  de tempo.
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">Mesociclo</span> é um bloco de aproximadamente 4
                  semanas dentro do macrociclo, cada um com um foco predominante (fase). O sistema agrupa
                  automaticamente as semanas geradas em mesociclos.
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">Microciclo</span> é cada semana individual — tem seu
                  próprio volume (km), intensidade (%), número de sessões e pode ser uma semana de descarga.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="font-display text-base font-semibold text-text">Fases do macrociclo</h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <PhaseRow variant="info" label="Base" description="Construção aeróbica e adaptação ao volume." />
                  <PhaseRow variant="primary" label="Construção" description="Aumento progressivo de volume e trabalho de limiar." />
                  <PhaseRow variant="warning" label="Específico" description="Maior intensidade, focada nas exigências da prova." />
                  <PhaseRow variant="success" label="Taper" description="Redução de volume antes da prova para chegar descansado." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 p-4">
                <Badge variant="warning" className="mt-0.5 shrink-0">
                  <Flame className="h-3 w-3" />
                </Badge>
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">Semanas de descarga (deload):</span> a cada 4 semanas,
                  o sistema sugere uma redução proposital de volume — favorece a recuperação e a
                  supercompensação, reduzindo o risco de overtraining.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <h2 className="font-display text-base font-semibold text-text">Como gerar uma periodização</h2>
                <div className="space-y-4">
                  <Step
                    number={1}
                    title="Escolha os parâmetros"
                    description="Selecione o atleta (opcional), objetivo, nível e o número total de semanas do macrociclo."
                  />
                  <Step
                    number={2}
                    title="Gere automaticamente"
                    description="Clique em 'Gerar periodização' — o sistema distribui as fases (Base, Construção, Específico, Taper) e monta os microciclos."
                  />
                  <Step
                    number={3}
                    title="Ajuste cada semana"
                    description="Edite volume, intensidade, km, sessões e notas de qualquer microciclo manualmente, se necessário."
                  />
                  <Step
                    number={4}
                    title="Salve o planejamento"
                    description="Salve a periodização para liberar as semanas ao atleta."
                  />
                </div>
              </CardContent>
            </Card>

            <FeatureLink
              href="/treinador/prescricao/periodizacao"
              icon={CalendarDays}
              title="Ir para Periodização"
              description="Gere o macrociclo do seu atleta em poucos cliques."
            />
          </TabsContent>

          {/* Carga & check-in */}
          <TabsContent value="carga" className="space-y-5">
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
                  <Flame className="h-4 w-4 text-primary" />
                  Carga de treino (UA)
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">UA (Unidades Arbitrárias)</span> é o método de carga de
                  sessão (session RPE), popularizado por Carl Foster. Para cada treino, multiplica-se a{" "}
                  <span className="text-text">duração em minutos</span> pelo{" "}
                  <span className="text-text">RPE (esforço percebido, de 1 a 10)</span>. A soma de todas as
                  sessões da semana é a carga semanal do atleta.
                </p>
                <div className="rounded-xl border border-border bg-card-hover/30 p-3.5 text-sm text-text-muted">
                  <span className="font-semibold text-text">Exemplo:</span> um treino de 60 min com RPE 6 gera 360
                  UA. Se na semana o atleta acumular 4 treinos somando 1.200 UA, essa é a carga semanal exibida no
                  dashboard.
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Aumentos abruptos — geralmente acima de <span className="text-text">130% da média</span> das
                  últimas semanas — são um dos principais preditores de lesão. O sistema usa a carga semanal para
                  alimentar os alertas automáticos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Check-in inteligente
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Após cada treino (ou diariamente), o atleta registra como se sentiu. Esses dados alimentam os
                  alertas e o motor de ajuste automático de carga.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <CheckInField icon={Activity} label="RPE" description="Esforço percebido da sessão (1-10)." />
                  <CheckInField icon={AlertTriangle} label="Dor" description="Nível de dor ou desconforto (1-10)." />
                  <CheckInField icon={Moon} label="Sono" description="Qualidade/quantidade de sono percebida." />
                  <CheckInField icon={Flame} label="Fadiga" description="Sensação de cansaço acumulado (1-10)." />
                  <CheckInField icon={Smile} label="Humor" description="Estado de ânimo geral do atleta." />
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  Quando o motor detecta fadiga acumulada, dor persistente ou sono insuficiente, ele{" "}
                  <span className="font-semibold text-text">reduz automaticamente o volume da próxima semana</span> —
                  sem que você precise intervir manualmente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="font-display text-base font-semibold text-text">Alertas inteligentes</h2>
                <div className="space-y-2">
                  <AlertRow
                    variant="danger"
                    icon={ShieldAlert}
                    title="Crítico"
                    description="Ausência por mais de 5 dias · dor ≥7 por 3 dias consecutivos · carga semanal acima de 130% da linha de base."
                  />
                  <AlertRow
                    variant="warning"
                    icon={AlertTriangle}
                    title="Atenção"
                    description="FC em Zona 2 subindo mais de 10% · adesão ao plano abaixo de 65% · volume realizado abaixo de 30% da meta."
                  />
                  <AlertRow
                    variant="info"
                    icon={Info}
                    title="Informativo"
                    description="Melhorias notáveis de performance e marcos atingidos pelo atleta."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureLink href="/treinador/alertas" icon={Bell} title="Ir para Alertas" description="Veja os sinais automáticos de risco da sua equipe." />
              <FeatureLink href="/treinador/analise-semanal" icon={BarChart2} title="Ir para Análise semanal" description="Acompanhe volume, aderência e recomendações." />
            </div>
          </TabsContent>

          {/* Gestão, vendas & força */}
          <TabsContent value="gestao" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureLink
                href="/treinador/gestao"
                icon={DollarSign}
                title="Gestão & vendas"
                description="Receita recorrente (MRR), slots disponíveis, status de pagamento, link de convite e QR code. Aba Despesas: cadastre custos fixos e variáveis (software, marketing, pessoal) e acompanhe o resultado líquido em tempo real."
                locked={isLocked("/treinador/gestao")}
                requiredPlan={requiredPlan("/treinador/gestao")}
              />
              <FeatureLink
                href="/treinador/crm"
                icon={Kanban}
                title="CRM + isca digital"
                description="Funil de vendas Kanban: Novo → Contato → Proposta → Ganho. Copie o link de isca e divulgue no Instagram — quem preencher o formulário entra automaticamente no funil sem você precisar cadastrar manualmente."
                locked={isLocked("/treinador/crm")}
                requiredPlan={requiredPlan("/treinador/crm")}
              />
              <FeatureLink
                href="/treinador/minha-pagina"
                icon={Share2}
                title="Minha página pública"
                description="Página profissional com seus planos, foto, banner e QR code. O link de isca e o link de convite usam o seu slug (ex: pacerunpro.com.br/p/seu-nome) configurado aqui."
                locked={isLocked("/treinador/minha-pagina")}
                requiredPlan={requiredPlan("/treinador/minha-pagina")}
              />
              <FeatureLink
                href="/atleta/calendario"
                icon={Trophy}
                title="Calendário de provas"
                description="O atleta cadastra as provas que vai correr (data, distância, local, meta de tempo). Os eventos aparecem no calendário em laranja e ficam visíveis para o treinador planejar o taper."
              />
              <FeatureLink
                href="/treinador/white-label"
                icon={Palette}
                title="White-label"
                description="Personalize a marca da sua assessoria — logo, cores, nome e mensagem de boas-vindas — e escolha quais módulos ficam visíveis para os atletas. Configure um domínio próprio conforme o seu plano."
                locked={isLocked("/treinador/white-label")}
                requiredPlan={requiredPlan("/treinador/white-label")}
              />
              <FeatureLink
                href="/treinador/admin"
                icon={Settings}
                title="Admin"
                description="Visão consolidada da plataforma: MRR total, crescimento, churn e distribuição de receita por plano, além da gestão de treinadores e assinaturas (conforme o seu nível de acesso)."
                locked={isLocked("/treinador/admin")}
                requiredPlan={requiredPlan("/treinador/admin")}
              />
              <FeatureLink
                href="/treinador/relatorios"
                icon={FileBarChart}
                title="Relatórios"
                description="Exporte relatórios em PDF premium, Excel ou CSV — por atleta ou para toda a equipe, com gráficos, check-ins, recordes pessoais e recomendações."
              />
              <FeatureLink
                href="/treinador/prescricao/forca"
                icon={Dumbbell}
                title="Prescrição de força"
                description="Monte treinos de força e funcional por divisão (AB, ABC, Full Body, Upper/Lower...). Escolha exercícios da biblioteca e personalize séries, repetições, descanso e RPE para cada atleta."
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureLink({
  href,
  icon: Icon,
  title,
  description,
  locked = false,
  requiredPlan = "",
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  locked?: boolean;
  requiredPlan?: string;
}) {
  if (locked) {
    return (
      <Card className="h-full p-4 opacity-60 cursor-default">
        <div className="flex items-start gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-hover text-text-muted">
            <Icon className="h-5 w-5" />
            <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
              <Lock className="h-2.5 w-2.5 text-text-muted" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{title}</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>
            {requiredPlan && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card-hover px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                <Lock className="h-2.5 w-2.5" />
                Plano {requiredPlan}
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link href={href}>
      <Card hover className="h-full p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{title}</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function PhaseRow({
  variant,
  label,
  description,
}: {
  variant: "info" | "primary" | "warning" | "success";
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card-hover/30 p-3">
      <Badge variant={variant} className="mt-0.5 w-24 shrink-0 justify-center">
        {label}
      </Badge>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function CheckInField({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card-hover/30 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-semibold text-text">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </div>
  );
}

function AlertRow({
  variant,
  icon: Icon,
  title,
  description,
}: {
  variant: "danger" | "warning" | "info";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card-hover/30 p-3.5">
      <Badge variant={variant} className="mt-0.5 shrink-0">
        <Icon className="h-3 w-3" />
      </Badge>
      <p className="text-xs text-text-muted leading-relaxed">
        <span className="font-semibold text-text">{title}:</span> {description}
      </p>
    </div>
  );
}
