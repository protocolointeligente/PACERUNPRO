export type CourseTarget = "athlete" | "coach" | "both";
export type CourseLevel = "iniciante" | "intermediário" | "avançado";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  level: CourseLevel;
  category: string;
  color: string;
  for: CourseTarget;
  lessons: Lesson[];
}

export const UNIVERSITY_COURSES: Course[] = [
  // ── ATHLETE COURSES ────────────────────────────────────────────────────────

  {
    id: "fundamentos-corrida",
    title: "Fundamentos do Treinamento de Corrida",
    description: "Entenda as bases científicas do treino de corrida: zonas, ritmos, RPE e como aproveitar ao máximo o seu PACERUNPRO.",
    totalDuration: "45 min",
    level: "iniciante",
    category: "Metodologia",
    color: "#C6F24E",
    for: "athlete",
    lessons: [
      {
        id: "l1",
        title: "O que é VDOT e por que importa?",
        duration: "8 min",
        content: `## O que é VDOT?

VDOT é um índice que resume sua capacidade aeróbica em um único número. Criado pelo fisiologista Jack Daniels, ele é calculado a partir do seu desempenho em provas reais — sem laboratório.

**Como é calculado?**
Seu treinador insere o tempo e a distância de uma prova recente. O PACERUNPRO aplica as fórmulas de Daniels & Gilbert e calcula seu VDOT automaticamente.

**O que o número significa?**
- VDOT 30–35: corredor iniciante
- VDOT 40–45: corredor intermediário
- VDOT 50–55: corredor avançado
- VDOT 60+: atleta de elite

**Por que não usar só o pace?**
O pace varia com o terreno, o calor e o cansaço. O VDOT captura sua capacidade real — e muda à medida que você evolui. É a régua mais justa para prescrever treinos personalizados.`
      },
      {
        id: "l2",
        title: "Suas zonas de treino explicadas",
        duration: "9 min",
        content: `## As 5 zonas de Daniels

Cada zona tem um propósito fisiológico específico. Respeitar as zonas é o que separa o treino eficiente do treino que machuca.

### Zona E — Fácil (Easy)
**Objetivo:** base aeróbica, recuperação ativa, economia de corrida.
**Sensação:** você consegue conversar em frases completas.
**Onde treinar:** 70–80% do volume semanal é nessa zona.

### Zona M — Maratona
**Objetivo:** pace sustentável em provas longas.
**Sensação:** respiração controlada, ritmo confortavelmente desconfortável.

### Zona T — Limiar (Threshold)
**Objetivo:** elevar o limiar de lactato — o ponto onde o ácido láctico começa a acumular.
**Sensação:** difícil mas sustentável por 20–30 min.
**Volume:** nunca mais que 10% do volume semanal.

### Zona I — Intervalo (VO₂máx)
**Objetivo:** maximizar o consumo de oxigênio.
**Sensação:** muito intenso, respiração pesada.
**Volume:** tiros de 3–5 min com descanso.

### Zona R — Repetição
**Objetivo:** velocidade, mecânica, economia.
**Sensação:** esforço máximo em tiros curtos (200–400 m).`
      },
      {
        id: "l3",
        title: "Como ler sua prescrição semanal",
        duration: "7 min",
        content: `## Lendo sua prescrição

Seu treinador usa siglas e termos técnicos. Aqui está o dicionário básico.

**Tipos de sessão:**
- **Rodagem (E):** ritmo fácil, conversa possível
- **Progressivo:** começa lento e termina mais rápido (ex: 6×1 km acelerando)
- **Intervalado:** tiros em Zona I ou R com recuperação
- **Fartlek:** variações de ritmo sem estrutura rígida
- **Longão:** corrida longa em Zona E — base aeróbica

**Números comuns na prescrição:**
- "3×10' T c/ 2' rec" = 3 repetições de 10 minutos em Zona T, com 2 minutos de recuperação
- "8×400m R c/ 400m trote" = 8 tiros de 400m em Zona R, recuperando com 400m de trote
- "60' E" = 60 minutos em ritmo fácil

**Dica:** sempre confira o ritmo indicado no seu PACERUNPRO. O sistema calcula o pace exato para cada zona com base no seu VDOT atual.`
      },
      {
        id: "l4",
        title: "RPE: entendendo o esforço percebido",
        duration: "7 min",
        content: `## O que é RPE?

RPE (Rate of Perceived Exertion) é a escala de esforço percebido de 1 a 10.

| RPE | Sensação | Zona Aproximada |
|-----|----------|-----------------|
| 1–3 | Muito leve, caminhar | Recuperação |
| 4–5 | Confortável, conversa fácil | Zona E |
| 6–7 | Difícil, frases curtas | Zona T |
| 8–9 | Muito difícil, sem conversa | Zona I |
| 10  | Máximo absoluto | Zona R |

**Por que o check-in de RPE importa?**
Seu treinador usa o RPE que você registra para calcular a carga real da sessão:

**Carga (UA) = Duração (min) × RPE**

Um treino de 60 minutos com RPE 6 = 360 UA. Isso ajuda o treinador a controlar o volume e a intensidade ao longo das semanas — e o PACERUNPRO usa esses dados para alertar sobre sinais de overtraining.

**Seja honesto no check-in.** O sistema é tão bom quanto os dados que você fornece.`
      },
      {
        id: "l5",
        title: "Check-in diário: por que fazer e como",
        duration: "7 min",
        content: `## O check-in inteligente

Depois de cada treino (ou diariamente), o PACERUNPRO pede 5 informações:

1. **RPE** — Quão difícil foi o treino? (1–10)
2. **Dor** — Algum desconforto físico? (1–10)
3. **Fadiga** — Quão cansado está? (1–10)
4. **Sono** — Dormiu bem? (1–10)
5. **Humor** — Como está o estado de ânimo? (1–10)

**O motor inteligente age com esses dados:**
- Se RPE está cronicamente acima do esperado → semana sobrecarregada
- Se fadiga + dor estão altos → sinal de alerta enviado ao treinador
- Se sono ruim por 3 dias seguidos → risco de performance e saúde

**Como preencher?**
Use a tela "Hoje" do app. É rápido — menos de 30 segundos. Quanto mais consistente você for, mais precisa será a prescrição da próxima semana.`
      },
      {
        id: "l6",
        title: "Usando o PACERUNPRO no dia a dia",
        duration: "7 min",
        content: `## Seu fluxo diário no app

**De manhã:**
- Verifique a aba "Hoje" — qual treino foi programado
- Confira o ritmo alvo para cada sessão
- Leia os comentários do treinador

**Após o treino:**
- Registre o check-in (RPE, dor, fadiga, sono, humor)
- Se integrado ao Strava, a atividade é importada automaticamente

**Semanalmente:**
- Veja sua evolução na aba "Evolução"
- Confira a aderência ao plano e o volume acumulado

**Aba "Treinador":**
- Envie mensagens diretamente ao seu treinador
- Pergunte sobre adaptações, tire dúvidas, compartilhe conquistas

**Dica de ouro:** não pule o check-in. Ele é o canal de comunicação silencioso mais poderoso entre você e seu treinador.`
      },
    ],
  },

  {
    id: "nutricao-corredores",
    title: "Nutrição para Corredores de Rua",
    description: "Estratégias práticas de alimentação e hidratação para treinos, recuperação e dia de prova.",
    totalDuration: "38 min",
    level: "iniciante",
    category: "Saúde",
    color: "#46E0C8",
    for: "athlete",
    lessons: [
      {
        id: "l1",
        title: "Carboidratos: o combustível da corrida",
        duration: "8 min",
        content: `## Por que carboidratos são essenciais?

O músculo em atividade usa preferencialmente glicogênio — o carboidrato armazenado no músculo e no fígado. Quando o estoque acaba, a performance cai drasticamente (o famoso "bater na parede").

**Quando comer carboidratos:**
- **3–4h antes do treino:** refeição completa (arroz, massa, batata)
- **30–60 min antes:** se for treino longo, lanche leve (banana, barra energética)
- **Durante (>75 min):** 30–60g de carboidrato por hora (gel, fruta, isotônico)
- **Após o treino:** carboidrato + proteína nas primeiras 30–60 min

**Dica prática:** não faça treino intenso em jejum. Para rodagens leves pela manhã, uma banana é suficiente. Para um intervalado, coma uma refeição 2h antes.

**Sinal de glicogênio baixo:** você começa o treino bem e depois sente as pernas pesadas e a cabeça turva. Ajuste a alimentação pré-treino.`
      },
      {
        id: "l2",
        title: "Hidratação: mais que tomar água",
        duration: "8 min",
        content: `## Hidratação para corredores

**Quanto beber?**
A regra geral é 35–40ml por kg de peso corporal por dia — mas corredores perdem muito mais com o suor.

**Antes do treino:**
- 500ml de água nas 2h antes
- Urina clara = bem hidratado

**Durante o treino:**
- Até 60 min: água é suficiente
- Acima de 60 min: adicione eletrólitos (sódio, potássio, magnésio)
- Evite beber demais — hiponatremia (excesso de água) é real

**Após o treino:**
- Pesem-se antes e depois — cada 1kg perdido = 1,5L de reposição
- Inclua sal na refeição pós-treino para reter a água

**Sinais de desidratação:**
- Urina escura, câimbras, queda de ritmo, dor de cabeça
- Em climas quentes, a desidratação é mais rápida — aumente a atenção

**Eletrólitos:** o sódio é o principal. Bebidas isotônicas, água de coco e pastilhas de eletrólito são boas opções para treinos longos.`
      },
      {
        id: "l3",
        title: "Alimentação pré-treino e recuperação",
        duration: "7 min",
        content: `## Pré-treino: monte seu prato

**Refeição completa (3–4h antes):**
- 50–60% carboidrato (arroz, macarrão, batata)
- 25–30% proteína magra (frango, peixe, ovo)
- Pouca gordura (mais lenta para digerir)
- Pouca fibra (evita desconforto gastrointestinal)

**Lanche leve (30–60 min antes):**
- 1 banana com pasta de amendoim
- Barra de cereal simples
- Pão com mel

**Recuperação — a janela de oportunidade:**
Nas primeiras 30 minutos pós-treino, o músculo absorve nutrientes com muito mais eficiência.

**A fórmula:**
- 1g de carboidrato por kg de peso + 0,25–0,4g de proteína por kg
- Exemplo para 70kg: 70g de carbo + 20g de proteína
- Na prática: arroz com frango, iogurte com fruta, shake de proteína + banana

**Não pule a refeição pós-treino.** A recuperação acontece nessa janela — cortar nutrientes aqui prejudica a adaptação ao treino.`
      },
      {
        id: "l4",
        title: "Estratégia nutricional para provas",
        duration: "8 min",
        content: `## Nutrição no dia da prova

**Na véspera (carregamento):**
- Aumente o carboidrato 20–30% nas refeições do dia anterior
- Evite alimentos novos, gordurosos ou com muita fibra
- Hidrate bem durante o dia todo
- Jantar: macarrão, arroz ou batata — o clássico funciona

**Manhã da prova:**
- Café da manhã 2–3h antes da largada
- Carboidrato de fácil digestão + pouca proteína, quase nada de gordura
- Ex: pão branco com geleia e ovo, banana, aveia com mel
- Beba 300–500ml de água

**Durante a prova:**
- 5km: só água (se precisar)
- 10km: água + gel ou fruta no posto (se oferecer)
- 21km/42km: gel ou carboidrato a cada 30–45 min
- Não experimente nada novo no dia da prova

**Após a prova:**
- Festeje — você merece!
- Proteína e carboidrato nas primeiras horas
- Hidrate com eletrólitos pelo resto do dia`
      },
      {
        id: "l5",
        title: "Erros nutricionais mais comuns e como evitar",
        duration: "7 min",
        content: `## Erros que corredores cometem

**1. Comer muito pouco (underfueling)**
Síndrome de baixa disponibilidade de energia (RED-S): queda de performance, cansaço crônico, lesões frequentes, alterações hormonais. Se você sempre está com fome após os treinos, provavelmente está comendo pouco.

**2. Excesso de proteína, pouco carboidrato**
Dieta low-carb pode funcionar para saúde geral, mas prejudica performance em treinos intensos e provas. Carboidrato é insubstituível para intensidade.

**3. Testar novidades no dia da prova**
Gel novo, isotônico diferente, café quando não toma habitualmente — pode gerar desconforto gastrointestinal e arruinar a prova.

**4. Não comer pós-treino "para emagrecer"**
Cortar a refeição de recuperação prejudica a adaptação muscular e aumenta o catabolismo. Você treina menos e come menos → fica mais fraco, não mais leve.

**5. Ignorar micronutrientes**
Ferro (anemia é comum em corredoras), vitamina D, magnésio e ômega-3 têm impacto real na performance e recuperação. Faça exames periodicamente.`
      },
    ],
  },

  {
    id: "prevencao-lesoes",
    title: "Prevenção de Lesões e Recuperação",
    description: "Reconheça sinais de alerta, entenda as lesões mais comuns do corredor e saiba quando — e como — voltar ao treino.",
    totalDuration: "40 min",
    level: "iniciante",
    category: "Saúde",
    color: "#FF5A4D",
    for: "athlete",
    lessons: [
      {
        id: "l1",
        title: "Por que os corredores se machucam?",
        duration: "8 min",
        content: `## As causas reais de lesão

Estudos mostram que 70–80% das lesões em corredores são por **overuse** (sobrecarga) — não por má técnica ou calçado errado, mas por aumento de volume ou intensidade rápido demais.

**As 3 principais causas:**

**1. Aumento rápido de carga**
Regra dos 10%: nunca aumente volume semanal mais de 10% por semana. O PACERUNPRO monitora isso e gera alertas automáticos quando a carga semanal sobe muito rápido.

**2. Falta de recuperação**
Sono insuficiente, dias de descanso pulados e refeições de recuperação ignoradas. A adaptação acontece durante o descanso, não durante o treino.

**3. Variação excessiva de superfície ou calçado**
Mudança repentina de superfície (rua → trail) ou de tênis (com drop alto para zero-drop) sem adaptação progressiva.

**O que o PACERUNPRO faz para ajudar:**
Seus check-ins de dor e fadiga alimentam um motor que detecta padrões de risco e notifica seu treinador antes que a lesão aconteça.`
      },
      {
        id: "l2",
        title: "As lesões mais comuns e seus sinais",
        duration: "9 min",
        content: `## Lesões frequentes no corredor de rua

**Síndrome Iliotibial (IT band)**
- Onde dói: lateral do joelho
- Quando: geralmente km 8–10 em treinos longos
- Por quê: fraqueza de glúteos + aumento de volume
- O que fazer: descanso, fortalecimento de quadril

**Fasceíte plantar**
- Onde dói: calcanhar e base do pé, pior pela manhã
- Por quê: aumento de carga, falta de mobilidade no tornozelo
- O que fazer: alongamento de panturrilha, rolo, fisioterapia

**Síndrome Patelofemoral (joelho do corredor)**
- Onde dói: em volta da rótula, ao subir escadas
- Por quê: fraqueza de quadríceps e glúteos
- O que fazer: fortalecer cadeia posterior, reduzir volume

**Tendinopatia de Aquiles**
- Onde dói: tendão acima do calcanhar
- Sinais: rigidez pela manhã, dor no início do treino que melhora
- O que fazer: excêntrico de panturrilha, fisioterapia

**Regra de ouro:** dor que persiste após os primeiros 10 minutos de aquecimento, ou que piora durante o treino = pare e consulte um fisioterapeuta.`
      },
      {
        id: "l3",
        title: "Mobilidade, alongamento e rotina preventiva",
        duration: "8 min",
        content: `## Rotina preventiva para corredores

**5 minutos que fazem diferença — faça após cada treino:**

**1. Panturrilha (30 seg cada)**
Pé no degrau, calcanhar abaixado. Mantido + flexão de joelho para alcançar o sóleo.

**2. Quadríceps em pé (30 seg cada)**
Puxe o tornozelo para trás, joelhos alinhados.

**3. Flexores do quadril (30 seg cada)**
Posição de afundo, quadril empurrado para frente.

**4. Glúteos — figura 4 deitado (30 seg cada)**
Deitado de costas, pé sobre o joelho oposto.

**5. Mobilidade de tornozelo**
Joelho sobre o pé, 10 repetições cada lado. Fundamental para prevenir fasceíte e Aquiles.

**Quando NÃO alongar:**
- Antes do treino: aquecimento dinâmico (não estático) é melhor
- Com dor aguda: não force o músculo inflamado
- Após lesão recente: consulte o fisioterapeuta primeiro

**Rolo de espuma (foam roller):**
Panturrilha, IT band e glúteos — 60–90 seg em cada ponto doloroso. Não é massagem: pare no ponto de tensão e espere relaxar.`
      },
      {
        id: "l4",
        title: "Sono e recuperação: a parte do treino que você ignora",
        duration: "8 min",
        content: `## O treino acontece durante o sono

Enquanto você dorme, o corpo:
- Libera hormônio do crescimento (pico nas primeiras 2h)
- Repara fibras musculares danificadas pelo treino
- Consolida memória motora (melhora a economia de corrida)
- Regula cortisol e inflamação

**Corredores precisam de mais sono que sedentários:**
- 7–9h por noite é o mínimo para atletas amadores
- Cada hora a menos reduz a performance em ~3%
- Dormir pouco aumenta risco de lesão em até 65% (estudo AJSM 2012)

**Higiene do sono para atletas:**
- Horário consistente de dormir e acordar (inclusive fins de semana)
- Quarto escuro e fresco (18–20°C é ideal)
- Sem tela 60 min antes de dormir (a luz azul suprime melatonina)
- Evite cafeína após 14h
- Não treine forte após 20h

**O check-in de sono do PACERUNPRO** detecta quando você está acumulando déficit de sono e avisa seu treinador para ajustar a carga.`
      },
      {
        id: "l5",
        title: "Voltando ao treino após lesão ou pausa",
        duration: "7 min",
        content: `## O protocolo de retorno seguro

**A regra de ouro:** você volta ao nível de treino que estava ANTES da lesão/pausa — não de onde parou.

**Quanto tempo fora → quanto tempo para voltar:**
- 1–2 semanas: perda mínima, volte com 80% do volume
- 3–4 semanas: perda de ~5–7% de VO₂, volte com 60–70%
- 6–8 semanas: reduza volume em 50%, aumente 10% por semana
- >3 meses: recomeço quase do zero (seguro para joelhos e tendões)

**Sinais de que você pode progredir:**
- Treino sem dor durante e após
- Sem rigidez no dia seguinte
- RPE de esforço normal para o ritmo

**Sinais de que é cedo demais:**
- Dor durante ou após o treino
- Compensação de passada (você está mudando a mecânica para evitar a dor)
- Insônia, irritabilidade, desânimo

**Use o PACERUNPRO nesse processo:**
Registre seus check-ins honestamente. Seu treinador recebe os dados e pode ajustar o retorno em tempo real, sem você precisar esperar a próxima consulta.`
      },
    ],
  },

  {
    id: "preparacao-mental",
    title: "Preparação Mental para Corredores",
    description: "A corrida começa na cabeça. Ferramentas de psicologia esportiva para treinar mais forte e correr mais inteligente.",
    totalDuration: "28 min",
    level: "intermediário",
    category: "Psicologia",
    color: "#B78BFF",
    for: "athlete",
    lessons: [
      {
        id: "l1",
        title: "Mindset de treinamento: o que separa quem evolui",
        duration: "7 min",
        content: `## O que diferencia corredores que progridem

Não é talento nato. É consistência + mentalidade de crescimento.

**Mindset fixo vs. de crescimento:**
- Fixo: "não sou feito para isso", "não tenho talento"
- Crescimento: "ainda não aprendi", "posso melhorar com treino"

**3 hábitos mentais dos corredores que evoluem:**

**1. Foco no processo, não no resultado**
Um treino ruim é dado — você aprende mais dele do que dos bons. Anote o que foi diferente (sono, alimentação, stress) e use esse dado.

**2. Comparação só consigo mesmo**
Seu VDOT de hoje vs. seu VDOT de 3 meses atrás. A evolução é individual — comparar com outros distorce a percepção real de progresso.

**3. Tolerância à desconforto (não à dor)**
Desconforto (zona T, I) é necessário e bom. Dor (lesão em desenvolvimento) é um sinal para parar. Aprenda a distinguir os dois.

**Use o PACERUNPRO para isso:**
A aba "Evolução" mostra sua progressão real em dados. Quando a voz interna diz "não estou evoluindo", os números contam a verdade.`
      },
      {
        id: "l2",
        title: "Estratégia de prova: como não estourar nos primeiros km",
        duration: "7 min",
        content: `## O erro mais caro: sair rápido demais

Em toda prova, a adrenalina da largada faz você sair 10–15% mais rápido do que deveria. Nas primeiras semanas de junho isso parece ótimo. Na metade da prova, você paga o preço.

**Estratégia de pace negativo:**
Largue um pouco mais devagar do que seu pace alvo. Acelere progressivamente. Chegue forte.

**Como calcular seu pace alvo:**
- Use a calculadora de provas no PACERUNPRO (baseada no seu VDOT)
- Adicione 10–15 seg/km nos primeiros 5km para segurança

**Divisão de prova para 10km:**
- km 1–3: 10–15 seg/km mais devagar que alvo
- km 4–7: no pace alvo
- km 8–10: acelere se ainda tiver gas

**Gestão de subidas:**
Em subidas, mantenha o ESFORÇO (RPE), não o pace. É normal o pace cair na subida — forçar o pace é o maior desperdício de energia.

**Zona de dor nos últimos 2km:**
Normal e esperado. Foque no próximo km, não no final. Segmente mentalmente a prova.`
      },
      {
        id: "l3",
        title: "Lidando com o muro e a crise mental",
        duration: "7 min",
        content: `## O que é o muro — e como atravessar

O muro (especialmente na maratona entre km 30–35) é a combinação de glicogênio baixo + acúmulo de fadiga + o cérebro calculando o custo-benefício de continuar.

**Sinais que o muro está chegando:**
- Pensamentos negativos em loop
- Vontade de parar que nunca estava lá antes
- Pernas pesadas mesmo em ritmo mais lento
- Incapacidade de fazer math simples (literalmente)

**Técnicas para atravessar:**

**1. Segmentação:** não pense no km 42. Pense no próximo marcador. "Só preciso chegar naquela placa."

**2. Mantra pessoal:** uma frase curta, poderosa, sua. "Mais um passo." "Eu consigo." "Eu treinei para isso."

**3. Dissociação:** tire o foco da fadiga. Observe o ambiente, ouça a torcida, pense em algo agradável.

**4. Associação:** aceite a dor. "Isso dói mas não está me matando. Meu corpo está me dizendo que está trabalhando."

**5. Comida/gel:** se ainda não tomou um gel, tome agora. A glicose leva 10–15 min para agir mas muda tudo.

**Prevenção é melhor:** estratégia nutricional correta e pace conservador evitam o muro na maioria das provas.`
      },
      {
        id: "l4",
        title: "Celebrando a evolução — não só o resultado",
        duration: "7 min",
        content: `## Redefinindo o que é sucesso

A armadilha do corredor: só celebra quando bate o PR (personal record). O que acontece? 80% dos treinos viram "fracasso".

**Redefina vitória:**
- Treino realizado com intensidade certa = vitória
- PR de 5km = vitória
- Completar um treino duro numa semana difícil = vitória
- Fazer o check-in todos os dias = vitória
- Chegar na linha de chegada de uma prova = vitória

**Use o PACERUNPRO para celebrar dados:**
- VDOT subiu 2 pontos em 3 meses? Isso representa minutos numa prova
- Adesão ao plano >85% por 4 semanas? Isso é disciplina real
- Volume semanal dobrou em 6 meses sem lesão? Isso é gestão inteligente

**A jornada importa tanto quanto a chegada:**
Corredores que duram anos no esporte são os que encontram prazer no processo — no treino da manhã fria, na conversa no grupo de corrida, na sensação de terminar um longão.

**Compartilhe com seu treinador:**
A mensagem "estou evoluindo" ou "estou lutando" via chat do PACERUNPRO cria uma relação mais forte e uma prescrição mais humana.`
      },
    ],
  },

  // ── COACH COURSES ──────────────────────────────────────────────────────────

  {
    id: "metodologia-vdot",
    title: "Metodologia VDOT de Jack Daniels",
    description: "Domine a ciência por trás das zonas de treino, aprenda a calcular e progredir o VDOT dos seus atletas e elimine a adivinhação da prescrição.",
    totalDuration: "65 min",
    level: "intermediário",
    category: "Metodologia",
    color: "#C6F24E",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "A ciência do VDOT: VO₂máx e performance",
        duration: "10 min",
        content: `## Da fisiologia à pista

**VO₂máx** é o volume máximo de oxigênio que o organismo consegue utilizar por minuto por kg de peso corporal (mL/kg/min). É o principal limitador de performance aeróbica.

**O problema do VO₂máx clínico:**
- Exige laboratório, equipamento caro e teste exaustivo
- Resultados variam com o protocolo e o dia
- Não captura a economia de corrida (eficiência)

**A solução de Daniels: VDOT**
Jack Daniels percebeu que corredores com mesmo VO₂máx podem ter performances diferentes. Criou o VDOT (V-dot = VO₂máx derivado de desempenho) como um índice composto de:

1. Capacidade aeróbica (VO₂máx)
2. Economia de corrida (eficiência do movimento)
3. Fração de utilização (% do VO₂máx sustentável)

**Por que VDOT é superior para prescrição:**
- Calculado de qualquer prova recente
- Captura como o atleta realmente corre
- Atualizado em tempo real à medida que o atleta evolui

**Fórmula simplificada (Daniels & Gilbert, 1979):**
VDOT é tabelado a partir de tempo × distância. O PACERUNPRO aplica as fórmulas originais automaticamente.`
      },
      {
        id: "l2",
        title: "Calculando e atualizando o VDOT",
        duration: "9 min",
        content: `## Prova de referência: escolhendo o dado certo

**Melhores distâncias para calcular VDOT:**
- 5km: ótima para iniciantes e intermediários
- 10km: a mais confiável para a maioria dos atletas
- 21km: use apenas se foi uma prova bem executada (sem problemas nutricionais, climáticos ou de pace)
- Maratona: tende a subestimar o VDOT real (muitos fatores externos)

**Quando atualizar:**
- Após cada prova cronometrada relevante
- Após melhora perceptível no pace de treino
- A cada 6–8 semanas no mínimo (atletas que treinem consistentemente evoluem)

**VDOT e condições ambientais:**
- Calor (>24°C) reduz performance ~5% → descontar antes de usar
- Altitude reduz performance ~2% por 300m acima de 1500m
- Vento forte e percurso com subidas → não use para calcular VDOT

**No PACERUNPRO:**
Acesse Prescrição de Corrida → informe a distância e o tempo → o sistema calcula o VDOT e já exibe os paces de treino para cada zona. Você pode salvar e vincular ao perfil do atleta.`
      },
      {
        id: "l3",
        title: "As 5 zonas de Daniels na prática",
        duration: "12 min",
        content: `## Prescrevendo com intenção

Cada zona tem um estímulo fisiológico específico. Prescrever sem saber a zona é como dar uma receita sem dosagem.

**Zona E — Easy**
- % VO₂máx: 59–74%
- FC: 65–79% FC máx
- Adaptação: capilarização muscular, mitocôndrias, economia
- Volume: 70–80% do volume total semanal
- Erro comum: atletas correm E muito rápido → volume insustentável

**Zona M — Maratona**
- % VO₂máx: 75–84%
- Para atletas que competem em maratona ou fazem longões longos
- Não é obrigatória para todos os atletas

**Zona T — Limiar**
- % VO₂máx: 83–88%
- Adapta o clearance de lactato → empurra o limiar para cima
- Dose máxima: 10% do volume semanal (Daniels)
- Formatos: Tempo Run (20–30 min contínuos) ou Cruise Intervals (tiros de T com pouco descanso)

**Zona I — Interval**
- % VO₂máx: 97–100%
- Estímulo de VO₂máx → aumenta o "teto" aeróbico
- Tiros de 3–5 min, recuperação igual ou maior ao esforço
- Volume: não mais que 8% da semana

**Zona R — Repetição**
- 100%+ VO₂máx, anaeróbio
- Melhora economia, velocidade, mecânica
- Tiros de 200–400m, recuperação longa (2–3x o tempo do tiro)`
      },
      {
        id: "l4",
        title: "Progressão de VDOT ao longo da temporada",
        duration: "10 min",
        content: `## Como o VDOT evolui — e o que esperar

**Taxa de evolução por nível:**
- Iniciante (VDOT 30–40): +2–5 pontos em 12–16 semanas de treino consistente
- Intermediário (VDOT 40–50): +1–3 pontos por ciclo
- Avançado (VDOT 50+): +0,5–1 ponto por ciclo (ganhos menores, mais difíceis)

**Quando o VDOT não sobe:**
1. Volume insuficiente (menos de 3 sessões/semana)
2. Todas as sessões em Zona E (sem estímulo de T/I)
3. Overtraining (muito volume/intensidade, recuperação insuficiente)
4. Problemas não esportivos: sono ruim, stress, déficit calórico
5. Adaptação: o atleta atingiu seu teto individual temporário

**Usando o VDOT como balizador da periodização:**
- Fase de Base: mantém VDOT atual (80% E, 10% M, 10% T)
- Fase de Construção: busca subir o VDOT (+T, +I)
- Fase Específica: trabalha próximo do VDOT alvo para prova
- Taper: preserva o VDOT, reduz volume

**Dica prática:** use a prova no PACERUNPRO para projetar o tempo alvo com o VDOT atual e ajustar o planejamento.`
      },
      {
        id: "l5",
        title: "Erros comuns na prescrição baseada em VDOT",
        duration: "12 min",
        content: `## Os 7 erros que treinadores iniciantes cometem

**1. Usar VDOT de prova mal executada**
Atleta saiu rápido demais, bateu na parede — o tempo não reflete a capacidade. Use provas bem executadas ou deduza pelo pace de treino.

**2. Prescrever todo treino em Zona T ou I**
"Mais intensidade = mais resultado" é o maior mito. Sem volume de base (E), o atleta não aguenta as semanas seguintes. 80% E é uma regra, não sugestão.

**3. Não ajustar para o calor**
35°C? Desacelere 15–20 seg/km nas zonas E e T. Forçar o pace alvo em calor intenso é overreaching garantido.

**4. Confundir E com "treino fácil"**
E é fácil em ritmo, não em comprometimento. Um longão de 90 min em E é um treino sério com objetivo fisiológico claro. Não é "qualquer coisa".

**5. Não atualizar o VDOT**
Atleta evolui, mas você ainda prescreve pelo VDOT de 3 meses atrás. O pace de treino fica subestimado → estímulo insuficiente.

**6. Ignorar a recuperação entre zonas**
I e R requerem recuperação completa entre tiros. Reduzir o descanso para parecer mais intenso destrói a qualidade da sessão.

**7. VDOT sem contexto de vida**
Semana de muita stress no trabalho, filho doente, viagem? Reduza a intensidade. VDOT é um guia — o atleta não é uma máquina.`
      },
      {
        id: "l6",
        title: "VDOT no PACERUNPRO: tutorial completo",
        duration: "12 min",
        content: `## Usando a ferramenta de ponta a ponta

**1. Acessando a calculadora**
Menu → Prescrição de corrida → aba VDOT/Paces

**2. Calculando o VDOT**
- Insira a distância da prova (5km, 10km, 21km, 42km ou distância customizada)
- Insira o tempo no formato MM:SS
- O VDOT é calculado automaticamente

**3. Vendo os paces por zona**
A tabela exibe para cada zona (E, M, T, I, R):
- Pace mais lento e mais rápido (min/km)
- Frequência cardíaca aproximada
- Descrição do esforço

**4. Salvando no perfil do atleta**
Clique em "Salvar VDOT" → o valor é vinculado ao atleta e usado em relatórios de evolução.

**5. Prescrevendo com os paces**
Ao criar um treino de corrida, selecione a zona → o pace alvo é preenchido automaticamente com base no VDOT salvo.

**6. Acompanhando a evolução**
Na tela do atleta, o histórico de VDOT é exibido em gráfico. Você vê a evolução trimestral e pode ajustar o próximo ciclo de periodização.

**7. Alertas de desalinhamento**
Se o atleta registrar check-ins com RPE muito acima ou abaixo do esperado para a zona, o sistema sinaliza → pode indicar VDOT desatualizado ou problema externo.`
      },
    ],
  },

  {
    id: "periodizacao-avancada",
    title: "Periodização Avançada para Corrida",
    description: "Domine o design de macrociclos, a distribuição de fases e a criação de microciclos que produzem supercompensação real.",
    totalDuration: "68 min",
    level: "avançado",
    category: "Metodologia",
    color: "#3FA7FF",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Princípios de periodização: por que você precisa deles",
        duration: "11 min",
        content: `## Os princípios que guiam a periodização

**Princípio da Sobrecarga Progressiva**
Para que haja adaptação, o estímulo deve ser progressivamente maior que o que o corpo já suporta. Mas tem um limite — a curva de dose-resposta é uma invertida U.

**Princípio da Especificidade**
O corpo se adapta ao estímulo exato que recebe. Um atleta de 10km precisa de treinos diferentes de um maratonista, mesmo com o mesmo VDOT.

**Princípio da Reversibilidade**
Ganhos são perdidos sem estímulo. 2 semanas sem treino → ~10% de queda no VO₂máx. Depois de 3 meses, quase todo o ganho é perdido.

**Princípio da Individualidade**
Dois atletas com mesmo VDOT podem responder de forma muito diferente ao mesmo volume. Resposta ao treino é parcialmente genética.

**Princípio da Supercompensação**
O pico de adaptação não ocorre durante o treino, mas 24–72h após — quando o corpo "soberpaga" a recuperação e fica mais forte que antes do estímulo.

**Como a periodização usa esses princípios:**
A periodização organiza o treinamento para maximizar a supercompensação no momento certo — o dia da prova — enquanto evita o overtraining ao longo do caminho.`
      },
      {
        id: "l2",
        title: "Design do macrociclo: do objetivo à estrutura",
        duration: "12 min",
        content: `## Como desenhar um macrociclo

**Passo 1: O objetivo ancora tudo**
Data da prova, distância e meta de tempo. O macrociclo é construído de trás para frente a partir da data da prova.

**Passo 2: Definindo o número de semanas**
- 5km/10km: 8–12 semanas de ciclo específico
- 21km: 12–16 semanas
- 42km: 16–20 semanas
- Ultra: 20–24+ semanas

**Passo 3: Distribuição das fases**
Para um ciclo de 16 semanas (21km):
- **Base (sem 1–5):** 5 semanas — volume crescente, 80% E, 10% T
- **Construção (sem 6–10):** 5 semanas — introduce I, aumenta T, volume pico
- **Específico (sem 11–14):** 4 semanas — pace de prova, treinos específicos
- **Taper (sem 15–16):** 2 semanas — redução 30–40% volume, mantém intensidade

**Passo 4: Semanas de descarga (deload)**
Regra do 3+1: a cada 3 semanas de carga, 1 semana com 30–40% menos volume. Algumas atletas (mulheres, mais velhos, iniciantes) se beneficiam de 2+1.

**No PACERUNPRO:**
Periodização → preencha objetivo, nível, duração → o sistema distribui as fases automaticamente, já incluindo as semanas de descarga. Você ajusta manualmente depois.`
      },
      {
        id: "l3",
        title: "Fases de treinamento: Base, Construção, Específico, Taper",
        duration: "14 min",
        content: `## Cada fase tem seu propósito fisiológico

**FASE BASE**
Objetivo: adaptar tendões, ossos e músculos ao volume. Construir a "base aeróbica".

Características:
- Volume cresce semana a semana
- 75–80% Zona E, 10–15% T, pouco ou nada de I
- Strides (aceleradas curtas de 20 seg) no final das rodagens — mantêm economia
- Treino de força: essencial nessa fase (fortalecimento geral)

Erros comuns: incluir muito I cedo — o atleta não tem base para aguentar semanas seguintes.

---

**FASE DE CONSTRUÇÃO**
Objetivo: elevar o VDOT, trabalhar o limiar, introduzir volume de I.

Características:
- Volume no pico (ou próximo)
- 65% E, 15% T, 10% I, 10% M/R
- Treino mais longo e específico da semana
- Strides continuam

Erros comuns: exceder 10% de I — o risco de overreaching é real.

---

**FASE ESPECÍFICA**
Objetivo: simular as condições de prova, afiar a velocidade de competição.

Características:
- Volume começa a cair (~10%)
- Treinos no pace de prova (M para maratona, T/I para 10km)
- Simule condições reais (hora do dia, terreno, nutrição)

---

**FASE TAPER**
Objetivo: chegar descansado mas não destreinado.

Características:
- Volume cai 30–50% (dependendo da distância)
- Intensidade se MANTÉM — não reduza o pace dos treinos
- Sono prioridade máxima
- Muitos atletas sentem "pesados" no taper — normal, é adaptação`
      },
      {
        id: "l4",
        title: "Semanas de descarga e supercompensação",
        duration: "11 min",
        content: `## A arte da descarga inteligente

**Por que o deload é obrigatório, não opcional:**
Sem semanas de descarga, o atleta acumula fadiga residual que mascara as adaptações. A supercompensação não acontece sob fadiga crônica — ela requer recuperação.

**Protocolo de deload padrão:**
- Volume: -30 a -40%
- Intensidade: mantida (não reduza o pace dos treinos)
- Número de sessões: pode reduzir 1 sessão
- Sono e nutrição: prioridade máxima

**Sinais de que o atleta precisava da descarga:**
- Nas primeiras 2 dias se sente "pesado" e lento
- Na metade da semana começa a sentir as pernas voltando
- No fim da semana se sente melhor do que antes da descarga
→ Esse é o sinal clássico de supercompensação acontecendo

**Descarga individualizada:**
- Atletas mais velhos (45+) se beneficiam de deload mais frequente (2+1)
- Atletas com alto stress de vida precisam de deload mais profundo
- Atletas muito bem recuperados podem fazer 4+1

**No PACERUNPRO:**
O sistema insere semanas de descarga automaticamente na periodização. Você pode ver quais são pelas semanas com volume reduzido na visualização de microciclos.`
      },
      {
        id: "l5",
        title: "Gerenciando múltiplos atletas com objetivos diferentes",
        duration: "10 min",
        content: `## O desafio do treinador: 15 atletas, 15 ciclos

**Estratégia 1: Calendário de provas**
Agrupe atletas com provas próximas na mesma fase. 3 atletas correndo o mesmo 10km → todos fazem Taper na mesma semana → você otimiza comunicação.

**Estratégia 2: Templates de semana**
Crie templates de semana por fase (Base padrão para atleta intermediário, Construção para avançado). Aplique e personalize.

**Estratégia 3: Alertas como triagem**
Use os alertas do PACERUNPRO como seu radar. Em vez de verificar 15 atletas diariamente, você age nos que o sistema sinalizou.

**Estratégia 4: Check-in como filtro**
Atletas com check-in ruim (RPE alto, dor, fadiga) recebem atenção primeiro. Os demais, revisão semanal.

**Como priorizar seu tempo:**
- Atletas em risco (vermelho): contato imediato
- Atletas em atenção (amarelo): revisar nessa semana
- Atletas ativos (verde): revisão semanal suficiente

**No PACERUNPRO:**
O dashboard do treinador já faz essa triagem automaticamente. A lista de "atletas em risco" é o ponto de partida do seu dia.`
      },
      {
        id: "l6",
        title: "Gerando e ajustando periodizações no PACERUNPRO",
        duration: "10 min",
        content: `## Tutorial: do clique à semana prescrita

**1. Acessar a ferramenta**
Menu → Periodização

**2. Configurar o macrociclo**
- Objetivo: 5km / 10km / 21km / 42km / Ultra
- Nível: iniciante / intermediário / avançado
- Duração: 8 a 24 semanas
- Semanas de descarga: automático (pode ajustar)

**3. Gerar**
Clique em "Gerar periodização" → o sistema distribui as fases, calcula volumes por semana e insere os deloads.

**4. Visualizar e entender a estrutura**
Você vê uma grade semanal com:
- Fase (Base/Construção/Específico/Taper)
- Volume planejado (km)
- Intensidade relativa (%)
- Se é semana de descarga

**5. Ajustar manualmente**
Clique em qualquer semana para editar:
- Volume (km)
- Intensidade (%)
- Número de sessões
- Notas da semana

**6. Salvar e vincular ao atleta**
Salve → selecione o atleta → as semanas são liberadas no calendário do atleta.

**Dica:** crie a estrutura base aqui e refine os treinos específicos na tela do atleta semana a semana.`
      },
    ],
  },

  {
    id: "gestao-carga",
    title: "Gestão de Carga e Prevenção de Overtraining",
    description: "Domine a relação de carga aguda:crônica, interprete os check-ins dos atletas e use os alertas do sistema para prevenir lesões antes que aconteçam.",
    totalDuration: "52 min",
    level: "intermediário",
    category: "Fisiologia",
    color: "#FFB020",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Carga de treino (UA): o método de Foster",
        duration: "10 min",
        content: `## Session-RPE: a forma mais prática de quantificar carga

**O método de Carl Foster:**
Carga (UA) = Duração da sessão (minutos) × RPE (1–10)

**Por que funciona:**
É simples, não requer equipamento, e captura tanto o volume quanto a intensidade. Estudos mostram correlação de 0,85+ com métodos mais sofisticados (TRIMP, TSS).

**Carga semanal = soma de todas as sessões da semana:**
- Rodagem 60 min, RPE 5 → 300 UA
- Intervalado 45 min, RPE 8 → 360 UA
- Total semana → 660 UA

**Interpretando os números:**
- <300 UA/semana: muito baixo para maioria dos corredores
- 300–600 UA: faixa de manutenção
- 600–1000 UA: treino moderado
- 1000–1400 UA: alto volume (atletas experientes)
- >1400 UA: risco de overreaching

**Esses números variam muito por atleta.** O importante é a progressão relativa — não o número absoluto.

**No PACERUNPRO:**
O dashboard mostra a carga semanal de cada atleta calculada automaticamente com base nos check-ins de RPE e duração.`
      },
      {
        id: "l2",
        title: "ACWR: relação de carga aguda e crônica",
        duration: "11 min",
        content: `## A métrica de lesão mais importante da fisiologia do esporte

**ACWR = Carga Aguda / Carga Crônica**

- Carga Aguda (CTa): carga da última semana
- Carga Crônica (CTc): média das últimas 4 semanas (ou 6 semanas)
- ACWR = CTa / CTc

**A "zona de perigo":**
- ACWR < 0,8: atleta destreinando, fitness em queda
- ACWR 0,8–1,3: zona segura (sweet spot)
- ACWR 1,3–1,5: risco aumentado de lesão
- ACWR > 1,5: zona de risco alto — muito mais carga do que o corpo está acostumado

**O estudo de Hulin et al. (2016):**
Atletas com ACWR >1,5 têm 2–4x mais risco de lesão nas semanas seguintes.

**Aplicação prática:**
Se um atleta estava doente e fez carga zero por 2 semanas, sua carga crônica caiu. Voltar para a mesma carga da semana antes da doença → ACWR pode explodir para 2,0+.

**No PACERUNPRO:**
O sistema calcula o ACWR automaticamente e sinaliza quando ultrapassa 1,3. Isso é um dos principais gatilhos dos alertas automáticos.`
      },
      {
        id: "l3",
        title: "Lendo os check-ins: o que os números dizem",
        duration: "11 min",
        content: `## Interpretando os 5 indicadores de check-in

**RPE (esforço percebido):**
- RPE muito acima do esperado para a zona → pode indicar overreaching, destreinamento, doença incipiente
- RPE muito abaixo → atleta melhorou (atualize o VDOT) ou foi muito conservador

**Dor (1–10):**
- 1–3: dor muscular normal pós-treino (DOMS)
- 4–6: atenção — monitore nos próximos dias
- 7+: contate o atleta imediatamente. Dor alta por 3 dias consecutivos → alerta crítico

**Fadiga (1–10):**
- Fadiga crescente por 5+ dias sem queda → overreaching em desenvolvimento
- Fadiga que não melhora após deload → pode ser síndrome de overtraining (rara, mas real)

**Sono:**
- Sono ruim por 3+ noites → sistema imune comprometido, recuperação lenta
- Sono ruim antes de competição → considere reduzir a semana de taper

**Humor:**
- Humor cronicamente baixo + fadiga alta = sinal clássico de overtraining
- Humor baixo isolado pode ser estressor externo (trabalho, relacionamento)

**Padrões que requerem ação imediata:**
- RPE >8 em treino de Zona E por 3 dias
- Dor ≥7 por mais de 2 dias
- Fadiga ≥8 combinada com humor ≤3
- Queda de sono + queda de humor por 1 semana`
      },
      {
        id: "l4",
        title: "Alertas inteligentes: como agir rápido",
        duration: "10 min",
        content: `## Os alertas do PACERUNPRO

O sistema gera 3 níveis de alerta com base nos check-ins e nos dados de carga:

**🔴 Crítico — ação imediata:**
- Ausência de check-in por 5+ dias
- Dor ≥7 por 3 dias consecutivos
- ACWR > 1,5 na semana
- RPE crônico >8 em sessões de Zona E

Ação sugerida: contate o atleta HOJE. Reduza a carga da semana atual. Avalie se precisa de descanso completo.

**🟡 Atenção — agir nessa semana:**
- FC em treinos de E subindo sem razão aparente
- Adesão ao plano abaixo de 65%
- Volume realizado <30% do prescrito
- Sono ruim por 3+ noites

Ação sugerida: mensagem de acompanhamento, ajuste de carga semanal, conversa sobre fatores externos.

**🔵 Informativo — celebrate:**
- Novo PR de pace em Zona E
- VDOT subiu
- 4 semanas de adesão >85%
- Volume semanal recorde sem sintomas negativos

Ação sugerida: reconheça a evolução. Compartilhe com o atleta.

**Fluxo de trabalho recomendado:**
1. Abra o dashboard → cheque os alertas críticos primeiro
2. Mensagens pendentes (aba Mensagens)
3. Revisão semanal dos atletas em atenção`
      },
      {
        id: "l5",
        title: "Ajuste dinâmico de carga: quando e como intervir",
        duration: "10 min",
        content: `## A arte da prescrição adaptativa

**O plano é o ponto de partida, não a lei.**

A periodização que você criou foi baseada em dados iniciais. A realidade do atleta muda — e você precisa adaptar em tempo real.

**Cenários e respostas:**

**Atleta fez uma prova inesperada no meio do ciclo:**
→ Reduza a semana seguinte em 30–40%. Trate como uma semana de descarga.

**Atleta viajou e não treinou por 1 semana:**
→ ACWR vai cair (crônica mantém, aguda cai). Semana de retorno com 60–70% do volume anterior.

**Atleta está em período de stress intenso no trabalho:**
→ Reduza volume em 20–30%, mantenha uma sessão de qualidade por semana. Volume alto + stress crônico = risco alto.

**Atleta superou as expectativas (pace muito abaixo do VDOT):**
→ Atualize o VDOT. Recalcule os paces. Adicione uma sessão de qualidade se a recuperação permitir.

**Atleta com dor leve mas insistindo em treinar:**
→ Substitua treinos de impacto por bike, natação ou treino aquático. Mantenha estímulo cardiorrespiratório sem impacto.

**Ferramenta-chave no PACERUNPRO:**
A tela de edição de semana permite ajustar volume, intensidade e sessões individualmente — sem precisar refazer toda a periodização.`
      },
    ],
  },

  {
    id: "captacao-atletas",
    title: "Captação e Retenção de Atletas",
    description: "Do funil de vendas ao CRM — estratégias para atrair novos atletas, fechar contratos e manter sua assessoria crescendo de forma sustentável.",
    totalDuration: "48 min",
    level: "iniciante",
    category: "Negócio",
    color: "#46E0C8",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Posicionamento: quem é o seu atleta ideal?",
        duration: "9 min",
        content: `## O nicho que você domina vale mais do que tudo

**O erro mais caro:** tentar atender a todos.
O treinador que atende "corredor de qualquer distância, qualquer nível" compete com todos. O que atende "mulheres 35–50 anos que querem correr a primeira meia maratona" tem um nicho defendível.

**Defina o seu atleta ideal (avatar):**
- Faixa etária
- Objetivo (distância, tempo, emagrecimento)
- Nível atual (iniciante, intermediário, avançado)
- Disponibilidade (treinos/semana, tempo por treino)
- Orçamento médio

**Por que o nicho importa:**
- Sua comunicação fica específica → taxa de conversão maior
- Você se torna a referência para esse grupo → indicações espontâneas
- Você pode cobrar mais → quem é especialista cobra caro

**Exemplos de nichos rentáveis:**
- Corredores acima de 50 anos (saúde + longevidade)
- Preparação para primeira maratona
- Emagrecimento + corrida (dueto muito demandado)
- Atletas de elite sub-regional (runners que buscam performance real)

**Como o PACERUNPRO ajuda:**
Sua página pública é a vitrine do seu nicho. Foto, bio e planos devem refletir exatamente quem você quer atrair.`
      },
      {
        id: "l2",
        title: "Sua página pública e a isca digital",
        duration: "10 min",
        content: `## A isca digital: a ferramenta de captação mais eficaz

**O que é uma isca digital?**
Um conteúdo de alto valor entregue gratuitamente em troca do contato do lead. Funciona porque resolve uma dor específica antes de qualquer venda.

**Exemplos de isca para treinadores de corrida:**
- "Plano de 4 semanas para correr seu primeiro 5km"
- "Calculadora gratuita: descubra seu VDOT"
- "Guia completo de nutrição para corredor de rua"
- "Checklist: 10 sinais de que você está pronto para a meia maratona"

**Como funciona no PACERUNPRO:**
CRM de leads → configure sua isca digital → copie o link → divulgue no Instagram, WhatsApp, Stories.

Quem preencher o formulário → entra automaticamente no seu funil (coluna "Novo Lead") sem você precisar cadastrar manualmente.

**Sua página pública:**
Configure em Minha Página Pública:
- Foto profissional
- Bio com credenciais e nicho
- Planos disponíveis com preços
- Depoimentos de atletas (quando disponível)
- Botão de contato / agendamento

**A combinação isca digital + página pública é o seu funil automatizado.**`
      },
      {
        id: "l3",
        title: "O funil de vendas: do lead ao contrato",
        duration: "10 min",
        content: `## As 4 etapas do funil de vendas para treinadores

**Etapa 1: Novo Lead**
O lead entrou pelo formulário da isca ou via indicação.
Ação: envie a isca prometida em < 24h. Personalize a mensagem — use o nome.

**Etapa 2: Em contato**
Você iniciou conversa. O lead respondeu.
Ação: qualifique o lead com 3 perguntas:
- "Qual é seu objetivo principal com a corrida?"
- "Você já treina ou está começando agora?"
- "O que te impediu de ter um treinador até agora?"

As respostas definem se ele é o seu cliente ideal e qual plano recomendar.

**Etapa 3: Proposta enviada**
Você enviou a proposta (plano + preço + o que está incluso).
Ação: dê 48h de prazo. Pergunte: "Alguma dúvida sobre a proposta?"
Não persiga — leads qualificados decidem rápido.

**Etapa 4: Ganho / Perdido**
Ganho: cliente entra para a assessoria.
Perdido: registre o motivo no CRM (preço, concorrência, não era o momento). Dados para melhorar sua abordagem.

**No PACERUNPRO:**
Arraste os cards no CRM Kanban de etapa em etapa. O sistema registra tempo em cada etapa e taxa de conversão.`
      },
      {
        id: "l4",
        title: "Retenção: por que atletas saem e como evitar",
        duration: "9 min",
        content: `## Os 5 motivos de churn mais comuns

**1. Falta de evolução percebida**
O atleta treina por 3 meses e sente que "não melhorou". Mas ele melhorou — você só não mostrou.

**Solução:** use a aba de evolução do PACERUNPRO para mostrar dados concretos: VDOT subiu de 42 para 45, volume semanal dobrou de 25km para 50km sem lesão. Apresente resultados mensalmente.

**2. Falta de comunicação**
O atleta sente que é apenas um número. Treinos chegam, dúvidas ficam sem resposta rápida.

**Solução:** use o chat integrado do PACERUNPRO. Responda em <12h nos dias úteis. Uma mensagem personalizada por semana ("vi que você mandou muito bem no longão de quinta") vale mais que qualquer feature.

**3. Preço**
"Achei mais barato." Geralmente não é sobre preço — é sobre valor percebido.

**Solução:** educa o cliente sobre o que você entrega. Check-in diário, ajuste semanal de carga, prevenção de lesão, VDOT personalizado. Quanto vale evitar 3 meses de fisioterapia?

**4. Vida pessoal**
Trabalho, filhos, viagem. Não tem muito a fazer — mas uma pausa flexível retém mais do que um cancelamento.

**Solução:** ofereça pausa de até 30 dias para atletas de longa data. É melhor que perder para sempre.

**5. Objetivo atingido**
O atleta correu a maratona. Agora o que?

**Solução:** já planeje a próxima meta antes da prova. "Depois da maratona, que tal a meia do ano que vem, mas mais rápida?"`
      },
      {
        id: "l5",
        title: "Indicações: seu canal de aquisição mais barato",
        duration: "10 min",
        content: `## O poder do boca a boca estruturado

**A realidade:** 60–70% dos clientes de treinadores vêm por indicação. E indicados convertem 3x mais rápido e ficam mais tempo.

**Como ativar indicações ativamente:**

**1. Peça (na hora certa)**
Momento ideal: logo após uma conquista do atleta (prova, PR, evolução clara).
"Fico muito feliz com sua evolução! Você conhece alguém que também quer começar a correr?"

**2. Programa de indicação**
"Se você indicar um amigo que assinar qualquer plano, você ganha 1 mês gratuito."
Simples, claro e funciona.

**3. Conteúdo que o atleta compartilha**
Quando você gera relatórios visuais, certificados de evolução ou badges de conquista → o atleta compartilha nas redes → exposição gratuita.

**4. Grupos e comunidades**
Crie um grupo de WhatsApp ou Discord dos seus atletas. Comunidade cria pertencimento → atletas ficam mais tempo → indicam mais.

**5. Provas como evento coletivo**
Organize a participação em grupo em provas locais. Camisetas personalizadas da assessoria → visibilidade gratuita + senso de equipe.

**No PACERUNPRO:**
A isca digital gera um link rastreável. Você sabe de onde cada lead veio e pode recompensar quem indicou.`
      },
    ],
  },

  {
    id: "gestao-financeira",
    title: "Gestão Financeira da Assessoria",
    description: "Precificação, MRR, controle de despesas e margem — tudo que você precisa para construir uma assessoria financeiramente saudável.",
    totalDuration: "45 min",
    level: "iniciante",
    category: "Negócio",
    color: "#46E0A0",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Quanto cobrar? A lógica da precificação",
        duration: "9 min",
        content: `## Precificação: a decisão mais difícil e mais importante

**Por que treinadores cobram pouco:**
- "Não quero perder o cliente"
- "Fulano cobra menos"
- Síndrome do impostor: não acredita que vale mais

**A fórmula correta:**
Preço = Custo de entrega + Margem desejada + Valor percebido pelo cliente

**Custo de entrega por atleta/mês:**
- Horas dedicadas × sua hora (inclua análise, prescrição, comunicação)
- Ferramentas (pro-rata do PACERUNPRO, plataformas usadas)
- Mínimo razoável: R$150–200/atleta/mês apenas para cobrir custos com margem mínima

**Modelos de preço:**
- **Por atleta:** mais previsível, escala com base de clientes
- **Pacote trimestral/semestral:** ticket maior, compromisso do cliente
- **Plano lite:** menos sessões, menos preço — para atender volume

**O benchmark do mercado (Brasil, 2025):**
- Free / sem plano: não existe assessoria real sem preço
- R$180–350: faixa entry level
- R$350–600: faixa intermediária (mais serviços, presença)
- R$600+: nicho de alto valor / performance / personalização

**Regra de ouro:** aumente o preço antes que os clientes peçam.`
      },
      {
        id: "l2",
        title: "MRR: a métrica que define a saúde do negócio",
        duration: "9 min",
        content: `## Monthly Recurring Revenue — por que é a métrica #1

**O que é MRR:**
A receita mensal recorrente — quanto entra de forma previsível todo mês, independente de vender algo novo.

**Como calcular:**
MRR = Soma de todos os planos mensais ativos
MRR = Planos anuais ÷ 12 (normalize para mensal)

**Exemplo:**
- 20 atletas × R$350/mês = R$7.000 MRR
- 3 atletas × R$4.200/ano = R$1.050 MRR normalizado
- **MRR total: R$8.050**

**Métricas derivadas importantes:**
- **New MRR:** nova receita adicionada no mês
- **Churn MRR:** receita perdida no mês (cancelamentos)
- **Net MRR Growth:** New MRR − Churn MRR
- **LTV (Lifetime Value):** MRR médio por atleta × tempo médio de permanência

**MRR vs. receita eventual:**
Uma assessoria com R$8.000 MRR estável vale muito mais do que uma com R$12.000 em meses de alta e R$3.000 em meses fracos. Previsibilidade permite planejamento.

**No PACERUNPRO:**
A aba Gestão mostra seu MRR em tempo real, crescimento mês a mês e distribuição por plano.`
      },
      {
        id: "l3",
        title: "Controle de despesas: o que corta a sua margem",
        duration: "9 min",
        content: `## As despesas que você precisa rastrear

**Despesas fixas (todo mês, independente do volume):**
- PACERUNPRO (seu plano)
- Ferramentas de edição de planilhas (se usar)
- Plataforma de pagamento (mensalidade)
- Marketing digital (anúncios recorrentes)
- Contador (se tiver MEI/empresa)

**Despesas variáveis (crescem com o negócio):**
- Taxa de processamento de pagamento (Stripe: ~2,9% + R$0,90 por transação)
- Comissões (se tiver treinadores contratados)
- Material de escritório, equipamentos

**Despesas ocultas que treinadores esquecem:**
- Seu próprio tempo → calcule sua hora e inclua no custo
- Deslocamento para treinos presenciais
- Equipamento (relógios, balança, fita métrica)
- Atualização profissional (cursos, certificações)

**A margem que você deve almejar:**
- Margem bruta (depois de custos diretos): 60–70%
- Margem líquida (depois de todos os custos): 30–45%

Se sua margem líquida for <20%, você está cobrando pouco ou gastando demais.

**No PACERUNPRO:**
Aba Gestão → Despesas: cadastre seus custos fixos e variáveis. O sistema calcula a margem automaticamente.`
      },
      {
        id: "l4",
        title: "Crescimento sustentável: a armadilha do crescimento rápido",
        duration: "9 min",
        content: `## Por que crescer rápido demais pode matar a assessoria

**O cenário comum:**
- Janeiro: 10 atletas, R$3.500 MRR, qualidade alta
- Março: 25 atletas, R$8.750 MRR, qualidade caindo
- Junho: 12 atletas, R$4.200 MRR (perdeu 13 por qualidade ruim)

**O problema não foi o crescimento — foi a operação.**

**Capacidade máxima sem ferramentas:**
Sem sistema: 15–20 atletas (planilhas, WhatsApp, planilhas)
Com PACERUNPRO: 40–60 atletas (check-ins automatizados, alertas, dashboard)
Com equipe (treinadores contratados): 100–200 atletas

**Antes de aceitar mais atletas, pergunte:**
- Consigo atender a qualidade que prometo a todos?
- Meus tempos de resposta estão dentro do esperado?
- Minha taxa de churn está abaixo de 5%?

**A estratégia do crescimento saudável:**
- Aumente preço para clientela atual → MRR sobe sem mais clientes
- Adicione 2–3 atletas por mês → dá tempo de integração
- Quando saturar: contrate treinador assistente, use o white-label

**Métricas de saúde da assessoria:**
- Churn mensal < 5%
- Adesão média dos atletas > 80%
- Tempo de resposta às mensagens < 12h
- NPS (satisfação) > 7/10`
      },
      {
        id: "l5",
        title: "Usando o PACERUNPRO para gestão financeira",
        duration: "9 min",
        content: `## Tutorial: módulo financeiro completo

**Aba Gestão & Vendas — o painel financeiro central**

**Dashboard financeiro:**
- MRR atual e evolução mês a mês (gráfico)
- Número de atletas ativos
- Churn do mês
- Novos contratos do mês

**Cadastrando despesas:**
Gestão → Despesas → Adicionar
- Categoria: ferramentas / marketing / pessoal / outros
- Valor e frequência (mensal, anual, variável)
- O sistema calcula a margem líquida automaticamente

**Configurando planos de venda:**
Meus Planos → Novo Plano
- Nome do plano (Ex: "Plano Maratona — 6 meses")
- Preço mensal / anual
- O que inclui (lista de serviços)
- Número de slots disponíveis

**Integrando pagamento:**
Config. Financeiras → Stripe ou PagBank
- Configure para receber mensalidades automaticamente
- Atletas pagam pelo link ou QR code
- Você recebe o alerta de pagamento confirmado

**Relatórios financeiros:**
Gestão → Relatório Financeiro → selecione o período
Exporta CSV com todas as entradas, saídas e resultado líquido.`
      },
    ],
  },

  // ── ADDITIONAL COACH COURSES ───────────────────────────────────────────────

  {
    id: "fundamentos-ciclismo",
    title: "Treinamento de Ciclismo: FTP e Potência",
    description: "Domine a prescrição por watts: FTP, zonas de potência, TSS e periodização para ciclistas.",
    totalDuration: "27 min",
    level: "intermediário",
    category: "Metodologia",
    color: "#38bdf8",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "O que é FTP e como calculá-lo",
        duration: "10 min",
        content: `## FTP — Functional Threshold Power

FTP é a potência máxima sustentável por 60 minutos. É o equivalente ao limiar de lactato no ciclismo, expresso em watts.

**Como calcular:**
Teste de 20 minutos em esforço máximo. FTP = resultado × 0,95.

**Referências por nível:**
- 200W: categoria iniciante
- 250W: intermediário
- 300W+: avançado

**Por que watts são superiores ao pace no ciclismo:**
O terreno, o vento e o peso da bicicleta afetam diretamente o pace — mas a potência medida pelo medidor de potência reflete o esforço real independentemente dessas variáveis externas.

**Zonas de potência (% FTP):**
- Z1: < 55% — Recuperação ativa
- Z2: 55–75% — Base aeróbica
- Z3: 75–90% — Aeróbico moderado
- Z4: 90–105% — Limiar (sweet spot superior)
- Z5: 105–120% — VO₂máx
- Z6: 120–150% — Anaeróbico
- Z7: > 150% — Neuromuscular / sprint`,
      },
      {
        id: "l2",
        title: "Estruturando uma semana de treino por potência",
        duration: "9 min",
        content: `## Distribuição polarizada

A distribuição polarizada é a mais eficaz para ciclistas: 80% do volume nas zonas Z1–Z2 e 20% em intensidade.

**TSS semanal recomendado por nível:**
- Iniciante: 200–350 TSS
- Intermediário: 350–500 TSS
- Avançado: 500–800+ TSS

**Sweet spot (88–93% FTP):**
O sweet spot é a principal ferramenta de desenvolvimento — oferece alto estímulo com recuperação mais rápida do que treinos em VO₂máx.

**Exemplo de semana intermediária:**
- Segunda: Fácil Z2, 60 min
- Terça: Intervalado Z5 — 5×5 min com 5 min rec
- Quarta: Base Z2, 90 min
- Quinta: Sweet spot — 3×20 min a 90% FTP
- Sexta: Fácil ou descanso
- Sábado: Longo Z2, 3h
- Domingo: Descanso ativo`,
      },
      {
        id: "l3",
        title: "Usando a periodização de potência no PACE RUN PRO",
        duration: "8 min",
        content: `## Periodização com modalidade Ciclismo

**Configurando a modalidade:**
Na seção Periodização, selecione "Ciclismo" como modalidade. O motor de prescrição usa o FTP ativo do atleta como referência para todas as zonas.

**Leitura dos gráficos:**
- CTL (azul): fitness acumulado ao longo das semanas
- ATL (laranja): fadiga da última semana
- TSB: equilíbrio entre fitness e fadiga — positivo = pronto para prova

**Semanas de deload:**
A cada 3–4 semanas, programe uma semana com 60% do TSS habitual. O atleta recupera sem perder adaptações.

**Exportação:**
Após configurar a periodização, exporte o plano para o calendário do atleta. Cada sessão aparece com zona e duração prescrita diretamente no app.`,
      },
    ],
  },

  {
    id: "fundamentos-natacao",
    title: "Natação: CSS e Zonas de Intensidade",
    description: "Prescreva treinos de natação com base em velocidade crítica (CSS) e zonas de pace por 100m.",
    totalDuration: "24 min",
    level: "intermediário",
    category: "Metodologia",
    color: "#a78bfa",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "CSS: a FC Limiar da natação",
        duration: "9 min",
        content: `## CSS — Critical Swim Speed

CSS é a velocidade crítica de nado — o pace sustentável indefinidamente em termos teóricos. É o equivalente natação do FTP no ciclismo ou do limiar de lactato na corrida.

**Teste simples:**
1. Nadar 400m no máximo
2. Nadar 200m no máximo
3. CSS = (400 − 200) ÷ (T400 − T200)

**Exemplo prático:**
- 400m em 6:40 (400 seg)
- 200m em 3:04 (184 seg)
- CSS = 200 ÷ (400 − 184) = 200 ÷ 216 ≈ **1:48/100m**

*Nota: o resultado final é ajustado para min/100m.*

**Zonas de natação (% CSS):**
- Z1: > 115% CSS — Recuperação (pace bem acima do CSS)
- Z2: 108–115% CSS — Aeróbico base
- Z3: 103–108% CSS — Aeróbico moderado
- Z4: 100–103% CSS — No CSS (limiar)
- Z5: < 100% CSS — Acima do limiar, alta intensidade`,
      },
      {
        id: "l2",
        title: "Estrutura de uma semana de natação",
        duration: "8 min",
        content: `## Volume semanal por nível

- Iniciante: 4–6 km/semana
- Intermediário: 8–12 km/semana
- Avançado: 15–20 km+/semana

**As 4 sessões principais:**

**Sessão de técnica:**
Baixa intensidade, foco em drills — pullbuoy, pernas, respiração bilateral. Constrói eficiência no longo prazo.

**Sessão de base Z2:**
Nado contínuo ou com pequenas pausas. 60–80% do volume total deve estar aqui.

**Sessão de CSS:**
Tiros no pace de CSS — ex: 10×100m no pace-alvo com 20 seg de descanso.

**Sessão de prova:**
Simula o ritmo e a distância da prova. Útil para triatletas que precisam calibrar o esforço na água antes da bike.

**Aquecimento progressivo:**
Sempre comece com 200–400m progressivos. Entrar frio em intensidade alta aumenta risco de lesão e reduz eficiência.

**Registro no PACE RUN PRO:**
Cada sessão pode ser registrada manualmente ou importada via wearable compatível.`,
      },
      {
        id: "l3",
        title: "Progressão e monitoramento de performance",
        duration: "7 min",
        content: `## Atualizando o CSS

Reavalie o CSS a cada 4–6 semanas. O teste é simples e pode ser feito em qualquer piscina de 25m ou 50m.

**Indicadores de melhora:**
- Tempo no 400m cai com o mesmo esforço percebido
- RPE de nado mais baixo no mesmo pace
- Menor número de braçadas por comprimento (eficiência técnica)

**Como registrar no sistema:**
Acesse Prescrição → Natação → Avaliação CSS. Insira os tempos do 400m e 200m — o sistema calcula o CSS automaticamente e atualiza as zonas.

**Cálculo automático de zonas:**
Após atualizar o CSS, todas as sessões prescritas são recalculadas com os novos paces por zona. Não há necessidade de ajuste manual.

**Dica:**
Combine a reavaliação de CSS com um pequeno teste de técnica (contagem de braçadas por comprimento). A redução de braçadas com o mesmo pace indica ganho real de economia de nado.`,
      },
    ],
  },

  {
    id: "fundamentos-triathlon",
    title: "Triathlon: Treinamento Integrado e Estratégia de Prova",
    description: "Planejamento e execução de treinos e provas de triathlon: distribuição de modalidades, brick training e estratégia de corrida.",
    totalDuration: "27 min",
    level: "avançado",
    category: "Estratégia",
    color: "#fb923c",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Distribuição de volume entre modalidades",
        duration: "10 min",
        content: `## A regra 50/30/20

A distribuição clássica de volume entre modalidades no triathlon:
- **Ciclismo:** 50% do volume total
- **Corrida:** 30% do volume total
- **Natação:** 20% do volume total

Essa proporção reflete o tempo real de prova em cada modalidade.

**Distâncias por formato:**
| Formato | Natação | Ciclismo | Corrida |
|---------|---------|---------|---------|
| Sprint | 750m | 20km | 5km |
| Olímpico | 1,5km | 40km | 10km |
| Ironman 70.3 | 1,9km | 90km | 21km |
| Ironman | 3,8km | 180km | 42km |

**Registro no PACE RUN PRO:**
Cada modalidade é registrada separadamente. O sistema calcula CTL individual por modalidade — importante porque um triatleta pode ter CTL alto no ciclismo e baixo na corrida.

**A corrida como limitante final:**
Independentemente do formato, a corrida determina o resultado final. Atletas com bike forte mas corrida fraca sempre terminam mal. Priorize a qualidade da corrida na distribuição de intensidade.`,
      },
      {
        id: "l2",
        title: "Brick training: por que e como",
        duration: "9 min",
        content: `## O que é um Brick

Brick é qualquer treino que combina duas modalidades consecutivas — mais comumente bike seguida de corrida imediatamente após. O nome vem da sensação de "tijolos nas pernas" nos primeiros quilômetros do run.

**Por que fazer:**
O músculo precisa ser treinado para a transição neuromotora entre pedalar (movimento circular, quadríceps dominante) e correr (movimento linear, glúteos e isquiotibiais). Sem bricks, a transição em prova é sempre pior.

**Os primeiros 2km do run sempre são mais lentos:**
Normal e esperado. O objetivo é treinar o atleta a tolerar esse período e não entrar em pânico de pace.

**Exemplo de brick olímpico:**
- 40km de bike em Z3 (75–85% FTP)
- Imediatamente: 10km de corrida progressivo (Z2 → Z3)

**Semana típica de triatleta:**
- Seg: Natação técnica
- Ter: Bike intervalado + Corrida leve (brick curto)
- Qua: Corrida longa Z2
- Qui: Bike longo Z2
- Sex: Natação CSS
- Sáb: Brick principal (bike longo + corrida)
- Dom: Descanso ativo

**Registro no sistema:**
Bricks são registrados como uma única sessão combinada no PACE RUN PRO, com duração total e RPE médio da sessão completa.`,
      },
      {
        id: "l3",
        title: "Estratégia de prova: T1, T2 e gestão de pace",
        duration: "8 min",
        content: `## As transições

**T1 — Natação → Bike:**
Touca, óculos → capacete (obrigatório antes de tocar a bike) → sapatilhas de ciclismo → partir. Treinar a rotina economiza 30–60 seg em prova.

**T2 — Bike → Corrida:**
Capacete → tênis de corrida → número de corrida (se exigido) → partir. Mais simples que T1.

**Estratégia de bike:**
A regra de ouro: **pedalar abaixo de 80% FTP para preservar a corrida**. Atletas que saem a 90%+ no bike chegam ao run sem pernas. A corrida paga o preço da arrogância no bike.

**Negative split na corrida:**
Sair conservador nos primeiros 2–3km e acelerar progressivamente. Triatletas que saem rápido no run raramente terminam fortes.

**Hidratação e nutrição no bike:**
- 500ml de líquido por hora (ajustar conforme temperatura)
- Gel a cada 30 minutos de bike (para Ironman e 70.3)
- Nada sólido nos últimos 20km antes de T2 — facilita a transição digestiva para o run

**Gestão mental:**
Divida a prova em blocos: "Só preciso chegar ao T1. Só preciso fechar o bike. Só preciso terminar os primeiros 5km do run." A segmentação mental reduz a percepção de dificuldade.`,
      },
    ],
  },

  {
    id: "fundamentos-forca",
    title: "Força para Atletas de Endurance",
    description: "Integre força ao treino de corrida e ciclismo: periodização, RPE, exercícios essenciais e programação compatível com o volume aeróbico.",
    totalDuration: "24 min",
    level: "intermediário",
    category: "Força",
    color: "#f87171",
    for: "coach",
    lessons: [
      {
        id: "l1",
        title: "Por que força melhora a performance de endurance",
        duration: "8 min",
        content: `## A ciência por trás da força no endurance

**Evidências:**
Dois treinos de força por semana melhoram a economia de corrida em 3–5% — o que representa ganhos reais de pace sem alterar o VO₂máx.

**Menos lesões:**
Glúteos fortes reduzem a sobrecarga no joelho e no quadril. Pesquisas mostram redução de 20–40% na incidência de lesões em corredores que fazem fortalecimento regular.

**Para ciclistas:**
Um core forte melhora a transferência de potência para o pedal. Joelho, quadril e coluna estabilizados = menos energia perdida em compensações.

**Exercícios essenciais para atletas de endurance:**
- Agachamento (variações: livre, goblet, búlgaro)
- Afundo (estático e dinâmico)
- Hip thrust (fortalecimento de glúteos)
- Elevação de panturrilha (prevenção de Aquiles e fasceíte)
- Core: prancha, dead bug, pallof press

**RPE de força:**
- RPE 6–7: hipertrofia (acúmulo de massa e base)
- RPE 8–9: força máxima (potência e recrutamento neural)
- RPE 10: não é recomendado para atletas de endurance (risco de lesão e recuperação lenta)`,
      },
      {
        id: "l2",
        title: "Periodização de força junto ao treino aeróbico",
        duration: "9 min",
        content: `## As 4 fases de força para atletas de endurance

**Fase 1 — Adaptação (2–4 semanas):**
Sem carga ou carga muito leve. Foco em ativação, técnica e estabilização. RPE 5–6. Compatível com qualquer volume aeróbico.

**Fase 2 — Hipertrofia (4–6 semanas):**
Cargas moderadas, RPE 7–8. 3–4 séries de 8–12 repetições. Construção de massa muscular funcional para proteger articulações.

**Fase 3 — Força Máxima (4 semanas):**
Cargas altas, RPE 8–9. 4–5 séries de 3–6 repetições. Aumento do recrutamento neural — mais força sem ganho de peso proporcional.

**Fase 4 — Potência (3 semanas):**
Movimentos explosivos: saltos, agachamento jump, kettlebell swing. Desenvolvimento de stiffness muscular — melhora economia de corrida.

**Na temporada de competição:**
Manutenção com 1 sessão por semana, RPE 7–8, volume reduzido. O objetivo é não perder os ganhos sem acumular fadiga adicional.

**Como cadastrar no PACE RUN PRO:**
Acesse Prescrição → Força → selecione o bloco correspondente à fase atual. Configure exercícios, séries e RPE. O sistema registra e monitora a carga de força separada da carga aeróbica.`,
      },
      {
        id: "l3",
        title: "Usando a Prescrição de Força no PACE RUN PRO",
        duration: "7 min",
        content: `## Tutorial: Prescrição de Força

**Acessando o módulo:**
Menu → Prescrição → Força.

**Biblioteca de exercícios:**
Escolha da lista com exercícios organizados por grupo muscular. Cada exercício tem descrição de execução e orientações de segurança.

**Montando uma sessão:**
- Selecione os exercícios
- Configure: séries, repetições, carga (kg ou % do peso corporal) e tempo de descanso
- Adicione RPE alvo para cada exercício

**Prescrevendo via calendário:**
A sessão de força pode ser vinculada a um dia específico no calendário do atleta — aparece como um bloco separado do treino aeróbico.

**StrengthBlocks no app do atleta:**
Cada exercício aparece no app com instruções completas. O atleta segue a sessão e registra o RPE após cada série ou ao final.

**Monitoramento:**
O sistema acumula a carga de força separadamente da carga aeróbica. O treinador pode ver a carga total (aeróbica + força) no dashboard do atleta para evitar sobrecarregar semanas de alta intensidade aeróbica.`,
      },
    ],
  },
];

export function getAthleteCoursesLength(): number {
  return UNIVERSITY_COURSES.filter((c) => c.for === "athlete" || c.for === "both").length;
}

export function getCoachCoursesLength(): number {
  return UNIVERSITY_COURSES.filter((c) => c.for === "coach" || c.for === "both").length;
}
