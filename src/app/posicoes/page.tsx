import { POSITIONS, POSITION_KEYS } from "@/lib/data/positions";
import { getExercises } from "@/lib/exercises/bank";

export default function PosicoesPage() {
  const exercises = getExercises();
  const positions = POSITION_KEYS.filter((key) => key !== "geral");

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          4
        </span>
        Módulo por posição
      </h2>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((key) => {
          const p = POSITIONS[key];
          const count = exercises.filter((ex) => ex.position === key).length;
          return (
            <div key={key} className="card p-4">
              <h3 className="m-0 mb-2 text-base font-bold">{p.label}</h3>
              <p className="m-0 text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Objetivos
              </p>
              <ul className="m-0 mt-1.5 list-disc pl-4.5 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.objetivos.map((o) => (
                  <li key={o} className="mb-1.5" style={{ color: "var(--text)" }}>
                    {o}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-2.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Fundamentos
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.fundamentos.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Exercícios no banco: <b style={{ color: "var(--text)" }}>{count}</b>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
