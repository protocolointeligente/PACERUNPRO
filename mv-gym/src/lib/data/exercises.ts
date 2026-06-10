import type { Exercicio } from "@/lib/types";

// Banco de exercícios MV GYM — base inicial curada cobrindo todos os
// principais grupos musculares e padrões de movimento. A estrutura foi
// pensada para escalar (via importação/CMS) até um catálogo de 500+
// exercícios sem alterar o modelo de dados.
export const EXERCICIOS: Exercicio[] = [
  // ── PEITO ─────────────────────────────────────────────────────────────
  {
    id: "peito-supino-reto-barra",
    nome: "Supino reto com barra",
    grupoMuscular: "peito",
    subgrupo: "Peitoral médio",
    equipamentos: ["barra", "banco"],
    execucao:
      "Deite no banco, pegada um pouco mais larga que os ombros, desça a barra controlada até tocar o peito e empurre até a extensão dos cotovelos.",
    errosComuns:
      "Arquear excessivamente a lombar, quicar a barra no peito e abrir demais os cotovelos a 90°.",
    nivel: "intermediario",
  },
  {
    id: "peito-supino-inclinado-halteres",
    nome: "Supino inclinado com halteres",
    grupoMuscular: "peito",
    subgrupo: "Peitoral superior",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Banco a 30-45°, halteres alinhados ao peito, empurre para cima sem travar totalmente os cotovelos no topo.",
    errosComuns:
      "Inclinação excessiva do banco (vira ombro) e descer os halteres sem controle.",
    nivel: "iniciante",
  },
  {
    id: "peito-supino-declinado",
    nome: "Supino declinado",
    grupoMuscular: "peito",
    subgrupo: "Peitoral inferior",
    equipamentos: ["barra", "banco"],
    execucao:
      "Pés presos no banco declinado, desça a barra até a porção inferior do peito e empurre em linha reta.",
    errosComuns: "Amplitude curta e apoio inadequado dos pés.",
    nivel: "intermediario",
  },
  {
    id: "peito-crucifixo-reto",
    nome: "Crucifixo reto com halteres",
    grupoMuscular: "peito",
    subgrupo: "Peitoral médio",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Braços levemente flexionados, abra em arco até sentir alongamento no peito e retorne sem bater os halteres.",
    errosComuns: "Flexionar/estender o cotovelo durante o movimento (vira tríceps).",
    nivel: "iniciante",
  },
  {
    id: "peito-crossover-cabo",
    nome: "Crossover no cabo",
    grupoMuscular: "peito",
    subgrupo: "Peitoral médio/inferior",
    equipamentos: ["cabo"],
    execucao:
      "Polias altas, incline o tronco à frente e traga as mãos em arco até se cruzarem na frente do quadril.",
    errosComuns: "Usar impulso do tronco e amplitude excessiva nos ombros.",
    nivel: "intermediario",
  },
  {
    id: "peito-peck-deck",
    nome: "Peck deck (voador)",
    grupoMuscular: "peito",
    subgrupo: "Peitoral médio",
    equipamentos: ["máquina"],
    execucao:
      "Cotovelos na altura dos ombros, aperte o peito levando os braços ao centro e retorne controlado.",
    errosComuns: "Deixar os ombros subirem em direção às orelhas.",
    nivel: "iniciante",
  },
  {
    id: "peito-flexao-braco",
    nome: "Flexão de braço",
    grupoMuscular: "peito",
    subgrupo: "Peitoral / Tríceps",
    equipamentos: ["peso corporal"],
    execucao:
      "Corpo alinhado da cabeça aos pés, desça até o peito quase tocar o chão e empurre de volta.",
    errosComuns: "Quadril caído ou elevado e amplitude incompleta.",
    nivel: "iniciante",
  },
  {
    id: "peito-supino-maquina",
    nome: "Supino máquina",
    grupoMuscular: "peito",
    subgrupo: "Peitoral médio",
    equipamentos: ["máquina"],
    execucao:
      "Ajuste o banco para que os punhos fiquem na linha do peito e empurre até quase a extensão total.",
    errosComuns: "Banco muito alto ou baixo, descentralizando o estímulo.",
    nivel: "iniciante",
  },
  {
    id: "peito-pullover",
    nome: "Pullover com halter",
    grupoMuscular: "peito",
    subgrupo: "Peitoral / Serrátil",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Deitado transversalmente no banco, leve o halter por trás da cabeça em arco e retorne sobre o peito.",
    errosComuns: "Arquear excessivamente a lombar durante a descida.",
    nivel: "intermediario",
  },

  // ── COSTAS ────────────────────────────────────────────────────────────
  {
    id: "costas-puxada-frente",
    nome: "Puxada frente (pulldown)",
    grupoMuscular: "costas",
    subgrupo: "Latíssimo do dorso",
    equipamentos: ["cabo", "máquina"],
    execucao:
      "Pegada aberta, puxe a barra até a parte superior do peito levando os cotovelos para baixo e para trás.",
    errosComuns: "Puxar atrás da nuca e usar impulso do corpo.",
    nivel: "iniciante",
  },
  {
    id: "costas-puxada-triangulo",
    nome: "Puxada triângulo",
    grupoMuscular: "costas",
    subgrupo: "Latíssimo / Romboides",
    equipamentos: ["cabo", "máquina"],
    execucao:
      "Pegada neutra fechada, puxe até o peito mantendo o tronco estável e cotovelos próximos ao corpo.",
    errosComuns: "Inclinar o tronco para trás de forma exagerada.",
    nivel: "iniciante",
  },
  {
    id: "costas-remada-curvada",
    nome: "Remada curvada com barra",
    grupoMuscular: "costas",
    subgrupo: "Dorsal / Romboides",
    equipamentos: ["barra"],
    execucao:
      "Tronco inclinado a ~45°, puxe a barra em direção ao abdômen mantendo a coluna neutra.",
    errosComuns: "Arredondar a lombar e usar embalo das pernas.",
    nivel: "intermediario",
  },
  {
    id: "costas-remada-cavalinho",
    nome: "Remada cavalinho (T-bar)",
    grupoMuscular: "costas",
    subgrupo: "Dorsal médio",
    equipamentos: ["barra", "máquina"],
    execucao:
      "Tronco apoiado ou inclinado, puxe a barra em direção ao tórax contraindo as escápulas.",
    errosComuns: "Amplitude curta e elevação dos ombros.",
    nivel: "intermediario",
  },
  {
    id: "costas-remada-unilateral-halter",
    nome: "Remada unilateral com halter",
    grupoMuscular: "costas",
    subgrupo: "Dorsal",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Apoie joelho e mão no banco, puxe o halter em direção ao quadril mantendo o tronco paralelo ao chão.",
    errosComuns: "Rotacionar o tronco para ajudar na puxada.",
    nivel: "iniciante",
  },
  {
    id: "costas-remada-baixa-cabo",
    nome: "Remada baixa no cabo",
    grupoMuscular: "costas",
    subgrupo: "Dorsal médio",
    equipamentos: ["cabo"],
    execucao:
      "Sentado, tronco ereto, puxe o triângulo até o abdômen levando os cotovelos para trás.",
    errosComuns: "Balançar o tronco para frente e para trás (cadência de embalo).",
    nivel: "iniciante",
  },
  {
    id: "costas-barra-fixa",
    nome: "Barra fixa (pull-up)",
    grupoMuscular: "costas",
    subgrupo: "Latíssimo do dorso",
    equipamentos: ["peso corporal", "barra fixa"],
    execucao:
      "Pendure-se na barra com pegada pronada e puxe o corpo até o queixo passar a barra.",
    errosComuns: "Amplitude incompleta e usar muito impulso (kipping) sem controle.",
    nivel: "avancado",
  },
  {
    id: "costas-levantamento-terra",
    nome: "Levantamento terra",
    grupoMuscular: "costas",
    subgrupo: "Cadeia posterior",
    equipamentos: ["barra"],
    execucao:
      "Pés na largura do quadril, segure a barra, mantenha a coluna neutra e estenda quadril e joelhos simultaneamente.",
    errosComuns: "Arredondar a coluna e afastar a barra do corpo.",
    nivel: "avancado",
  },
  {
    id: "costas-hiperextensao",
    nome: "Hiperextensão lombar",
    grupoMuscular: "costas",
    subgrupo: "Lombar / Glúteos",
    equipamentos: ["banco romano"],
    execucao:
      "Quadril apoiado no banco, desça o tronco controlado e suba até alinhar com as pernas, sem hiperestender.",
    errosComuns: "Hiperextensão excessiva da lombar no topo do movimento.",
    nivel: "iniciante",
  },
  {
    id: "costas-pulldown-braco-reto",
    nome: "Pulldown braço reto (cabo)",
    grupoMuscular: "costas",
    subgrupo: "Latíssimo do dorso",
    equipamentos: ["cabo"],
    execucao:
      "Braços estendidos, leve a barra até as coxas mantendo cotovelos levemente flexionados e fixos.",
    errosComuns: "Flexionar os cotovelos durante o movimento (vira tríceps).",
    nivel: "intermediario",
  },

  // ── OMBROS ────────────────────────────────────────────────────────────
  {
    id: "ombro-desenvolvimento-militar",
    nome: "Desenvolvimento militar com barra",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide anterior",
    equipamentos: ["barra"],
    execucao:
      "Em pé ou sentado, empurre a barra do nível dos ombros até a extensão total dos braços acima da cabeça.",
    errosComuns: "Hiperextensão lombar para compensar e empurrar à frente do corpo.",
    nivel: "intermediario",
  },
  {
    id: "ombro-desenvolvimento-halteres",
    nome: "Desenvolvimento com halteres",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide anterior/lateral",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Sentado com encosto, empurre os halteres para cima até quase a extensão total e desça controlado.",
    errosComuns: "Descer demais sobrecarregando o ombro e arquear a lombar.",
    nivel: "iniciante",
  },
  {
    id: "ombro-elevacao-lateral",
    nome: "Elevação lateral com halteres",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide lateral",
    equipamentos: ["halteres"],
    execucao:
      "Cotovelos levemente flexionados, eleve os braços lateralmente até a altura dos ombros.",
    errosComuns: "Usar impulso do tronco e elevar acima da linha dos ombros.",
    nivel: "iniciante",
  },
  {
    id: "ombro-elevacao-frontal",
    nome: "Elevação frontal",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide anterior",
    equipamentos: ["halteres", "anilha"],
    execucao:
      "Eleve o peso à frente do corpo até a altura dos ombros, com leve flexão de cotovelo.",
    errosComuns: "Balançar o tronco para gerar impulso.",
    nivel: "iniciante",
  },
  {
    id: "ombro-crucifixo-invertido",
    nome: "Crucifixo invertido",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide posterior",
    equipamentos: ["halteres", "máquina"],
    execucao:
      "Tronco inclinado à frente, abra os braços lateralmente contraindo a parte posterior do ombro.",
    errosComuns: "Encolher os ombros em direção às orelhas.",
    nivel: "iniciante",
  },
  {
    id: "ombro-remada-alta",
    nome: "Remada alta",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide / Trapézio",
    equipamentos: ["barra", "cabo"],
    execucao:
      "Puxe a barra verticalmente próximo ao corpo até a altura do peito, cotovelos acima dos punhos.",
    errosComuns: "Pegada muito fechada sobrecarregando o ombro.",
    nivel: "intermediario",
  },
  {
    id: "ombro-arnold-press",
    nome: "Arnold press",
    grupoMuscular: "ombros",
    subgrupo: "Deltoide completo",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Inicie com palmas voltadas para você, gire os punhos enquanto empurra os halteres para cima.",
    errosComuns: "Rotação muito rápida sem controle de carga.",
    nivel: "intermediario",
  },
  {
    id: "ombro-encolhimento",
    nome: "Encolhimento de trapézio",
    grupoMuscular: "ombros",
    subgrupo: "Trapézio",
    equipamentos: ["halteres", "barra"],
    execucao:
      "Eleve os ombros em direção às orelhas e desça controlado, sem rotacionar.",
    errosComuns: "Rotacionar os ombros (pode irritar a articulação).",
    nivel: "iniciante",
  },

  // ── BÍCEPS ────────────────────────────────────────────────────────────
  {
    id: "biceps-rosca-direta-barra",
    nome: "Rosca direta com barra",
    grupoMuscular: "biceps",
    subgrupo: "Bíceps braquial",
    equipamentos: ["barra"],
    execucao:
      "Cotovelos fixos ao lado do corpo, flexione os braços levando a barra até a altura do peito.",
    errosComuns: "Balançar o tronco e mover os cotovelos para frente.",
    nivel: "iniciante",
  },
  {
    id: "biceps-rosca-alternada",
    nome: "Rosca alternada com halteres",
    grupoMuscular: "biceps",
    subgrupo: "Bíceps braquial",
    equipamentos: ["halteres"],
    execucao:
      "Flexione um braço por vez, supinando o punho durante o movimento.",
    errosComuns: "Usar embalo do ombro para iniciar a subida.",
    nivel: "iniciante",
  },
  {
    id: "biceps-rosca-martelo",
    nome: "Rosca martelo",
    grupoMuscular: "biceps",
    subgrupo: "Braquial / Antebraço",
    equipamentos: ["halteres"],
    execucao:
      "Pegada neutra (palmas viradas para o corpo), flexione os cotovelos sem girar o punho.",
    errosComuns: "Abrir os cotovelos para os lados.",
    nivel: "iniciante",
  },
  {
    id: "biceps-rosca-scott",
    nome: "Rosca Scott",
    grupoMuscular: "biceps",
    subgrupo: "Bíceps braquial",
    equipamentos: ["barra", "banco scott"],
    execucao:
      "Braços apoiados no banco scott, flexione até quase a contração total sem travar os cotovelos.",
    errosComuns: "Estender totalmente o cotovelo de forma brusca no fim do movimento.",
    nivel: "intermediario",
  },
  {
    id: "biceps-rosca-concentrada",
    nome: "Rosca concentrada",
    grupoMuscular: "biceps",
    subgrupo: "Bíceps braquial",
    equipamentos: ["halteres"],
    execucao:
      "Sentado, cotovelo apoiado na coxa, flexione o braço focando na contração no topo.",
    errosComuns: "Usar o ombro para ajudar a levantar o peso.",
    nivel: "iniciante",
  },
  {
    id: "biceps-rosca-cabo",
    nome: "Rosca no cabo",
    grupoMuscular: "biceps",
    subgrupo: "Bíceps braquial",
    equipamentos: ["cabo"],
    execucao:
      "Cotovelos fixos, flexione puxando a barra em direção ao peito, mantendo tensão constante.",
    errosComuns: "Afastar os cotovelos do tronco durante a flexão.",
    nivel: "iniciante",
  },

  // ── TRÍCEPS ───────────────────────────────────────────────────────────
  {
    id: "triceps-pulley-corda",
    nome: "Tríceps pulley com corda",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps braquial",
    equipamentos: ["cabo"],
    execucao:
      "Cotovelos fixos junto ao corpo, estenda os braços para baixo e abra a corda no final do movimento.",
    errosComuns: "Mover os cotovelos para frente durante a extensão.",
    nivel: "iniciante",
  },
  {
    id: "triceps-testa",
    nome: "Tríceps testa (skull crusher)",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps braquial",
    equipamentos: ["barra", "banco"],
    execucao:
      "Deitado, desça a barra controlada em direção à testa e estenda os cotovelos de volta.",
    errosComuns: "Mover os ombros/cotovelos durante o movimento.",
    nivel: "intermediario",
  },
  {
    id: "triceps-frances",
    nome: "Tríceps francês com halter",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps braquial",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Halter atrás da cabeça com os dois braços, estenda os cotovelos mantendo-os próximos à cabeça.",
    errosComuns: "Abrir os cotovelos para os lados.",
    nivel: "intermediario",
  },
  {
    id: "triceps-mergulho-banco",
    nome: "Mergulho no banco (bench dips)",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps / Peito",
    equipamentos: ["peso corporal", "banco"],
    execucao:
      "Mãos apoiadas no banco atrás do corpo, desça o quadril flexionando os cotovelos e empurre de volta.",
    errosComuns: "Descer demais sobrecarregando o ombro.",
    nivel: "iniciante",
  },
  {
    id: "triceps-coice",
    nome: "Tríceps coice (kickback)",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps braquial",
    equipamentos: ["halteres"],
    execucao:
      "Tronco inclinado, braço paralelo ao chão, estenda o cotovelo levando o halter para trás.",
    errosComuns: "Balançar o braço usando o ombro.",
    nivel: "iniciante",
  },
  {
    id: "triceps-supino-fechado",
    nome: "Supino com pegada fechada",
    grupoMuscular: "triceps",
    subgrupo: "Tríceps / Peito",
    equipamentos: ["barra", "banco"],
    execucao:
      "Pegada na largura dos ombros, desça a barra ao peito mantendo cotovelos próximos ao corpo.",
    errosComuns: "Pegada muito fechada sobrecarregando o punho.",
    nivel: "intermediario",
  },

  // ── QUADRÍCEPS ────────────────────────────────────────────────────────
  {
    id: "quad-agachamento-livre",
    nome: "Agachamento livre com barra",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps / Glúteos",
    equipamentos: ["barra", "rack"],
    execucao:
      "Pés na largura dos ombros, desça flexionando quadril e joelhos até a coxa paralela ao chão e suba.",
    errosComuns: "Joelhos colapsando para dentro e perder a curvatura natural da lombar.",
    nivel: "intermediario",
  },
  {
    id: "quad-leg-press",
    nome: "Leg press 45°",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps / Glúteos",
    equipamentos: ["máquina"],
    execucao:
      "Pés na plataforma na largura dos ombros, desça até 90° de joelho e empurre sem travar.",
    errosComuns: "Tirar a lombar do encosto na descida.",
    nivel: "iniciante",
  },
  {
    id: "quad-cadeira-extensora",
    nome: "Cadeira extensora",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps",
    equipamentos: ["máquina"],
    execucao:
      "Estenda os joelhos até quase a extensão total e retorne controlado.",
    errosComuns: "Usar impulso e descer rápido demais.",
    nivel: "iniciante",
  },
  {
    id: "quad-agachamento-smith",
    nome: "Agachamento no Smith",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps / Glúteos",
    equipamentos: ["smith"],
    execucao:
      "Pés ligeiramente à frente do corpo, desça controlado e empurre pelos calcanhares.",
    errosComuns: "Posicionar os pés muito próximos da barra.",
    nivel: "iniciante",
  },
  {
    id: "quad-avanco",
    nome: "Avanço (afundo)",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps / Glúteos",
    equipamentos: ["halteres", "peso corporal"],
    execucao:
      "Dê um passo à frente e desça até o joelho de trás quase tocar o chão, retornando à posição inicial.",
    errosComuns: "Joelho da frente ultrapassando muito a ponta do pé com perda de equilíbrio.",
    nivel: "intermediario",
  },
  {
    id: "quad-hack-squat",
    nome: "Hack squat",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps",
    equipamentos: ["máquina"],
    execucao:
      "Costas apoiadas, desça até 90° de flexão de joelho e empurre pelos calcanhares.",
    errosComuns: "Amplitude excessiva sobrecarregando os joelhos.",
    nivel: "intermediario",
  },
  {
    id: "quad-agachamento-bulgaro",
    nome: "Agachamento búlgaro",
    grupoMuscular: "quadriceps",
    subgrupo: "Quadríceps / Glúteos",
    equipamentos: ["halteres", "banco"],
    execucao:
      "Pé de trás apoiado no banco, desça verticalmente sobre a perna da frente e suba.",
    errosComuns: "Inclinar o tronco demais para frente.",
    nivel: "avancado",
  },

  // ── POSTERIOR DE COXA ─────────────────────────────────────────────────
  {
    id: "post-stiff",
    nome: "Stiff (levantamento pernas semi-rígidas)",
    grupoMuscular: "posterior",
    subgrupo: "Posterior de coxa / Glúteos",
    equipamentos: ["barra", "halteres"],
    execucao:
      "Pernas levemente flexionadas, desça o peso deslizando próximo às pernas mantendo a coluna neutra.",
    errosComuns: "Arredondar a coluna durante a descida.",
    nivel: "intermediario",
  },
  {
    id: "post-mesa-flexora",
    nome: "Mesa flexora",
    grupoMuscular: "posterior",
    subgrupo: "Posterior de coxa",
    equipamentos: ["máquina"],
    execucao:
      "Deitado de bruços, flexione os joelhos trazendo o calcanhar em direção ao glúteo.",
    errosComuns: "Elevar o quadril durante a execução.",
    nivel: "iniciante",
  },
  {
    id: "post-cadeira-flexora",
    nome: "Cadeira flexora",
    grupoMuscular: "posterior",
    subgrupo: "Posterior de coxa",
    equipamentos: ["máquina"],
    execucao:
      "Sentado, flexione os joelhos puxando o apoio para baixo e retorne controlado.",
    errosComuns: "Soltar o peso rapidamente na volta.",
    nivel: "iniciante",
  },
  {
    id: "post-terra-romeno",
    nome: "Levantamento terra romeno",
    grupoMuscular: "posterior",
    subgrupo: "Posterior de coxa / Glúteos",
    equipamentos: ["barra", "halteres"],
    execucao:
      "Com leve flexão de joelhos, leve o quadril para trás descendo a barra próxima às pernas.",
    errosComuns: "Transformar em agachamento (flexionar muito o joelho).",
    nivel: "intermediario",
  },
  {
    id: "post-good-morning",
    nome: "Good morning",
    grupoMuscular: "posterior",
    subgrupo: "Posterior de coxa / Lombar",
    equipamentos: ["barra"],
    execucao:
      "Barra apoiada nas costas, incline o tronco à frente mantendo a coluna neutra e retorne.",
    errosComuns: "Arredondar a coluna torácica/lombar.",
    nivel: "avancado",
  },

  // ── GLÚTEOS ───────────────────────────────────────────────────────────
  {
    id: "glut-elevacao-pelvica",
    nome: "Elevação pélvica (hip thrust)",
    grupoMuscular: "gluteos",
    subgrupo: "Glúteo máximo",
    equipamentos: ["barra", "banco"],
    execucao:
      "Costas apoiadas no banco, eleve o quadril contraindo os glúteos no topo do movimento.",
    errosComuns: "Hiperextensão lombar no topo em vez de contração glútea.",
    nivel: "intermediario",
  },
  {
    id: "glut-cadeira-abdutora",
    nome: "Cadeira abdutora",
    grupoMuscular: "gluteos",
    subgrupo: "Glúteo médio",
    equipamentos: ["máquina"],
    execucao:
      "Sentado, abra as pernas contra a resistência contraindo os glúteos laterais.",
    errosComuns: "Amplitude exagerada com impulso do tronco.",
    nivel: "iniciante",
  },
  {
    id: "glut-coice-cabo",
    nome: "Glúteo no cabo (coice)",
    grupoMuscular: "gluteos",
    subgrupo: "Glúteo máximo",
    equipamentos: ["cabo"],
    execucao:
      "De pé, leve a perna para trás contra a resistência do cabo, contraindo o glúteo.",
    errosComuns: "Compensar com a lombar em vez do quadril.",
    nivel: "iniciante",
  },
  {
    id: "glut-agachamento-sumo",
    nome: "Agachamento sumô",
    grupoMuscular: "gluteos",
    subgrupo: "Glúteos / Adutores",
    equipamentos: ["halteres", "barra"],
    execucao:
      "Pés bem afastados e apontados para fora, desça mantendo o tronco ereto e joelhos alinhados aos pés.",
    errosComuns: "Joelhos colapsando para dentro.",
    nivel: "intermediario",
  },

  // ── PANTURRILHA ───────────────────────────────────────────────────────
  {
    id: "pant-em-pe",
    nome: "Panturrilha em pé",
    grupoMuscular: "panturrilha",
    subgrupo: "Gastrocnêmio",
    equipamentos: ["máquina", "smith"],
    execucao:
      "Suba na ponta dos pés o máximo possível e desça até alongar bem a panturrilha.",
    errosComuns: "Amplitude curta e movimento muito rápido.",
    nivel: "iniciante",
  },
  {
    id: "pant-sentado",
    nome: "Panturrilha sentado",
    grupoMuscular: "panturrilha",
    subgrupo: "Sóleo",
    equipamentos: ["máquina"],
    execucao:
      "Sentado, com joelhos a 90°, suba o calcanhar contraindo a panturrilha.",
    errosComuns: "Não atingir a amplitude total de alongamento.",
    nivel: "iniciante",
  },
  {
    id: "pant-leg-press",
    nome: "Panturrilha no leg press",
    grupoMuscular: "panturrilha",
    subgrupo: "Gastrocnêmio",
    equipamentos: ["máquina"],
    execucao:
      "Apoie a ponta dos pés na plataforma e empurre estendendo o tornozelo.",
    errosComuns: "Travar os joelhos durante a execução.",
    nivel: "iniciante",
  },

  // ── ABDÔMEN ───────────────────────────────────────────────────────────
  {
    id: "abdome-supra",
    nome: "Abdominal supra",
    grupoMuscular: "abdomen",
    subgrupo: "Reto abdominal",
    equipamentos: ["peso corporal"],
    execucao:
      "Deitado, joelhos flexionados, eleve o tronco contraindo o abdômen sem puxar o pescoço.",
    errosComuns: "Puxar a cabeça com as mãos.",
    nivel: "iniciante",
  },
  {
    id: "abdome-prancha",
    nome: "Prancha isométrica",
    grupoMuscular: "abdomen",
    subgrupo: "Core",
    equipamentos: ["peso corporal"],
    execucao:
      "Apoio nos antebraços e pés, mantenha o corpo alinhado e abdômen contraído pelo tempo definido.",
    errosComuns: "Quadril elevado ou caído.",
    nivel: "iniciante",
  },
  {
    id: "abdome-elevacao-pernas",
    nome: "Elevação de pernas",
    grupoMuscular: "abdomen",
    subgrupo: "Reto abdominal inferior",
    equipamentos: ["peso corporal", "barra fixa"],
    execucao:
      "Eleve as pernas estendidas ou flexionadas até 90° controlando a descida.",
    errosComuns: "Usar embalo e arquear a lombar.",
    nivel: "intermediario",
  },
  {
    id: "abdome-infra-banco",
    nome: "Abdominal infra no banco",
    grupoMuscular: "abdomen",
    subgrupo: "Reto abdominal inferior",
    equipamentos: ["banco"],
    execucao:
      "Deitado no banco, eleve o quadril em direção ao peito contraindo o abdômen.",
    errosComuns: "Usar impulso das pernas em vez do abdômen.",
    nivel: "intermediario",
  },
  {
    id: "abdome-obliquo",
    nome: "Abdominal oblíquo",
    grupoMuscular: "abdomen",
    subgrupo: "Oblíquos",
    equipamentos: ["peso corporal"],
    execucao:
      "Deitado, leve o cotovelo em direção ao joelho oposto contraindo o oblíquo.",
    errosComuns: "Puxar o pescoço com as mãos.",
    nivel: "iniciante",
  },
  {
    id: "abdome-roda",
    nome: "Roda abdominal (ab wheel)",
    grupoMuscular: "abdomen",
    subgrupo: "Core completo",
    equipamentos: ["roda abdominal"],
    execucao:
      "Ajoelhado, role a roda à frente mantendo o abdômen contraído e retorne sem deixar o quadril cair.",
    errosComuns: "Deixar a lombar hiperestender durante a extensão.",
    nivel: "avancado",
  },

  // ── ANTEBRAÇO ─────────────────────────────────────────────────────────
  {
    id: "ante-rosca-punho",
    nome: "Rosca de punho",
    grupoMuscular: "antebraco",
    subgrupo: "Flexores do antebraço",
    equipamentos: ["barra", "halteres"],
    execucao:
      "Antebraços apoiados nas coxas, flexione os punhos para cima e desça controlado.",
    errosComuns: "Amplitude excessiva forçando o punho.",
    nivel: "iniciante",
  },
  {
    id: "ante-rosca-inversa",
    nome: "Rosca inversa",
    grupoMuscular: "antebraco",
    subgrupo: "Extensores do antebraço / Braquiorradial",
    equipamentos: ["barra"],
    execucao:
      "Pegada pronada, flexione os cotovelos levando a barra até a altura do peito.",
    errosComuns: "Usar carga muito alta gerando instabilidade no punho.",
    nivel: "intermediario",
  },

  // ── CARDIO ────────────────────────────────────────────────────────────
  {
    id: "cardio-esteira",
    nome: "Esteira (caminhada/corrida)",
    grupoMuscular: "cardio",
    subgrupo: "Aeróbico contínuo",
    equipamentos: ["esteira"],
    execucao:
      "Mantenha postura ereta e ritmo constante de acordo com a zona de frequência cardíaca alvo.",
    errosComuns: "Apoiar-se no console reduzindo o gasto calórico real.",
    nivel: "iniciante",
  },
  {
    id: "cardio-bike",
    nome: "Bicicleta ergométrica",
    grupoMuscular: "cardio",
    subgrupo: "Aeróbico contínuo",
    equipamentos: ["bicicleta"],
    execucao:
      "Ajuste o banco na altura do quadril e mantenha cadência constante durante o tempo definido.",
    errosComuns: "Selim muito baixo sobrecarregando o joelho.",
    nivel: "iniciante",
  },
  {
    id: "cardio-corda-naval",
    nome: "Corda naval (battle rope)",
    grupoMuscular: "cardio",
    subgrupo: "HIIT / Core",
    equipamentos: ["corda naval"],
    execucao:
      "Em posição atlética, alterne ondulações dos braços com a corda em alta intensidade.",
    errosComuns: "Perder a postura do core durante o exercício.",
    nivel: "intermediario",
  },
  {
    id: "cardio-burpee",
    nome: "Burpee",
    grupoMuscular: "cardio",
    subgrupo: "HIIT / Corpo inteiro",
    equipamentos: ["peso corporal"],
    execucao:
      "Agache, jogue os pés para trás em prancha, faça uma flexão, retorne e salte com extensão dos braços.",
    errosComuns: "Arredondar a lombar ao jogar os pés para trás.",
    nivel: "intermediario",
  },
  {
    id: "cardio-mountain-climber",
    nome: "Mountain climber",
    grupoMuscular: "cardio",
    subgrupo: "HIIT / Core",
    equipamentos: ["peso corporal"],
    execucao:
      "Em posição de prancha, alterne levando os joelhos em direção ao peito de forma rápida.",
    errosComuns: "Elevar o quadril perdendo o alinhamento da prancha.",
    nivel: "iniciante",
  },
  {
    id: "cardio-pular-corda",
    nome: "Pular corda",
    grupoMuscular: "cardio",
    subgrupo: "Aeróbico / Coordenação",
    equipamentos: ["corda"],
    execucao:
      "Salte com os tornozelos, mantendo cotovelos próximos ao corpo e giro pelo punho.",
    errosComuns: "Saltos muito altos gerando fadiga precoce.",
    nivel: "iniciante",
  },

  // ── CORPO INTEIRO / FUNCIONAL ─────────────────────────────────────────
  {
    id: "full-kettlebell-swing",
    nome: "Kettlebell swing",
    grupoMuscular: "corpo_inteiro",
    subgrupo: "Posterior / Glúteos / Core",
    equipamentos: ["kettlebell"],
    execucao:
      "Com leve flexão de joelhos, projete o quadril à frente para impulsionar o kettlebell até a altura dos ombros.",
    errosComuns: "Usar os braços para levantar o peso em vez do quadril.",
    nivel: "intermediario",
  },
  {
    id: "full-clean-and-press",
    nome: "Clean and press",
    grupoMuscular: "corpo_inteiro",
    subgrupo: "Corpo inteiro",
    equipamentos: ["barra", "halteres"],
    execucao:
      "Puxe o peso do chão até os ombros (clean) e em seguida empurre acima da cabeça (press).",
    errosComuns: "Perder a posição neutra da coluna na puxada.",
    nivel: "avancado",
  },
  {
    id: "full-thruster",
    nome: "Thruster",
    grupoMuscular: "corpo_inteiro",
    subgrupo: "Pernas / Ombros",
    equipamentos: ["halteres", "barra"],
    execucao:
      "Combine um agachamento frontal com um desenvolvimento, usando o impulso da subida do agachamento.",
    errosComuns: "Quebrar a sequência em dois movimentos separados sem fluidez.",
    nivel: "avancado",
  },
  {
    id: "full-box-jump",
    nome: "Box jump",
    grupoMuscular: "corpo_inteiro",
    subgrupo: "Pliometria",
    equipamentos: ["caixa pliométrica"],
    execucao:
      "Agache levemente e salte com os dois pés sobre a caixa, aterrissando de forma controlada.",
    errosComuns: "Aterrissar com os joelhos travados ou muito à frente dos pés.",
    nivel: "avancado",
  },
  {
    id: "full-remada-baixa-tronco",
    nome: "Remada com barra invertida (inverted row)",
    grupoMuscular: "corpo_inteiro",
    subgrupo: "Costas / Core",
    equipamentos: ["barra fixa", "smith"],
    execucao:
      "Pendurado sob a barra, corpo em prancha, puxe o peito em direção à barra mantendo o core firme.",
    errosComuns: "Quadril caído durante a puxada.",
    nivel: "intermediario",
  },
];

export function getExercicioById(id: string): Exercicio | undefined {
  return EXERCICIOS.find((e) => e.id === id);
}

export const GRUPOS_MUSCULARES_LABEL: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quadriceps: "Quadríceps",
  posterior: "Posterior de coxa",
  gluteos: "Glúteos",
  panturrilha: "Panturrilha",
  abdomen: "Abdômen",
  antebraco: "Antebraço",
  cardio: "Cardio",
  corpo_inteiro: "Corpo inteiro",
};
