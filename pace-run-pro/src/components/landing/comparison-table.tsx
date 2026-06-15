import { Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type CellValue = true | false | "partial";

const comparisonRows: { feature: string; paceRunPro: CellValue; excel: CellValue; strava: CellValue }[] = [
  { feature: "Prescrição de treino personalizada", paceRunPro: true, excel: "partial", strava: false },
  { feature: "Periodização profissional (macro, meso e microciclos)", paceRunPro: true, excel: "partial", strava: false },
  { feature: "Treino de musculação estruturado", paceRunPro: true, excel: "partial", strava: false },
  { feature: "Check-in diário com ajuste automático por IA", paceRunPro: true, excel: false, strava: false },
  { feature: "Relatórios em PDF para o atleta", paceRunPro: true, excel: "partial", strava: false },
  { feature: "Gestão de múltiplos atletas (treinador/assessoria)", paceRunPro: true, excel: "partial", strava: "partial" },
  { feature: "Integração com Garmin, Polar, Coros, Suunto e Apple Watch", paceRunPro: true, excel: false, strava: "partial" },
  { feature: "Histórico de evolução, recordes e conquistas", paceRunPro: true, excel: "partial", strava: true },
];

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-success" />;
  if (value === "partial") return <Minus className="mx-auto h-5 w-5 text-warning" />;
  return <X className="mx-auto h-5 w-5 text-text-muted/40" />;
}

export function ComparisonTable() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <Badge variant="info" className="mb-4">Comparativo</Badge>
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
            Por que trocar a{" "}
            <span className="gradient-text">planilha</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Strava registra. Planilha organiza. O Pace Run Pro prescreve, ajusta e acompanha — tudo
            automaticamente.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="p-4 text-left font-display font-semibold text-text">Recurso</th>
                <th className="bg-primary/10 p-4 text-center font-display font-semibold text-primary">
                  <div className="flex flex-col items-center gap-1.5">
                    <Logo variant="mark" size={22} />
                    Pace Run Pro
                  </div>
                </th>
                <th className="p-4 text-center font-display font-semibold text-text-muted">
                  Planilha / Excel
                </th>
                <th className="p-4 text-center font-display font-semibold text-text-muted">
                  Strava / apps genéricos
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-card/40")}
                >
                  <td className="p-4 text-text">{row.feature}</td>
                  <td className="bg-primary/5 p-4">
                    <ComparisonCell value={row.paceRunPro} />
                  </td>
                  <td className="p-4">
                    <ComparisonCell value={row.excel} />
                  </td>
                  <td className="p-4">
                    <ComparisonCell value={row.strava} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-text-muted">
          &ldquo;Parcial&rdquo; = recurso existe apenas de forma manual, limitada ou via ferramentas
          adicionais.
        </p>
      </div>
    </section>
  );
}
