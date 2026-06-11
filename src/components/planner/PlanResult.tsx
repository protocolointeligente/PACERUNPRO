import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { FOCI } from "@/lib/data/foci";
import { MESOCICLO } from "@/lib/planner/mesociclo";
import type { LessonPlan } from "@/lib/planner/generate";

export function PlanResult({ plan }: { plan: LessonPlan }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <div className="metric">
          <small className="block text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Categoria
          </small>
          <b className="mt-1 block text-base">{plan.category.label}</b>
        </div>
        <div className="metric">
          <small className="block text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Foco
          </small>
          <b className="mt-1 block text-base">{FOCI[plan.config.foco]}</b>
        </div>
        <div className="metric">
          <small className="block text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Posição
          </small>
          <b className="mt-1 block text-base">{plan.position.label}</b>
        </div>
        <div className="metric">
          <small className="block text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Tempo
          </small>
          <b className="mt-1 block text-base">{plan.config.tempo} min</b>
        </div>
        <div className="metric">
          <small className="block text-[10px] font-black uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Banco usado
          </small>
          <b className="mt-1 block text-base">{plan.bankSize}</b>
        </div>
      </div>

      <div className="callout mt-3.5">
        <b>Diretriz da aula:</b> {plan.category.stage} • {plan.config.nivel} • {plan.config.espaco} • {plan.config.atletas} atletas.
        <br />
        Prioridades: {plan.priorities.join(" • ")}
      </div>

      <h2 className="mb-2.5 mt-5 text-[22px] font-bold tracking-tight">Objetivos da sessão</h2>
      <ul className="m-0 list-disc pl-5 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {plan.config.objetivos.map((o) => (
          <li key={o} className="mb-1.5" style={{ color: "var(--text)" }}>
            {o}
          </li>
        ))}
      </ul>

      <h2 className="mb-2.5 mt-5 text-[22px] font-bold tracking-tight">Organização da sessão</h2>
      <div className="surface overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr>
              {["Bloco", "Duração", "Conteúdo", "Orientação"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-extrabold text-white" style={{ background: "var(--accent)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.organization.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="px-3 py-2.5 align-top">{row.block}</td>
                <td className="px-3 py-2.5 align-top">{row.duration} min</td>
                <td className="px-3 py-2.5 align-top">{row.content}</td>
                <td className="px-3 py-2.5 align-top">{row.guidance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2.5 mt-5 text-[22px] font-bold tracking-tight">Exercícios selecionados</h2>
      {plan.exercises.map((ex) => (
        <ExerciseCard key={ex.id} exercise={ex} minutes={plan.eachMinutes} />
      ))}

      <h2 className="mb-2.5 mt-5 text-[22px] font-bold tracking-tight">Mesociclo sugerido — 4 semanas</h2>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {MESOCICLO.map((week) => (
          <div key={week.title} className="surface p-3.5">
            <h4 className="m-0 mb-2 font-bold" style={{ color: "var(--accent2)" }}>
              {week.title}
            </h4>
            <ul className="m-0 list-disc pl-4 text-[13px] leading-relaxed">
              {week.items.map((item) => (
                <li key={item} className="mb-1.5">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Banco interno: {plan.bankSize} exercícios. A geração prioriza categoria, posição, foco, estrutura e fundamentos marcados.
      </p>
    </div>
  );
}
