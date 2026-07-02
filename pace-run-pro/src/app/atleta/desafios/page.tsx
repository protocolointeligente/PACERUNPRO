"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Medal, Target, Users, Plus, TrendingUp } from "lucide-react";

interface ChallengeParticipant {
  id: string;
  athleteId: string;
  progress: number;
  completedAt?: string;
  rank: number;
  athlete: { user: { name: string; avatarUrl?: string } };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  targetValue?: number;
  targetUnit?: string;
  sport: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  myProgress?: number;
  completedAt?: string;
  _count?: { participants: number };
  coach?: { user: { name: string; avatarUrl?: string } };
}

interface ChallengeData {
  enrolled: Challenge[];
  available: Challenge[];
}

const SPORT_LABELS: Record<string, string> = {
  CORRIDA: "Corrida",
  CICLISMO: "Ciclismo",
  NATACAO: "Natação",
  TRIATHLON: "Triathlon",
  OUTRO: "Outro",
};

export default function AtletaDesafiosPage() {
  const [data, setData] = useState<ChallengeData>({ enrolled: [], available: [] });
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ challenge: Challenge; leaderboard: ChallengeParticipant[]; myRank: number | null } | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/atleta/desafios");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function joinChallenge(challengeId: string) {
    await fetch("/api/atleta/desafios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    });
    load();
  }

  async function updateProgress(challengeId: string) {
    const val = progressInput[challengeId];
    if (!val) return;
    setUpdatingProgress(challengeId);
    await fetch("/api/atleta/desafios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, progress: Number(val) }),
    });
    setUpdatingProgress(null);
    load();
  }

  async function loadLeaderboard(challengeId: string) {
    const res = await fetch(`/api/atleta/desafios?challengeId=${challengeId}`);
    if (res.ok) setLeaderboard(await res.json());
  }

  const now = new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Desafios
        </h1>
        <p className="text-sm text-gray-500 mt-1">Participe de desafios, acompanhe seu progresso e compita no ranking</p>
      </div>

      {/* Enrolled challenges */}
      {!loading && data.enrolled.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Meus Desafios</h2>
          <div className="space-y-3">
            {data.enrolled.map((c) => {
              const end = new Date(c.endDate);
              const isEnded = end < now;
              const pct = c.targetValue ? Math.min(100, ((c.myProgress ?? 0) / c.targetValue) * 100) : 0;
              return (
                <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {SPORT_LABELS[c.sport] ?? c.sport} · {new Date(c.startDate).toLocaleDateString("pt-BR")} → {end.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {c.completedAt ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        <Trophy className="w-3.5 h-3.5" />
                        Concluído!
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isEnded ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"
                      }`}>
                        {isEnded ? "Encerrado" : "Ativo"}
                      </span>
                    )}
                  </div>

                  {c.targetValue && (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {c.myProgress ?? 0} / {c.targetValue} {c.targetUnit ?? ""}
                        </span>
                        <span className="text-indigo-600 font-medium">{Math.round(pct)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all ${c.completedAt ? "bg-green-500" : "bg-indigo-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  )}

                  {!isEnded && !c.completedAt && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={0}
                        placeholder={`Progresso atual (${c.targetUnit ?? "unidade"})`}
                        value={progressInput[c.id] ?? ""}
                        onChange={(e) => setProgressInput((p) => ({ ...p, [c.id]: e.target.value }))}
                        className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      />
                      <button
                        onClick={() => updateProgress(c.id)}
                        disabled={updatingProgress === c.id}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Atualizar
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => loadLeaderboard(c.id)}
                    className="mt-3 text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Ver ranking
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available challenges */}
      {!loading && data.available.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Desafios Disponíveis</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.available.map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{SPORT_LABELS[c.sport] ?? c.sport}</span>
                  {c.targetValue && <span><Target className="w-3 h-3 inline" /> {c.targetValue} {c.targetUnit}</span>}
                  {c._count && <span><Users className="w-3 h-3 inline" /> {c._count.participants}</span>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    Até {new Date(c.endDate).toLocaleDateString("pt-BR")}
                  </p>
                  <button
                    onClick={() => joinChallenge(c.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Participar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && data.enrolled.length === 0 && data.available.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum desafio disponível no momento</p>
          <p className="text-sm text-gray-400 mt-1">Seu treinador publicará desafios em breve</p>
        </div>
      )}

      {/* Leaderboard modal */}
      {leaderboard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Ranking — {leaderboard.challenge.title}
              </h2>
              {leaderboard.myRank && (
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                  Você: #{leaderboard.myRank}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {leaderboard.leaderboard.slice(0, 20).map((p) => (
                <div key={p.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                  leaderboard.myRank && p.rank === leaderboard.myRank ? "bg-indigo-50" : ""
                }`}>
                  <span className={`w-6 text-center text-sm font-bold ${
                    p.rank === 1 ? "text-yellow-500" : p.rank === 2 ? "text-gray-400" : p.rank === 3 ? "text-amber-600" : "text-gray-400"
                  }`}>
                    {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{p.athlete.user.name}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {p.progress} {leaderboard.challenge.targetUnit ?? ""}
                  </span>
                  {p.completedAt && <Trophy className="w-4 h-4 text-yellow-500" />}
                </div>
              ))}
            </div>
            <button
              onClick={() => setLeaderboard(null)}
              className="mt-4 w-full py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
