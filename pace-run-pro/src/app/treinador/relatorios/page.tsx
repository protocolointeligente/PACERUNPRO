"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, FileSpreadsheet, FileText, FileType2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { athleteList, coachOverview, reportsList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

const reportTypes = [
  { id: "individual", label: "Relatório individual do atleta", description: "Evolução, treinos, check-ins e testes — PDF premium estilo IronGuides." },
  { id: "carga-equipe", label: "Carga da equipe", description: "Volume, RPE médio e adesão de todos os atletas no período." },
  { id: "avaliacao-fisica", label: "Avaliação física & testes", description: "VO2máx, VAM, limiar, RAST e composição corporal." },
  { id: "checkins", label: "Exportação de check-ins", description: "Histórico bruto de RPE, dor, sono, fadiga e humor para análise externa." },
] as const;

type ReportTypeId = (typeof reportTypes)[number]["id"];

const periods = ["Últimos 7 dias", "Últimos 30 dias", "Mês atual", "Ciclo completo", "Personalizado"];

const formats = [
  { id: "PDF", label: "PDF premium", description: "Layout estilo IronGuides, pronto para enviar ao atleta", icon: FileText, accent: "text-danger bg-danger/15" },
  { id: "Excel", label: "Excel (.xlsx)", description: "Planilhas dinâmicas para análise detalhada", icon: FileSpreadsheet, accent: "text-success bg-success/15" },
  { id: "CSV", label: "CSV", description: "Dados brutos para importar em outras ferramentas", icon: FileType2, accent: "text-info bg-info/15" },
] as const;

type FormatId = (typeof formats)[number]["id"];

const formatBadge: Record<string, "danger" | "success" | "info"> = { PDF: "danger", Excel: "success", CSV: "info" };

export default function ReportsPage() {
  const [scope, setScope] = useState<string>("equipe");
  const [reportType, setReportType] = useState<ReportTypeId>("individual");
  const [period, setPeriod] = useState(periods[1]);
  const [format, setFormat] = useState<FormatId>("PDF");
  const [generated, setGenerated] = useState(false);

  const athlete = useMemo(() => athleteList.find((a) => a.id === scope), [scope]);
  const needsAthlete = reportType === "individual" || reportType === "avaliacao-fisica";

  function generate() {
    setGenerated(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Relatórios</Badge>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Relatórios e exportações</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Gere relatórios em PDF premium no estilo IronGuides, planilhas Excel ou exportações CSV para acompanhar a
          evolução individual e da equipe — prontos para enviar aos seus atletas ou analisar offline.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* Generator */}
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-white">Tipo de relatório</h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {reportTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setGenerated(false);
                      setReportType(t.id);
                    }}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-colors",
                      reportType === t.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{t.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {needsAthlete && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-white">Atleta</h3>
                <select
                  value={scope}
                  onChange={(e) => {
                    setGenerated(false);
                    setScope(e.target.value);
                  }}
                  className={inputClass}
                >
                  <option value="equipe" className="bg-card text-white">Selecione um atleta…</option>
                  {athleteList.map((a) => (
                    <option key={a.id} value={a.id} className="bg-card text-white">
                      {a.name} — {a.goal}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-white">Período &amp; formato</h3>
              <label className="block max-w-sm">
                <span className={labelClass}>Período</span>
                <select
                  value={period}
                  onChange={(e) => {
                    setGenerated(false);
                    setPeriod(e.target.value);
                  }}
                  className={inputClass}
                >
                  {periods.map((p) => (
                    <option key={p} value={p} className="bg-card text-white">{p}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className={labelClass}>Formato de exportação</span>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {formats.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setGenerated(false);
                          setFormat(f.id);
                        }}
                        className={cn(
                          "rounded-xl border px-3.5 py-3 text-left transition-colors",
                          format === f.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                        )}
                      >
                        <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", f.accent)}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <p className="text-sm font-semibold text-white">{f.label}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">{f.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={generate} size="lg" className="w-full sm:w-auto">
                <Download className="h-4 w-4" /> Gerar relatório
              </Button>

              {generated && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-2.5 text-sm text-text-muted">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        <span>
                          Relatório <span className="font-semibold text-white">{reportTypes.find((t) => t.id === reportType)?.label}</span>{" "}
                          {needsAthlete && athlete ? <>de <span className="font-semibold text-white">{athlete.name}</span> </> : null}
                          gerado em <span className="font-semibold text-white">{format}</span> · {period.toLowerCase()}.
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Relatório: ${reportTypes.find((t) => t.id === reportType)?.label}\nAtleta: ${athlete?.name ?? "Equipe"}\nPeríodo: ${period}\nFormato: ${format}\nGerado em: ${new Date().toLocaleDateString("pt-BR")}`)}`}
                          download={`relatorio-${reportType}-${new Date().toISOString().slice(0,10)}.${format === "PDF" ? "pdf" : format === "Excel" ? "xlsx" : "csv"}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/30 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary/25 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Baixar {format}
                        </a>
                        <button onClick={() => setGenerated(false)} className="px-3 py-2 text-sm text-text-muted hover:text-white transition-colors">
                          Novo relatório
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/12 to-card">
            <CardContent className="p-5">
              <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-primary" /> PDF premium estilo IronGuides
              </h3>
              <p className="text-xs text-text-muted">
                Layout editorial com identidade visual da Pace Run Pro — capa com dados do atleta e do treinador
                ({coachOverview.name}, {coachOverview.credential}), gráficos de evolução, resumo de check-ins, recordes
                pessoais e recomendações para o próximo ciclo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5 text-xs text-text-muted">
              <div className="flex items-center justify-between">
                <span>Atletas monitorados</span>
                <span className="font-semibold text-white">{coachOverview.athletesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Treinos prescritos / semana</span>
                <span className="font-semibold text-white">{coachOverview.prescribedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Carga atual da equipe</span>
                <span className="font-semibold text-white">{Math.round(coachOverview.teamLoad * 100)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent reports */}
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Relatórios recentes</h3>
        <div className="space-y-2.5">
          {reportsList.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-text-muted">{r.period}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={formatBadge[r.type]}>{r.type}</Badge>
                  <Button size="sm" variant="secondary">
                    <Download className="h-3.5 w-3.5" /> Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
