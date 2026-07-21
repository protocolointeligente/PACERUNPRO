import type { PaceCourse, PaceLesson, PaceQuizQuestion } from "./pace-university";

const references = {
  science: "Método PaceRunPro — princípios de treinamento e progressão",
  metrics: "Método PaceRunPro — leitura de carga, resposta e aderência",
  product: "PaceRunPro — execução, registro e revisão do treino",
  intelligence: "PaceRunPro — tomada de decisão contextual",
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

const trackPlans: Record<string, { promise: string; method: string; progression: string }> = {
  "zonas-intensidade-rpe": {
    promise: "aprender a controlar o estímulo pelo efeito pretendido, combinando zona, RPE e resposta do atleta",
    method: "classificar o objetivo da sessão, escolher a métrica dominante e confirmar a execução pelo comportamento do esforço",
    progression: "da distinção entre zonas para a calibragem individual e, depois, para a tomada de decisão quando os sinais entram em conflito",
  },
  "execucao-corrida": {
    promise: "executar os principais formatos de corrida com ritmo, recuperação e técnica coerentes com o objetivo",
    method: "ler a sessão antes de começar, construir a intensidade progressivamente e registrar o que aconteceu em cada bloco",
    progression: "da rodagem fácil para estímulos com variação de ritmo, limiar e intervalos, terminando com revisão pós-treino",
  },
  "forca-endurance": {
    promise: "usar a força para melhorar capacidade de produzir e repetir esforço sem prejudicar os treinos de endurance",
    method: "preservar o padrão de movimento, controlar RPE/RIR, progredir uma variável por vez e respeitar a recuperação",
    progression: "da justificativa da força para a escolha de carga, qualidade técnica, progressão semanal e registro que permite revisar o plano",
  },
  "metricas-feedback": {
    promise: "transformar carga, aderência e feedback em decisões de treinamento claras e justificáveis",
    method: "separar dado observado de interpretação, comparar planejado e realizado e procurar tendência antes de agir",
    progression: "da consistência do treino para carga externa, carga interna, fadiga e fechamento de uma revisão semanal",
  },
  "triatlo-multimodal": {
    promise: "organizar natação, ciclismo, corrida e força sem deixar que uma modalidade destrua a qualidade da outra",
    method: "definir prioridade, distribuir estímulos, estimar custo de recuperação e ajustar a semana pelo que foi realizado",
    progression: "da distribuição de frequência para a ordem dos treinos, sessões combinadas, volume, descarga e publicação da semana",
  },
  "estrategia-prova": {
    promise: "chegar à prova com meta, ritmo, recuperação e estratégia compatíveis com o nível real de preparo",
    method: "usar histórico e sinais atuais para definir cenário, executar com margem e aprender com o resultado",
    progression: "da meta realista para taper, controle no dia, análise pós-prova e retorno gradual à rotina",
  },
  "execucao-app-mobile": {
    promise: "usar o treino prescrito como orientação prática para executar melhor cada sessão",
    method: "ler objetivo, intensidade, sequência e critérios de registro antes de iniciar o treino",
    progression: "da leitura do treino para a execução, o registro de força, o feedback e a continuidade quando houver imprevisto",
  },
  "dados-relogio-strava": {
    promise: "interpretar dados de treino sem confundir precisão do dispositivo com qualidade da decisão",
    method: "verificar origem, unidade, completude e contexto antes de comparar o planejado ao realizado",
    progression: "da escolha do dado relevante para comparação, leitura de métricas, recuperação, preenchimento e auditoria semanal",
  },
};

const suppliedLessonContent: Record<string, string> = {
  "Intensidade: o que o treinador realmente está controlando": `Intensidade é o grau de exigência do exercício em relação à capacidade atual do atleta. Não é volume nem carga total. Duas sessões com a mesma duração podem produzir demandas diferentes.\n\nSepare carga externa — ritmo, velocidade, potência, distância, carga e repetições — de carga interna — frequência cardíaca, RPE, fadiga, dor e resposta técnica. Uma corrida a 5:30 min/km pode ser leve para um atleta e muito intensa para outro, dependendo de sono, calor, hidratação, estresse e fadiga acumulada.\n\nA aplicação é comparar o trabalho realizado com a resposta que ele provocou. Não use apenas ritmo ou frequência cardíaca. Registre a variável externa, o RPE, o contexto e a decisão para a próxima sessão.`,
  "Zonas de intensidade: Z1 a Z5 sem falsas certezas": `Zonas são faixas operacionais para prescrever e comunicar o treinamento; não são fronteiras biológicas perfeitas. Em um modelo de cinco zonas, Z1 é muito leve e útil para recuperação, Z2 sustenta o desenvolvimento aeróbio, Z3 representa esforço moderado, Z4 aproxima-se do limiar e Z5 concentra esforços muito intensos.\n\nOs limites podem vir de frequência cardíaca, limiar, ritmo, potência ou testes de campo. Cada método tem limitações. Por isso, combine a zona com RPE, teste da fala, terreno e objetivo. Uma pequena oscilação em uma subida não muda automaticamente o objetivo da sessão.`,
  "RPE e teste da fala: interpretar o esforço do atleta": `RPE é a avaliação do quanto a sessão exigiu do organismo, e não se o atleta gostou do treino. Em uma escala de 0 a 10, 2–3 costuma representar esforço leve, 4–5 moderado, 6–7 difícil e 8–10 muito difícil ou máximo.\n\nColete o RPE da sessão depois que o atleta recuperar a percepção do estímulo final. Combine-o com o teste da fala: conversa confortável sugere baixa intensidade; frases curtas indicam esforço moderado ou alto; palavras isoladas indicam intensidade elevada. O valor principal está na tendência individual.`,
  "Tomada de decisão combinando zonas, ritmo, potência e sinais do corpo": `A decisão deve comparar planejado, realizado, zona, RPE, frequência cardíaca, ritmo ou potência, dor, fadiga, sono, ambiente e histórico recente. Se a execução estiver dentro do plano e a resposta for compatível, mantenha. Se o desempenho cair e o esforço subir, reduza ou encerre. Dor persistente, tontura, falta de ar desproporcional ou dor torácica exigem interrupção e avaliação apropriada.`,
  "Por que atletas de endurance precisam de força": `Força é a capacidade de produzir tensão e ajuda o atleta de endurance a sustentar técnica, economia de movimento e tolerância às demandas mecânicas. Treinar força não significa necessariamente buscar grande aumento de massa corporal. A prescrição depende da modalidade, fase da temporada, histórico e custo de fadiga.\n\nUm corredor que aumenta volume mas perde controle em subidas pode precisar desenvolver panturrilha, quadril e controle de tronco, em vez de apenas correr mais. A atividade é selecionar três capacidades relevantes para corredor, ciclista, nadador e triatleta e justificar cada escolha.`,
  "Seleção de exercícios e padrões fundamentais": `Organize a sessão por padrões: agachar, levantar, empurrar, puxar, avançar, estabilizar, saltar e produzir força unilateralmente. Escolha exercícios considerando objetivo, modalidade, equipamento, capacidade técnica, fase da temporada e custo de recuperação.\n\nNão copie um treino de fisiculturismo sem adaptação. O melhor exercício é aquele que o atleta executa com qualidade e que atende à demanda do treinamento. Registre por que cada exercício entrou e qual sinal faria você substituí-lo.`,
  "Carga, séries, repetições, RIR e RPE": `Séries, repetições, carga relativa, RIR e RPE descrevem o estímulo e a proximidade da falha. Força frequentemente usa 3–6 repetições com margem de 2–4 RIR; trabalho complementar pode usar 6–12; resistência localizada pode usar 12–20 ou mais. São referências, não regras universais.\n\nAumente uma variável por vez: carga, repetições ou séries. Se a velocidade e a técnica caírem, a sessão já ultrapassou o estímulo útil, mesmo que ainda existam repetições possíveis.`,
  "Organização semanal e treinamento concorrente": `Combine força e endurance observando ordem, intervalo entre sessões, prioridade competitiva e semanas leves. Coloque o estímulo prioritário quando o atleta estiver mais disponível e evite empilhar sessões intensas que disputem a mesma recuperação.\n\nUma semana pode alternar corrida leve e força, intervalado, recuperação, força reduzida, corrida moderada, longo e descanso. O exemplo deve ser adaptado à disponibilidade e à prova; não existe distribuição ideal para todos.`,
  "Segurança, progressão e montagem de uma sessão completa": `Uma sessão completa contém preparação, exercício principal, complementares, trabalho específico e encerramento. A progressão deve ser gradual e a técnica compatível com a carga. Dor que altera o movimento, fadiga que compromete controle e sintomas persistentes exigem adaptação ou encaminhamento.\n\nMonte a sessão justificando exercício, séries, repetições, RIR e descanso. A avaliação está concluída quando a escolha atende ao esporte e não apenas ao desejo de treinar mais.`,
  "Métricas úteis, métricas vaidosas e contexto": `Uma métrica só é útil quando consegue mudar uma decisão prática. Separe dado, informação e decisão: duração é dado; uma tendência de queda de aderência é informação; reduzir o volume da próxima semana é decisão. Avalie validade, confiabilidade, sensibilidade e aplicabilidade antes de colocar um número no centro da prescrição.\n\nClassifique as métricas do atleta em essenciais, complementares e pouco acionáveis. Mais números não significam melhor treinamento.`,
  "Sono, fadiga, estresse e prontidão": `Sono, fadiga, estresse, humor e prontidão são sinais de carga interna. Colete-os em escalas simples e compare cada atleta com a própria linha de base. Uma pontuação isolada não diagnostica nem autoriza cancelar automaticamente o treino.\n\nProcure tendência: vários dias de sono ruim, fadiga crescente e queda de desempenho justificam reduzir a exigência e investigar o contexto.`,
  "Dor, desconforto e sinais que exigem atenção": `Diferencie esforço esperado, desconforto transitório e dor que altera o movimento ou persiste após a sessão. Registre localização, intensidade, duração, comportamento e impacto funcional. O fluxo é identificar, adaptar ou interromper, registrar, acompanhar e encaminhar quando necessário.\n\nO treinador não diagnostica lesão. Dor torácica, sintomas neurológicos, tontura ou falta de ar desproporcional exigem interrupção e avaliação apropriada.`,
  "Carga: volume, sRPE, TSS, monotonia e tendência": `Volume, duração, distância e carga por sRPE descrevem o trabalho; TSS e outras métricas podem organizar a análise, mas não são equivalentes automaticamente entre pessoas. No sRPE, uma sessão de 60 minutos com RPE 6 gera 360 unidades arbitrárias.\n\nUse monotonia, strain e rampas como alertas para investigar, nunca como prova de causalidade. Não some métricas diferentes sem explicar o que cada uma mede.`,
  "Planejado versus realizado e regras de ajuste": `Compare duração, volume, intensidade, intervalos, exercícios, RPE esperado, RPE observado, aderência e sintomas. Executar menos com esforço alto pede investigação; executar o plano com boa recuperação permite manter; cumprir a sessão com piora de sintomas exige rever a carga.\n\nUse o histórico de sete dias para propor uma mudança pequena e justificável na semana seguinte.`,
  "O problema central da preparação para triathlon": `Triathlon não é a soma de três planilhas independentes. Natação, ciclismo, corrida e força disputam tempo e recuperação. A prioridade depende da prova, distância, perfil e limitação atual do atleta.\n\nOrganize a carga total e por modalidade, protegendo sessões-chave, força e recuperação. Um treino bom isoladamente pode ser ruim quando colocado ao lado de outros estímulos intensos.`,
  "Diagnóstico inicial e definição de prioridades": `Comece por experiência, disponibilidade semanal, técnica de natação, capacidade no ciclismo, desempenho na corrida, histórico de lesões, logística e perfil da prova. Identifique se o atleta é limitado por natação, ciclismo, corrida, tempo disponível ou recuperação.\n\nA prioridade deve representar o maior ganho possível dentro da capacidade de recuperação, não apenas a modalidade preferida do atleta.`,
  "Distribuição de volume e intensidade entre modalidades": `Distribua frequência, volume e intensidade por modalidade considerando sessões-chave, volume mínimo efetivo e semanas de descarga. Um exemplo pode conter três sessões de natação, três de ciclismo, três de corrida e duas de força, mas isso é uma referência, não uma regra universal.\n\nRevise a distribuição quando a recuperação cair ou quando uma modalidade prejudicar a qualidade da outra.`,
  "Sessões combinadas e treinos de transição": `Brick é a combinação planejada de modalidades, como bicicleta seguida de corrida. O objetivo pode ser adaptação perceptiva, organização logística ou especificidade de prova; não é transformar toda transição em competição.\n\nUm pedal moderado de 90 minutos seguido de 15 minutos de corrida leve ensina a transição sem inflar desnecessariamente a fadiga. Use frequência adequada e critérios claros para não adicionar custo sem benefício.`,
  "Força, recuperação e prevenção de excesso de carga": `A força deve apoiar o triatleta, não competir com os treinos prioritários. Organize volume, sono, alimentação, hidratação, dias leves e distância entre sessões intensas. Três modalidades intensas em dias consecutivos podem produzir uma semana impossível de recuperar.\n\nReorganize preservando a sessão mais específica e reduzindo o estímulo acessório.`,
  "Construção de uma semana de triathlon": `Construa a semana em oito passos: defina prova e prioridade; identifique sessões-chave; distribua modalidades; posicione força; proteja recuperação; adicione complementares; revise carga total; e confirme viabilidade.\n\nA semana só está pronta quando cabe na vida do atleta e mantém margem para adaptar o que foi realizado.`,
  "De onde vêm os dados e por que eles podem falhar": `Dados podem vir de relógios, sensores, ciclocomputadores, aplicativos, Strava e lançamentos manuais. FIT, GPX e TCX podem perder campos durante a sincronização; atividades podem aparecer duplicadas ou com modalidade errada.\n\nAntes de analisar, confirme origem, data, modalidade, duração e completude. Registro automático não significa registro correto.`,
  "Distância, tempo, ritmo e velocidade": `Diferencie tempo decorrido, tempo em movimento, pausas, distância, ritmo médio, ritmo por volta e velocidade. Uma corrida com 55 minutos decorridos e 49 em movimento não deve ser interpretada como se os números fossem iguais.\n\nGPS, esteira, trilha, subida e pausa automática mudam a confiabilidade. Escolha a duração adequada ao objetivo da análise.`,
  "Frequência cardíaca: uso e limitações": `Sensor óptico e cinta podem apresentar atraso, picos impossíveis ou ausência de sinal. Calor, desidratação, cafeína, medicamentos e deriva cardiovascular alteram a resposta.\n\nCompare frequência média, tempo em zona, RPE e condições da sessão. Não interprete um pico isolado nem aceite zonas automáticas sem validar o método.`,
  "Potência, pace e métricas avançadas": `Diferencie potência medida de potência estimada, pace real de pace ajustado e FTP ou potência crítica de um número importado sem calibração. Métricas avançadas ajudam quando a origem e o método são conhecidos.\n\nNão compare diretamente dados de dispositivos diferentes sem verificar algoritmo, unidade e condições de coleta.`,
  "Sono, estresse e dados de recuperação": `Sono, frequência cardíaca de repouso, HRV, estresse e métricas proprietárias são estimativas com limitações algorítmicas. O melhor uso é acompanhar tendências consistentes do mesmo atleta e dispositivo, não comparar valores absolutos entre marcas.\n\nCombine recuperação percebida, carga realizada e função no treino antes de ajustar.`,
  "Validação, correção e lançamento manual": `Audite modalidade, data, horário, duração, distância, pausas, frequência cardíaca, potência, RPE, sintomas, duplicidade e observações. Corrija atividades importadas antes de usá-las na análise.\n\nO lançamento manual deve cobrir força, mobilidade, técnica e treinos sem dispositivo. Se uma atividade tem duas horas, 54 minutos em movimento, FC média impossível e duplicidade, ela deve ser corrigida antes de orientar a prescrição.`,
};

export function editorializeLesson(course: PaceCourse, lesson: PaceLesson): PaceLesson {
  const domain = domainFor(course);
  const guidance = lessonGuidance(lesson.title);
  const track = trackPlans[course.id] ?? trackPlans["zonas-intensidade-rpe"];
  const content = [
    `## O lugar desta aula na trilha\n\nEsta trilha ensina a ${track.promise}. A sequência foi construída ${track.progression}. Portanto, esta aula não deve ser estudada isoladamente: ela desenvolve o próximo passo do tema “${course.title}” e prepara a decisão da aula seguinte.`,
    `## O que esta aula resolve\n\n${lesson.objective} ${guidance.concept} Ao final, o atleta ou treinador deve conseguir explicar o objetivo do treino, executar o procedimento e justificar um ajuste sem usar uma métrica isolada como resposta automática.`,
    `## Conteúdo essencial\n\n${suppliedLessonContent[lesson.title] ?? `${guidance.steps} Na lógica do PaceRunPro, o treino começa com uma intenção clara: ${track.method}. O objetivo vem antes da métrica; depois são observados execução, percepção, contexto e recuperação. Compare o atleta consigo mesmo, considerando nível, histórico, sono, estresse, dor, técnica, disponibilidade e fase da periodização.`}`,
    `## Aplicação passo a passo\n\n1. Escreva o objetivo da sessão em uma frase.\n2. Defina a variável principal e uma faixa aceitável, sem exigir um número perfeito.\n3. Observe execução, percepção e contexto durante ou logo após o treino.\n4. Compare planejado e realizado, descrevendo a diferença antes de julgá-la.\n5. Registre uma decisão pequena, reversível e com motivo explícito.\n\n${guidance.decision}`,
    `## Relação com o PaceRunPro\n\nNa plataforma, esta aula ajuda o treinador a ${domain.application}. O método PaceRunPro organiza objetivo, execução, resposta e revisão em um ciclo simples: prescrever com clareza, observar o que aconteceu, registrar contexto e ajustar somente o necessário. O sistema apoia a decisão, mas não substitui avaliação profissional, especialmente diante de dor ou sinais persistentes.`,
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
