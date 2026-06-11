"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { averageScore, emptyScores } from "@/lib/avaliacao/dimensions";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { POSITIONS, POSITION_KEYS, type PositionKey } from "@/lib/data/positions";
import { genId, loadAthletes, saveAthletes, type Athlete } from "@/lib/storage";

function calcAge(birthdate?: string): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function AtletasPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<PositionKey>("geral");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Reads persisted athletes after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAthletes(loadAthletes());
  }, []);

  const sorted = useMemo(() => [...athletes].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [athletes]);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const athlete: Athlete = {
      id: genId(),
      name: trimmed,
      position,
      category: category || undefined,
      birthdate: birthdate || undefined,
      notes: notes.trim() || undefined,
      evaluations: [],
    };
    const next = [...athletes, athlete];
    setAthletes(next);
    saveAthletes(next);
    setName("");
    setPosition("geral");
    setCategory("");
    setBirthdate("");
    setNotes("");
  }

  function handleRemove(id: string) {
    const next = athletes.filter((a) => a.id !== id);
    setAthletes(next);
    saveAthletes(next);
  }

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          7
        </span>
        Atletas
      </h2>

      <div className="surface mb-4 p-3.5">
        <h3 className="m-0 mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
          Novo atleta
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="field-label" htmlFor="atlNome">
              Nome
            </label>
            <input id="atlNome" className="field-input" placeholder="Nome do atleta" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="atlPosicao">
              Posição
            </label>
            <select id="atlPosicao" className="field-input" value={position} onChange={(e) => setPosition(e.target.value as PositionKey)}>
              {POSITION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {POSITIONS[key].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="atlCategoria">
              Categoria
            </label>
            <select id="atlCategoria" className="field-input" value={category} onChange={(e) => setCategory(e.target.value as CategoryKey | "")}>
              <option value="">Não informada</option>
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="atlNascimento">
              Data de nascimento
            </label>
            <input id="atlNascimento" type="date" className="field-input" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="field-label" htmlFor="atlObs">
              Observações
            </label>
            <input id="atlObs" className="field-input" placeholder="ex: lesão recente, perfil comportamental" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn mt-3.5" onClick={handleAdd} disabled={!name.trim()}>
          Adicionar atleta
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-[22px] border border-dashed p-9 text-center" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.025)", color: "var(--muted)" }}>
          Nenhum atleta cadastrado ainda. Adicione o primeiro acima.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((athlete) => {
            const last = athlete.evaluations[athlete.evaluations.length - 1];
            const age = calcAge(athlete.birthdate);
            return (
              <div key={athlete.id} className="surface p-3.5">
                <h4 className="m-0 mb-2 text-[15px] font-bold">{athlete.name}</h4>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-accent">{POSITIONS[athlete.position].label}</span>
                  {athlete.category && <span className="chip">{CATEGORIES[athlete.category].label}</span>}
                  {age != null && <span className="chip">{age} anos</span>}
                </div>
                <p className="m-0 text-[12px]" style={{ color: "var(--muted)" }}>
                  {last ? (
                    <>
                      Última avaliação: nota média <b style={{ color: "var(--text)" }}>{averageScore(last.scores).toFixed(1)}</b> em{" "}
                      {new Date(last.date).toLocaleDateString("pt-BR")}
                    </>
                  ) : (
                    <>Sem avaliações registradas. Nota inicial sugerida: {averageScore(emptyScores()).toFixed(1)}.</>
                  )}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <Link href={`/atletas/${athlete.id}`} className="chip chip-accent">
                    Ver perfil →
                  </Link>
                  <button type="button" className="chip ml-auto" style={{ color: "var(--danger)" }} onClick={() => handleRemove(athlete.id)}>
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
