import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Bike, BookOpen, Dumbbell, Gauge, HeartPulse, Waves, Zap } from "lucide-react";

function MetricRow({ abbr, name, formula, description }: {
  abbr: string; name: string; formula: string; description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card-hover/20 p-3.5 mb-2">
      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary text-center leading-tight">
        {abbr}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text leading-snug">{name}</p>
        <p className="mt-0.5 text-[11px] font-mono text-primary/80">{formula}</p>
        <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function GlossarioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-3">
          <BookOpen className="h-3 w-3" /> Aprender
        </Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Glossário de métricas</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Referência completa das métricas usadas no PACE RUN PRO — carga de treino, fisiologia, pace e gestão.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Zap className="h-4 w-4 text-primary" />
            Carga de treino: UA, CTL, ATL e TSB
          </h2>
          <MetricRow
            abbr="UA"
            name="Unidades Arbitrárias (Session RPE)"
            formula="Duração (min) × RPE"
            description="Método de Foster: quantifica a carga de uma sessão multiplicando sua duração total em minutos pelo RPE registrado após o treino. Exemplo: 60 min com RPE 7 = 420 UA. É a base de todos os cálculos de carga no sistema."
          />
          <MetricRow
            abbr="CTL"
            name="Chronic Training Load — Carga Crônica"
            formula="Média ponderada das UAs dos últimos 42 dias"
            description="Representa o 'fitness' acumulado do atleta — o quanto ele está adaptado ao volume de treino. Um CTL alto indica boa capacidade aeróbica construída ao longo das semanas. Também chamado de 'Forma de longo prazo'. Sobe lentamente (semanas) e desce lentamente após pausa."
          />
          <MetricRow
            abbr="ATL"
            name="Acute Training Load — Carga Aguda"
            formula="Média ponderada das UAs dos últimos 7 dias"
            description="Representa a fadiga recente. Um ATL alto significa que o atleta treinou muito nos últimos 7 dias e ainda está sob efeito de fadiga. Sobe e desce muito mais rápido que o CTL. Em semanas de descarga, o ATL cai enquanto o CTL se mantém — e o TSB melhora."
          />
          <MetricRow
            abbr="TSB"
            name="Training Stress Balance — Equilíbrio / Forma"
            formula="CTL − ATL"
            description="O balanço entre fitness e fadiga. TSB positivo (entre +5 e +25) = atleta descansado e em boa forma — janela ideal para provas. TSB muito negativo (abaixo de −30) = excesso de fadiga acumulada, risco de overtraining. TSB muito alto (acima de +25) = atleta destreinado, fitness em queda."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <HeartPulse className="h-4 w-4 text-primary" />
            Percepção de esforço e sinais vitais
          </h2>
          <MetricRow
            abbr="RPE"
            name="Rate of Perceived Exertion — Esforço Percebido"
            formula="Escala Borg CR-10: 0 a 10"
            description="O atleta avalia subjetivamente o esforço da sessão. 1 = levíssimo (caminhada), 5 = moderado, 7 = difícil, 10 = máximo absoluto. Usado para calcular UA e detectar se o atleta está acima do esforço prescrito. Simples, sem equipamento, e surpreendentemente preciso."
          />
          <MetricRow
            abbr="FC"
            name="Frequência Cardíaca (bpm)"
            formula="Batimentos por minuto"
            description="Indicador de intensidade em tempo real. O sistema cruza FC com zona de treino para validar se o atleta está no esforço correto. FC em Z2 subindo mais de 10% ao longo das semanas para o mesmo pace é sinal de fadiga acumulada — gera alerta automático."
          />
          <MetricRow
            abbr="HRV"
            name="Heart Rate Variability — Variabilidade da FC"
            formula="Desvio padrão dos intervalos R-R (ms)"
            description="HRV alto = sistema nervoso autônomo recuperado, atleta pronto para treino intenso. HRV baixo = fadiga sistêmica, risco de overtraining. Coletado via wearable (Garmin, Apple Watch, Polar). Quando disponível, o sistema usa HRV para calibrar a recomendação de intensidade do dia."
          />
          <MetricRow
            abbr="VO₂máx"
            name="Consumo Máximo de Oxigênio"
            formula="mL/kg/min"
            description="A capacidade máxima de absorver e utilizar oxigênio durante esforço. É o teto do desempenho aeróbico. No PACE RUN PRO é estimado via VDOT — a correlação entre ambos é muito alta em corredores treinados. Não precisa de teste de laboratório."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Activity className="h-4 w-4 text-primary" />
            Pace, VDOT e zonas de treino
          </h2>
          <MetricRow
            abbr="Pace"
            name="Ritmo de corrida (min/km)"
            formula="Tempo total ÷ distância em km"
            description="A velocidade do atleta expressa em minutos por quilômetro. Um pace de 5:30/km significa 5 minutos e 30 segundos por quilômetro. No sistema, cada zona de treino tem uma faixa de pace prescrita com base no VDOT do atleta."
          />
          <MetricRow
            abbr="VDOT"
            name="Índice de capacidade aeróbica (Daniels)"
            formula="Calculado a partir de resultados de prova"
            description="Criado por Jack Daniels. Aproxima o VO₂máx efetivo a partir do desempenho real em prova — sem laboratório. VDOT 30 = iniciante, 45 = intermediário, 55 = avançado, 65+ = elite. É a base para calcular todas as faixas de pace por zona."
          />
          <MetricRow
            abbr="Zona E"
            name="Easy (Fácil / Aeróbico leve)"
            formula="59–74% do VDOT equivalente"
            description="Intensidade conversacional. Treinos longos, regenerativos e de aquecimento. Constrói base aeróbica e promove recuperação ativa. Deve representar 70–80% do volume semanal de corredores de rua."
          />
          <MetricRow
            abbr="Zona M"
            name="Marathon pace (Pace de maratona)"
            formula="75–84% do VDOT equivalente"
            description="Pace previsto para completar uma maratona. Usado em treinos longos com progressão ou em corredores de prova longa. Limiar aeróbico-anaeróbico."
          />
          <MetricRow
            abbr="Zona T"
            name="Threshold (Limiar de lactato)"
            formula="83–88% do VDOT equivalente"
            description="Intensidade do 'limiar anaeróbico' — o máximo que o atleta sustenta por ~1 hora de corrida. Treinos de tempo run, cruzeiro e progressivos. Melhora o tempo até a fadiga e o ritmo de prova em distâncias de 10K a meia-maratona."
          />
          <MetricRow
            abbr="Zona I"
            name="Interval (VO₂máx)"
            formula="97–100% do VDOT equivalente"
            description="Intensidade máxima sustentável por 3–5 minutos. Treinos intervalados: 1000m, 1200m, 1600m. Eleva o VO₂máx e melhora a economia de corrida. Requer recuperação adequada — máx. 8% do volume semanal."
          />
          <MetricRow
            abbr="Zona R"
            name="Repetition (Velocidade neuromuscular)"
            formula="Acima de 105% do VDOT equivalente"
            description="Sprint de alta potência: 200m, 400m com recuperação completa. Melhora economia de corrida, cadência e força muscular específica. Não é aeróbico — é treinamento de velocidade pura. Volume muito baixo (máx. 5%)."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Gauge className="h-4 w-4 text-primary" />
            Métricas de acompanhamento e gestão
          </h2>
          <MetricRow
            abbr="Adesão"
            name="Taxa de adesão ao plano (%)"
            formula="Treinos realizados ÷ treinos prescritos × 100"
            description="Percentual de sessões prescritas que o atleta efetivamente realizou no período. Abaixo de 65%: alerta de baixa adesão. O sistema usa Strava sync ou registro manual para contabilizar cada treino como 'realizado'."
          />
          <MetricRow
            abbr="ACWR"
            name="Acute:Chronic Workload Ratio"
            formula="ATL ÷ CTL"
            description="Razão entre carga aguda e crônica. Zona segura: 0,8 a 1,3. ACWR acima de 1,5 indica que o atleta aumentou a carga muito rápido — risco de lesão elevado. Abaixo de 0,8: atleta subcarregado, perdendo adaptações. O sistema gera alertas automáticos para ACWR fora da zona segura."
          />
          <MetricRow
            abbr="MRR"
            name="Monthly Recurring Revenue"
            formula="Soma das mensalidades ativas no mês"
            description="Receita recorrente mensal da sua assessoria: soma de todos os atletas pagantes × valor do plano. Exibido no painel de Gestão e vendas (disponível no plano Starter+). Inclui receita da loja de planilhas separada do MRR de mensalidades."
          />
          <MetricRow
            abbr="Deload"
            name="Semana de descarga"
            formula="Volume = 40–60% da semana anterior"
            description="Redução intencional de volume a cada 3–4 semanas para permitir supercompensação. O ATL cai, o TSB sobe, e o atleta chega à semana seguinte mais adaptado. O sistema marca automaticamente semanas de deload na periodização."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Bike className="h-4 w-4 text-primary" />
            Ciclismo: potência e zonas de FTP
          </h2>
          <MetricRow
            abbr="FTP"
            name="Functional Threshold Power — Potência no Limiar"
            formula="Média de potência sustentável em 60 min (estimada via teste de 20 min × 0,95)"
            description="A potência máxima que um ciclista consegue sustentar por aproximadamente uma hora. Base de todas as zonas de potência. Teste padrão: 20 minutos de esforço máximo; o FTP estimado é 95% da média. FTP 200W = iniciante, 280W = intermediário, 350W+ = avançado recreativo."
          />
          <MetricRow
            abbr="W/kg"
            name="Watts por quilograma — relação potência-peso"
            formula="FTP ÷ peso corporal (kg)"
            description="A métrica mais importante para comparar ciclistas entre si e avaliar performance em subidas. W/kg 2,5 = iniciante, 3,5 = esportista, 4,5 = cat. III/II, 5,5+ = elite. Melhora tanto aumentando FTP quanto reduzindo peso (com cautela)."
          />
          <MetricRow
            abbr="TSS"
            name="Training Stress Score"
            formula="(duração em seg × NP × IF) ÷ (FTP × 3600) × 100"
            description="Quantifica o estresse de um treino de ciclismo em pontos. 100 TSS = 1 hora no FTP exato. Semana base: 300-400 TSS. Semana intensa: 500-700 TSS. Semana de deload: 200-250 TSS. Acumula em CTL e ATL da mesma forma que UA na corrida."
          />
          <MetricRow
            abbr="IF"
            name="Intensity Factor — Fator de Intensidade"
            formula="Normalized Power ÷ FTP"
            description="Razão entre a intensidade real do treino e o FTP. IF 0,65 = pedalada leve Z2. IF 0,85 = sweet spot. IF 1,0 = esforço no FTP. IF >1,05 = acima do limiar. Fundamental para calcular TSS e planejar a recuperação pós-treino."
          />
          <MetricRow
            abbr="NP"
            name="Normalized Power — Potência Normalizada"
            formula="Média quadrática elevada da potência instantânea (algoritmo de 30s)"
            description="Potência 'equivalente' levando em conta as variações de intensidade. Em terreno acidentado, NP é sempre maior que a potência média simples — reflete melhor o custo fisiológico real do esforço. Usado para calcular TSS e IF."
          />
          <MetricRow
            abbr="Sweet Spot"
            name="Sweet Spot — zona de máxima eficiência"
            formula="88–93% do FTP"
            description="A zona mais eficiente para ganho de FTP: suficientemente intensa para promover adaptação, mas sustentável por 20–60 minutos. Principal ferramenta de treinamento de ciclismo baseado em potência. Formato: 2–3 intervalos de 20 minutos com 5 minutos de recuperação."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Waves className="h-4 w-4 text-primary" />
            Natação: pace e velocidade crítica
          </h2>
          <MetricRow
            abbr="CSS"
            name="Critical Swim Speed — Velocidade Crítica de Natação"
            formula="(400m – 200m) ÷ (T400 – T200)"
            description="Equivale ao limiar de lactato na natação. Calculado a partir de dois testes máximos: 400m e 200m. Exemplo: 400m em 6:40 e 200m em 3:04 → CSS = 200 ÷ (400-184) = 0,93m/s = 1:47/100m. É a base para todas as zonas de intensidade de natação no PACE RUN PRO."
          />
          <MetricRow
            abbr="Pace/100m"
            name="Pace de natação por 100 metros"
            formula="Tempo total ÷ (distância ÷ 100)"
            description="Unidade padrão de velocidade em natação. Equivalente ao pace/km na corrida. Um pace de 1:30/100m é muito rápido (competidor experiente). 2:00/100m = nadador recreativo treinado. As zonas de treino são expressas em faixas de pace por 100m relativas ao CSS do atleta."
          />
          <MetricRow
            abbr="Z1–Z5 Nat."
            name="Zonas de natação por CSS"
            formula="Z1: >115% CSS · Z2: 108–115% · Z3: 103–108% · Z4: 100–103% · Z5: <100%"
            description="Sistema de 5 zonas baseado no CSS. Z1 (recuperação/técnica) = pace bem mais lento que o CSS. Z4 (limiar/CSS) = pace igual ou levemente mais rápido que o CSS — intensidade de séries de 400–600m. Z5 (sprint/prova) = pace de prova e tiros curtos. O sistema calcula e exibe essas zonas após registrar o CSS do atleta."
          />
          <MetricRow
            abbr="DPS"
            name="Distance Per Stroke — Distância por braçada"
            formula="Comprimento da piscina ÷ número de braçadas por comprimento"
            description="Indicador de eficiência técnica. Nadadores eficientes cobrem mais distância por braçada com menos esforço. Melhora com drills técnicos e força de tração. Correlaciona-se com velocidade média — aumentar DPS sem perder cadência é o objetivo de longo prazo do treinamento de natação."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text mb-4">
            <Dumbbell className="h-4 w-4 text-primary" />
            Força: terminologia e periodização
          </h2>
          <MetricRow
            abbr="1RM"
            name="1 Repetition Maximum — Repetição Máxima"
            formula="Carga máxima para 1 repetição com técnica correta"
            description="A carga máxima que o atleta consegue levantar uma única vez. Base para prescrição de intensidade em força: hipertrofia usa 65–80% 1RM, força máxima usa 85–95% 1RM, potência usa 30–60% 1RM com alta velocidade. No sistema, a estimativa de 1RM pode ser feita via fórmula de Brzycki a partir de repetições submáximas."
          />
          <MetricRow
            abbr="RPE Força"
            name="RPE de Força (Escala de Esforço Percebido)"
            formula="Escala Borg CR-10: 0 a 10 (ou RIR: repetições na reserva)"
            description="Em força, RPE 7 = 3 repetições na reserva (poderia fazer mais 3 reps). RPE 8 = 2 reps na reserva. RPE 9 = 1 rep na reserva. RPE 10 = falha total. Hipertrofia: treinar entre RPE 7–8. Força máxima: RPE 8–9. Potência/explosão: RPE 6–7 (foco em velocidade, não em carga máxima)."
          />
          <MetricRow
            abbr="Volume"
            name="Volume de força (séries × reps)"
            formula="Séries × Repetições × Carga (kg)"
            description="O volume total de trabalho em uma sessão ou semana de treino de força. Para hipertrofia: 10–20 séries por grupo muscular por semana. Para força máxima: 5–10 séries de 1–5 reps com cargas altas. Volume excessivo sem recuperação adequada leva à overreaching e queda de performance."
          />
          <MetricRow
            abbr="Brick"
            name="Brick Training — Treino combinado (Triathlon)"
            formula="Bike + Run (ou Swim + Bike) em sequência imediata"
            description="Treino que combina duas modalidades do triathlon sem descanso entre elas, simulando a transição de prova. O mais comum é bike + run. Os primeiros 2–3 km do run após o bike sempre serão mais lentos — o corpo precisa adaptar o recrutamento muscular. Fundamental para treinamento de triatletas em todas as distâncias."
          />
          <MetricRow
            abbr="T1/T2"
            name="Transições do Triathlon"
            formula="T1: Natação → Bike · T2: Bike → Run"
            description="As transições são a 'quarta disciplina' do triathlon. T1 (transition 1): troca da roupa de natação para o equipamento de ciclismo (capacete, óculos, sapatilhas). T2 (transition 2): troca do ciclismo para a corrida (número de atleta, tênis). Tempo de transição conta no tempo oficial — treinamento de transição é uma vantagem competitiva."
          />
        </CardContent>
      </Card>
    </div>
  );
}
