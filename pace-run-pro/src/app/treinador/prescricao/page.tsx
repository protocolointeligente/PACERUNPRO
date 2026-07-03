"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  CalendarDays,
  Save,
  ToggleLeft,
  ToggleRight,
  Copy,
  Users,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StructuredWorkoutBuilder, type WorkoutBlock } from "@/components/workout/structured-workout-builder";
import type { AthleteListItem } from "@/lib/types";

// ── Runner SVG icon ───────────────────────────────────────────────────────────

function RunnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="14" cy="4" r="2" />
      <path d="M8 18 L10.5 13.5" />
      <path d="M10.5 13.5 L8.5 10" />
      <path d="M8.5 10 L12 7.5 L15 9.5" />
      <path d="M15 9.5 L17.5 7" />
      <path d="M10.5 13.5 L13.5 16 L16.5 13.5" />
      <path d="M13.5 16 L14.5 20" />
    </svg>
  );
}

// ── Sport config ─────────────────────────────────────────────────────────────

type SportMode = "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "OTHER";
type IntensityMethod = "VDOT" | "ZONES" | "FTP" | "CSS" | "RPE" | "1RM_PCT";

const SPORTS: {
  id: SportMode;
  label: string;
  Icon: React.ElementType;
  color: string;
  methods: { id: IntensityMethod; label: string }[];
}[] = [
  {
    id: "RUN", label: "Corrida", Icon: RunnerIcon, color: "#f97316",
    methods: [
      { id: "VDOT",  label: "VDOT" },
      { id: "ZONES", label: "Zonas de FC" },
      { id: "RPE",   label: "RPE" },
    ],
  },
  {
    id: "BIKE", label: "Ciclismo", Icon: ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
        <path d="M15 6a1 1 0 0 0-1-1h-2v2"/><path d="M6 17.5l6-11 3.5 5.5"/>
        <path d="M12 6.5 L15 17.5 L18.5 14"/><path d="M5.5 17.5 L10 9"/>
      </svg>
    ), color: "#3b82f6",
    methods: [
      { id: "FTP",   label: "Zonas FTP" },
      { id: "ZONES", label: "Zonas FC" },
      { id: "RPE",   label: "RPE" },
    ],
  },
  {
    id: "SWIM", label: "Natação", Icon: ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12 C3.5 10.5 5 10.5 6.5 12 C8 13.5 9.5 13.5 11 12 C12.5 10.5 14 10.5 15.5 12 C17 13.5 18.5 13.5 20 12 C21.5 10.5 22 10.5 22 12"/>
        <path d="M7 8 L11 4 L14 7 L17 5"/>
        <circle cx="17" cy="3" r="2"/>
      </svg>
    ), color: "#06b6d4",
    methods: [
      { id: "CSS",   label: "CSS (ritmo)" },
      { id: "ZONES", label: "Zonas FC" },
      { id: "RPE",   label: "RPE" },
    ],
  },
  {
    id: "STRENGTH", label: "Força", Icon: ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2 L14.5 22 M9.5 2 L9.5 22"/>
        <rect x="6" y="5" width="12" height="3" rx="1.5"/>
        <rect x="6" y="16" width="12" height="3" rx="1.5"/>
        <path d="M3 8 L6 8 M18 8 L21 8 M3 16 L6 16 M18 16 L21 16"/>
      </svg>
    ), color: "#a855f7",
    methods: [
      { id: "1RM_PCT", label: "% de 1RM" },
      { id: "RPE",     label: "RPE" },
    ],
  },
  {
    id: "OTHER", label: "Outro", Icon: ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
      </svg>
    ), color: "#6b7280",
    methods: [{ id: "RPE", label: "RPE" }],
  },
];

const WORKOUT_TYPES: Record<SportMode, { value: string; label: string }[]> = {
  RUN: [
    { value: "RODAGEM_LEVE",      label: "Rodagem Leve" },
    { value: "REGENERATIVO",      label: "Regenerativo" },
    { value: "PROGRESSIVO",       label: "Progressivo" },
    { value: "TEMPO_RUN",         label: "Tempo Run" },
    { value: "FARTLEK",           label: "Fartlek" },
    { value: "INTERVALADO_LONGO", label: "Intervalado Longo" },
    { value: "INTERVALADO_CURTO", label: "Intervalado Curto" },
    { value: "LONGAO",            label: "Longão" },
    { value: "SUBIDA",            label: "Subida" },
    { value: "PROVA",             label: "Prova" },
  ],
  BIKE: [
    { value: "ENDURANCE_BIKE",  label: "Endurance / Z2 Base" },
    { value: "SWEET_SPOT",      label: "Sweet Spot" },
    { value: "TEMPO_BIKE",      label: "Tempo" },
    { value: "THRESHOLD_BIKE",  label: "Limiar" },
    { value: "VO2MAX_BIKE",     label: "VO2máx" },
    { value: "RECOVERY_BIKE",   label: "Recuperação Ativa" },
    { value: "LONG_RIDE",       label: "Saída Longa" },
  ],
  SWIM: [
    { value: "TECNICA_NATACAO",     label: "Técnica" },
    { value: "ENDURANCE_NATACAO",   label: "Endurance / Base" },
    { value: "INTERVALADO_NATACAO", label: "Intervalados" },
    { value: "LIMIAR_NATACAO",      label: "Limiar / CSS" },
    { value: "SPRINT_NATACAO",      label: "Sprint" },
    { value: "RECUPERACAO_NATACAO", label: "Recuperação" },
    { value: "AGUAS_ABERTAS",       label: "Águas Abertas" },
  ],
  STRENGTH: [
    { value: "FORCA",       label: "Força" },
    { value: "FUNCIONAL",   label: "Funcional" },
    { value: "MOBILIDADE",  label: "Mobilidade" },
    { value: "RECUPERACAO", label: "Recuperação" },
  ],
  OTHER: [
    { value: "RECUPERACAO", label: "Recuperação" },
    { value: "MOBILIDADE",  label: "Mobilidade" },
    { value: "PROVA",       label: "Prova / Evento" },
    { value: "FUNCIONAL",   label: "Funcional" },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  RODAGEM_LEVE: "#84cc16", INTERVALADO_CURTO: "#ef4444",
  INTERVALADO_LONGO: "#FFB020", TEMPO_RUN: "#eab308", FARTLEK: "#a78bfa",
  PROGRESSIVO: "#38bdf8", LONGAO: "#22c55e", REGENERATIVO: "#94a3b8",
  SUBIDA: "#fb923c", PROVA: "#ec4899",
  ENDURANCE_BIKE: "#3b82f6", SWEET_SPOT: "#8b5cf6", TEMPO_BIKE: "#f59e0b",
  THRESHOLD_BIKE: "#ef4444", VO2MAX_BIKE: "#ec4899", RECOVERY_BIKE: "#10b981",
  LONG_RIDE: "#06b6d4",
  TECNICA_NATACAO: "#06b6d4", ENDURANCE_NATACAO: "#22c55e",
  INTERVALADO_NATACAO: "#f97316", LIMIAR_NATACAO: "#ef4444",
  SPRINT_NATACAO: "#ec4899", RECUPERACAO_NATACAO: "#94a3b8",
  AGUAS_ABERTAS: "#0ea5e9", FORCA: "#46E0C8", FUNCIONAL: "#46E0C8",
  MOBILIDADE: "#84cc16", RECUPERACAO: "#94a3b8",
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  CONCLUIDO: { label: "Concluído", color: "text-success" },
  LIBERADO:  { label: "Programado", color: "text-text-muted" },
  AGENDADO:  { label: "Agendado",   color: "text-text-muted" },
  PERDIDO:   { label: "Perdido",    color: "text-danger" },
  AJUSTADO:  { label: "Ajustado",   color: "text-warning" },
};

// ── VDOT pace table (Jack Daniels, per km) ───────────────────────────────────

const VDOT_PACES: Record<number, { E: string; M: string; T: string; I: string; R: string }> = {
  30: { E: "8:19", M: "7:25", T: "7:00", I: "6:38", R: "6:19" },
  35: { E: "7:20", M: "6:33", T: "6:09", I: "5:52", R: "5:36" },
  40: { E: "6:33", M: "5:50", T: "5:29", I: "5:12", R: "4:58" },
  45: { E: "5:56", M: "5:19", T: "4:59", I: "4:44", R: "4:31" },
  50: { E: "5:27", M: "4:54", T: "4:35", I: "4:21", R: "4:09" },
  55: { E: "5:04", M: "4:32", T: "4:15", I: "4:01", R: "3:50" },
  60: { E: "4:44", M: "4:14", T: "3:58", I: "3:45", R: "3:35" },
  65: { E: "4:27", M: "3:59", T: "3:43", I: "3:31", R: "3:22" },
  70: { E: "4:13", M: "3:46", T: "3:31", I: "3:19", R: "3:11" },
  75: { E: "4:00", M: "3:34", T: "3:20", I: "3:08", R: "3:00" },
};

function lookupVdot(v: number) {
  const keys = Object.keys(VDOT_PACES).map(Number).sort((a, b) => a - b);
  const low = keys.filter((k) => k <= v).at(-1);
  const high = keys.filter((k) => k > v)[0];
  if (!low && !high) return null;
  if (!low) return VDOT_PACES[high!];
  if (!high) return VDOT_PACES[low];
  const t = (v - low) / (high - low);
  const lerp = (a: string, b: string) => {
    const toSec = (s: string) => { const [m, sec] = s.split(":").map(Number); return m * 60 + sec; };
    const fromSec = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    return fromSec(toSec(a) + t * (toSec(b) - toSec(a)));
  };
  return {
    E: lerp(VDOT_PACES[low].E, VDOT_PACES[high].E),
    M: lerp(VDOT_PACES[low].M, VDOT_PACES[high].M),
    T: lerp(VDOT_PACES[low].T, VDOT_PACES[high].T),
    I: lerp(VDOT_PACES[low].I, VDOT_PACES[high].I),
    R: lerp(VDOT_PACES[low].R, VDOT_PACES[high].R),
  };
}

// ── Zone tables ───────────────────────────────────────────────────────────────

const FC_ZONES = [
  { zone: "Z1", label: "Recuperação Ativa",  fcPct: "<60%",    rpe: "1–3",  color: "#94a3b8" },
  { zone: "Z2", label: "Aeróbico Base",       fcPct: "60–70%",  rpe: "4–5",  color: "#22c55e" },
  { zone: "Z3", label: "Tempo / Aeróbico+",  fcPct: "71–80%",  rpe: "6–7",  color: "#eab308" },
  { zone: "Z4", label: "Limiar Anaeróbico",  fcPct: "81–90%",  rpe: "8",    color: "#f97316" },
  { zone: "Z5", label: "VO₂máx",             fcPct: ">90%",    rpe: "9–10", color: "#ef4444" },
];

const FTP_ZONES = [
  { zone: "Z1", label: "Recuperação Ativa",  ftpPct: "<55%",    color: "#94a3b8" },
  { zone: "Z2", label: "Endurance",          ftpPct: "56–75%",  color: "#22c55e" },
  { zone: "Z3", label: "Tempo",              ftpPct: "76–90%",  color: "#38bdf8" },
  { zone: "Z4", label: "Limiar (Sweet Spot)", ftpPct: "91–105%", color: "#eab308" },
  { zone: "Z5", label: "VO₂máx",            ftpPct: "106–120%", color: "#f97316" },
  { zone: "Z6", label: "Capacidade Anaeróbica", ftpPct: ">121%", color: "#ef4444" },
];

const CSS_ZONES = [
  { zone: "T1", label: "Volume / Base",     cssOffset: "+15s",   color: "#22c55e" },
  { zone: "T2", label: "Aeróbico",          cssOffset: "+10s",   color: "#38bdf8" },
  { zone: "T3", label: "Limiar CSS−",       cssOffset: "+5s",    color: "#eab308" },
  { zone: "T4", label: "Ritmo CSS",         cssOffset: "CSS",    color: "#f97316" },
  { zone: "T5", label: "Sprint / Potência", cssOffset: "Abaixo", color: "#ef4444" },
];

// ── Strength auto-generate ───────────────────────────────────────────────────

const STRENGTH_OBJECTIVES = [
  { id: "HIPERTROFIA", label: "Hipertrofia" },
  { id: "FORCA_MAX",   label: "Força Máxima" },
  { id: "POTENCIA",    label: "Potência" },
  { id: "FUNCIONAL",   label: "Funcional" },
  { id: "RESISTENCIA", label: "Resistência" },
  { id: "DELOAD",      label: "Deload" },
];

const MUSCLE_GROUPS = [
  { id: "FULL_BODY",  label: "Full Body" },
  { id: "INFERIORES", label: "Membros Inferiores" },
  { id: "SUPERIORES", label: "Membros Superiores" },
  { id: "PUSH",       label: "Push (empurrar)" },
  { id: "PULL",       label: "Pull (puxar)" },
  { id: "CORE",       label: "Core / Estabilização" },
];

function buildStrengthSuggestion(obj: string, group: string): { title: string; mainSet: string; duration: number; rpe: number; pct1RM: number } {
  const t: Record<string, Record<string, { title: string; mainSet: string; duration: number; rpe: number; pct1RM: number }>> = {
    HIPERTROFIA: {
      FULL_BODY: { title: "Hipertrofia — Full Body", mainSet: "Aquecimento: 5min mobilidade geral\n\nA. Agachamento 4×10 @70% 1RM (descanso 90s)\nB. Supino Reto 3×10 @70% 1RM (descanso 90s)\nC. Remada Curvada 3×10 @68% 1RM (descanso 90s)\nD. Desenvolvimento 3×12 RPE 7\nE1. Rosca Direta 3×12 RPE 6\nE2. Tríceps Corda 3×12 RPE 6\nF. Panturrilha 3×15\n\nVolta à calma: 5min", duration: 75, rpe: 7, pct1RM: 70 },
      INFERIORES: { title: "Hipertrofia — Membros Inferiores", mainSet: "Aquecimento: 5min mobilidade articular\n\nA. Agachamento Livre 4×10 @70% 1RM (descanso 90s)\nB. Leg Press 3×12 @65% 1RM (descanso 60s)\nC1. Afundo Alternado 3×12/perna RPE 7\nC2. Mesa Flexora 3×12 RPE 7\nD. Panturrilha em Pé 4×15 (descanso 45s)\n\nVolta à calma: 5min alongamento", duration: 65, rpe: 7, pct1RM: 70 },
      SUPERIORES: { title: "Hipertrofia — Membros Superiores", mainSet: "Aquecimento: 5min mobilidade escapular\n\nA. Supino Reto 4×10 @70% 1RM (descanso 90s)\nB. Remada Curvada 4×10 @70% 1RM (descanso 90s)\nC1. Desenvolvimento Halter 3×12 RPE 7\nC2. Puxada Frontal 3×12 RPE 7\nD1. Rosca Direta 3×12 RPE 6\nD2. Tríceps Testa 3×12 RPE 6\n\nVolta à calma: 5min", duration: 65, rpe: 7, pct1RM: 70 },
      PUSH: { title: "Hipertrofia — Push (Empurrar)", mainSet: "Aquecimento: 5min mobilidade de ombros\n\nA. Supino Reto 4×10 @70% 1RM (descanso 90s)\nB. Supino Inclinado 3×12 @65% 1RM (descanso 90s)\nC. Desenvolvimento Halter 3×12 RPE 7\nD. Elevação Lateral 4×15 RPE 6\nE1. Tríceps Corda 3×15 RPE 6\nE2. Tríceps Banco 3×15 RPE 6\n\nVolta à calma: 5min", duration: 60, rpe: 7, pct1RM: 68 },
      PULL: { title: "Hipertrofia — Pull (Puxar)", mainSet: "Aquecimento: 5min mobilidade escapular\n\nA. Remada Curvada 4×10 @70% 1RM (descanso 90s)\nB. Puxada Frontal 4×10 (descanso 90s)\nC. Remada Unilateral 3×12/lado RPE 7\nD. Remada Máquina 3×12 RPE 7\nE1. Rosca Direta 3×12 RPE 6\nE2. Rosca Martelo 3×12 RPE 6\n\nVolta à calma: 5min", duration: 60, rpe: 7, pct1RM: 68 },
      CORE: { title: "Hipertrofia — Core", mainSet: "A. Prancha 3×45s\nB. Abdominal Supra 3×20\nC. Abdominal Infra 3×15\nD. Elevação de Quadril 3×20\nE. Rotação Russa 3×20 total\nF. Superman 3×15\nG. Bird Dog 3×10/lado\n\nVolta à calma: 5min", duration: 40, rpe: 6, pct1RM: 0 },
    },
    FORCA_MAX: {
      FULL_BODY: { title: "Força Máxima — Full Body", mainSet: "Aquecimento: progressivo até carga\n\nA. Terra 5×3 @87% 1RM (descanso 4–5min)\nB. Agachamento 4×4 @85% 1RM (descanso 4min)\nC. Supino 4×4 @85% 1RM (descanso 3min)\nD. Remada Pesada 3×5 @82% 1RM (descanso 3min)\n\nVolta à calma: 10min mobilidade", duration: 90, rpe: 9, pct1RM: 87 },
      INFERIORES: { title: "Força Máxima — Membros Inferiores", mainSet: "Aquecimento: progressivo\n\nA. Agachamento Livre 5×5 @85% 1RM (descanso 3–4min)\nB. Terra Romeno 4×5 @80% 1RM (descanso 3min)\nC. Leg Press 3×8 @80% 1RM (descanso 2min)\nD. Acessório: Panturrilha 3×12\n\nVolta à calma: 5min mobilidade", duration: 75, rpe: 9, pct1RM: 85 },
      SUPERIORES: { title: "Força Máxima — Membros Superiores", mainSet: "Aquecimento: progressivo\n\nA. Supino Reto 5×5 @85% 1RM (descanso 3–4min)\nB. Remada Curvada 4×5 @82% 1RM (descanso 3min)\nC. Desenvolvimento 3×8 @80% 1RM (descanso 2min)\nD. Acessório: 2×10 por grupo auxiliar\n\nVolta à calma: 5min", duration: 70, rpe: 9, pct1RM: 85 },
      PUSH: { title: "Força Máxima — Push", mainSet: "A. Supino Reto 6×3 @88% 1RM (descanso 4min)\nB. Supino Inclinado 3×5 @80% (descanso 3min)\nC. Desenvolvimento 3×6 @78% (descanso 3min)\nD. Acessório leve 2×10", duration: 70, rpe: 9, pct1RM: 88 },
      PULL: { title: "Força Máxima — Pull", mainSet: "A. Remada Curvada 5×5 @85% 1RM (descanso 3–4min)\nB. Puxada Ponderada 4×4 @85% (descanso 3min)\nC. Remada Máquina 3×6 @80% (descanso 2min)\nD. Acessório de cotovelo 2×10", duration: 65, rpe: 9, pct1RM: 85 },
      CORE: { title: "Força Máxima — Core / Anti-rotação", mainSet: "A. Barra Fixa Ponderada 4×4 (descanso 3min)\nB. Prancha Ponderada 3×40s\nC. Pallof Press 3×10/lado (carga progressiva)\nD. Abdominal Roda 3×8 (controlado)\nE. Farmer's Walk 3×20m", duration: 40, rpe: 8, pct1RM: 0 },
    },
    POTENCIA: {
      FULL_BODY: { title: "Potência — Full Body", mainSet: "Aquecimento: ativação neural 8–10min\n\nA. Power Clean 5×3 @70% 1RM (descanso 3min)\nB. Agachamento Jump 3×5 @40% 1RM (descanso 2min)\nC. Medicine Ball Slam 3×8 (descanso 90s)\nD. Sprint 5×20m (descanso completo)\n\nVolta à calma: 5min", duration: 55, rpe: 8, pct1RM: 65 },
      INFERIORES: { title: "Potência — Membros Inferiores", mainSet: "Aquecimento: ativação neural 8min\n\nA. Box Jump 4×5 @máximo (descanso 2–3min)\nB. Agachamento Explosivo 4×4 @60% 1RM (descanso 2min)\nC. Salto Horizontal 3×5 (descanso 2min)\nD. Step Up Explosivo 3×8/lado\n\nVolta à calma: 5min", duration: 55, rpe: 8, pct1RM: 60 },
      SUPERIORES: { title: "Potência — Membros Superiores", mainSet: "A. Supino com Banda (velocidade) 4×4 @50–60% 1RM rápido\nB. Arremesso MB contra parede 4×6\nC. Flexão Explosiva 3×8\nD. Pull-over Explosivo 3×8", duration: 45, rpe: 8, pct1RM: 55 },
      PUSH: { title: "Potência — Push", mainSet: "A. Supino Balístico 4×4 @50% 1RM (explosivo)\nB. Arremesso MB 3×8\nC. Flexão com Palmada 3×6\nD. Desenvolvimento Explosivo 3×6", duration: 45, rpe: 8, pct1RM: 50 },
      PULL: { title: "Potência — Pull", mainSet: "A. Remada Explosiva 4×4 @60% 1RM\nB. Pull-over KB 3×8 rápido\nC. High Pull 4×5 @55% 1RM\nD. Barra Fixa Explosiva 3×5", duration: 45, rpe: 8, pct1RM: 60 },
      CORE: { title: "Potência — Core Reativo", mainSet: "A. MB Rotacional Slam 3×10\nB. MB Chest Pass contra parede 3×10\nC. Rotação Russa Rápida 3×20\nD. Sprint Lateral 4×10m\nE. Salto Lateral 3×8/lado", duration: 35, rpe: 7, pct1RM: 0 },
    },
    FUNCIONAL: {
      FULL_BODY: { title: "Funcional — Full Body", mainSet: "Aquecimento: 5min cardio leve + mobilidade\n\nCircuito A (3 rodadas, 45s trabalho/15s descanso):\n1. Burpee · 2. Agachamento com Salto · 3. Flexão · 4. Remada Elástico · 5. Afundo Alternado\n\nCircuito B (3 rodadas):\n1. Prancha com Alcance 30s · 2. Mountain Climber 30s · 3. Superman 15 reps · 4. Bird Dog 10/lado\n\nVolta à calma: 5min", duration: 50, rpe: 7, pct1RM: 0 },
      INFERIORES: { title: "Funcional — Membros Inferiores", mainSet: "A. Agachamento Pistol Assistido 3×8/lado\nB. Afundo Caminhando 3×12/lado\nC. Step Up Lateral 3×10/lado\nD. Romanian DL Unilateral 3×10/lado\nE. Salto Caixote 3×5\nF. Panturrilha Unilateral 3×12/lado", duration: 50, rpe: 7, pct1RM: 0 },
      SUPERIORES: { title: "Funcional — Membros Superiores", mainSet: "A. Flexão com Variações 4×10\nB. Remada TRX 3×12\nC. Face Pull 3×15\nD. Rotação Externa 3×15\nE. Arremesso MB Peitoral 3×10\nF. Curl Isométrico 3×30s", duration: 45, rpe: 6, pct1RM: 0 },
      PUSH: { title: "Funcional — Push", mainSet: "A. Flexão Diamante 3×10 · B. Pike Push-up 3×10 · C. Arremesso MB 3×10 · D. Lateral Raise Unilateral 3×12 · E. Rotação Peitoral 3×10", duration: 40, rpe: 6, pct1RM: 0 },
      PULL: { title: "Funcional — Pull", mainSet: "A. Pull-up / Remada Invertida 4×8 · B. Face Pull 3×15 · C. Rotação Externa 3×15 · D. KB Row 3×10/lado · E. Chin-up com Pausa 3×5", duration: 40, rpe: 6, pct1RM: 0 },
      CORE: { title: "Funcional — Core & Estabilização", mainSet: "Aquecimento: mobilidade lombar\n\nA. Prancha Frontal 3×45s\nB. Prancha Lateral 3×30s/lado\nC. Dead Bug 3×10 (controlado)\nD. Pallof Press 3×12/lado\nE. KB Swing 3×15\nF. Rotação com Disco 3×15\nG. Abdominal Roda 3×8\n\nVolta à calma: 5min", duration: 45, rpe: 6, pct1RM: 0 },
    },
    RESISTENCIA: {
      FULL_BODY: { title: "Resistência Muscular — Full Body", mainSet: "Aquecimento: 5min + mobilidade\n\nCircuito (4 rodadas, 50s trabalho/10s entre exercícios, 60s entre rodadas):\n1. Agachamento · 2. Flexão · 3. Afundo Alternado · 4. Remada Elástico · 5. Desenvolvimento Halter leve · 6. Abdominal · 7. Burpee Modificado\n\nVolta à calma: 5min", duration: 50, rpe: 7, pct1RM: 50 },
      INFERIORES: { title: "Resistência Muscular — Membros Inferiores", mainSet: "A. Agachamento 3×20 @50% 1RM (descanso 45s)\nB. Leg Press 3×20 @50% (descanso 45s)\nC. Afundo 3×15/perna (descanso 45s)\nD. Mesa Flexora 3×20 @50% (descanso 45s)\nE. Panturrilha 4×25 (descanso 30s)\n\nVolta à calma: 5min", duration: 55, rpe: 6, pct1RM: 50 },
      SUPERIORES: { title: "Resistência Muscular — Membros Superiores", mainSet: "A. Flexão 3×20 · B. Remada 3×20 @50% · C. Desenvolvimento 3×20 @50% · D. Rosca 3×20 @50% · E. Tríceps 3×20 @50%\n\nDescanso: 45s entre séries", duration: 50, rpe: 6, pct1RM: 50 },
      PUSH: { title: "Resistência — Push", mainSet: "A. Supino 4×15 @55% · B. Desenvolvimento 4×15 @55% · C. Elevação Lateral 4×20 · D. Tríceps 4×20\nDescanso: 45s", duration: 45, rpe: 6, pct1RM: 55 },
      PULL: { title: "Resistência — Pull", mainSet: "A. Remada 4×15 @55% · B. Puxada 4×15 · C. Face Pull 4×20 · D. Rosca 4×20\nDescanso: 45s", duration: 45, rpe: 6, pct1RM: 55 },
      CORE: { title: "Resistência — Core", mainSet: "Circuito 4 rodadas (40s/20s):\n1. Prancha · 2. Mountain Climber · 3. Abdominal Bicicleta · 4. Elevação de Pernas · 5. Superman · 6. Rotação Russa", duration: 35, rpe: 6, pct1RM: 0 },
    },
    DELOAD: {
      FULL_BODY: { title: "Deload — Recuperação Ativa Full Body", mainSet: "(Volume −40%, intensidade −40%)\n\nA. Agachamento 3×8 @60% 1RM habitual\nB. Supino 3×8 @60% 1RM habitual\nC. Remada 3×8 @60%\nD. Mobilidade: 10min alongamento geral\n\nFoco: técnica, sem falha muscular, recuperação", duration: 45, rpe: 5, pct1RM: 60 },
      INFERIORES: { title: "Deload — Membros Inferiores", mainSet: "Volume reduzido 40%\n\nA. Agachamento 3×6 @60% 1RM\nB. Leg Press 3×8 @60%\nC. Mesa Flexora 3×8 @60%\nD. Panturrilha 3×12\nE. Mobilidade quadril 10min", duration: 40, rpe: 5, pct1RM: 60 },
      SUPERIORES: { title: "Deload — Membros Superiores", mainSet: "A. Supino 3×6 @60% · B. Remada 3×6 @60% · C. Desenvolvimento 3×8 leve · D. Acessórios 2×10 @60%\n\nFoco: recuperação total", duration: 40, rpe: 5, pct1RM: 60 },
      PUSH: { title: "Deload — Push", mainSet: "A. Supino 3×6 @60% · B. Desenvolvimento 3×8 leve · C. Elevação Lateral 2×15 leve\nFoco: fluir, sem dor", duration: 35, rpe: 4, pct1RM: 58 },
      PULL: { title: "Deload — Pull", mainSet: "A. Remada 3×6 @60% · B. Puxada 3×8 (leve) · C. Mobilidade escapular 10min\nFoco: recuperação ativa", duration: 35, rpe: 4, pct1RM: 58 },
      CORE: { title: "Deload — Core Regenerativo", mainSet: "A. Respiração Diafragmática 3×10\nB. Prancha Leve 3×20s\nC. Mobilidade Lombar 10min\nD. Alongamento Hip Flexors 3×30s\n\nFoco: recuperação e mobilidade", duration: 25, rpe: 3, pct1RM: 0 },
    },
  };
  const objMap = t[obj] ?? t.HIPERTROFIA;
  return objMap[group] ?? objMap.FULL_BODY ?? Object.values(objMap)[0];
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toISO(d: Date): string { return d.toISOString().slice(0, 10); }
function fmtWeek(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.getDate()} – ${sunday.getDate()} de ${sunday.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
}

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarWorkout {
  id: string;
  date: string;
  type: string;
  title: string;
  status: string;
  targetDurationMin?: number | null;
  targetDistanceKm?: number | null;
  targetRpe?: number | null;
  sport?: string | null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrescricaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [workouts, setWorkouts] = useState<CalendarWorkout[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Panel state
  const [showPanel, setShowPanel] = useState(false);
  const [sport, setSport] = useState<SportMode>("RUN");
  const [workoutType, setWorkoutType] = useState("RODAGEM_LEVE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [rpe, setRpe] = useState("6");
  const [durationMin, setDurationMin] = useState("60");
  const [mainSet, setMainSet] = useState("");
  const [useStructured, setUseStructured] = useState(false);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Intensity method
  const [intensityMethod, setIntensityMethod] = useState<IntensityMethod>("RPE");
  const [vdotValue, setVdotValue] = useState("50");
  const [ftpValue, setFtpValue] = useState("250");
  const [cssValue, setCssValue] = useState("1:45");
  const [targetZone, setTargetZone] = useState("Z2");
  const [oneRmPct, setOneRmPct] = useState("75");

  // Multi-athlete
  const [multiAthlete, setMultiAthlete] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);

  // Strength auto-generate
  const [strengthObjective, setStrengthObjective] = useState("HIPERTROFIA");
  const [muscleGroup, setMuscleGroup] = useState("FULL_BODY");
  const [showStrengthSuggestion, setShowStrengthSuggestion] = useState(false);

  // Drag-to-duplicate
  const [draggingWorkout, setDraggingWorkout] = useState<CalendarWorkout | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Load athletes
  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => {
        setAthletes(data);
        if (data.length > 0) { setAthleteId(data[0].id); setSelectedAthletes([data[0].id]); }
      })
      .catch(() => null);
  }, []);

  // Load week workouts
  const loadWeek = useCallback(async (ws: Date) => {
    setLoadingWeek(true);
    try {
      const res = await fetch(`/api/coach/athletes/week?weekStart=${toISO(ws)}`);
      if (!res.ok) return;
      const data = await res.json() as { athletes: { id: string; workouts: CalendarWorkout[] }[] };
      const athleteData = data.athletes.find((a) => a.id === athleteId);
      setWorkouts(athleteData?.workouts ?? []);
    } catch { /* ignore */ }
    finally { setLoadingWeek(false); }
  }, [athleteId]);

  useEffect(() => { if (athleteId) loadWeek(weekStart); }, [athleteId, weekStart, loadWeek]);

  // Pre-select sport from URL ?sport= param
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search).get("sport") as SportMode | null;
    if (sp && SPORTS.find((s) => s.id === sp)) {
      changeSport(sp);
      setShowPanel(true);
      if (sp === "STRENGTH") setShowStrengthSuggestion(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function prevWeek() { setWeekStart((w) => addDays(w, -7)); }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)); }
  function goToday() { setWeekStart(getMondayOf(new Date())); }

  function changeSport(s: SportMode) {
    setSport(s);
    const firstType = WORKOUT_TYPES[s][0].value;
    setWorkoutType(firstType);
    setTitle(WORKOUT_TYPES[s][0].label);
    setBlocks([]);
    const sportInfo = SPORTS.find((sp) => sp.id === s)!;
    setIntensityMethod(sportInfo.methods[0].id);
    setShowStrengthSuggestion(s === "STRENGTH");
  }

  function applyStrengthSuggestion() {
    const s = buildStrengthSuggestion(strengthObjective, muscleGroup);
    setTitle(s.title);
    setMainSet(s.mainSet);
    setDurationMin(String(s.duration));
    setRpe(String(s.rpe));
    if (s.pct1RM > 0) {
      setOneRmPct(String(s.pct1RM));
      setIntensityMethod("1RM_PCT");
    }
  }

  function changeWorkoutType(t: string) {
    setWorkoutType(t);
    const found = WORKOUT_TYPES[sport].find((w) => w.value === t);
    if (found && !title) setTitle(found.label);
  }

  const estimatedDuration = useStructured
    ? blocks.reduce((s, b) => s + Math.round(b.durationSeconds / 60) * b.repeatCount, 0)
    : Number(durationMin) || 0;
  const estimatedLoad = Math.round(estimatedDuration * (Number(rpe) || 6));

  function buildIntensityNote(): string {
    if (intensityMethod === "VDOT") {
      const paces = lookupVdot(Number(vdotValue));
      if (!paces) return "";
      return `VDOT ${vdotValue} — Z:${targetZone} — Pace: ${paces[targetZone as keyof typeof paces] ?? "—"}/km`;
    }
    if (intensityMethod === "FTP") return `FTP: ${ftpValue}w — Zona: ${targetZone}`;
    if (intensityMethod === "CSS") return `CSS: ${cssValue}/100m — Zona: ${targetZone}`;
    if (intensityMethod === "1RM_PCT") return `% 1RM: ${oneRmPct}%`;
    if (intensityMethod === "ZONES") return `Zona FC: ${targetZone}`;
    return "";
  }

  async function handleSubmit() {
    const targets = multiAthlete ? selectedAthletes : [athleteId];
    if (targets.length === 0 || !date || !workoutType) {
      setError("Preencha atleta, data e tipo.");
      return;
    }
    setError("");
    setSubmitting(true);
    const intensityNote = buildIntensityNote();
    try {
      await Promise.all(targets.map((aid) =>
        fetch("/api/coach/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId: aid,
            date,
            type: workoutType,
            sport: sport === "OTHER" ? undefined : sport,
            title: title || WORKOUT_TYPES[sport].find((t) => t.value === workoutType)?.label || workoutType,
            objective: [description, mainSet, intensityNote].filter(Boolean).join("\n") || undefined,
            structured: useStructured,
            blocks: useStructured && blocks.length > 0 ? blocks : undefined,
            targetDurationMin: estimatedDuration || undefined,
            targetRpe: Number(rpe) || undefined,
          }),
        })
      ));
      setSaved(true);
      loadWeek(weekStart);
      setTimeout(() => {
        setSaved(false);
        setShowPanel(false);
        setTitle("");
        setDescription("");
        setMainSet("");
        setBlocks([]);
        setUseStructured(false);
        setSaveAsTemplate(false);
        setDurationMin("60");
        setRpe("6");
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function handleDragStart(workout: CalendarWorkout) {
    setDraggingWorkout(workout);
  }

  function handleDragEnter(iso: string) {
    dragCounter.current++;
    setDragOverDate(iso);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverDate(null);
  }

  async function handleDrop(targetDate: string) {
    dragCounter.current = 0;
    setDragOverDate(null);
    if (!draggingWorkout || targetDate === draggingWorkout.date) { setDraggingWorkout(null); return; }
    try {
      await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          date: targetDate,
          type: draggingWorkout.type,
          sport: draggingWorkout.sport,
          title: draggingWorkout.title,
          targetDurationMin: draggingWorkout.targetDurationMin,
          targetRpe: draggingWorkout.targetRpe,
        }),
      });
      loadWeek(weekStart);
    } catch { /* ignore */ }
    setDraggingWorkout(null);
  }

  // ── Calendar cells ────────────────────────────────────────────────────────────

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = toISO(d);
    return { date: d, iso, dayWorkouts: workouts.filter((w) => w.date === iso), isToday: iso === toISO(new Date()) };
  });

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + (w.targetDurationMin ?? 0), 0);
  const completed = workouts.filter((w) => w.status === "CONCLUIDO").length;

  // ── VDOT display component ────────────────────────────────────────────────────

  const vdotPaces = lookupVdot(Number(vdotValue));
  const vdotZones = ["E", "M", "T", "I", "R"] as const;
  const vdotZoneLabels: Record<string, string> = { E: "Easy (Z2)", M: "Maratona", T: "Tempo (Z3/4)", I: "Intervalo (Z5)", R: "Repetição" };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <span className="font-display text-sm font-bold text-text">Prescrição</span>
            <span className="text-border hidden sm:block">·</span>
            <span className="text-xs text-text-muted hidden sm:block">Calendário semanal de treinos</span>
          </div>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-text outline-none focus:border-primary/60 min-w-[160px]"
          >
            {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <Button variant="primary" size="sm" className="shrink-0 gap-1.5" onClick={() => { setDate(toISO(new Date())); setShowPanel(true); }}>
            <Plus className="h-4 w-4" /> Novo treino
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
        {/* ── Calendar ─────────────────────────────────────────────────────── */}
        <div className={cn("flex-1 min-w-0 transition-all", showPanel && "lg:mr-[26rem]")}>
          {/* Week nav */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-card-hover transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToday} className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-text hover:bg-card-hover transition-colors">
                Hoje
              </button>
              <button onClick={nextWeek} className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-card-hover transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="font-display text-sm font-semibold text-text flex-1">{fmtWeek(weekStart)}</span>
            {loadingWeek && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
            {draggingWorkout && (
              <Badge variant="outline" className="text-xs text-primary border-primary/40 animate-pulse">
                Arraste para duplicar
              </Badge>
            )}
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="min-w-[640px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {days.map(({ date: d, isToday }, i) => (
                  <div key={i} className={cn("px-3 py-2.5 text-center border-r border-border/50 last:border-r-0", isToday && "bg-primary/5")}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{DAYS[i]}</p>
                    <p className={cn("mt-0.5 text-lg font-bold font-display", isToday ? "text-primary" : "text-text")}>{d.getDate()}</p>
                  </div>
                ))}
              </div>

              {/* Workout cells */}
              <div className="grid grid-cols-7 min-h-[320px]">
                {days.map(({ iso, dayWorkouts, isToday }, i) => (
                  <div
                    key={i}
                    className={cn(
                      "border-r border-border/50 last:border-r-0 p-2 space-y-1.5 transition-colors",
                      isToday && "bg-primary/[0.02]",
                      dragOverDate === iso && "bg-primary/10 border-primary/30"
                    )}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDragEnter={() => handleDragEnter(iso)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(iso)}
                  >
                    {dayWorkouts.map((wo) => {
                      const color = TYPE_COLORS[wo.type] ?? "#6b7280";
                      const status = STATUS_BADGE[wo.status];
                      return (
                        <div
                          key={wo.id}
                          draggable
                          onDragStart={() => handleDragStart(wo)}
                          onDragEnd={() => { setDraggingWorkout(null); setDragOverDate(null); dragCounter.current = 0; }}
                          className={cn(
                            "rounded-xl p-2.5 border transition-all cursor-grab active:cursor-grabbing select-none",
                            draggingWorkout?.id === wo.id && "opacity-40"
                          )}
                          style={{ borderColor: `${color}40`, backgroundColor: `${color}12` }}
                        >
                          <div className="flex items-start gap-1">
                            <GripVertical className="h-2.5 w-2.5 text-text-muted/40 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-semibold leading-tight truncate flex-1" style={{ color }}>
                              {wo.title}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap pl-3.5">
                            {wo.targetDurationMin && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                                <Clock className="h-2.5 w-2.5" />{wo.targetDurationMin} min
                              </span>
                            )}
                            {wo.targetDistanceKm && <span className="text-[10px] text-text-muted">{wo.targetDistanceKm} km</span>}
                          </div>
                          {status && (
                            <p className={cn("mt-0.5 text-[10px] font-medium pl-3.5", status.color)}>
                              {wo.status === "CONCLUIDO" && <CheckCircle2 className="inline h-2.5 w-2.5 mr-0.5" />}
                              {status.label}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Add button on empty cells */}
                    {dayWorkouts.length === 0 && (
                      <button
                        onClick={() => { setDate(iso); setShowPanel(true); }}
                        className="w-full h-full min-h-[60px] rounded-lg border border-dashed border-border/40 text-[10px] text-text-muted/40 hover:border-primary/40 hover:text-primary/60 transition-colors flex items-center justify-center"
                      >
                        + treino
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly summary */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Treinos" value={String(totalWorkouts)} />
            <SummaryCard label="Concluídos" value={`${completed}/${totalWorkouts}`} highlight={completed === totalWorkouts && totalWorkouts > 0} />
            <SummaryCard label="Volume" value={totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}min` : `${totalMinutes} min`} />
            <SummaryCard label="Dica" value="Arraste para duplicar" small />
          </div>
        </div>

        {/* ── Panel ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showPanel && (
            <motion.aside
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.22 }}
              className="fixed right-0 top-0 z-30 h-full w-full max-w-sm overflow-y-auto bg-card border-l border-border shadow-2xl lg:sticky lg:top-20 lg:h-auto lg:max-h-[calc(100vh-6rem)] lg:w-96 lg:rounded-2xl lg:shadow-none"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-text">Novo treino</h2>
                  <button onClick={() => setShowPanel(false)} className="text-text-muted hover:text-text">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sport selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Modalidade</label>
                  <div className="flex gap-2 flex-wrap">
                    {SPORTS.map((s) => {
                      const Icon = s.Icon;
                      return (
                        <button
                          key={s.id}
                          onClick={() => changeSport(s.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border p-2.5 w-14 transition-all",
                            sport === s.id ? "border-primary/60 bg-primary/10" : "border-border bg-background hover:border-primary/30"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", sport === s.id ? "text-primary" : "text-text-muted")} />
                          <span className={cn("text-[9px] font-semibold", sport === s.id ? "text-primary" : "text-text-muted")}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workout type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tipo de treino</label>
                  <select
                    value={workoutType}
                    onChange={(e) => changeWorkoutType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary/60 appearance-none"
                  >
                    {WORKOUT_TYPES[sport].map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Strength auto-generate */}
                {sport === "STRENGTH" && (
                  <div className={cn("rounded-xl border p-3 space-y-3 transition-colors", showStrengthSuggestion ? "border-primary/30 bg-primary/5" : "border-border bg-background/40")}>
                    <button
                      onClick={() => setShowStrengthSuggestion((v) => !v)}
                      className="w-full flex items-center gap-2"
                    >
                      <Sparkles className={cn("h-4 w-4", showStrengthSuggestion ? "text-primary" : "text-text-muted")} />
                      <span className={cn("text-xs font-semibold uppercase tracking-wider flex-1 text-left", showStrengthSuggestion ? "text-primary" : "text-text-muted")}>
                        Sugestão de treino
                      </span>
                      <span className="text-[10px] text-text-muted">{showStrengthSuggestion ? "fechar ▲" : "abrir ▼"}</span>
                    </button>
                    {showStrengthSuggestion && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider">Objetivo</label>
                            <select
                              value={strengthObjective}
                              onChange={(e) => setStrengthObjective(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text outline-none focus:border-primary/60 appearance-none"
                            >
                              {STRENGTH_OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider">Grupos musculares</label>
                            <select
                              value={muscleGroup}
                              onChange={(e) => setMuscleGroup(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text outline-none focus:border-primary/60 appearance-none"
                            >
                              {MUSCLE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={applyStrengthSuggestion}
                          className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Gerar sugestão de treino
                        </button>
                        <p className="text-[10px] text-text-muted text-center">Baseado na periodização · editável antes de salvar</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Intensity method */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Intensidade — método</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {SPORTS.find((s) => s.id === sport)!.methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setIntensityMethod(m.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                          intensityMethod === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-text-muted hover:border-primary/30"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* VDOT engine */}
                  {intensityMethod === "VDOT" && (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">VDOT</label>
                        <input
                          type="number" min={30} max={85} value={vdotValue}
                          onChange={(e) => setVdotValue(e.target.value)}
                          className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-text text-center outline-none focus:border-primary/60"
                        />
                      </div>
                      {vdotPaces && (
                        <div className="space-y-1">
                          {vdotZones.map((z) => (
                            <button
                              key={z}
                              onClick={() => setTargetZone(z)}
                              className={cn(
                                "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all border",
                                targetZone === z ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-border text-text-muted"
                              )}
                            >
                              <span className="font-semibold">{z} — {vdotZoneLabels[z]}</span>
                              <span className="font-mono">{vdotPaces[z]}/km</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FC Zones engine */}
                  {intensityMethod === "ZONES" && (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1">
                      {FC_ZONES.map((z) => (
                        <button
                          key={z.zone}
                          onClick={() => setTargetZone(z.zone)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all border",
                            targetZone === z.zone ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                          )}
                        >
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                          <span className={cn("font-semibold", targetZone === z.zone ? "text-primary" : "text-text")}>{z.zone}</span>
                          <span className="text-text-muted flex-1 text-left">{z.label}</span>
                          <span className="text-text-muted/70 font-mono">{z.fcPct}</span>
                          <span className="text-text-muted/50">RPE {z.rpe}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FTP Zones engine */}
                  {intensityMethod === "FTP" && (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">FTP (watts)</label>
                        <input
                          type="number" min={50} value={ftpValue}
                          onChange={(e) => setFtpValue(e.target.value)}
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm text-text text-center outline-none focus:border-primary/60"
                        />
                      </div>
                      <div className="space-y-1">
                        {FTP_ZONES.map((z) => {
                          const ftpNum = Number(ftpValue) || 200;
                          const match = z.ftpPct.match(/(\d+)%?(?:–(\d+)%?)?/);
                          const lo = match ? Math.round(ftpNum * Number(match[1]) / 100) : null;
                          const hi = match?.[2] ? Math.round(ftpNum * Number(match[2]) / 100) : null;
                          return (
                            <button
                              key={z.zone}
                              onClick={() => setTargetZone(z.zone)}
                              className={cn(
                                "w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all border",
                                targetZone === z.zone ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                              )}
                            >
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                              <span className={cn("font-semibold w-6", targetZone === z.zone ? "text-primary" : "text-text")}>{z.zone}</span>
                              <span className="text-text-muted flex-1 text-left">{z.label}</span>
                              <span className="text-text-muted/70 font-mono text-[10px]">
                                {lo}{hi ? `–${hi}` : "+"}w
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CSS engine */}
                  {intensityMethod === "CSS" && (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">CSS pace/100m</label>
                        <input
                          type="text" value={cssValue} placeholder="1:45"
                          onChange={(e) => setCssValue(e.target.value)}
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm text-text text-center outline-none focus:border-primary/60"
                        />
                      </div>
                      <div className="space-y-1">
                        {CSS_ZONES.map((z) => (
                          <button
                            key={z.zone}
                            onClick={() => setTargetZone(z.zone)}
                            className={cn(
                              "w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all border",
                              targetZone === z.zone ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
                            )}
                          >
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                            <span className={cn("font-semibold w-6", targetZone === z.zone ? "text-primary" : "text-text")}>{z.zone}</span>
                            <span className="text-text-muted flex-1 text-left">{z.label}</span>
                            <span className="text-text-muted/70 font-mono">{z.cssOffset}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* % 1RM engine */}
                  {intensityMethod === "1RM_PCT" && (
                    <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted">% de 1RM</label>
                        <input
                          type="number" min={30} max={100} value={oneRmPct}
                          onChange={(e) => setOneRmPct(e.target.value)}
                          className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm text-text text-center outline-none focus:border-primary/60"
                        />
                        <span className="text-xs text-text-muted">%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[["Endurance","40–60"],["Hipertrofia","67–85"],["Força","85–95"],["Potência","50–70"],["Pico","90–100"],["Deload","40–50"]].map(([l, r]) => (
                          <button
                            key={l}
                            onClick={() => setOneRmPct(r.split("–")[0])}
                            className="rounded-lg border border-border px-2 py-1 text-[10px] text-text-muted hover:border-primary/40 hover:text-text transition-all text-left"
                          >
                            <span className="block font-semibold">{l}</span>
                            <span className="text-text-muted/70">{r}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RPE (simple) */}
                  {intensityMethod === "RPE" && (
                    <div className="grid grid-cols-5 gap-1">
                      {[4,5,6,7,8,9,10].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRpe(String(r))}
                          className={cn(
                            "rounded-lg border py-1.5 text-xs font-bold transition-all",
                            rpe === String(r) ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:border-primary/30"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Nome do treino</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: 6x800m @ pace 5K"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Data</label>
                  <input
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                  />
                </div>

                {/* Athlete / Multi-athlete */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Atleta(s)</label>
                  {/* Mode toggle */}
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setMultiAthlete(false)}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold transition-all border-r border-border",
                        !multiAthlete ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text bg-background"
                      )}
                    >
                      Atleta único
                    </button>
                    <button
                      onClick={() => { setMultiAthlete(true); setSelectedAthletes([athleteId]); }}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        multiAthlete ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text bg-background"
                      )}
                    >
                      <Users className="h-3.5 w-3.5" /> Vários atletas
                    </button>
                  </div>
                  {!multiAthlete ? (
                    <select
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60 appearance-none"
                    >
                      {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2 space-y-1 max-h-40 overflow-y-auto">
                      <p className="text-[10px] text-primary px-2 pb-1">Selecione os atletas que receberão este treino:</p>
                      {athletes.map((a) => (
                        <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card-hover cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={selectedAthletes.includes(a.id)}
                            onChange={(e) => setSelectedAthletes(prev =>
                              e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                            )}
                            className="accent-primary h-3.5 w-3.5"
                          />
                          <span className="text-text">{a.name}</span>
                          <span className="text-text-muted/60 text-xs ml-auto">{a.goal}</span>
                        </label>
                      ))}
                      {selectedAthletes.length > 0 && (
                        <p className="text-center text-xs font-semibold text-primary pt-1 border-t border-primary/20 mt-1">
                          {selectedAthletes.length} atleta(s) selecionado(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição (opcional)</label>
                  <textarea
                    rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objetivo do treino…"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 resize-none"
                  />
                </div>

                {/* Structured toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">Estrutura detalhada</p>
                    <p className="text-[11px] text-text-muted">Blocos visuais por fase</p>
                  </div>
                  <button type="button" onClick={() => setUseStructured((v) => !v)} className="text-text-muted hover:text-primary transition-colors">
                    {useStructured ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7" />}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {useStructured ? (
                    <motion.div key="structured" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <StructuredWorkoutBuilder
                        sport={sport === "OTHER" ? "RUN" : sport === "STRENGTH" ? "STRENGTH" : sport as "RUN" | "BIKE" | "SWIM" | "STRENGTH"}
                        onChange={setBlocks}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="simple" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
                      <textarea
                        rows={3} value={mainSet} onChange={(e) => setMainSet(e.target.value)}
                        placeholder="Aquecimento · Parte principal · Volta à calma…"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Duração (min)</label>
                          <input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary/60 text-center" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">RPE (1–10)</label>
                          <input type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary/60 text-center" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Estimated load */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card-hover/30 p-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Carga estimada</p>
                    <p className="text-base font-bold font-display text-text">{estimatedLoad} <span className="text-xs font-normal text-text-muted">sRPE</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Duração</p>
                    <p className="text-base font-bold font-display text-text">
                      {estimatedDuration >= 60 ? `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min` : `${estimatedDuration} min`}
                    </p>
                  </div>
                </div>

                {/* Save as template */}
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="saveTemplate" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} className="accent-primary h-4 w-4" />
                  <label htmlFor="saveTemplate" className="text-sm text-text cursor-pointer flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5 text-text-muted" /> Salvar como template
                  </label>
                </div>

                {/* Copy hint */}
                <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-[11px] text-text-muted flex items-center gap-2">
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                  Para copiar, arraste um treino existente no calendário para outro dia
                </div>

                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPanel(false)}>Cancelar</Button>
                  <Button
                    variant={saved ? "success" : "primary"}
                    size="sm" className="flex-1 gap-1.5"
                    onClick={handleSubmit} disabled={submitting || saved}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> :
                      saved ? <><CheckCircle2 className="h-4 w-4" /> Salvo!</> :
                      multiAthlete && selectedAthletes.length > 1 ? `Aplicar (${selectedAthletes.length})` : "Salvar treino"}
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight, small }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3 text-center", highlight ? "border-primary/30 bg-primary/5" : "border-border")}>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("mt-0.5 font-display font-bold", small ? "text-sm text-text-muted" : "text-xl", highlight ? "text-primary" : "text-text")}>{value}</p>
    </div>
  );
}
