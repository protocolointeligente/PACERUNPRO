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

  function downloadReport() {
    const reportLabel = reportTypes.find((t) => t.id === reportType)?.label ?? reportType;
    const athleteName = needsAthlete && athlete ? athlete.name : "Equipe";
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    if (format === "CSV") {
      const csv = [
        "Data,Atleta,RPE,Dor,Sono,Fadiga,Humor",
        "01/06/2026," + athleteName + ",7,2,7,4,8",
        "03/06/2026," + athleteName + ",6,1,8,3,9",
        "05/06/2026," + athleteName + ",8,3,6,6,7",
        "07/06/2026," + athleteName + ",5,1,9,2,8",
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === "Excel") {
      const tsv = "Data\tAtleta\tRPE\tDor\tSono\tFadiga\tHumor\n01/06/2026\t" + athleteName + "\t7\t2\t7\t4\t8\n03/06/2026\t" + athleteName + "\t6\t1\t8\t3\t9\n";
      const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportType}-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PDF — open formatted HTML in new window and trigger print
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório Pace Run Pro</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 28px; }
  .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #8b5cf6; }
  .logo span { color: #1a1a2e; }
  .meta { text-align: right; font-size: 12px; color: #666; }
  h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .badge { display: inline-block; background: #8b5cf6; color: #fff; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 16px; }
  .section { margin-top: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8b5cf6; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .stat-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
  .stat-value { font-size: 20px; font-weight: 800; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f5f3ff; color: #8b5cf6; font-weight: 700; text-align: left; padding: 9px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .bar-bg { background: #f0ebff; border-radius: 4px; height: 8px; }
  .bar-fill { background: #8b5cf6; border-radius: 4px; height: 8px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #8b5cf6; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
<div class="header">
  <div class="logo">PACE RUN <span>PRO</span></div>
  <div class="meta">
    <strong>Treinador Ricardo Pace</strong> — CREF 014626-G/MG<br/>
    Gerado em ${today}
  </div>
</div>

<span class="badge">${reportLabel}</span>
<h1>${athleteName} — ${period}</h1>

<div class="section">
  <div class="section-title">Resumo do período</div>
  <div class="grid">
    <div class="stat-card"><div class="stat-label">Volume total</div><div class="stat-value">127 km</div></div>
    <div class="stat-card"><div class="stat-label">Sessões</div><div class="stat-value">18</div></div>
    <div class="stat-card"><div class="stat-label">Adesão</div><div class="stat-value">86%</div></div>
    <div class="stat-card"><div class="stat-label">RPE médio</div><div class="stat-value">6.4</div></div>
    <div class="stat-card"><div class="stat-label">Carga total (UA)</div><div class="stat-value">1.872</div></div>
    <div class="stat-card"><div class="stat-label">Pace médio</div><div class="stat-value">5:12/km</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Histórico de treinos</div>
  <table>
    <tr><th>Data</th><th>Treino</th><th>Dist.</th><th>Pace</th><th>RPE</th><th>Carga UA</th></tr>
    <tr><td>07/06</td><td>Intervalado 8×400m</td><td>9.2 km</td><td>4:38/km</td><td>7</td><td>124</td></tr>
    <tr><td>05/06</td><td>Longo progressivo</td><td>18 km</td><td>5:20/km</td><td>6</td><td>216</td></tr>
    <tr><td>03/06</td><td>Trote regenerativo</td><td>5 km</td><td>6:10/km</td><td>3</td><td>45</td></tr>
    <tr><td>01/06</td><td>Tempo run 8 km</td><td>8 km</td><td>4:52/km</td><td>7</td><td>168</td></tr>
    <tr><td>29/05</td><td>Fartlek 10 km</td><td>10 km</td><td>5:05/km</td><td>6</td><td>180</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Check-ins — Bem-estar</div>
  <table>
    <tr><th>Data</th><th>RPE</th><th>Dor</th><th>Sono</th><th>Fadiga</th><th>Humor</th></tr>
    <tr><td>07/06</td><td>7</td><td>2</td><td>7</td><td>4</td><td>8</td></tr>
    <tr><td>05/06</td><td>6</td><td>1</td><td>8</td><td>3</td><td>9</td></tr>
    <tr><td>03/06</td><td>8</td><td>3</td><td>6</td><td>6</td><td>7</td></tr>
    <tr><td>01/06</td><td>5</td><td>1</td><td>9</td><td>2</td><td>8</td></tr>
  </table>
</div>

<div class="section">
  <div class="section-title">Recomendações para o próximo ciclo</div>
  <p style="font-size:13px;line-height:1.7;color:#444;">
    O atleta apresentou boa progressão de volume nas últimas 4 semanas, com adesão acima da média.
    Recomenda-se manutenção do volume na semana de deload e introdução de um treino de limiar de 10 km
    no próximo mesociclo. Monitorar fadiga nos dias após o treino longo.
  </p>
</div>

<div class="footer">
  <span>Pace Run Pro © ${new Date().getFullYear()} — Relatório gerado automaticamente</span>
  <span>${today}</span>
</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
                        <button
                          onClick={downloadReport}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/30 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary/25 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          {format === "PDF" ? "Abrir PDF" : `Baixar ${format}`}
                        </button>
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
