import { CONQUISTAS } from "@/lib/data/achievements";
import type { CheckIn, Conquista, RegistroTreino } from "@/lib/types";

export const XP_POR_TREINO = 50;
export const XP_POR_CHECKIN = 10;
export const XP_POR_AVALIACAO = 30;
export const XP_BONUS_PR = 25;

export interface NivelInfo {
  nivel: number;
  titulo: string;
  xpAtual: number;
  xpInicioNivel: number;
  xpProximoNivel: number;
  progresso: number; // 0-1
}

const TITULOS_NIVEL = [
  "Iniciante",
  "Disciplinado",
  "Consistente",
  "Atleta",
  "Avançado",
  "Elite",
  "Lenda MV GYM",
];

// XP necessário cresce de forma incremental a cada nível.
function xpParaNivel(nivel: number): number {
  return 100 + (nivel - 1) * 75;
}

export function calcularNivel(xpTotal: number): NivelInfo {
  let nivel = 1;
  let restante = xpTotal;

  while (restante >= xpParaNivel(nivel)) {
    restante -= xpParaNivel(nivel);
    nivel += 1;
  }

  const xpProximoNivel = xpParaNivel(nivel);
  const tituloIdx = Math.min(nivel - 1, TITULOS_NIVEL.length - 1);

  return {
    nivel,
    titulo: TITULOS_NIVEL[tituloIdx],
    xpAtual: restante,
    xpInicioNivel: 0,
    xpProximoNivel,
    progresso: Math.min(1, restante / xpProximoNivel),
  };
}

interface ContextoConquistas {
  treinosConcluidos: number;
  streakDias: number;
  avaliacoesRegistradas: number;
  prsRegistrados: number;
  checkinsSeguidos: number;
  metaAlcancada: boolean;
}

export function buildContextoConquistas(params: {
  registros: RegistroTreino[];
  checkins: CheckIn[];
  avaliacoesCount: number;
  streakDias: number;
  prsRegistrados: number;
  metaAlcancada: boolean;
}): ContextoConquistas {
  return {
    treinosConcluidos: params.registros.length,
    streakDias: params.streakDias,
    avaliacoesRegistradas: params.avaliacoesCount,
    prsRegistrados: params.prsRegistrados,
    checkinsSeguidos: contarCheckinsSeguidos(params.checkins),
    metaAlcancada: params.metaAlcancada,
  };
}

function contarCheckinsSeguidos(checkins: CheckIn[]): number {
  if (checkins.length === 0) return 0;

  const datas = [...checkins]
    .map((c) => c.data)
    .sort()
    .reverse();

  let streak = 1;
  for (let i = 0; i < datas.length - 1; i++) {
    const atual = new Date(datas[i]);
    const anterior = new Date(datas[i + 1]);
    const diffDias = Math.round((atual.getTime() - anterior.getTime()) / 86400000);
    if (diffDias === 1) {
      streak += 1;
    } else if (diffDias > 1) {
      break;
    }
  }
  return streak;
}

/**
 * Avalia o critério de cada conquista contra o contexto atual e retorna
 * as conquistas que devem estar desbloqueadas.
 */
export function avaliarConquistas(ctx: ContextoConquistas): Conquista[] {
  return CONQUISTAS.filter((conquista) => {
    switch (conquista.criterio) {
      case "treinos_concluidos>=1":
        return ctx.treinosConcluidos >= 1;
      case "treinos_concluidos>=10":
        return ctx.treinosConcluidos >= 10;
      case "treinos_concluidos>=50":
        return ctx.treinosConcluidos >= 50;
      case "treinos_concluidos>=100":
        return ctx.treinosConcluidos >= 100;
      case "streak>=7":
        return ctx.streakDias >= 7;
      case "streak>=30":
        return ctx.streakDias >= 30;
      case "avaliacoes>=1":
        return ctx.avaliacoesRegistradas >= 1;
      case "prs>=1":
        return ctx.prsRegistrados >= 1;
      case "checkins_seguidos>=7":
        return ctx.checkinsSeguidos >= 7;
      case "meta_alcancada":
        return ctx.metaAlcancada;
      default:
        return false;
    }
  });
}

export function calcularStreak(registros: RegistroTreino[]): number {
  if (registros.length === 0) return 0;

  const datas = [...new Set(registros.map((r) => r.data.slice(0, 10)))].sort().reverse();

  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (datas[0] !== hoje && datas[0] !== ontem) return 0;

  let streak = 1;
  for (let i = 0; i < datas.length - 1; i++) {
    const atual = new Date(datas[i]);
    const anterior = new Date(datas[i + 1]);
    const diffDias = Math.round((atual.getTime() - anterior.getTime()) / 86400000);
    if (diffDias === 1) {
      streak += 1;
    } else if (diffDias > 1) {
      break;
    }
  }
  return streak;
}
