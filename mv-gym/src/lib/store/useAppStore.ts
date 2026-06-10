"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AvaliacaoFisica,
  CheckIn,
  MensagemCoach,
  Objetivo,
  PlanoAssinaturaId,
  PlanoNutricional,
  PlanoTreino,
  Preferencias,
  RegistroNutricaoDia,
  RegistroTreino,
  Sexo,
  Usuario,
  UserRole,
  NivelExperiencia,
} from "@/lib/types";
import {
  gerarPlanoNutricional,
  gerarPlanoTreino,
  gerarDeload,
  responderCoach,
} from "@/lib/ai/coach";
import { calcIMC, todayIso } from "@/lib/utils";
import {
  avaliarConquistas,
  buildContextoConquistas,
  calcularStreak,
} from "@/lib/gamification";

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CadastroInput {
  nome: string;
  email: string;
  dataNascimento: string;
  sexo: Sexo;
  alturaCm: number;
  pesoKg: number;
}

interface AppState {
  _hasHydrated: boolean;

  usuario: Usuario | null;
  preferencias: Preferencias | null;
  onboardingCompleto: boolean;

  avaliacoes: AvaliacaoFisica[];
  planoTreino: PlanoTreino | null;
  registrosTreino: RegistroTreino[];

  checkins: CheckIn[];

  planoNutricional: PlanoNutricional | null;
  registrosNutricao: RegistroNutricaoDia[];

  xp: number;
  prsRegistrados: number;
  conquistasDesbloqueadas: Record<string, string>;

  planoAssinatura: PlanoAssinaturaId;

  mensagensCoach: MensagemCoach[];

  setHasHydrated: (value: boolean) => void;
  iniciarCadastro: (dados: CadastroInput) => void;
  setObjetivo: (objetivo: Objetivo, nivel: NivelExperiencia, pesoMetaKg?: number) => void;
  addAvaliacao: (avaliacao: Omit<AvaliacaoFisica, "id" | "imc">) => void;
  setPreferencias: (prefs: Preferencias) => void;
  regenerarPlano: () => void;
  aplicarDeload: () => void;
  addRegistroTreino: (registro: Omit<RegistroTreino, "id">) => void;
  addCheckIn: (checkin: Omit<CheckIn, "id">) => void;
  toggleRefeicaoConcluida: (data: string, refeicaoId: string) => void;
  addAgua: (data: string, ml: number) => void;
  enviarMensagemCoach: (texto: string) => void;
  setPlanoAssinatura: (id: PlanoAssinaturaId) => void;
  carregarDemo: (role: UserRole) => void;
  logout: () => void;
}

const initialState = {
  usuario: null as Usuario | null,
  preferencias: null as Preferencias | null,
  onboardingCompleto: false,
  avaliacoes: [] as AvaliacaoFisica[],
  planoTreino: null as PlanoTreino | null,
  registrosTreino: [] as RegistroTreino[],
  checkins: [] as CheckIn[],
  planoNutricional: null as PlanoNutricional | null,
  registrosNutricao: [] as RegistroNutricaoDia[],
  xp: 0,
  prsRegistrados: 0,
  conquistasDesbloqueadas: {} as Record<string, string>,
  planoAssinatura: "free" as PlanoAssinaturaId,
  mensagensCoach: [] as MensagemCoach[],
};

function getRegistroNutricaoDia(registros: RegistroNutricaoDia[], data: string): RegistroNutricaoDia {
  return registros.find((r) => r.data === data) ?? { data, aguaMl: 0, refeicoesConcluidas: [] };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      iniciarCadastro: (dados) => {
        const usuario: Usuario = {
          id: genId("user"),
          nome: dados.nome,
          email: dados.email,
          role: "aluno",
          dataNascimento: dados.dataNascimento,
          sexo: dados.sexo,
          alturaCm: dados.alturaCm,
          pesoKg: dados.pesoKg,
          criadoEm: new Date().toISOString(),
        };
        set({ usuario, onboardingCompleto: false });
      },

      setObjetivo: (objetivo, nivel, pesoMetaKg) => {
        const { usuario } = get();
        if (!usuario) return;
        set({
          usuario: { ...usuario, objetivo, nivel, pesoMetaKg },
        });
      },

      addAvaliacao: (avaliacao) => {
        const nova: AvaliacaoFisica = {
          ...avaliacao,
          id: genId("avaliacao"),
          imc: calcIMC(avaliacao.pesoKg, avaliacao.alturaCm),
        };
        set((state) => {
          const avaliacoes = [nova, ...state.avaliacoes];
          const usuario = state.usuario ? { ...state.usuario, pesoKg: nova.pesoKg } : state.usuario;
          const conquistasDesbloqueadas = atualizarConquistas(state, { avaliacoes, usuario });
          return { avaliacoes, usuario, xp: state.xp + 30, conquistasDesbloqueadas };
        });
      },

      setPreferencias: (prefs) => {
        const { usuario } = get();
        if (!usuario) return;

        const planoTreino = gerarPlanoTreino(usuario, prefs);
        const planoNutricional = gerarPlanoNutricional(usuario);

        set({
          preferencias: prefs,
          planoTreino,
          planoNutricional,
          onboardingCompleto: true,
        });
      },

      regenerarPlano: () => {
        const { usuario, preferencias } = get();
        if (!usuario || !preferencias) return;
        set({ planoTreino: gerarPlanoTreino(usuario, preferencias) });
      },

      aplicarDeload: () => {
        const { planoTreino } = get();
        if (!planoTreino) return;
        set({ planoTreino: gerarDeload(planoTreino) });
      },

      addRegistroTreino: (registro) => {
        const novo: RegistroTreino = { ...registro, id: genId("registro") };

        set((state) => {
          const registrosAnteriores = state.registrosTreino;

          let novosPRs = 0;
          novo.series.forEach((serie) => {
            const maxAnterior = Math.max(
              0,
              ...registrosAnteriores.flatMap((r) =>
                r.series.filter((s) => s.exercicioId === serie.exercicioId).map((s) => s.cargaKg),
              ),
            );
            if (serie.cargaKg > maxAnterior && maxAnterior > 0) {
              novosPRs += 1;
            }
          });

          const registrosTreino = [novo, ...registrosAnteriores];
          const xp = state.xp + 50 + novosPRs * 25;
          const prsRegistrados = state.prsRegistrados + novosPRs;
          const conquistasDesbloqueadas = atualizarConquistas(state, {
            registrosTreino,
            prsRegistrados,
          });

          return { registrosTreino, xp, prsRegistrados, conquistasDesbloqueadas };
        });
      },

      addCheckIn: (checkin) => {
        const novo: CheckIn = { ...checkin, id: genId("checkin") };
        set((state) => {
          const checkins = [novo, ...state.checkins.filter((c) => c.data !== novo.data)];
          const conquistasDesbloqueadas = atualizarConquistas(state, { checkins });
          return { checkins, xp: state.xp + 10, conquistasDesbloqueadas };
        });
      },

      toggleRefeicaoConcluida: (data, refeicaoId) => {
        set((state) => {
          const registros = [...state.registrosNutricao];
          const idx = registros.findIndex((r) => r.data === data);
          const atual = idx >= 0 ? registros[idx] : { data, aguaMl: 0, refeicoesConcluidas: [] };

          const jaConcluida = atual.refeicoesConcluidas.includes(refeicaoId);
          const refeicoesConcluidas = jaConcluida
            ? atual.refeicoesConcluidas.filter((id) => id !== refeicaoId)
            : [...atual.refeicoesConcluidas, refeicaoId];

          const atualizado = { ...atual, refeicoesConcluidas };

          if (idx >= 0) {
            registros[idx] = atualizado;
          } else {
            registros.push(atualizado);
          }

          return { registrosNutricao: registros };
        });
      },

      addAgua: (data, ml) => {
        set((state) => {
          const registros = [...state.registrosNutricao];
          const idx = registros.findIndex((r) => r.data === data);
          const atual = idx >= 0 ? registros[idx] : { data, aguaMl: 0, refeicoesConcluidas: [] };
          const atualizado = { ...atual, aguaMl: Math.max(0, atual.aguaMl + ml) };

          if (idx >= 0) {
            registros[idx] = atualizado;
          } else {
            registros.push(atualizado);
          }

          return { registrosNutricao: registros };
        });
      },

      enviarMensagemCoach: (texto) => {
        const { usuario, planoTreino, registrosTreino } = get();
        if (!usuario) return;

        const mensagemUsuario: MensagemCoach = {
          id: genId("msg"),
          autor: "usuario",
          texto,
          data: new Date().toISOString(),
        };

        const respostaTexto = responderCoach(texto, {
          nome: usuario.nome.split(" ")[0],
          objetivo: usuario.objetivo,
          proximoTreinoNome: planoTreino?.treinos[0]?.nome,
          streakDias: calcularStreak(registrosTreino),
        });

        const mensagemIA: MensagemCoach = {
          id: genId("msg"),
          autor: "ia",
          texto: respostaTexto,
          data: new Date().toISOString(),
        };

        set((state) => ({
          mensagensCoach: [...state.mensagensCoach, mensagemUsuario, mensagemIA],
        }));
      },

      setPlanoAssinatura: (id) => set({ planoAssinatura: id }),

      carregarDemo: (role) => {
        if (role !== "aluno") {
          const usuario: Usuario = {
            id: genId("user"),
            nome: role === "personal" ? "Personal Demo" : "Admin Demo",
            email: role === "personal" ? "personal@mvgym.com" : "admin@mvgym.com",
            role,
            criadoEm: new Date().toISOString(),
          };
          set({ usuario, onboardingCompleto: true });
          return;
        }

        const usuario: Usuario = {
          id: genId("user"),
          nome: "Rafael Souza",
          email: "demo@mvgym.com",
          role: "aluno",
          dataNascimento: "1996-04-12",
          sexo: "masculino",
          alturaCm: 178,
          pesoKg: 82,
          pesoMetaKg: 78,
          objetivo: "hipertrofia",
          nivel: "intermediario",
          criadoEm: new Date().toISOString(),
        };

        const preferencias: Preferencias = {
          local: "academia",
          equipamentos: ["barra", "halteres", "anilha", "máquina", "cabo", "banco", "rack", "smith", "barra fixa"],
          diasPorSemana: 4,
          tempoDisponivelMin: 60,
        };

        const planoTreino = gerarPlanoTreino(usuario, preferencias);
        const planoNutricional = gerarPlanoNutricional(usuario);

        const hoje = Date.now();
        const dia = 86400000;

        const avaliacoes: AvaliacaoFisica[] = [
          {
            id: genId("avaliacao"),
            data: new Date(hoje - 2 * dia).toISOString(),
            pesoKg: 82,
            alturaCm: 178,
            imc: calcIMC(82, 178),
            percentualGordura: 18.5,
            massaMuscularKg: 36.2,
            circunferencias: { cintura: 86, peito: 102, bracoDireito: 38, coxaDireita: 58 },
          },
          {
            id: genId("avaliacao"),
            data: new Date(hoje - 32 * dia).toISOString(),
            pesoKg: 84.5,
            alturaCm: 178,
            imc: calcIMC(84.5, 178),
            percentualGordura: 20.1,
            massaMuscularKg: 35.4,
            circunferencias: { cintura: 89, peito: 101, bracoDireito: 37, coxaDireita: 57 },
          },
          {
            id: genId("avaliacao"),
            data: new Date(hoje - 62 * dia).toISOString(),
            pesoKg: 87,
            alturaCm: 178,
            imc: calcIMC(87, 178),
            percentualGordura: 22,
            massaMuscularKg: 34.8,
            circunferencias: { cintura: 92, peito: 100, bracoDireito: 36.5, coxaDireita: 56.5 },
          },
        ];

        const treinoBase = planoTreino.treinos[0];
        const registrosTreino: RegistroTreino[] = Array.from({ length: 6 }).map((_, i) => {
          const treino = planoTreino.treinos[i % planoTreino.treinos.length];
          return {
            id: genId("registro"),
            treinoId: treino.id,
            treinoNome: treino.nome,
            data: new Date(hoje - (i + 1) * 2 * dia).toISOString(),
            duracaoSeg: treino.duracaoEstimadaMin * 60 - 120,
            volumeTotalKg: 2400 + i * 80,
            series: treino.exercicios.slice(0, 3).flatMap((ex, exIdx) =>
              Array.from({ length: ex.series }).map((_, serieIdx) => ({
                exercicioId: ex.exercicioId,
                numeroSerie: serieIdx + 1,
                repeticoes: 10,
                cargaKg: 20 + exIdx * 10 + (5 - i) * 1.25,
                rpe: 8,
              })),
            ),
          };
        });

        const checkins: CheckIn[] = Array.from({ length: 5 }).map((_, i) => ({
          id: genId("checkin"),
          data: new Date(hoje - i * dia).toISOString().slice(0, 10),
          humor: 3 + (i % 3 === 0 ? 1 : 0),
          energia: 3 + (i % 2),
          sono: 4,
          fome: 3,
          dorMuscular: 2 + (i % 2),
          estresse: 2,
          comentario: i === 0 ? "Treino de pernas hoje, mas me senti bem!" : undefined,
        }));

        const xp = registrosTreino.length * 50 + checkins.length * 10 + avaliacoes.length * 30;

        const conquistasDesbloqueadas = atualizarConquistas(
          {
            ...initialState,
            registrosTreino,
            checkins,
            avaliacoes,
            usuario,
            prsRegistrados: 1,
          },
          { registrosTreino, checkins, avaliacoes, usuario, prsRegistrados: 1 },
        );

        set({
          usuario,
          preferencias,
          onboardingCompleto: true,
          planoTreino,
          planoNutricional,
          avaliacoes,
          registrosTreino,
          checkins,
          xp,
          prsRegistrados: 1,
          conquistasDesbloqueadas,
          mensagensCoach: [
            {
              id: genId("msg"),
              autor: "ia",
              texto: `Olá, ${usuario.nome.split(" ")[0]}! Sou seu AI Coach no MV GYM. Acompanhei sua evolução: você já perdeu 5kg nos últimos 2 meses mantendo a força. Continue assim! Hoje sugiro o "${treinoBase.nome}". Qualquer dúvida, é só perguntar.`,
              data: new Date(hoje - dia).toISOString(),
            },
          ],
        });
      },

      logout: () => set({ ...initialState }),
    }),
    {
      name: "mv-gym-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// ────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ────────────────────────────────────────────────────────────────────────────

type ConquistasState = Pick<
  AppState,
  "registrosTreino" | "checkins" | "avaliacoes" | "usuario" | "prsRegistrados" | "conquistasDesbloqueadas"
>;

function atualizarConquistas(
  state: ConquistasState,
  overrides: Partial<Pick<AppState, "registrosTreino" | "checkins" | "avaliacoes" | "usuario" | "prsRegistrados">>,
): Record<string, string> {
  const registrosTreino = overrides.registrosTreino ?? state.registrosTreino;
  const checkins = overrides.checkins ?? state.checkins;
  const avaliacoes = overrides.avaliacoes ?? state.avaliacoes;
  const usuario = overrides.usuario ?? state.usuario;
  const prsRegistrados = overrides.prsRegistrados ?? state.prsRegistrados;

  const metaAlcancada =
    !!usuario?.pesoMetaKg &&
    avaliacoes.length > 0 &&
    Math.abs(avaliacoes[0].pesoKg - usuario.pesoMetaKg) <= 0.5;

  const ctx = buildContextoConquistas({
    registros: registrosTreino,
    checkins,
    avaliacoesCount: avaliacoes.length,
    streakDias: calcularStreak(registrosTreino),
    prsRegistrados,
    metaAlcancada,
  });

  const conquistasAtivas = avaliarConquistas(ctx);
  const resultado = { ...state.conquistasDesbloqueadas };
  const agora = new Date().toISOString();

  conquistasAtivas.forEach((c) => {
    if (!resultado[c.id]) {
      resultado[c.id] = agora;
    }
  });

  return resultado;
}
