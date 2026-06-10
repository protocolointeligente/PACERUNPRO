// ────────────────────────────────────────────────────────────────────────────
// MV GYM — Modelo de domínio
// Tipos compartilhados entre UI, store (Zustand) e o módulo de IA (AI Coach).
// ────────────────────────────────────────────────────────────────────────────

export type UserRole = "aluno" | "personal" | "admin";

export type Sexo = "masculino" | "feminino" | "outro";

export type Objetivo =
  | "emagrecimento"
  | "hipertrofia"
  | "forca"
  | "condicionamento"
  | "saude"
  | "performance";

export type LocalTreino = "academia" | "casa" | "crossfit" | "funcional";

export type NivelExperiencia = "iniciante" | "intermediario" | "avancado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  dataNascimento?: string;
  sexo?: Sexo;
  alturaCm?: number;
  pesoKg?: number;
  pesoMetaKg?: number;
  objetivo?: Objetivo;
  nivel?: NivelExperiencia;
  criadoEm: string;
}

export interface Preferencias {
  local: LocalTreino;
  equipamentos: string[];
  diasPorSemana: number;
  tempoDisponivelMin: number;
}

export interface Circunferencias {
  peito?: number;
  cintura?: number;
  quadril?: number;
  bracoDireito?: number;
  bracoEsquerdo?: number;
  coxaDireita?: number;
  coxaEsquerda?: number;
  panturrilhaDireita?: number;
  panturrilhaEsquerda?: number;
  abdomen?: number;
}

export interface Dobras {
  triceps?: number;
  subescapular?: number;
  suprailiaca?: number;
  abdominal?: number;
  coxa?: number;
}

export interface FotosProgresso {
  frente?: string;
  lado?: string;
  costas?: string;
}

export interface AvaliacaoFisica {
  id: string;
  data: string; // ISO
  pesoKg: number;
  alturaCm: number;
  imc: number;
  percentualGordura?: number;
  massaMuscularKg?: number;
  circunferencias: Circunferencias;
  dobras?: Dobras;
  fotos?: FotosProgresso;
}

export type GrupoMuscular =
  | "peito"
  | "costas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "posterior"
  | "gluteos"
  | "panturrilha"
  | "abdomen"
  | "antebraco"
  | "cardio"
  | "corpo_inteiro";

export interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  subgrupo?: string;
  equipamentos: string[];
  execucao: string;
  errosComuns: string;
  nivel: NivelExperiencia;
}

export interface ExercicioTreino {
  exercicioId: string;
  series: number;
  repeticoes: string; // ex.: "8-10" ou "30s"
  cargaSugeridaKg?: number;
  rpeAlvo?: number;
  descansoSeg: number;
  observacao?: string;
}

export interface Treino {
  id: string;
  nome: string; // "Treino A — Peito e Tríceps"
  grupos: GrupoMuscular[];
  exercicios: ExercicioTreino[];
  duracaoEstimadaMin: number;
}

export interface PlanoTreino {
  id: string;
  nome: string;
  objetivo: Objetivo;
  split: string; // ex.: "ABC", "Upper/Lower", "Full Body"
  semanaAtual: number;
  totalSemanas: number;
  treinos: Treino[];
  geradoPorIA: boolean;
  deload: boolean;
  criadoEm: string;
}

export interface SerieRegistrada {
  exercicioId: string;
  numeroSerie: number;
  repeticoes: number;
  cargaKg: number;
  rpe?: number;
}

export interface RegistroTreino {
  id: string;
  treinoId: string;
  treinoNome: string;
  data: string; // ISO
  duracaoSeg: number;
  series: SerieRegistrada[];
  volumeTotalKg: number;
}

export interface CheckIn {
  id: string;
  data: string; // ISO (yyyy-MM-dd)
  humor: number; // 1-5
  energia: number; // 1-5
  sono: number; // 1-5
  fome: number; // 1-5
  dorMuscular: number; // 1-5
  estresse: number; // 1-5
  comentario?: string;
}

export interface AlimentoRefeicao {
  nome: string;
  quantidade: string;
  calorias: number;
  proteinasG: number;
  carboidratosG: number;
  gordurasG: number;
}

export interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  alimentos: AlimentoRefeicao[];
}

export interface PlanoNutricional {
  caloriasAlvo: number;
  proteinasAlvoG: number;
  carboidratosAlvoG: number;
  gordurasAlvoG: number;
  aguaAlvoMl: number;
  refeicoes: Refeicao[];
}

export interface RegistroNutricaoDia {
  data: string; // yyyy-MM-dd
  aguaMl: number;
  refeicoesConcluidas: string[]; // ids das refeições
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string; // nome do ícone lucide-react
  criterio: string;
}

export type PlanoAssinaturaId = "free" | "premium" | "personal";

export interface PlanoAssinatura {
  id: PlanoAssinaturaId;
  nome: string;
  precoMensal: number;
  recursos: string[];
  destaque?: boolean;
}

export interface MensagemCoach {
  id: string;
  autor: "ia" | "usuario";
  texto: string;
  data: string; // ISO
}

export interface AlunoResumo {
  id: string;
  nome: string;
  avatarUrl?: string;
  objetivo: Objetivo;
  adesao: number; // 0-1
  ultimoTreino: string; // descrição relativa
  status: "em_dia" | "atencao" | "inativo";
  sequenciaDias: number;
}
