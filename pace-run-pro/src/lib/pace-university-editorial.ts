import type { PaceCourse, PaceLesson, PaceQuizQuestion } from "./pace-university";

const references = {
  science: "ENKY 19 — Base Científica e Regras de Treinamento",
  metrics: "ENKY 18 — Métricas, Indicadores e Dashboards",
  product: "ENKY 13 — Product Vision & Scope",
  intelligence: "ENKY 20 — ENKY Intelligence no Produto",
};

function question(title: string, objective: string): PaceQuizQuestion {
  return {
    prompt: `Em uma situação prática relacionada a “${title}”, qual decisão é mais coerente com o objetivo da aula?`,
    options: [
      "Considerar o contexto, os dados disponíveis e a resposta individual antes de ajustar o treino.",
      "Aplicar a mesma regra para todos os atletas, independentemente do histórico.",
      "Ignorar o feedback e decidir apenas pelo número mais alto.",
      "Aumentar a carga imediatamente para acelerar o resultado.",
    ],
    answer: 0,
    explanation: `${objective} A decisão deve combinar dados, contexto e resposta individual, sem transformar uma métrica isolada em diagnóstico.`,
  };
}

function domainFor(course: PaceCourse): { lens: string; application: string; reference: string } {
  if (/métrica|feedback|dados|relógio|Strava/i.test(course.title)) {
    return { lens: "interpretação de dados", application: "comparar planejado, realizado e resposta do atleta", reference: references.metrics };
  }
  if (/força/i.test(course.title)) {
    return { lens: "prescrição de força", application: "ajustar carga, técnica, volume e recuperação", reference: references.science };
  }
  if (/triathlon/i.test(course.title)) {
    return { lens: "integração multimodal", application: "organizar estímulos sem competir contra a recuperação", reference: references.science };
  }
  if (/app|celular/i.test(course.title)) {
    return { lens: "uso operacional do produto", application: "transformar o treino prescrito em execução e feedback", reference: references.product };
  }
  if (/prova|recuperação/i.test(course.title)) {
    return { lens: "decisão em torno da prova", application: "combinar objetivo, carga, prontidão e recuperação", reference: references.science };
  }
  return { lens: "controle de intensidade", application: "prescrever e ajustar o estímulo sem perder o objetivo", reference: references.science };
}

function lessonGuidance(title: string): { concept: string; steps: string; decision: string } {
  const t = title.toLowerCase();
  if (t.includes("zona") || t.includes("rpe") || t.includes("intensidade")) {
    return { concept: "A zona representa o estímulo pretendido, não uma faixa que precisa ser perseguida a qualquer custo.", steps: "Defina o objetivo; escolha a métrica mais estável; estabeleça uma faixa de tolerância; e confirme a resposta pelo RPE e pela técnica.", decision: "Se as métricas divergirem, preserve o objetivo fisiológico e reduza a exigência quando a técnica ou a percepção mostrarem perda de controle." };
  }
  if (t.includes("corrida") || t.includes("rodagem") || t.includes("fartlek") || t.includes("tempo") || t.includes("intervalado") || t.includes("ritmo")) {
    return { concept: "A sessão de corrida é uma sequência de decisões: aquecer, executar o estímulo principal e terminar preservando a capacidade de treinar novamente.", steps: "Leia o objetivo; faça aquecimento progressivo; execute a primeira repetição com margem; compare as repetições; e registre ritmo, RPE, técnica e recuperação.", decision: "Se o ritmo cair por fadiga desproporcional, ajuste a série ou a recuperação em vez de transformar a sessão em teste máximo." };
  }
  if (t.includes("força") || t.includes("carga") || t.includes("reps") || t.includes("técnica")) {
    return { concept: "O ganho vem da combinação entre padrão de movimento, tensão suficiente e recuperação; carga alta sem controle não é progresso.", steps: "Aqueça o padrão; selecione carga que permita as repetições previstas; mantenha RIR planejado; descanse de forma consistente; e anote carga, repetições e execução.", decision: "Se a técnica deteriorar ou a dor alterar o movimento, interrompa a série, reduza a carga ou troque a variação e registre a justificativa." };
  }
  if (t.includes("sono") || t.includes("stress") || t.includes("dor") || t.includes("fadiga") || t.includes("aderência")) {
    return { concept: "Feedback subjetivo é dado de carga interna: ele não substitui o treino realizado, mas muda a interpretação do treino.", steps: "Colete o sinal em escala simples; compare com a linha de base do atleta; procure repetição por dias; e combine o achado com carga e contexto.", decision: "Um sinal isolado pede observação; sinais persistentes, dor crescente ou queda de função pedem redução de carga e avaliação profissional." };
  }
  if (t.includes("triatlon") || t.includes("modalidade") || t.includes("brick") || t.includes("transição") || t.includes("descarga")) {
    return { concept: "No planejamento multimodal, a recuperação entre estímulos é um recurso limitado e precisa ser distribuído como parte da sessão.", steps: "Defina a prioridade da semana; ordene os treinos-chave; estime custo em tempo e fadiga; deixe margem entre estímulos concorrentes; e revise o realizado.", decision: "Quando duas sessões competirem pela mesma recuperação, preserve a que atende à prioridade da prova e reduza a sessão acessória." };
  }
  if (t.includes("prova") || t.includes("taper") || t.includes("meta") || t.includes("retorno")) {
    return { concept: "Estratégia de prova é a aplicação controlada do que foi treinado, com margem para condições reais e sem tentar recuperar treinamento perdido.", steps: "Defina meta e cenário; planeje ritmo ou esforço por segmentos; combine alimentação e hidratação testadas; e determine critérios de ajuste.", decision: "A decisão correta é a que mantém o atleta funcional até o final; começar acima do plano raramente compensa o custo posterior." };
  }
  if (t.includes("strava") || t.includes("relógio") || t.includes("dados") || t.includes("manual") || t.includes("relatório")) {
    return { concept: "Dado útil é dado contextualizado, com origem conhecida e suficiente para sustentar uma decisão específica.", steps: "Confira a fonte; verifique unidade e completude; compare planejado com realizado; confronte com RPE e contexto; e registre a decisão.", decision: "Quando a informação estiver incompleta, marque a incerteza e peça confirmação; não transforme ausência de dado em sinal de baixa aderência." };
  }
  return { concept: "A aula transforma um princípio de treinamento em um procedimento repetível, observável e ajustável.", steps: "Defina o objetivo; prepare a sessão; execute com uma variável principal sob controle; registre o resultado; e revise a decisão com o histórico.", decision: "Ajuste uma variável por vez e escolha a menor mudança capaz de aproximar o treino do objetivo." };
}

export function editorializeLesson(course: PaceCourse, lesson: PaceLesson): PaceLesson {
  const domain = domainFor(course);
  const guidance = lessonGuidance(lesson.title);
  const content = [
    `## O que esta aula resolve\n\n${lesson.objective} ${guidance.concept} Nesta aula, você vai sair com um procedimento aplicável à rotina, e não apenas com uma definição.`,
    `## Conteúdo essencial\n\n${guidance.steps} O objetivo vem antes da métrica: primeiro descreva o estímulo que deveria acontecer, depois escolha os sinais que permitem verificar se ele aconteceu. Compare o atleta consigo mesmo, considerando nível, histórico, sono, estresse, dor, técnica, disponibilidade e fase da periodização.`,
    `## Aplicação passo a passo\n\n1. Escreva o objetivo da sessão em uma frase.\n2. Defina a variável principal e uma faixa aceitável, sem exigir um número perfeito.\n3. Observe execução, percepção e contexto durante ou logo após o treino.\n4. Compare planejado e realizado, descrevendo a diferença antes de julgá-la.\n5. Registre uma decisão pequena, reversível e com motivo explícito.\n\n${guidance.decision}`,
    `## Relação com a ENKY\n\nNa plataforma, esta aula ajuda o treinador a ${domain.application}. A ENKY 19 fornece o raciocínio científico; a ENKY 18 organiza métricas e indicadores; e a ENKY 20 orienta recomendações explicáveis, com indicação de incerteza. O sistema apoia a decisão, mas não substitui avaliação profissional, especialmente diante de dor ou sinais persistentes.`,
  ].join("\n\n");

  const example = `Um treinador acompanha um atleta que deveria completar uma sessão relacionada a “${lesson.title}”. O atleta entrega parte do planejado, relata esforço acima do habitual e registra sono ruim. Em vez de concluir que houve falta de disciplina ou aumentar a cobrança, o treinador compara a sessão com o histórico, verifica se o padrão se repete e decide entre manter, reduzir ou reorganizar o próximo estímulo. A justificativa fica registrada para orientar a próxima revisão.`;
  const activity = `Escolha uma sessão recente relacionada a “${lesson.title}”. Preencha: objetivo; variável principal; faixa esperada; resultado observado; RPE ou feedback; contexto; decisão; e qual dado faltante poderia mudar essa decisão. Faça o registro no histórico do atleta ou em uma nota de revisão semanal. A atividade está concluída quando outra pessoa consegue entender por que você manteve, ajustou ou adiou a carga.`;
  const commonMistakes = [
    "Usar uma métrica isolada como diagnóstico ou decisão automática.",
    "Aumentar ou reduzir a carga sem registrar o motivo e sem observar a resposta individual.",
    "Confundir cumprir o planejado com executar o estímulo adequado ao objetivo.",
  ];
  const summary = `A aula apresenta ${lesson.title.toLowerCase()} como uma decisão contextual. O objetivo vem antes da métrica; a resposta individual vem antes da generalização; e qualquer recomendação deve ser proporcional à qualidade dos dados. Use o histórico para comparar o atleta consigo mesmo, registre a justificativa e revise a decisão quando novas informações aparecerem.`;

  return {
    ...lesson,
    id: lesson.id ?? lesson.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    content,
    example,
    commonMistakes,
    activity,
    summary,
    quiz: [question(lesson.title, lesson.objective)],
    references: [domain.reference, references.intelligence],
    status: "review",
  };
}

export function withEditorialContent(course: PaceCourse): PaceCourse {
  return { ...course, lessons: course.lessons.map((lesson) => editorializeLesson(course, lesson)) };
}
