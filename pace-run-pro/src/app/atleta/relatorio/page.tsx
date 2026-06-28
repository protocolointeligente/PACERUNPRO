"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

const VARIABLES = [
  { key: "volume", label: "Volume (km/semana)" },
  { key: "pace", label: "Ritmo médio" },
  { key: "fc", label: "Frequência cardíaca" },
  { key: "vo2", label: "VO₂máx" },
  { key: "wellness", label: "Bem-estar (sono, fadiga, humor)" },
  { key: "provas", label: "Resultados de provas" },
  { key: "peso", label: "Histórico de peso" },
];

export default function RelatorioPage() {
  const [selected, setSelected] = useState<string[]>(VARIABLES.map((v) => v.key));
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function downloadPdf() {
    if (!selected.length) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/atleta/evolucao/pdf?vars=${selected.join(",")}`);
      if (!res.ok) { alert("Erro ao gerar relatório. Tente novamente."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio-evolucao.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-text">Relatório de Evolução</h1>
        </div>
        <p className="text-sm text-text-muted">Selecione as variáveis que deseja incluir no PDF.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Variáveis</p>
        {VARIABLES.map((v) => (
          <label key={v.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 hover:border-primary/40 transition-colors">
            <input
              type="checkbox"
              checked={selected.includes(v.key)}
              onChange={() => toggle(v.key)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium text-text">{v.label}</span>
          </label>
        ))}
      </div>

      <div className="rounded-xl border border-border/50 bg-card-hover/30 px-4 py-3">
        <p className="text-xs text-text-muted">
          O relatório cobre as <strong className="text-text">últimas 12 semanas</strong> de dados registrados na plataforma. Quanto mais treinos e check-ins registrados, mais completo o relatório.
        </p>
      </div>

      <button
        onClick={downloadPdf}
        disabled={loading || selected.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando PDF…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Baixar relatório PDF
          </>
        )}
      </button>
    </div>
  );
}
