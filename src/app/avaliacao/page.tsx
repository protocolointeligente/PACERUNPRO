const ROWS: [string, string, string][] = [
  ["Ataque", "Conservar a bola", "Apoios, mobilidade e passe seguro"],
  ["Ataque", "Progredir", "Passe vertical, condução ou terceiro homem"],
  ["Ataque", "Criar e finalizar", "Último passe, cruzamento, finalização"],
  ["Defesa", "Proteger a baliza", "Compactação, cobertura e controle de profundidade"],
  ["Defesa", "Recuperar a bola", "Pressão, interceptação e desarme"],
  ["Transição ofensiva", "Acelerar após recuperar", "Primeiro passe para frente ou retirada da pressão"],
  ["Transição defensiva", "Reagir após perder", "Pressão imediata ou temporização"],
];

export default function AvaliacaoPage() {
  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          5
        </span>
        Avaliação por princípios
      </h2>
      <div className="surface overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr>
              {["Dimensão", "Critério", "Indicadores observáveis"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-extrabold text-white" style={{ background: "var(--accent)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--line)" }}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2.5 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
