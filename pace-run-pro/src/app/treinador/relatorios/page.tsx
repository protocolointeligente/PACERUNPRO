"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AthleteListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted";

const reportTypes = [
  { id: "individual",        label: "Relatório do atleta",        description: "Evolução, treinos, check-ins e testes no período." },
  { id: "avaliacao-fisica",  label: "Avaliação física completa",  description: "Composição corporal, circunferências, testes e evolução." },
  { id: "periodizacao",      label: "Periodização do macrociclo", description: "Plano completo de fases, volume e carga do período." },
  { id: "forca",             label: "Força — Schoenfeld",         description: "MEV/MRV, mesociclos e ondulação de intensidade." },
  { id: "carga-equipe",      label: "Carga da equipe",            description: "Volume, RPE médio e adesão de todos os atletas." },
  { id: "checkins",          label: "Exportação de check-ins",    description: "Histórico bruto de RPE, dor, sono, fadiga e humor." },
  { id: "financeiro",        label: "Receitas do marketplace",    description: "Exportação CSV das vendas e comissões do marketplace." },
] as const;

type ReportTypeId = (typeof reportTypes)[number]["id"];

const periods = ["Últimos 7 dias", "Últimos 30 dias", "Mês atual", "Ciclo completo", "Personalizado"];

const formats = [
  { id: "PDF",   label: "PDF",         description: "Relatório formatado, pronto para enviar ao atleta", icon: FileText,        accent: "text-danger bg-danger/15" },
  { id: "Excel", label: "Excel (.xlsx)", description: "Planilhas dinâmicas para análise detalhada",       icon: FileSpreadsheet, accent: "text-success bg-success/15" },
  { id: "CSV",   label: "CSV",         description: "Dados brutos para importar em outras ferramentas",  icon: FileType2,       accent: "text-info bg-info/15" },
] as const;

type FormatId = (typeof formats)[number]["id"];

// ── PDF template helpers ──────────────────────────────────────────────────────

const PDF_BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #C6F24E; color: #0A0C0F; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #C6F24E; padding-bottom: 20px; margin-bottom: 28px; }
  .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #C6F24E; }
  .logo span { color: #1a1a2e; }
  .meta { text-align: right; font-size: 12px; color: #666; line-height: 1.6; }
  h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .badge { display: inline-block; background: #C6F24E; color: #0A0C0F; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { margin-top: 28px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #C6F24E; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
  .stat-value { font-size: 22px; font-weight: 800; color: #1a1a2e; }
  .stat-unit { font-size: 12px; font-weight: 400; color: #888; margin-left: 3px; }
  .stat-delta { font-size: 11px; color: #22c55e; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f8f8f4; color: #444; font-weight: 700; text-align: left; padding: 9px 12px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #fafafa; }
  .bar-bg { background: #f0ebff; border-radius: 4px; height: 6px; }
  .bar-fill { background: linear-gradient(90deg, #C6F24E, #a3cc3e); border-radius: 4px; height: 6px; }
  .highlight { color: #C6F24E; font-weight: 700; }
  .tag { display: inline-block; background: #f0f9ff; color: #0284c7; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 12px; border: 1px solid #bae6fd; }
  .tag-green { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
  .tag-amber { background: #fffbeb; color: #d97706; border-color: #fcd34d; }
  p.notes { font-size: 13px; line-height: 1.7; color: #444; }
  .phase-row { display: flex; gap: 4px; margin: 12px 0; border-radius: 8px; overflow: hidden; }
  .phase-block { display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 700; padding: 8px 4px; }
  .signature-area { margin-top: 48px; display: flex; justify-content: flex-end; }
  .signature-box { text-align: center; border-top: 1px solid #333; padding-top: 8px; min-width: 220px; font-size: 12px; }
  .signature-name { font-weight: 700; font-size: 13px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
`;

function pdfHeader(coachName: string, coachCredential: string, today: string) {
  return `
<div class="header">
  <div>
    <div class="logo">PACE RUN <span>PRO</span></div>
    <div style="font-size:11px;color:#888;margin-top:4px;">Plataforma profissional de periodização esportiva</div>
  </div>
  <div class="meta">
    <strong>${coachName}</strong>${coachCredential ? ` — ${coachCredential}` : ""}<br/>
    Gerado em ${today}
  </div>
</div>`;
}

function pdfSignature(coachName: string, coachCredential: string) {
  return `
<div class="signature-area">
  <div class="signature-box">
    <div class="signature-name">${coachName}</div>
    <div style="color:#888;font-size:11px;">${coachCredential || "Treinador Profissional"}</div>
    <div style="color:#888;font-size:11px;margin-top:2px;">Assinatura</div>
  </div>
</div>`;
}

function pdfFooter(today: string) {
  return `
<div class="footer">
  <span>Pace Run Pro — Relatório gerado automaticamente para uso profissional</span>
  <span>${today}</span>
</div>`;
}

interface AssessmentData {
  assessedAt: string;
  weightKg:    number | null; bodyFatPct: number | null; muscleMassKg: number | null; bmi: number | null;
  waistCm:     number | null; hipCm: number | null; thighCm: number | null; calfCm: number | null;
  chestCm:     number | null; neckCm: number | null; armCm: number | null; forearmCm: number | null;
  vo2max:      number | null; restingHr: number | null; hrv: number | null; notes: string | null;
}

interface TeamAthleteRow {
  athleteId: string; name: string; totalKm: number;
  sessionsCompleted: number; adherencePct: number;
  avgRpe: number | null; totalLoad: number; status: "overreach" | "abaixo" | "ok";
}

interface TeamData {
  teamStats: {
    avgAdherence: number; avgRpe: number | null; avgVolumeKm: number;
    avgLoad: number; overreachCount: number; belowTargetCount: number; totalAthletes: number;
  } | null;
  athletes: TeamAthleteRow[];
}

interface ReportData {
  summary: {
    totalKm: number; sessionsCompleted: number; sessionsTotal: number;
    adherencePct: number; avgRpe: number; totalLoad: number; sessionsLost: number;
  };
  workouts: {
    date: string; title: string; distanceKm: number | null;
    paceStr: string | null; rpe: number | null; load: number | null; status: string;
  }[];
  checkIns: {
    date: string; rpe: number | null; pain: number | null;
    sleep: number | null; fatigue: number | null; mood: number | null;
  }[];
  assessment?: AssessmentData | null;
}

function workoutStatusTag(status: string) {
  if (status === "CONCLUIDO") return `<span class="tag-green tag">✓ Completo</span>`;
  if (status === "PERDIDO") return `<span class="tag-amber tag">✗ Perdido</span>`;
  return `<span class="tag">— Pendente</span>`;
}

function buildIndividualPdf(
  athleteName: string,
  period: string,
  coachName: string,
  coachCredential: string,
  today: string,
  data?: ReportData
): string {
  const s = data?.summary;
  const workoutRows = data?.workouts.map((w) => `
    <tr>
      <td>${w.date}</td>
      <td>${w.title}</td>
      <td>${w.distanceKm != null ? w.distanceKm + " km" : "—"}</td>
      <td>${w.paceStr ?? "—"}</td>
      <td>${w.rpe ?? "—"}</td>
      <td>${w.load ?? "—"}</td>
      <td>${workoutStatusTag(w.status)}</td>
    </tr>`).join("") ?? "";

  const checkInRows = data?.checkIns.map((c) => `
    <tr>
      <td>${c.date}</td>
      <td>${c.rpe ?? "—"}</td>
      <td>${c.pain != null ? c.pain + " / 10" : "—"}</td>
      <td>${c.sleep != null ? c.sleep + " / 10" : "—"}</td>
      <td>${c.fatigue != null ? c.fatigue + " / 10" : "—"}</td>
      <td>${c.mood != null ? c.mood + " / 10" : "—"}</td>
    </tr>`).join("") ?? "";

  const analysisText = s
    ? `${athleteName} realizou ${s.sessionsCompleted} de ${s.sessionsTotal} sessões no período, com ${s.adherencePct}% de adesão e volume total de ${s.totalKm} km. RPE médio: ${s.avgRpe}. Carga acumulada: ${s.totalLoad} UA.`
    : `Adicione observações sobre a evolução e recomendações para o próximo ciclo de ${athleteName}.`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Relatório ${athleteName}</title>
<style>${PDF_BASE_STYLES}</style></head><body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
${pdfHeader(coachName, coachCredential, today)}

<span class="badge">Relatório Individual</span>
<h1>${athleteName}</h1>
<p style="color:#666;font-size:13px;margin-bottom:4px;">Período: ${period}</p>

<div class="section">
  <div class="section-title">Resumo do período</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Volume total</div><div class="stat-value">${s?.totalKm ?? "—"}<span class="stat-unit">km</span></div>${s ? `<div class="stat-delta">Adesão: ${s.adherencePct}%</div>` : ""}</div>
    <div class="stat-card"><div class="stat-label">Sessões realizadas</div><div class="stat-value">${s?.sessionsCompleted ?? "—"}<span class="stat-unit">treinos</span></div>${s ? `<div class="stat-delta">${s.adherencePct}% de adesão</div>` : ""}</div>
    <div class="stat-card"><div class="stat-label">Carga acumulada</div><div class="stat-value">${s?.totalLoad ?? "—"}<span class="stat-unit">UA</span></div></div>
    <div class="stat-card"><div class="stat-label">RPE médio</div><div class="stat-value">${s?.avgRpe ?? "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Sessões programadas</div><div class="stat-value">${s?.sessionsTotal ?? "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Sessões perdidas</div><div class="stat-value">${s?.sessionsLost ?? "—"}</div></div>
  </div>
</div>

${workoutRows ? `<div class="section">
  <div class="section-title">Histórico de treinos</div>
  <table>
    <tr><th>Data</th><th>Treino</th><th>Distância</th><th>Pace</th><th>RPE</th><th>Carga UA</th><th>Status</th></tr>
    ${workoutRows}
  </table>
</div>` : ""}

${checkInRows ? `<div class="section">
  <div class="section-title">Check-ins de bem-estar</div>
  <table>
    <tr><th>Data</th><th>RPE pós</th><th>Dor muscular</th><th>Qualidade do sono</th><th>Fadiga</th><th>Humor</th></tr>
    ${checkInRows}
  </table>
</div>` : ""}

<div class="section">
  <div class="section-title">Análise e recomendações do treinador</div>
  <p class="notes">${analysisText}</p>
</div>

${pdfSignature(coachName, coachCredential)}
${pdfFooter(today)}
</body></html>`;
}

function fmt(v: number | null | undefined, decimals = 1): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function buildAvaliacaoPdf(
  athleteName: string,
  coachName: string,
  coachCredential: string,
  today: string,
  a?: AssessmentData | null,
): string {
  const noData = !a;
  const assessDate = a?.assessedAt ?? today;

  const circumferenceRows = [
    ["Cintura", a?.waistCm], ["Quadril", a?.hipCm], ["Coxa", a?.thighCm], ["Panturrilha", a?.calfCm],
    ["Peito", a?.chestCm], ["Pescoço", a?.neckCm], ["Braço", a?.armCm], ["Antebraço", a?.forearmCm],
  ].map(([label, val]) => `<tr><td>${label}</td><td>${fmt(val as number | null)} cm</td><td>—</td></tr>`).join("");

  const analysisText = a
    ? [
        a.bodyFatPct != null ? `Gordura corporal: ${fmt(a.bodyFatPct)}%.` : "",
        a.muscleMassKg != null ? `Massa muscular: ${fmt(a.muscleMassKg)} kg.` : "",
        a.vo2max != null ? `VO₂máx estimado: ${fmt(a.vo2max)} ml/kg/min.` : "",
        a.restingHr != null ? `FC repouso: ${a.restingHr} bpm.` : "",
        a.notes ? `\n\nObservações do treinador: ${a.notes}` : "",
      ].filter(Boolean).join(" ") || "Dados da avaliação registrados."
    : `Nenhuma avaliação física registrada para ${athleteName}. Realize uma avaliação em Atletas → Avaliação física para gerar um relatório com dados reais.`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Avaliação Física — ${athleteName}</title>
<style>${PDF_BASE_STYLES}
.tbl-comp td:first-child { font-weight: 600; color: #444; width: 200px; }
.tbl-comp td:nth-child(2) { color: #1a1a2e; font-weight: 700; }
.no-data-banner { background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;margin:16px 0;font-size:13px;color:#92400e; }
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
${pdfHeader(coachName, coachCredential, today)}

<span class="badge">Avaliação Física Completa</span>
<h1>${athleteName}</h1>
<p style="color:#666;font-size:13px;margin-bottom:4px;">Data da avaliação: ${assessDate}</p>

${noData ? `<div class="no-data-banner">⚠ Nenhuma avaliação física registrada para este atleta. Os campos abaixo mostram "—". Cadastre uma avaliação para obter o relatório completo.</div>` : ""}

<div class="section">
  <div class="section-title">Composição corporal</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Massa total</div><div class="stat-value">${fmt(a?.weightKg)}<span class="stat-unit">kg</span></div></div>
    <div class="stat-card"><div class="stat-label">Gordura corporal</div><div class="stat-value">${fmt(a?.bodyFatPct)}<span class="stat-unit">%</span></div></div>
    <div class="stat-card"><div class="stat-label">Massa muscular</div><div class="stat-value">${fmt(a?.muscleMassKg)}<span class="stat-unit">kg</span></div></div>
    <div class="stat-card"><div class="stat-label">IMC</div><div class="stat-value">${fmt(a?.bmi)}<span class="stat-unit">kg/m²</span></div></div>
    <div class="stat-card"><div class="stat-label">VO₂máx estimado</div><div class="stat-value">${fmt(a?.vo2max)}<span class="stat-unit">ml/kg/min</span></div></div>
    <div class="stat-card"><div class="stat-label">FC repouso</div><div class="stat-value">${a?.restingHr ?? "—"}<span class="stat-unit">bpm</span></div></div>
  </div>
</div>

${a?.hrv != null ? `<div class="section">
  <div class="section-title">Variabilidade da FC (HRV)</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">HRV (RMSSD)</div><div class="stat-value">${fmt(a.hrv)}<span class="stat-unit">ms</span></div></div>
  </div>
</div>` : ""}

<div class="section">
  <div class="section-title">Circunferências (cm)</div>
  <div class="grid-2">
    <table class="tbl-comp">
      <tr><th>Medida</th><th>Atual</th><th>Δ anterior</th></tr>
      ${circumferenceRows.slice(0, 4 * 3)}
    </table>
    <table class="tbl-comp">
      <tr><th>Medida</th><th>Atual</th><th>Δ anterior</th></tr>
      ${circumferenceRows.slice(4 * 3)}
    </table>
  </div>
</div>

<div class="section">
  <div class="section-title">Análise do treinador</div>
  <p class="notes">${analysisText}</p>
</div>

${pdfSignature(coachName, coachCredential)}
${pdfFooter(today)}
</body></html>`;
}

function buildPeriodizacaoPdf(
  athleteName: string,
  period: string,
  coachName: string,
  coachCredential: string,
  today: string,
  data?: ReportData
): string {
  const s = data?.summary;
  const phases = [
    { name: "Base",       weeks: 4, color: "#38bdf8", intensity: "60–65%", volume: "Alto",    focus: "Aeróbico extensivo, adaptação" },
    { name: "Construção", weeks: 5, color: "#6366f1", intensity: "70–78%", volume: "Muito alto", focus: "Limiar, VO₂máx, progressão" },
    { name: "Específico", weeks: 4, color: "#f59e0b", intensity: "80–88%", volume: "Médio",   focus: "Especificidade de prova, velocidade" },
    { name: "Taper",      weeks: 3, color: "#22c55e", intensity: "85–92%", volume: "Baixo",   focus: "Manutenção intensidade, recuperação" },
  ];

  const phaseBlocks = phases.map((p) =>
    `<div class="phase-block" style="flex:${p.weeks};background:${p.color}cc;">${p.name}<br/>${p.weeks}s</div>`
  ).join("");

  const phaseRows = phases.map((p) =>
    `<tr><td><strong style="color:${p.color}">${p.name}</strong></td><td>${p.weeks} semanas</td><td>${p.intensity} FCmáx</td><td>${p.volume}</td><td>${p.focus}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Periodização — ${athleteName}</title>
<style>${PDF_BASE_STYLES}</style></head><body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
${pdfHeader(coachName, coachCredential, today)}

<span class="badge">Periodização do Macrociclo</span>
<h1>${athleteName}</h1>
<p style="color:#666;font-size:13px;margin-bottom:4px;">Plano: ${period} · 16 semanas · Corrida</p>

<div class="section">
  <div class="section-title">Linha do tempo</div>
  <div class="phase-row">${phaseBlocks}</div>
  <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">
    ${phases.map((p) => `<span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#666;"><span style="display:inline-block;width:14px;height:10px;background:${p.color};border-radius:3px;"></span>${p.name}</span>`).join("")}
  </div>
</div>

<div class="section">
  <div class="section-title">Estrutura das fases</div>
  <table>
    <tr><th>Fase</th><th>Duração</th><th>Intensidade</th><th>Volume</th><th>Foco principal</th></tr>
    ${phaseRows}
  </table>
</div>

<div class="section">
  <div class="section-title">Métricas do plano</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Total de semanas</div><div class="stat-value">16</div></div>
    <div class="stat-card"><div class="stat-label">Deloads programados</div><div class="stat-value">4</div></div>
    <div class="stat-card"><div class="stat-label">Volume pico semanal</div><div class="stat-value">85<span class="stat-unit">km</span></div></div>
    <div class="stat-card"><div class="stat-label">Sessões / semana</div><div class="stat-value">5<span class="stat-unit">treinos</span></div></div>
    <div class="stat-card"><div class="stat-label">Carga total estimada</div><div class="stat-value">4.800<span class="stat-unit">UA</span></div></div>
    <div class="stat-card"><div class="stat-label">Prova alvo</div><div class="stat-value" style="font-size:14px;">Maratona</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Distribuição de intensidade (% do volume total)</div>
  <table>
    <tr><th>Zona</th><th>Descrição</th><th>% do volume</th><th>Visualização</th></tr>
    <tr><td><span class="highlight">Z1</span></td><td>Recuperação ativa</td><td>15%</td><td><div class="bar-bg"><div class="bar-fill" style="width:15%"></div></div></td></tr>
    <tr><td><span class="highlight">Z2</span></td><td>Base aeróbica</td><td>55%</td><td><div class="bar-bg"><div class="bar-fill" style="width:55%"></div></div></td></tr>
    <tr><td><span class="highlight">Z3</span></td><td>Limiar aeróbico</td><td>15%</td><td><div class="bar-bg"><div class="bar-fill" style="width:15%"></div></div></td></tr>
    <tr><td><span class="highlight">Z4</span></td><td>Limiar anaeróbico</td><td>10%</td><td><div class="bar-bg"><div class="bar-fill" style="width:10%"></div></div></td></tr>
    <tr><td><span class="highlight">Z5</span></td><td>VO₂máx</td><td>5%</td><td><div class="bar-bg"><div class="bar-fill" style="width:5%"></div></div></td></tr>
  </table>
</div>

${s ? `<div class="section">
  <div class="section-title">Dados reais do período: ${period}</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Volume realizado</div><div class="stat-value">${s.totalKm}<span class="stat-unit">km</span></div></div>
    <div class="stat-card"><div class="stat-label">Sessões realizadas</div><div class="stat-value">${s.sessionsCompleted}<span class="stat-unit">/${s.sessionsTotal}</span></div></div>
    <div class="stat-card"><div class="stat-label">Adesão</div><div class="stat-value">${s.adherencePct}<span class="stat-unit">%</span></div></div>
    <div class="stat-card"><div class="stat-label">RPE médio</div><div class="stat-value">${s.avgRpe}</div></div>
    <div class="stat-card"><div class="stat-label">Carga acumulada</div><div class="stat-value">${s.totalLoad}<span class="stat-unit">UA</span></div></div>
    <div class="stat-card"><div class="stat-label">Sessões perdidas</div><div class="stat-value">${s.sessionsLost}</div></div>
  </div>
</div>` : ""}

<div class="section">
  <div class="section-title">Observações do treinador</div>
  <p class="notes">
    Periodização linear-dupla com ênfase em volume aeróbico nas primeiras 9 semanas (Base + Construção).
    A fase Específica prioriza o pace de prova e corridas contínuas longas acima de 32 km.
    O Taper começa na semana 14, com redução progressiva de 40% do volume mantendo a intensidade.
    ${s ? `Dados do período registrado: ${s.totalKm} km totais, ${s.adherencePct}% de adesão, carga acumulada ${s.totalLoad} UA.` : ""}
  </p>
</div>

${pdfSignature(coachName, coachCredential)}
${pdfFooter(today)}
</body></html>`;
}

function buildForcaPdf(
  athleteName: string,
  coachName: string,
  coachCredential: string,
  today: string,
  data?: ReportData
): string {
  const s = data?.summary;
  const mesoTypes = [
    { name: "Anatomical Adaptation", weeks: 3, color: "#94a3b8", pct: 50, reps: "15–20", rir: 4 },
    { name: "Hypertrophy",           weeks: 4, color: "#6366f1", pct: 67, reps: "6–12",  rir: 2 },
    { name: "Basic Strength",        weeks: 4, color: "#38bdf8", pct: 78, reps: "4–6",   rir: 2 },
    { name: "Deload",                weeks: 1, color: "#22c55e", pct: 40, reps: "10–15", rir: 5 },
  ];

  const muscles = [
    { name: "Peitoral",   mev: 10, current: 14, mrv: 20 },
    { name: "Costas",     mev: 12, current: 15, mrv: 25 },
    { name: "Ombros",     mev: 8,  current: 12, mrv: 22 },
    { name: "Quadríceps", mev: 10, current: 14, mrv: 22 },
    { name: "Glúteos",    mev: 6,  current: 12, mrv: 20 },
    { name: "Core",       mev: 6,  current: 10, mrv: 20 },
  ];

  const phaseBlocks = mesoTypes.map((m) =>
    `<div class="phase-block" style="flex:${m.weeks};background:${m.color}cc;">${m.name.split(" ")[0]}<br/>${m.weeks}s</div>`
  ).join("");

  const mesoRows = mesoTypes.map((m) =>
    `<tr><td><strong style="color:${m.color}">${m.name}</strong></td><td>${m.weeks}s</td><td>${m.pct}% 1RM</td><td>${m.reps}</td><td>RIR ${m.rir}</td></tr>`
  ).join("");

  const muscleRows = muscles.map((m) => {
    const pct = Math.round((m.current / m.mrv) * 100);
    return `<tr><td>${m.name}</td><td>${m.mev}</td><td><strong>${m.current}</strong></td><td>${m.mrv}</td><td><div class="bar-bg" style="width:100px;display:inline-block;"><div class="bar-fill" style="width:${pct}%"></div></div></td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Força Periodização — ${athleteName}</title>
<style>${PDF_BASE_STYLES}</style></head><body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
${pdfHeader(coachName, coachCredential, today)}

<span class="badge">Força — Modelo Schoenfeld</span>
<h1>${athleteName}</h1>
<p style="color:#666;font-size:13px;margin-bottom:4px;">Periodização de 12 semanas · Hipertrofia · Intermediário</p>

<div class="section">
  <div class="section-title">Macrociclo</div>
  <div class="phase-row">${phaseBlocks}</div>
</div>

<div class="section">
  <div class="section-title">Estrutura dos mesociclos</div>
  <table>
    <tr><th>Fase</th><th>Duração</th><th>Intensidade</th><th>Repetições</th><th>RIR</th></tr>
    ${mesoRows}
  </table>
</div>

<div class="section">
  <div class="section-title">Volume por grupo muscular (séries / semana)</div>
  <table>
    <tr><th>Músculo</th><th>MEV</th><th>Atual</th><th>MRV</th><th>Volume relativo</th></tr>
    ${muscleRows}
  </table>
  <p style="font-size:11px;color:#888;margin-top:8px;">MEV = Mínimo Volume Efetivo · MRV = Máximo Volume Recuperável · Referência: Schoenfeld et al. (2017)</p>
</div>

<div class="section">
  <div class="section-title">Princípios aplicados</div>
  <div class="grid-2">
    <div class="stat-card"><div class="stat-label">Frequência</div><p style="font-size:13px;margin-top:6px;">Cada grupo muscular treinado ≥ 2×/semana para síntese proteica máxima.</p></div>
    <div class="stat-card"><div class="stat-label">Intensidade de hipertrofia</div><p style="font-size:13px;margin-top:6px;">67–85% 1RM com RIR 1–3 produz hipertrofia miofibrilar e sarcoplasmática.</p></div>
    <div class="stat-card"><div class="stat-label">Sobrecarga progressiva</div><p style="font-size:13px;margin-top:6px;">Aumento de 2–5% de carga ou 1–2 repetições a cada semana dentro do mesociclo.</p></div>
    <div class="stat-card"><div class="stat-label">Deload</div><p style="font-size:13px;margin-top:6px;">Redução de 30–40% do volume na semana 12, mantendo intensidade para supercompensação.</p></div>
  </div>
</div>

${s ? `<div class="section">
  <div class="section-title">Dados reais do período</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Sessões realizadas</div><div class="stat-value">${s.sessionsCompleted}<span class="stat-unit">/${s.sessionsTotal}</span></div></div>
    <div class="stat-card"><div class="stat-label">Adesão</div><div class="stat-value">${s.adherencePct}<span class="stat-unit">%</span></div></div>
    <div class="stat-card"><div class="stat-label">RPE médio</div><div class="stat-value">${s.avgRpe}</div></div>
    <div class="stat-card"><div class="stat-label">Carga acumulada</div><div class="stat-value">${s.totalLoad}<span class="stat-unit">UA</span></div></div>
    <div class="stat-card"><div class="stat-label">Sessões perdidas</div><div class="stat-value">${s.sessionsLost}</div></div>
  </div>
</div>` : ""}

${pdfSignature(coachName, coachCredential)}
${pdfFooter(today)}
</body></html>`;
}

function buildEquipePdf(
  coachName: string,
  coachCredential: string,
  today: string,
  period: string,
  teamData?: TeamData | null,
): string {
  const ts = teamData?.teamStats;
  const athleteRows = (teamData?.athletes ?? []).map((a) => {
    const statusTag =
      a.status === "overreach"
        ? `<span class="tag-amber tag">⚠ Overreach</span>`
        : a.status === "abaixo"
          ? `<span class="tag-amber tag">⚠ Abaixo</span>`
          : `<span class="tag-green tag">✓ OK</span>`;
    return `<tr>
      <td>${a.name}</td>
      <td>${fmt(a.totalKm)}</td>
      <td>${a.sessionsCompleted}</td>
      <td>${a.adherencePct}%</td>
      <td>${a.avgRpe != null ? fmt(a.avgRpe) : "—"}</td>
      <td>${a.totalLoad}</td>
      <td>${statusTag}</td>
    </tr>`;
  }).join("");

  const noData = !ts;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Carga da equipe</title>
<style>${PDF_BASE_STYLES}
.no-data-banner { background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;margin:16px 0;font-size:13px;color:#92400e; }
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">⬇ Salvar PDF</button>
${pdfHeader(coachName, coachCredential, today)}

<span class="badge">Carga da Equipe</span>
<h1>Equipe — ${ts?.totalAthletes ?? "—"} atletas</h1>
<p style="color:#666;font-size:13px;margin-bottom:4px;">Período: ${period}</p>

${noData ? `<div class="no-data-banner">⚠ Nenhum dado encontrado para o período selecionado.</div>` : ""}

<div class="section">
  <div class="section-title">Métricas da equipe</div>
  <div class="grid-3">
    <div class="stat-card"><div class="stat-label">Adesão média</div><div class="stat-value">${ts ? ts.avgAdherence : "—"}<span class="stat-unit">%</span></div></div>
    <div class="stat-card"><div class="stat-label">RPE médio</div><div class="stat-value">${ts?.avgRpe != null ? fmt(ts.avgRpe) : "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Volume médio/atleta</div><div class="stat-value">${ts ? fmt(ts.avgVolumeKm) : "—"}<span class="stat-unit">km</span></div></div>
    <div class="stat-card"><div class="stat-label">Carga média (UA)</div><div class="stat-value">${ts?.avgLoad ?? "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Atletas em overreach</div><div class="stat-value">${ts?.overreachCount ?? "—"}</div></div>
    <div class="stat-card"><div class="stat-label">Atletas abaixo da meta</div><div class="stat-value">${ts?.belowTargetCount ?? "—"}</div></div>
  </div>
</div>

${athleteRows ? `<div class="section">
  <div class="section-title">Resumo por atleta</div>
  <table>
    <tr><th>Atleta</th><th>Volume (km)</th><th>Sessões</th><th>Adesão</th><th>RPE médio</th><th>Carga UA</th><th>Status</th></tr>
    ${athleteRows}
  </table>
</div>` : ""}

${pdfSignature(coachName, coachCredential)}
${pdfFooter(today)}
</body></html>`;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [coachName, setCoachName] = useState("Treinador");
  const [coachCredential, setCoachCredential] = useState("");

  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => setAthletes(data))
      .catch(() => null);

    fetch("/api/coach/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { name?: string; credential?: string } | null) => {
        if (d?.name) setCoachName(d.name);
        if (d?.credential) setCoachCredential(d.credential);
      })
      .catch(() => null);
  }, []);

  const [scope, setScope] = useState<string>("equipe");
  const [reportType, setReportType] = useState<ReportTypeId>("individual");
  const [period, setPeriod] = useState(periods[1]);
  const [format, setFormat] = useState<FormatId>("PDF");
  const [generated, setGenerated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const athlete = useMemo(() => athletes.find((a) => a.id === scope), [athletes, scope]);
  const needsAthlete = reportType === "individual" || reportType === "avaliacao-fisica" || reportType === "periodizacao" || reportType === "forca";

  function generate() {
    setGenerated(true);
  }

  async function downloadReport() {
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const athleteName = needsAthlete && athlete ? athlete.name : "Equipe";
    const athleteId = needsAthlete && athlete ? athlete.id : "equipe";

    setDownloading(true);

    // Financial report — direct CSV download from revenue API
    if (reportType === "financeiro") {
      try {
        const res = await fetch("/api/coach/revenue?format=csv");
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `receitas-marketplace-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } finally {
        setDownloading(false);
      }
      return;
    }

    let reportData: ReportData | undefined;
    let teamData: TeamData | undefined;
    try {
      if (reportType === "carga-equipe") {
        const params = new URLSearchParams({ period });
        const res = await fetch(`/api/treinador/relatorios/equipe?${params}`);
        if (res.ok) teamData = await res.json() as TeamData;
      } else {
        const params = new URLSearchParams({ athleteId, period });
        const res = await fetch(`/api/treinador/relatorios/data?${params}`);
        if (res.ok) reportData = await res.json() as ReportData;
      }
    } catch {
      // proceed without data if fetch fails
    }
    setDownloading(false);

    if (format === "CSV") {
      const header = "Data,Atleta,RPE,Dor,Sono,Fadiga,Humor";
      const rows = reportData?.checkIns.map((c) =>
        `${c.date},${athleteName},${c.rpe ?? ""},${c.pain ?? ""},${c.sleep ?? ""},${c.fatigue ?? ""},${c.mood ?? ""}`
      ) ?? [];
      const csv = [header, ...rows].join("\n");
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
      const header = "Data\tAtleta\tRPE\tDor\tSono\tFadiga\tHumor";
      const rows = reportData?.checkIns.map((c) =>
        `${c.date}\t${athleteName}\t${c.rpe ?? ""}\t${c.pain ?? ""}\t${c.sleep ?? ""}\t${c.fatigue ?? ""}\t${c.mood ?? ""}`
      ) ?? [];
      const tsv = [header, ...rows].join("\n");
      const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportType}-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PDF — choose template by type
    let html = "";
    switch (reportType) {
      case "individual":
        html = buildIndividualPdf(athleteName, period, coachName, coachCredential, today, reportData);
        break;
      case "avaliacao-fisica":
        html = buildAvaliacaoPdf(athleteName, coachName, coachCredential, today, reportData?.assessment);
        break;
      case "periodizacao":
        html = buildPeriodizacaoPdf(athleteName, period, coachName, coachCredential, today, reportData);
        break;
      case "forca":
        html = buildForcaPdf(athleteName, coachName, coachCredential, today, reportData);
        break;
      case "carga-equipe":
        html = buildEquipePdf(coachName, coachCredential, today, period, teamData);
        break;
      default:
        html = buildIndividualPdf(athleteName, period, coachName, coachCredential, today, reportData);
    }

    const win = window.open("", "_blank", "width=960,height=800");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Badge variant="primary" className="mb-2">Relatórios</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Relatórios e exportações</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          PDFs profissionais com assinatura do treinador, planilhas Excel e exportações CSV —
          prontos para enviar ao atleta ou importar em outras ferramentas.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* Generator */}
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">Tipo de relatório</h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {reportTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setGenerated(false); setReportType(t.id); }}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-colors",
                      reportType === t.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                    )}
                  >
                    <p className="text-sm font-semibold text-text">{t.label}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{t.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {needsAthlete && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">Atleta</h3>
                <select
                  value={scope}
                  onChange={(e) => { setGenerated(false); setScope(e.target.value); }}
                  className={inputClass}
                >
                  <option value="equipe" className="bg-card text-text">Selecione um atleta…</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id} className="bg-card text-text">
                      {a.name} — {a.goal}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-sm font-semibold text-text">Período &amp; formato</h3>
              <label className="block max-w-sm">
                <span className={labelClass}>Período</span>
                <select
                  value={period}
                  onChange={(e) => { setGenerated(false); setPeriod(e.target.value); }}
                  className={inputClass}
                >
                  {periods.map((p) => (
                    <option key={p} value={p} className="bg-card text-text">{p}</option>
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
                        onClick={() => { setGenerated(false); setFormat(f.id); }}
                        className={cn(
                          "rounded-xl border px-3.5 py-3 text-left transition-colors",
                          format === f.id ? "border-primary/60 bg-primary/15" : "border-border bg-card-hover/30 hover:border-primary/30"
                        )}
                      >
                        <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", f.accent)}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <p className="text-sm font-semibold text-text">{f.label}</p>
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
                          Relatório <span className="font-semibold text-text">{reportTypes.find((t) => t.id === reportType)?.label}</span>{" "}
                          {needsAthlete && athlete ? <>de <span className="font-semibold text-text">{athlete.name}</span> </> : null}
                          pronto — <span className="font-semibold text-text">{format}</span> · {period.toLowerCase()}.
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={downloadReport}
                          disabled={downloading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/30 px-3.5 py-2 text-sm font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {downloading ? "Carregando dados..." : format === "PDF" ? "Abrir PDF" : `Baixar ${format}`}
                        </button>
                        <button onClick={() => setGenerated(false)} className="px-3 py-2 text-sm text-text-muted hover:text-text transition-colors">
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
          <Card>
            <CardContent className="space-y-3 p-5 text-xs text-text-muted">
              <p className="text-sm font-semibold text-text mb-3">Visão geral</p>
              <div className="flex items-center justify-between">
                <span>Atletas monitorados</span>
                <span className="font-semibold text-text">{athletes.length || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tipos de relatório</span>
                <span className="font-semibold text-text">{reportTypes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Formatos de exportação</span>
                <span className="font-semibold text-text">PDF · Excel · CSV</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-text mb-3">PDFs disponíveis</p>
              <div className="space-y-2">
                {[
                  { label: "Relatório individual",        badge: "Treinos + check-ins + análise" },
                  { label: "Avaliação física",            badge: "Composição + dobras + testes" },
                  { label: "Periodização do macrociclo",  badge: "Fases + volume + intensidade" },
                  { label: "Força Schoenfeld",            badge: "MEV/MRV + mesociclos" },
                  { label: "Carga da equipe",             badge: "Resumo por atleta" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-text">{item.label}</span>
                    <span className="text-[10px] text-text-muted">{item.badge}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-4 leading-relaxed">
                Todos os PDFs incluem assinatura do treinador, cabeçalho da assessoria e rodapé datado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent reports placeholder */}
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-text">Relatórios recentes</h3>
        <p className="py-4 text-center text-sm text-text-muted">Nenhum relatório gerado ainda.</p>
      </div>
    </div>
  );
}
