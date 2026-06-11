"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export default function IdentidadePage() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          6
        </span>
        Identidade visual
      </h2>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4">
          <h3 className="m-0 mb-2 text-base font-bold">Paleta Azul Performance</h3>
          <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Preto como base, azul elétrico como acento e branco para leitura. Sensação: tecnologia, precisão e análise tática.
          </p>
          <button type="button" className="btn" onClick={() => setAccent("blue")} disabled={accent === "blue"}>
            {accent === "blue" ? "Azul aplicado" : "Aplicar azul"}
          </button>
        </div>
        <div className="card p-4">
          <h3 className="m-0 mb-2 text-base font-bold">Paleta Laranja Impacto</h3>
          <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Preto como base, laranja de alta energia como acento. Sensação: treino, intensidade, ação e performance.
          </p>
          <button type="button" className="btn" onClick={() => setAccent("orange")} disabled={accent === "orange"}>
            {accent === "orange" ? "Laranja aplicado" : "Aplicar laranja"}
          </button>
        </div>
        <div className="card p-4">
          <h3 className="m-0 mb-2 text-base font-bold">Logo</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Escudo com monograma FC, campo tático e visual de aplicativo. Funciona em ícone, PDF, prancheta e material digital.
          </p>
        </div>
      </div>
    </div>
  );
}
