import { EXERCICIOS } from "@/lib/data/exercises";
import type {
  Usuario,
  Preferencias,
  PlanoTreino,
  Treino,
  ExercicioTreino,
  GrupoMuscular,
  RegistroTreino,
  PlanoNutricional,
  Objetivo,
  NivelExperiencia,
  Refeicao,
} from "@/lib/types";

// ────────────────────────────────────────────────────────────────────────────
// AI COACH — geração e adaptação de treinos, progressão, deload,
// mensagens motivacionais e plano nutricional.
//
// Implementado como um motor de regras determinístico (sem dependência de
// API externa), o que permite rodar 100% no cliente. A interface das
// funções foi desenhada para, no futuro, ser substituída por chamadas a um
// modelo de linguagem (ex.: Claude) mantendo o mesmo contrato de entrada/saída.
// ────────────────────────────────────────────────────────────────────────────

interface ConfigObjetivo {
  series: number;
  repeticoes: string;
  descansoSeg: number;
  rpeAlvo: number;
}

const CONFIG_POR_OBJETIVO: Record<Objetivo, ConfigObjetivo> = {
  hipertrofia: { series: 4, repeticoes: "8-12", descansoSeg: 75, rpeAlvo: 8 },
  forca: { series: 5, repeticoes: "4-6", descansoSeg: 150, rpeAlvo: 9 },
  emagrecimento: { series: 3, repeticoes: "12-15", descansoSeg: 40, rpeAlvo: 7 },
  condicionamento: { series: 3, repeticoes: "15-20", descansoSeg: 30, rpeAlvo: 7 },
  saude: { series: 3, repeticoes: "10-12", descansoSeg: 60, rpeAlvo: 6 },
  performance: { series: 4, repeticoes: "6-10", descansoSeg: 90, rpeAlvo: 8 },
};

interface DiaSplit {
  nome: string;
  grupos: GrupoMuscular[];
}

interface SplitDefinition {
  nome: string;
  dias: DiaSplit[];
}

function definirSplit(diasPorSemana: number): SplitDefinition {
  const dias = Math.min(Math.max(diasPorSemana, 1), 7);

  if (dias === 1) {
    return {
      nome: "Full Body",
      dias: [
        { nome: "Treino A — Corpo Inteiro", grupos: ["quadriceps", "peito", "costas", "ombros", "abdomen"] },
      ],
    };
  }

  if (dias === 2) {
    return {
      nome: "Full Body A/B",
      dias: [
        { nome: "Treino A — Inferior + Push", grupos: ["quadriceps", "peito", "ombros", "abdomen"] },
        { nome: "Treino B — Posterior + Pull", grupos: ["posterior", "gluteos", "costas", "biceps", "triceps"] },
      ],
    };
  }

  if (dias === 3) {
    return {
      nome: "ABC",
      dias: [
        { nome: "Treino A — Peito, Ombro e Tríceps", grupos: ["peito", "ombros", "triceps"] },
        { nome: "Treino B — Costas, Bíceps e Antebraço", grupos: ["costas", "biceps", "antebraco"] },
        { nome: "Treino C — Pernas e Abdômen", grupos: ["quadriceps", "posterior", "gluteos", "panturrilha", "abdomen"] },
      ],
    };
  }

  if (dias === 4) {
    return {
      nome: "Upper / Lower (ABCD)",
      dias: [
        { nome: "Treino A — Upper (Push)", grupos: ["peito", "ombros", "triceps"] },
        { nome: "Treino B — Lower (Quadríceps)", grupos: ["quadriceps", "gluteos", "panturrilha"] },
        { nome: "Treino C — Upper (Pull)", grupos: ["costas", "biceps", "antebraco"] },
        { nome: "Treino D — Lower (Posterior) + Core", grupos: ["posterior", "gluteos", "abdomen", "panturrilha"] },
      ],
    };
  }

  if (dias === 5) {
    return {
      nome: "ABCDE",
      dias: [
        { nome: "Treino A — Peito", grupos: ["peito", "triceps"] },
        { nome: "Treino B — Costas", grupos: ["costas", "biceps"] },
        { nome: "Treino C — Pernas", grupos: ["quadriceps", "posterior", "gluteos", "panturrilha"] },
        { nome: "Treino D — Ombros e Abdômen", grupos: ["ombros", "abdomen"] },
        { nome: "Treino E — Braços", grupos: ["biceps", "triceps", "antebraco"] },
      ],
    };
  }

  // 6 ou 7 dias — Push / Pull / Legs (x2)
  const ppl: DiaSplit[] = [
    { nome: "Treino A — Push 1", grupos: ["peito", "ombros", "triceps"] },
    { nome: "Treino B — Pull 1", grupos: ["costas", "biceps"] },
    { nome: "Treino C — Legs 1", grupos: ["quadriceps", "posterior", "gluteos", "panturrilha"] },
    { nome: "Treino D — Push 2", grupos: ["peito", "ombros", "triceps"] },
    { nome: "Treino E — Pull 2", grupos: ["costas", "biceps", "antebraco"] },
    { nome: "Treino F — Legs 2", grupos: ["quadriceps", "posterior", "gluteos", "abdomen"] },
  ];

  if (dias === 7) {
    ppl.push({ nome: "Treino G — Cardio e Mobilidade", grupos: ["cardio", "abdomen"] });
  }

  return { nome: "Push / Pull / Legs", dias: ppl };
}

const NIVEL_PESO: Record<NivelExperiencia, number> = {
  iniciante: 1,
  intermediario: 2,
  avancado: 3,
};

function exercicioCompativel(equipamentosDisponiveis: string[], nivelUsuario: NivelExperiencia, exercicioEquip: string[], exercicioNivel: NivelExperiencia) {
  const temEquipamento =
    exercicioEquip.includes("peso corporal") ||
    exercicioEquip.some((eq) => equipamentosDisponiveis.includes(eq));

  const nivelOk = NIVEL_PESO[exercicioNivel] <= NIVEL_PESO[nivelUsuario] + 1;

  return temEquipamento && nivelOk;
}

function selecionarExercicios(
  grupos: GrupoMuscular[],
  qtdAlvo: number,
  equipamentosDisponiveis: string[],
  nivelUsuario: NivelExperiencia,
  jaUsados: Set<string>,
): string[] {
  const selecionados: string[] = [];
  const base = Math.floor(qtdAlvo / grupos.length);
  const extras = qtdAlvo % grupos.length;

  grupos.forEach((grupo, idx) => {
    const quantidade = base + (idx < extras ? 1 : 0);
    if (quantidade <= 0) return;

    const candidatos = EXERCICIOS.filter(
      (ex) =>
        ex.grupoMuscular === grupo &&
        exercicioCompativel(equipamentosDisponiveis, nivelUsuario, ex.equipamentos, ex.nivel),
    );

    const naoUsados = candidatos.filter((ex) => !jaUsados.has(ex.id));
    const pool = naoUsados.length >= quantidade ? naoUsados : candidatos;

    for (let i = 0; i < quantidade && pool.length > 0; i++) {
      const idxEscolhido = i % pool.length;
      const exercicio = pool[idxEscolhido];
      if (exercicio && !selecionados.includes(exercicio.id)) {
        selecionados.push(exercicio.id);
        jaUsados.add(exercicio.id);
      }
    }
  });

  return selecionados;
}

function estimarDuracao(treino: Treino): number {
  const segundos = treino.exercicios.reduce((total, ex) => {
    const tempoSerie = 45; // execução média por série
    return total + ex.series * (tempoSerie + ex.descansoSeg);
  }, 0);
  return Math.round(segundos / 60) + 10; // + aquecimento
}

function montarTreino(
  diaSplit: DiaSplit,
  qtdExercicios: number,
  preferencias: Preferencias,
  objetivo: Objetivo,
  nivel: NivelExperiencia,
  jaUsados: Set<string>,
): Treino {
  const config = CONFIG_POR_OBJETIVO[objetivo];

  let grupos = diaSplit.grupos;
  if ((objetivo === "emagrecimento" || objetivo === "condicionamento") && !grupos.includes("cardio")) {
    grupos = [...grupos, "cardio"];
  }

  const idsExercicios = selecionarExercicios(grupos, qtdExercicios, preferencias.equipamentos, nivel, jaUsados);

  const exercicios: ExercicioTreino[] = idsExercicios.map((id) => {
    const exercicio = EXERCICIOS.find((e) => e.id === id);
    const isCardio = exercicio?.grupoMuscular === "cardio";

    return {
      exercicioId: id,
      series: isCardio ? 1 : config.series,
      repeticoes: isCardio ? "10-15 min" : config.repeticoes,
      rpeAlvo: config.rpeAlvo,
      descansoSeg: isCardio ? 60 : config.descansoSeg,
    };
  });

  const treino: Treino = {
    id: `${diaSplit.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    nome: diaSplit.nome,
    grupos,
    exercicios,
    duracaoEstimadaMin: 0,
  };

  treino.duracaoEstimadaMin = estimarDuracao(treino);
  return treino;
}

/**
 * Gera um plano de treino completo adaptado ao objetivo, nível, dias
 * disponíveis, tempo por sessão e equipamentos do aluno.
 */
export function gerarPlanoTreino(usuario: Usuario, preferencias: Preferencias): PlanoTreino {
  const objetivo = usuario.objetivo ?? "saude";
  const nivel = usuario.nivel ?? "iniciante";
  const split = definirSplit(preferencias.diasPorSemana);

  const qtdExercicios = Math.max(4, Math.min(9, Math.round(preferencias.tempoDisponivelMin / 9)));
  const jaUsados = new Set<string>();

  const treinos = split.dias.map((dia) =>
    montarTreino(dia, qtdExercicios, preferencias, objetivo, nivel, jaUsados),
  );

  return {
    id: `plano-${Date.now()}`,
    nome: `Plano ${OBJETIVO_LABEL[objetivo]} — IA`,
    objetivo,
    split: split.nome,
    semanaAtual: 1,
    totalSemanas: 8,
    treinos,
    geradoPorIA: true,
    deload: false,
    criadoEm: new Date().toISOString(),
  };
}

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  forca: "Força",
  condicionamento: "Condicionamento",
  saude: "Saúde",
  performance: "Performance",
};

/**
 * Gera uma semana de deload: reduz volume (séries) e intensidade,
 * aumentando levemente o descanso, mantendo os mesmos exercícios.
 */
export function gerarDeload(plano: PlanoTreino): PlanoTreino {
  const treinos = plano.treinos.map((treino) => ({
    ...treino,
    nome: `${treino.nome} (Deload)`,
    exercicios: treino.exercicios.map((ex) => ({
      ...ex,
      series: Math.max(2, ex.series - 1),
      descansoSeg: ex.descansoSeg + 30,
      rpeAlvo: Math.max(5, (ex.rpeAlvo ?? 7) - 2),
    })),
  }));

  return {
    ...plano,
    id: `${plano.id}-deload`,
    nome: `${plano.nome} (Semana de Deload)`,
    treinos,
    deload: true,
    geradoPorIA: true,
  };
}

/**
 * Analisa os últimos registros de um exercício e indica se o aluno está
 * estagnado (carga máxima não evoluiu nas últimas 3 sessões).
 */
export function detectarEstagnacao(registros: RegistroTreino[], exercicioId: string): boolean {
  const cargasMaximas = registros
    .filter((r) => r.series.some((s) => s.exercicioId === exercicioId))
    .slice(0, 3)
    .map((r) => Math.max(0, ...r.series.filter((s) => s.exercicioId === exercicioId).map((s) => s.cargaKg)));

  if (cargasMaximas.length < 3) return false;

  const [maisRecente, , maisAntiga] = cargasMaximas;
  return maisRecente <= maisAntiga;
}

/**
 * Sugere a progressão de carga/repetições com base no RPE médio da última sessão.
 */
export function sugerirProgressao(registros: RegistroTreino[], exercicioId: string): string {
  const ultimoRegistro = registros.find((r) => r.series.some((s) => s.exercicioId === exercicioId));
  if (!ultimoRegistro) return "Sem histórico ainda — registre sua primeira série para receber sugestões.";

  const seriesExercicio = ultimoRegistro.series.filter((s) => s.exercicioId === exercicioId);
  const cargaMax = Math.max(...seriesExercicio.map((s) => s.cargaKg));
  const rpeMedio =
    seriesExercicio.reduce((acc, s) => acc + (s.rpe ?? 8), 0) / seriesExercicio.length;

  if (detectarEstagnacao(registros, exercicioId)) {
    return `Você estagnou em ${cargaMax}kg nas últimas sessões. Tente uma técnica de intensidade (drop-set ou rest-pause) ou considere uma semana de deload.`;
  }

  if (rpeMedio <= 7) {
    const novaCarga = Math.round((cargaMax + cargaMax * 0.025) * 2) / 2;
    return `RPE baixo na última sessão. Suba para ${novaCarga}kg na próxima vez.`;
  }

  if (rpeMedio >= 9) {
    return `RPE alto — mantenha ${cargaMax}kg e foque em melhorar a execução antes de aumentar a carga.`;
  }

  return `Bom trabalho! Tente adicionar 1 repetição extra em pelo menos uma série mantendo ${cargaMax}kg.`;
}

interface ContextoMotivacional {
  nome: string;
  streakDias: number;
  treinosSemanaConcluidos: number;
  treinosSemanaAlvo: number;
  ultimoCheckinHumor?: number;
}

const MENSAGENS_STREAK_ALTA = (ctx: ContextoMotivacional) => [
  `${ctx.nome}, ${ctx.streakDias} dias seguidos! Sua consistência é o que constrói resultados de verdade. 🔥`,
  `${ctx.streakDias} dias direto na ativa — você já está à frente de 90% das pessoas. Bora manter o ritmo!`,
];

const MENSAGENS_SEMANA_OK = (ctx: ContextoMotivacional) => [
  `${ctx.nome}, você já cumpriu ${ctx.treinosSemanaConcluidos}/${ctx.treinosSemanaAlvo} treinos da semana. Falta pouco!`,
  `Mais um treino concluído! ${ctx.treinosSemanaAlvo - ctx.treinosSemanaConcluidos} para fechar a meta semanal.`,
];

const MENSAGENS_SEMANA_BAIXA = (ctx: ContextoMotivacional) => [
  `${ctx.nome}, faz um tempo desde o último treino. Que tal começar com algo leve hoje?`,
  `Toda jornada tem altos e baixos. O importante é voltar — seu próximo treino te espera, ${ctx.nome}.`,
];

const MENSAGENS_HUMOR_BAIXO = (ctx: ContextoMotivacional) => [
  `${ctx.nome}, vimos que você não está no seu melhor dia. Um treino leve pode ajudar a liberar endorfina. Vai com calma hoje.`,
];

const MENSAGENS_PADRAO = (ctx: ContextoMotivacional) => [
  `Bora, ${ctx.nome}! Cada treino te aproxima do seu objetivo.`,
  `O progresso não é sempre visível no espelho, mas seu corpo está registrando cada esforço, ${ctx.nome}.`,
  `Disciplina vence motivação. Hoje é mais um dia de construção, ${ctx.nome}.`,
];

export function gerarMensagemMotivacional(ctx: ContextoMotivacional): string {
  let pool: string[];

  if (ctx.ultimoCheckinHumor !== undefined && ctx.ultimoCheckinHumor <= 2) {
    pool = MENSAGENS_HUMOR_BAIXO(ctx);
  } else if (ctx.streakDias >= 7) {
    pool = MENSAGENS_STREAK_ALTA(ctx);
  } else if (ctx.treinosSemanaConcluidos >= ctx.treinosSemanaAlvo) {
    pool = [`Meta semanal batida, ${ctx.nome}! Você está no controle total da sua evolução. 🎉`];
  } else if (ctx.treinosSemanaConcluidos > 0) {
    pool = MENSAGENS_SEMANA_OK(ctx);
  } else if (ctx.streakDias === 0) {
    pool = MENSAGENS_SEMANA_BAIXA(ctx);
  } else {
    pool = MENSAGENS_PADRAO(ctx);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ────────────────────────────────────────────────────────────────────────────
// Plano nutricional
// ────────────────────────────────────────────────────────────────────────────

interface AlimentoBase {
  nome: string;
  porcaoBase: string;
  caloriasBase: number;
  proteinasBase: number;
  carboidratosBase: number;
  gordurasBase: number;
}

const TEMPLATE_REFEICOES: { nome: string; horario: string; participacao: number; alimentos: AlimentoBase[] }[] = [
  {
    nome: "Café da manhã",
    horario: "07:00",
    participacao: 0.2,
    alimentos: [
      { nome: "Pão integral", porcaoBase: "2 fatias", caloriasBase: 140, proteinasBase: 6, carboidratosBase: 24, gordurasBase: 2 },
      { nome: "Ovos mexidos", porcaoBase: "2 unidades", caloriasBase: 150, proteinasBase: 12, carboidratosBase: 1, gordurasBase: 10 },
      { nome: "Banana", porcaoBase: "1 unidade", caloriasBase: 90, proteinasBase: 1, carboidratosBase: 23, gordurasBase: 0 },
    ],
  },
  {
    nome: "Lanche da manhã",
    horario: "10:00",
    participacao: 0.1,
    alimentos: [
      { nome: "Iogurte natural", porcaoBase: "1 pote (170g)", caloriasBase: 100, proteinasBase: 10, carboidratosBase: 8, gordurasBase: 3 },
      { nome: "Castanhas", porcaoBase: "1 punhado (20g)", caloriasBase: 120, proteinasBase: 4, carboidratosBase: 4, gordurasBase: 10 },
    ],
  },
  {
    nome: "Almoço",
    horario: "13:00",
    participacao: 0.3,
    alimentos: [
      { nome: "Arroz branco", porcaoBase: "4 col. sopa", caloriasBase: 150, proteinasBase: 3, carboidratosBase: 33, gordurasBase: 0 },
      { nome: "Feijão", porcaoBase: "1 concha", caloriasBase: 80, proteinasBase: 5, carboidratosBase: 14, gordurasBase: 0 },
      { nome: "Frango grelhado", porcaoBase: "150g", caloriasBase: 250, proteinasBase: 45, carboidratosBase: 0, gordurasBase: 7 },
      { nome: "Salada + legumes", porcaoBase: "à vontade", caloriasBase: 60, proteinasBase: 2, carboidratosBase: 10, gordurasBase: 1 },
    ],
  },
  {
    nome: "Lanche da tarde",
    horario: "16:00",
    participacao: 0.1,
    alimentos: [
      { nome: "Whey protein", porcaoBase: "1 scoop (30g)", caloriasBase: 120, proteinasBase: 24, carboidratosBase: 3, gordurasBase: 1 },
      { nome: "Aveia", porcaoBase: "2 col. sopa", caloriasBase: 75, proteinasBase: 3, carboidratosBase: 13, gordurasBase: 1 },
    ],
  },
  {
    nome: "Jantar",
    horario: "20:00",
    participacao: 0.3,
    alimentos: [
      { nome: "Batata-doce", porcaoBase: "150g", caloriasBase: 130, proteinasBase: 2, carboidratosBase: 30, gordurasBase: 0 },
      { nome: "Carne magra ou peixe", porcaoBase: "150g", caloriasBase: 230, proteinasBase: 40, carboidratosBase: 0, gordurasBase: 8 },
      { nome: "Legumes refogados", porcaoBase: "1 xícara", caloriasBase: 70, proteinasBase: 2, carboidratosBase: 12, gordurasBase: 1 },
    ],
  },
];

/**
 * Gera um plano nutricional com base no perfil do aluno usando a fórmula de
 * Mifflin-St Jeor para gasto energético, ajustado pelo objetivo.
 */
export function gerarPlanoNutricional(usuario: Usuario): PlanoNutricional {
  const peso = usuario.pesoKg ?? 75;
  const altura = usuario.alturaCm ?? 170;
  const idade = usuario.dataNascimento
    ? Math.max(16, new Date().getFullYear() - new Date(usuario.dataNascimento).getFullYear())
    : 30;
  const objetivo = usuario.objetivo ?? "saude";

  const bmr =
    usuario.sexo === "feminino"
      ? 10 * peso + 6.25 * altura - 5 * idade - 161
      : 10 * peso + 6.25 * altura - 5 * idade + 5;

  const tdee = bmr * 1.55; // nível de atividade moderado (treino regular)

  const ajuste: Record<Objetivo, number> = {
    emagrecimento: 0.8,
    hipertrofia: 1.1,
    forca: 1.05,
    condicionamento: 1.0,
    saude: 1.0,
    performance: 1.05,
  };

  const caloriasAlvo = Math.round((tdee * ajuste[objetivo]) / 10) * 10;

  const proteinaPorKg: Record<Objetivo, number> = {
    emagrecimento: 2.2,
    hipertrofia: 2.0,
    forca: 2.0,
    condicionamento: 1.8,
    saude: 1.6,
    performance: 1.9,
  };

  const proteinasAlvoG = Math.round(peso * proteinaPorKg[objetivo]);
  const caloriasProteina = proteinasAlvoG * 4;
  const caloriasGordura = caloriasAlvo * 0.25;
  const gordurasAlvoG = Math.round(caloriasGordura / 9);
  const caloriasCarbo = Math.max(0, caloriasAlvo - caloriasProteina - caloriasGordura);
  const carboidratosAlvoG = Math.round(caloriasCarbo / 4);

  const aguaAlvoMl = Math.round(peso * 35);

  const fatorEscala = caloriasAlvo / 2000; // template base ~2000kcal

  const refeicoes: Refeicao[] = TEMPLATE_REFEICOES.map((template, idx) => ({
    id: `refeicao-${idx}`,
    nome: template.nome,
    horario: template.horario,
    alimentos: template.alimentos.map((alimento) => ({
      nome: alimento.nome,
      quantidade: alimento.porcaoBase,
      calorias: Math.round(alimento.caloriasBase * fatorEscala),
      proteinasG: Math.round(alimento.proteinasBase * fatorEscala),
      carboidratosG: Math.round(alimento.carboidratosBase * fatorEscala),
      gordurasG: Math.round(alimento.gordurasBase * fatorEscala),
    })),
  }));

  return {
    caloriasAlvo,
    proteinasAlvoG,
    carboidratosAlvoG,
    gordurasAlvoG,
    aguaAlvoMl,
    refeicoes,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Chat — IA Coach
// ────────────────────────────────────────────────────────────────────────────

interface ContextoChat {
  nome: string;
  objetivo?: Objetivo;
  proximoTreinoNome?: string;
  streakDias: number;
}

export function responderCoach(pergunta: string, ctx: ContextoChat): string {
  const texto = pergunta.toLowerCase();

  if (texto.includes("treino") && (texto.includes("hoje") || texto.includes("próximo") || texto.includes("proximo"))) {
    return ctx.proximoTreinoNome
      ? `Seu próximo treino é "${ctx.proximoTreinoNome}". Foque na execução e respeite os tempos de descanso para manter a intensidade.`
      : "Você ainda não tem um plano de treino ativo. Vá até a aba Treino para gerar um plano com a IA.";
  }

  if (texto.includes("dor") || texto.includes("lesão") || texto.includes("lesao")) {
    return "Sinto muito por isso. Se a dor for articular ou aguda, é importante reduzir a carga, ajustar a amplitude ou substituir o exercício. Em casos persistentes, procure um profissional de saúde antes de continuar.";
  }

  if (texto.includes("estagn") || texto.includes("travado") || texto.includes("não evolu") || texto.includes("nao evolu")) {
    return "Estagnação é normal! Algumas estratégias: variar o ângulo do exercício, ajustar repetições, incluir uma semana de deload ou revisar sono e alimentação — tudo isso impacta diretamente sua recuperação.";
  }

  if (texto.includes("emagrec") || texto.includes("perder peso") || texto.includes("gordura")) {
    return "Para emagrecimento, o mais importante é manter um déficit calórico moderado (recomendamos no plano nutricional), treino de força para preservar massa magra e cardio complementar 2-3x por semana.";
  }

  if (texto.includes("hipertrof") || texto.includes("ganhar massa") || texto.includes("músculo") || texto.includes("musculo")) {
    return "Para hipertrofia, priorize sobrecarga progressiva (aumente carga ou repetições gradualmente), volume de 10-20 séries por grupo muscular por semana e consumo adequado de proteína (cerca de 2g/kg).";
  }

  if (texto.includes("descanso") || texto.includes("recupera")) {
    return "A recuperação é onde o músculo realmente cresce. Durma de 7-9h por noite, mantenha hidratação e considere dias de descanso ativo entre treinos intensos do mesmo grupo muscular.";
  }

  if (texto.includes("nutri") || texto.includes("dieta") || texto.includes("comer")) {
    return "Seu plano nutricional foi calculado com base no seu peso, altura e objetivo. Ele é um ponto de partida — ajuste as porções conforme sua evolução nas próximas avaliações físicas.";
  }

  if (texto.includes("obrigad") || texto.includes("valeu")) {
    return `Disponha, ${ctx.nome}! Estou aqui sempre que precisar. Bons treinos! 💪`;
  }

  return `Boa pergunta, ${ctx.nome}! Com base no seu objetivo (${ctx.objetivo ? OBJETIVO_LABEL[ctx.objetivo] : "geral"}), recomendo manter consistência nos treinos e check-ins diários — assim consigo te dar recomendações cada vez mais precisas.`;
}
