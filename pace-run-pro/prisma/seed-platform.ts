/**
 * Platform template seed — run ONCE against production:
 *   npm run seed:platform
 *
 * Safe to re-run: uses upsert / findFirst + create patterns.
 * Does NOT reset or delete any existing data.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

// ─── Types ───────────────────────────────────────────────────────────────────

type Level = "Iniciante" | "Intermediário" | "Avançado" | "Pro";

interface Ex {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  rpe?: number;
  notes?: string;
}

// ─── Exercise builder helpers ────────────────────────────────────────────────

function lvlSets(l: Level) { return { Iniciante: 3, Intermediário: 3, Avançado: 4, Pro: 5 }[l]; }
function lvlRpe(l: Level)  { return { Iniciante: 6, Intermediário: 7, Avançado: 8, Pro: 9 }[l]; }

function lvlReps(l: Level, kind: "force" | "hyper" | "endur"): string {
  return ({
    Iniciante:    { force: "12-15", hyper: "15-20", endur: "20-25" },
    Intermediário:{ force: "8-10",  hyper: "10-12", endur: "15-20" },
    Avançado:     { force: "5-8",   hyper: "8-10",  endur: "12-15" },
    Pro:          { force: "3-5",   hyper: "6-8",   endur: "10-12" },
  } as Record<Level, Record<string, string>>)[l][kind];
}

function lvlRest(l: Level, kind: "force" | "hyper" | "endur"): number {
  return ({
    Iniciante:    { force: 90,  hyper: 60,  endur: 45  },
    Intermediário:{ force: 120, hyper: 75,  endur: 60  },
    Avançado:     { force: 150, hyper: 90,  endur: 75  },
    Pro:          { force: 180, hyper: 105, endur: 90  },
  } as Record<Level, Record<string, number>>)[l][kind];
}

function ex(name: string, l: Level, kind: "force" | "hyper" | "endur", notes?: string): Ex {
  return { name, sets: lvlSets(l), reps: lvlReps(l, kind), restSec: lvlRest(l, kind), rpe: lvlRpe(l), notes };
}

function exC(name: string, s: number, r: string, rest: number, rpe?: number, notes?: string): Ex {
  return { name, sets: s, reps: r, restSec: rest, rpe, notes };
}

// ─── Session builders ────────────────────────────────────────────────────────

function sLowerPush(l: Level) {
  return { label: "A — Membros Inferiores (Push)", exercises: [
    ex("Agachamento livre", l, "force"),
    ex("Afundo alternado", l, "force"),
    ex("Step-up unilateral", l, "hyper"),
    ex("Panturrilha em pé (unilateral)", l, "endur"),
    ex("Hip thrust barra", l, "force"),
  ] as Ex[] };
}

function sLowerPull(l: Level) {
  return { label: "B — Membros Inferiores (Pull)", exercises: [
    ex("Peso morto romeno (RDL)", l, "force"),
    ex("Mesa flexora (Leg curl)", l, "hyper"),
    ex("Afundo reverso com halteres", l, "hyper"),
    ex("Panturrilha sentado", l, "endur"),
    ex("Good morning", l, "force"),
  ] as Ex[] };
}

function sUpperPush(l: Level) {
  return { label: "C — Superior (Push)", exercises: [
    ex("Supino com halteres", l, "force"),
    ex("Desenvolvimento com halteres", l, "force"),
    ex("Tríceps polia (corda)", l, "hyper"),
    ex("Elevação lateral", l, "hyper"),
    ex("Push-up variação", l, "endur"),
  ] as Ex[] };
}

function sUpperPull(l: Level, label = "D — Superior (Pull)") {
  return { label, exercises: [
    ex("Puxada na polia alta", l, "force"),
    ex("Remada curvada com barra", l, "force"),
    ex("Rosca direta com halteres", l, "hyper"),
    ex("Face pull (polia)", l, "hyper"),
    ex("Encolhimento de ombros", l, "hyper"),
  ] as Ex[] };
}

function sCore(l: Level, label = "E — Core & Estabilidade") {
  const plank = { Iniciante: "30-45s", Intermediário: "45-60s", Avançado: "60-90s", Pro: "90-120s" }[l];
  return { label, exercises: [
    exC("Prancha frontal", 3, plank, 60, lvlRpe(l)),
    ex("Dead bug", l, "endur"),
    ex("Russian twist com peso", l, "endur"),
    ex("Elevação de perna (solo)", l, "endur"),
    exC("Bird dog", 3, "10 p/ lado", 45, lvlRpe(l)),
    ex("Hiperextensão lombar", l, "endur"),
  ] as Ex[] };
}

function sPrevention(l: Level) {
  return { label: "E — Prevenção e Mobilidade", exercises: [
    exC("Ativação de glúteo médio (elástico)", 3, "15 p/ lado", 30, lvlRpe(l), "Movimento lento"),
    exC("Exercício de tornozelo (alfabeto)", 2, "1 série completa", 30, 5),
    exC("VMO — Extensão de joelho (arco curto)", 3, "15 p/ lado", 30, lvlRpe(l)),
    exC("Mobilidade de quadril (90/90)", 3, "45s p/ lado", 0, 5),
    exC("Alongamento de isquiotibial (ativo)", 3, "30s p/ lado", 0, 5),
    exC("Fortalecimento de tornozelo (elástico)", 3, "20 p/ lado", 30, lvlRpe(l)),
  ] as Ex[] };
}

function sPlyometrics(l: Level) {
  const j = { Iniciante: "6-8", Intermediário: "8-10", Avançado: "10-12", Pro: "12-15" }[l];
  return { label: "E — Pliometria & Potência", exercises: [
    exC("Agachamento com salto (Jump squat)", 3, j, 90, lvlRpe(l), "Aterrissagem suave"),
    exC("Salto lateral (Lateral hop)", 3, j, 90, lvlRpe(l), "Alternado"),
    exC("Box jump", 3, l === "Iniciante" ? "4-6" : l === "Intermediário" ? "6-8" : "8-10", 120, lvlRpe(l)),
    exC("Salto unipodal progressivo", 3, "5 p/ lado", 90, lvlRpe(l)),
    exC("Sprint skipping / joelho alto", 3, "20m", 60, lvlRpe(l)),
  ] as Ex[] };
}

function sFullBody(l: Level, label: string) {
  return { label, exercises: [
    ex("Agachamento livre", l, "force"),
    ex("Peso morto romeno (RDL)", l, "force"),
    ex("Puxada na polia alta", l, "force"),
    ex("Supino com halteres", l, "force"),
    exC("Prancha frontal", 3, { Iniciante: "30s", Intermediário: "45s", Avançado: "60s", Pro: "90s" }[l], 45, lvlRpe(l)),
    ex("Hip thrust barra", l, "hyper"),
    ex("Panturrilha em pé (unilateral)", l, "endur"),
  ] as Ex[] };
}

// ─── 28 strength templates (7 divisions × 4 levels) ─────────────────────────

const LEVELS: Level[] = ["Iniciante", "Intermediário", "Avançado", "Pro"];

function buildStrengthTemplates() {
  const tpls: { name: string; description: string; division: string; targetLevel: Level; focus: string; sessions: { label: string; exercises: Ex[] }[] }[] = [];

  for (const l of LEVELS) {
    // Full Body
    tpls.push({ name: `Full Body para Corredores — ${l}`, description: `Treino de corpo inteiro para corredores de nível ${l.toLowerCase()}.`, division: "FULL_BODY", targetLevel: l, focus: "forca",
      sessions: [sFullBody(l, "Sessão A — Full Body (Força)"), sFullBody(l, "Sessão B — Full Body (Volume)")] });

    // AB
    tpls.push({ name: `Divisão AB — ${l}`, description: `AB clássico para corredores: inferior no Dia A, superior + core no Dia B.`, division: "AB", targetLevel: l, focus: "forca",
      sessions: [
        { ...sLowerPush(l), label: "A — Membros Inferiores" },
        { label: "B — Superior + Core", exercises: [...sUpperPull(l).exercises.slice(0, 3), ...sUpperPush(l).exercises.slice(0, 2), ...sCore(l).exercises.slice(0, 3)] },
      ] });

    // ABC
    tpls.push({ name: `Divisão ABC — ${l}`, description: `ABC para corredores: inferior push / superior / inferior pull + core.`, division: "ABC", targetLevel: l, focus: "forca",
      sessions: [
        sLowerPush(l),
        { label: "B — Superior (Push + Pull)", exercises: [...sUpperPull(l).exercises.slice(0, 3), ...sUpperPush(l).exercises.slice(0, 3)] },
        { label: "C — Inferior Pull + Core", exercises: [...sLowerPull(l).exercises.slice(0, 3), ...sCore(l).exercises.slice(0, 3)] },
      ] });

    // ABCD
    tpls.push({ name: `Divisão ABCD — ${l}`, description: `ABCD: inferior push / superior push / inferior pull / superior pull + core.`, division: "ABCD", targetLevel: l, focus: "forca",
      sessions: [
        sLowerPush(l),
        sUpperPush(l),
        sLowerPull(l),
        { ...sUpperPull(l), exercises: [...sUpperPull(l).exercises, ...sCore(l).exercises.slice(0, 3)] },
      ] });

    // ABCDE
    tpls.push({ name: `Divisão ABCDE — ${l}`, description: `ABCDE para atletas dedicados: 5 sessões semanais com prevenção e potência.`, division: "ABCDE", targetLevel: l, focus: "forca",
      sessions: [
        sLowerPush(l),
        sUpperPush(l),
        sLowerPull(l),
        sUpperPull(l),
        l === "Avançado" || l === "Pro" ? sPlyometrics(l) : sPrevention(l),
      ] });

    // Upper/Lower
    tpls.push({ name: `Upper/Lower para Corredores — ${l}`, description: `4 sessões: 2 lower + 2 upper. Força funcional e prevenção.`, division: "UPPER_LOWER", targetLevel: l, focus: "forca",
      sessions: [
        { label: "Lower A — Quad/Glúteo", exercises: sLowerPush(l).exercises },
        { label: "Upper A — Pull + Core", exercises: [...sUpperPull(l).exercises, ...sCore(l).exercises.slice(0, 2)] },
        { label: "Lower B — Posterior/Prevenção", exercises: [...sLowerPull(l).exercises, ...sPrevention(l).exercises.slice(0, 2)] },
        { label: "Upper B — Push + Core", exercises: [...sUpperPush(l).exercises, ...sCore(l).exercises.slice(2, 4)] },
      ] });

    // Personalizada
    const desc: Record<Level, string> = {
      Iniciante: "Introdução à musculação com segurança",
      Intermediário: "Periodização ondulatória para ganhos consistentes",
      Avançado: "Bloco de força máxima com técnica avançada",
      Pro: "Preparação pré-temporada com pliometria integrada",
    };
    tpls.push({ name: `Personalizada — ${l}`, description: desc[l], division: "PERSONALIZADA", targetLevel: l, focus: l === "Avançado" || l === "Pro" ? "potencia" : "forca",
      sessions: [
        { label: "Sessão 1 — Força Base", exercises: [...sLowerPush(l).exercises.slice(0, 3), ...sUpperPull(l).exercises.slice(0, 2)] },
        { label: "Sessão 2 — Auxiliar + Core", exercises: [...sLowerPull(l).exercises.slice(0, 3), ...sCore(l).exercises.slice(0, 3)] },
        l === "Avançado" || l === "Pro" ? sPlyometrics(l) : sPrevention(l),
      ] });
  }
  return tpls;
}

// ─── 8 running plan templates ─────────────────────────────────────────────────

const D = "DESCANSO";
const P = "PROVA";
const DPRP = "DPRP";

function week(n: number, ...days: string[]) {
  const labels = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
  return { week: n, days: labels.map((day, i) => ({ day, workout: days[i] })) };
}

function parseWorkout(raw: string, dayOfWeek: number, weekNum: number) {
  if (!raw || raw === "DESCANSO" || raw === "DPRP") return null;
  let type = "CORRIDA", targetDistanceKm: number | undefined, targetDurationMin: number | undefined, targetRpe = 6;
  if (raw.startsWith("TL") || raw.startsWith("TE")) { type = "LONGO"; targetRpe = 7; const m = raw.match(/(\d+(?:\.\d+)?)km/); if (m) targetDistanceKm = parseFloat(m[1]); }
  else if (raw.startsWith("TI")) { type = "INTERVALADO"; targetRpe = 8; }
  else if (raw.startsWith("TF")) { type = "FARTLEK"; targetRpe = 7; const m = raw.match(/(\d+)min/); if (m) targetDurationMin = parseInt(m[1]); }
  else if (raw.startsWith("TRT")) { type = "TIME_TRIAL"; targetRpe = 9; const m = raw.match(/(\d+(?:\.\d+)?)km/); if (m) targetDistanceKm = parseFloat(m[1]); }
  else if (raw.startsWith("TR")) { type = "REGENERATIVO"; targetRpe = 4; const m = raw.match(/(\d+)min/); if (m) targetDurationMin = parseInt(m[1]); }
  else if (raw.startsWith("CO")) { type = "CONTINUO"; targetRpe = 5; const m = raw.match(/(\d+(?:\.\d+)?)km/); if (m) targetDistanceKm = parseFloat(m[1]); const t = raw.match(/(\d+)min/); if (t) targetDurationMin = parseInt(t[1]); }
  if (raw === "PROVA") { type = "PROVA"; targetRpe = 9; }
  return { id: `w${weekNum}d${dayOfWeek}`, dayOfWeek, type, title: raw, targetDistanceKm, targetDurationMin, targetRpe };
}

function buildPlanContent(weeks: { week: number; days: { day: string; workout: string }[] }[], phases: string[]) {
  return weeks.map((w) => ({
    weekNumber: w.week,
    phase: phases[Math.min(Math.floor((w.week - 1) / 4), phases.length - 1)],
    workouts: w.days.map((d, i) => parseWorkout(d.workout, i, w.week)).filter(Boolean),
  }));
}

const RUN_TEMPLATES = [
  { slug: "run-3k-inic-08",   title: "3 km — Iniciante (8 sem)",         targetLevel: "Iniciante",    weeklyKm: 15, sessionsPerWeek: 3, focus: "aerobico",    durationWeeks: 8,  goal: "3KM",            priceCents: 4990, phases: ["Base","Construção","Pico"], included: ["8 semanas progressivas","Intervalado + fartlek","Semana de descarga","Prova simulada"],
    weeks: [ week(1,"CO 20min Z1",D,"CO 20min Z1",D,"CO 20min Z1",D,D), week(2,"CO 25min Z1",D,"CO 25min Z1",D,"CO 25min Z1",D,D), week(3,"CO 30min Z2",D,"CO 30min Z2",D,"TRT 3km",D,D), week(4,"TR 20min",D,"CO 25min Z1",D,"CO 25min Z1",D,D), week(5,"TI 4x400m Ra3",D,"CO 30min Z2",D,"TRT 3km",D,D), week(6,"CO 35min Z2",D,"TF 30min",D,"CO 30min Z2",D,D), week(7,"TI 6x400m Ra3",D,"CO 30min Z2",D,"TR 20min",D,D), week(8,"CO 20min Z1",D,"TR 15min",D,DPRP,P,D) ] },
  { slug: "run-5k-sup-08",    title: "5 km — Superação (8 sem)",          targetLevel: "Iniciante",    weeklyKm: 20, sessionsPerWeek: 3, focus: "aerobico",    durationWeeks: 8,  goal: "5KM",            priceCents: 4990, phases: ["Base","Construção","Pico"], included: ["8 semanas de progressão aeróbica","Intervalado introdutório","Deload semana 4","Prova ao final"],
    weeks: [ week(1,"CO 25min Z1",D,"CO 25min Z1",D,"CO 25min Z1",D,D), week(2,"CO 30min Z1",D,"CO 30min Z1",D,"TRT 5km",D,D), week(3,"CO 35min Z2",D,"TF 30min",D,"CO 30min Z1",D,D), week(4,"TR 25min",D,"CO 30min Z1",D,"CO 30min Z2",D,D), week(5,"TI 5x500m Ra4",D,"CO 35min Z2",D,"TRT 5km",D,D), week(6,"TE 4km 80%",D,"CO 35min Z2",D,"TL 6km 70%",D,D), week(7,"TI 6x500m Ra4",D,"CO 30min Z2",D,"TR 25min",D,D), week(8,"CO 25min Z1",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-5k-evo-08",    title: "5 km — Evolução (8 sem)",           targetLevel: "Intermediário", weeklyKm: 30, sessionsPerWeek: 3, focus: "limiar",      durationWeeks: 8,  goal: "5KM",            priceCents: 4990, phases: ["Base","Construção","Pico"], included: ["8 sem de qualidade","Limiar e VO₂máx","3 blocos de periodização","Time-trial"],
    weeks: [ week(1,"COL 5km",D,"TI 6x400m Ra3",D,"COL 5km",D,D), week(2,"TF 35min",D,"TI 6x500m Ra4",D,"TE 5km 80%",D,D), week(3,"TL 7km 75%",D,"TI 8x400m Ra3",D,"TF 35min",D,D), week(4,"TR 25min",D,"COL 5km",D,"TR 25min",D,D), week(5,"TI 8x500m Ra4",D,"TE 6km 82%",D,"TRT 5km",D,D), week(6,"TL 8km 75%",D,"TI 10x400m Ra3",D,"TF 40min",D,D), week(7,"TI 6x600m Ra4",D,"TE 5km 85%",D,"TR 25min",D,D), week(8,"COL 4km",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-5k-evo-12",    title: "5 km — Evolução (12 sem)",          targetLevel: "Intermediário", weeklyKm: 35, sessionsPerWeek: 3, focus: "limiar",      durationWeeks: 12, goal: "5KM",            priceCents: 4990, phases: ["Base","Construção","Específico"], included: ["12 sem de periodização completa","3 blocos","VO₂máx e limiar","Time-trial de acompanhamento"],
    weeks: [ week(1,"COL 5km",D,"TI 4x500m Ra4",D,"COL 5km",D,D), week(2,"TF 30min",D,"TI 6x400m Ra3",D,"TE 5km 78%",D,D), week(3,"TL 7km 72%",D,"TI 6x500m Ra4",D,"TF 35min",D,D), week(4,"TR 25min",D,"COL 4km",D,"TR 20min",D,D), week(5,"TI 8x400m Ra3",D,"TE 6km 80%",D,"TRT 5km",D,D), week(6,"TL 8km 75%",D,"TI 8x500m Ra4",D,"TF 40min",D,D), week(7,"TI 10x400m Ra3",D,"TE 5km 83%",D,"TL 8km 75%",D,D), week(8,"TR 25min",D,"COL 5km",D,"TR 20min",D,D), week(9,"TI 6x600m Ra4",D,"TE 6km 85%",D,"TRT 5km",D,D), week(10,"TL 9km 75%",D,"TI 8x500m Ra3",D,"TF 40min",D,D), week(11,"TI 6x500m Ra3",D,"TE 5km 87%",D,"TR 25min",D,D), week(12,"COL 4km",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-10k-sup-08",   title: "10 km — Superação (8 sem)",         targetLevel: "Iniciante",    weeklyKm: 28, sessionsPerWeek: 3, focus: "aerobico",    durationWeeks: 8,  goal: "10KM",           priceCents: 4990, phases: ["Base","Construção","Pico"], included: ["8 sem progressão de volume","Longões semanais","Deload semana 4","Ritmo conservador"],
    weeks: [ week(1,"COL 5km",D,"CO 30min Z1",D,"TL 6km 70%",D,D), week(2,"TI 4x500m Ra4",D,"CO 35min Z2",D,"TL 7km 70%",D,D), week(3,"TF 35min",D,"CO 35min Z2",D,"TL 8km 70%",D,D), week(4,"TR 25min",D,"COL 5km",D,"TL 6km 72%",D,D), week(5,"TI 6x500m Ra4",D,"TE 6km 80%",D,"TL 9km 72%",D,D), week(6,"TF 40min",D,"TE 7km 80%",D,"TL 10km 72%",D,D), week(7,"TI 6x600m Ra4",D,"CO 35min Z2",D,"TR 25min",D,D), week(8,"COL 5km",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-10k-evo-12",   title: "10 km — Evolução (12 sem)",         targetLevel: "Intermediário", weeklyKm: 45, sessionsPerWeek: 3, focus: "limiar",      durationWeeks: 12, goal: "10KM",           priceCents: 4990, phases: ["Base","Construção","Específico"], included: ["12 sem periodização progressiva","Longões até 13 km","Limiar e VO₂máx","Taper e deloads"],
    weeks: [ week(1,"COL 5km",D,"TI 4x500m Ra4",D,"TL 7km 70%",D,D), week(2,"TF 35min",D,"TI 6x500m Ra4",D,"TL 8km 72%",D,D), week(3,"TE 7km 78%",D,"TI 6x600m Ra4",D,"TL 9km 72%",D,D), week(4,"TR 30min",D,"COL 6km",D,"TL 7km 70%",D,D), week(5,"TI 8x500m Ra3",D,"TE 8km 80%",D,"TL 10km 74%",D,D), week(6,"TF 45min",D,"TI 8x600m Ra3",D,"TL 11km 74%",D,D), week(7,"TI 10x500m Ra3",D,"TE 8km 83%",D,"TL 12km 74%",D,D), week(8,"TR 30min",D,"COL 6km",D,"TR 25min",D,D), week(9,"TI 6x800m Ra4",D,"TE 8km 85%",D,"TL 12km 75%",D,D), week(10,"TF 45min",D,"TI 8x600m Ra3",D,"TL 13km 75%",D,D), week(11,"TI 8x500m Ra3",D,"TE 8km 87%",D,"TR 30min",D,D), week(12,"COL 5km",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-21k-evo-16",   title: "Meia Maratona — Evolução (16 sem)", targetLevel: "Intermediário", weeklyKm: 55, sessionsPerWeek: 4, focus: "resistencia", durationWeeks: 16, goal: "VINTE_E_UM_KM",  priceCents: 4990, phases: ["Base","Construção","Específico","Polimento"], included: ["16 sem por blocos","Longões até 19 km","Limiar e ritmo de prova","3 deloads + taper"],
    weeks: [ week(1,"COL 6km",D,"TI 6x400m Ra3","COL 6km",D,"TL 10km 70%",D), week(2,"TF 35min",D,"TI 6x500m Ra4","TE 8km 78%",D,"TL 11km 72%",D), week(3,"COL 7km",D,"TI 8x400m Ra3","TE 9km 80%",D,"TL 12km 72%",D), week(4,"TR 30min",D,"COL 6km",D,D,"TL 10km 68%",D), week(5,"TI 6x600m Ra4",D,"TE 9km 80%","COL 7km",D,"TL 13km 74%",D), week(6,"TF 45min",D,"TI 8x500m Ra3","TE 10km 82%",D,"TL 14km 74%",D), week(7,"TI 8x600m Ra3",D,"TE 10km 83%","COL 8km",D,"TL 15km 75%",D), week(8,"TR 30min",D,"COL 7km",D,D,"TL 13km 70%",D), week(9,"TI 6x800m Ra4",D,"TE 11km 84%","COL 8km",D,"TL 16km 75%",D), week(10,"TF 50min",D,"TI 8x600m Ra3","TE 11km 85%",D,"TL 17km 75%",D), week(11,"TI 8x700m Ra4",D,"TE 12km 85%","COL 9km",D,"TL 18km 76%",D), week(12,"TR 35min",D,"COL 8km",D,D,"TL 15km 72%",D), week(13,"TI 6x800m Ra4",D,"TE 12km 86%","COL 8km",D,"TL 19km 76%",D), week(14,"TF 40min",D,"TE 10km 82%","COL 7km",D,"TL 16km 73%",D), week(15,"COL 6km",D,"TI 4x400m Ra3",D,D,"TL 12km 70%",D), week(16,"COL 5km",D,"TR 20min",D,DPRP,P,D) ] },
  { slug: "run-42k-evo-20",   title: "Maratona — Evolução (20 sem)",      targetLevel: "Avançado",     weeklyKm: 70, sessionsPerWeek: 4, focus: "resistencia", durationWeeks: 20, goal: "QUARENTA_E_DOIS_KM", priceCents: 4990, phases: ["Base","Construção","Específico","Polimento"], included: ["20 sem de periodização completa","Longões até 32 km","Ritmo de maratona","4 deloads + taper 3 sem"],
    weeks: [ week(1,"COL 7km",D,"TI 6x400m Ra3","COL 7km",D,"TL 12km 70%",D), week(2,"TF 40min",D,"TI 6x500m Ra4","TE 9km 76%",D,"TL 14km 70%",D), week(3,"COL 8km",D,"TI 8x400m Ra3","TE 10km 78%",D,"TL 15km 72%",D), week(4,"TI 6x600m Ra4",D,"TE 10km 79%","COL 8km",D,"TL 16km 72%",D), week(5,"TR 35min",D,"COL 7km",D,D,"TL 13km 68%",D), week(6,"TI 8x500m Ra3",D,"TE 11km 80%","COL 8km",D,"TL 17km 74%",D), week(7,"TF 50min",D,"TI 8x600m Ra3","TE 12km 80%",D,"TL 19km 74%",D), week(8,"TI 8x600m Ra3",D,"TE 12km 82%","COL 9km",D,"TL 21km 75%",D), week(9,"TF 55min",D,"TI 10x500m Ra3","TE 13km 82%",D,"TL 23km 75%",D), week(10,"TR 35min",D,"COL 8km",D,D,"TL 19km 70%",D), week(11,"TI 8x700m Ra4",D,"TE 13km 84%","COL 10km",D,"TL 25km 75%",D), week(12,"TF 60min",D,"TI 10x600m Ra3","TE 14km 84%",D,"TL 27km 75%",D), week(13,"TI 10x600m Ra3",D,"TE 14km 85%","COL 10km",D,"TL 29km 76%",D), week(14,"TF 60min",D,"TI 8x700m Ra3","TE 15km 85%",D,"TL 31km 76%",D), week(15,"TR 40min",D,"COL 9km",D,D,"TL 25km 72%",D), week(16,"TI 6x800m Ra4",D,"TE 15km 85%","COL 10km",D,"TL 32km 76%",D), week(17,"TF 50min",D,"TE 12km 80%","COL 9km",D,"TL 26km 74%",D), week(18,"TI 6x600m Ra3",D,"TE 10km 78%","COL 8km",D,"TL 20km 72%",D), week(19,"COL 7km",D,"TI 4x400m Ra3",D,D,"TL 14km 70%",D), week(20,"COL 5km",D,"TR 20min",D,DPRP,P,D) ] },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 seed-platform: iniciando...\n");

  // 1. Find or create system coach
  let coach = await prisma.coach.findFirst({ orderBy: { createdAt: "asc" } });
  if (!coach) {
    console.log("  → Nenhum coach encontrado, criando coach sistema...");
    await prisma.user.upsert({
      where: { email: "sistema@pacerunpro.com.br" },
      create: {
        email: "sistema@pacerunpro.com.br",
        name: "Pace Run Pro",
        role: "COACH",
        coach: { create: { credential: "Pace Run Pro", bio: "Templates oficiais", specialties: ["Corrida de rua"], slug: "pace-run-pro" } },
      },
      update: {},
    });
    coach = await prisma.coach.findFirst({ where: { user: { email: "sistema@pacerunpro.com.br" } } });
  }
  if (!coach) throw new Error("Coach não encontrado após criação");
  console.log(`  ✓ Coach: ${coach.id}\n`);

  // 2. Running plan templates
  console.log("🏃 Inserindo 8 planos de corrida...");
  for (const tpl of RUN_TEMPLATES) {
    const planContent = buildPlanContent(tpl.weeks, tpl.phases);

    // CoachRunTemplate (upsert by coachId + name)
    const existingRun = await prisma.coachRunTemplate.findFirst({ where: { coachId: coach.id, name: tpl.title } });
    if (!existingRun) {
      await prisma.coachRunTemplate.create({
        data: {
          coachId: coach.id, name: tpl.title, description: tpl.title,
          targetLevel: tpl.targetLevel, weeklyKm: tpl.weeklyKm, sessionsPerWeek: tpl.sessionsPerWeek, focus: tpl.focus,
          sessions: tpl.weeks[0].days.filter(d => d.workout !== "DESCANSO" && d.workout !== "DPRP").map(d => ({ dayLabel: d.day, title: d.workout, type: "corrida", description: d.workout })),
        },
      });
    }

    // PlanProduct (upsert by slug)
    await prisma.planProduct.upsert({
      where: { slug: tpl.slug },
      create: {
        coachId: coach.id, title: tpl.title, slug: tpl.slug, description: tpl.title,
        sport: "CORRIDA", level: tpl.targetLevel, durationWeeks: tpl.durationWeeks,
        goal: tpl.goal, priceCents: tpl.priceCents, currency: "BRL", published: true,
        featured: tpl.slug.includes("evo-12") || tpl.slug.includes("evo-16") || tpl.slug.includes("evo-20"),
        included: tpl.included, planContent,
      },
      update: { published: true, priceCents: tpl.priceCents, planContent, included: tpl.included },
    });
    console.log(`  ✓ ${tpl.slug}`);
  }

  // 3. Strength templates (28 = 7 divisions × 4 levels)
  console.log("\n💪 Inserindo 28 templates de força...");
  const strengthTpls = buildStrengthTemplates();
  for (const tpl of strengthTpls) {
    const existing = await prisma.coachStrengthTemplate.findFirst({ where: { coachId: coach.id, name: tpl.name } });
    if (!existing) {
      await prisma.coachStrengthTemplate.create({
        data: { coachId: coach.id, name: tpl.name, description: tpl.description, division: tpl.division, targetLevel: tpl.targetLevel, focus: tpl.focus, sessions: tpl.sessions as never },
      });
      console.log(`  ✓ ${tpl.name}`);
    } else {
      console.log(`  ↩ skip (já existe): ${tpl.name}`);
    }
  }

  console.log("\n🎉 seed-platform concluído!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
