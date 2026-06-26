import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// Converts compact workout notation to a structured PlanWorkout
function parseWorkout(raw: string, dayOfWeek: number, weekNum: number): object | null {
  if (!raw || raw === "DESCANSO" || raw === "DPRP") return null;

  const isRace = raw === "PROVA";
  if (isRace) {
    return {
      id: `w${weekNum}d${dayOfWeek}`,
      dayOfWeek,
      type: "PROVA",
      title: "Dia de Prova",
      objective: "Competição",
      targetRpe: 9,
    };
  }

  // Parse distance (e.g. "TL 12km 75%", "TI 8x400m Ra3", "TF 45min")
  let type = "CORRIDA";
  let title = raw;
  let targetDistanceKm: number | undefined;
  let targetDurationMin: number | undefined;
  let targetRpe = 6;

  if (raw.startsWith("TL") || raw.startsWith("TE")) {
    type = "LONGO";
    targetRpe = 7;
    const km = raw.match(/(\d+(?:\.\d+)?)km/);
    if (km) targetDistanceKm = parseFloat(km[1]);
  } else if (raw.startsWith("TI")) {
    type = "INTERVALADO";
    targetRpe = 8;
  } else if (raw.startsWith("TF")) {
    type = "FARTLEK";
    targetRpe = 7;
    const min = raw.match(/(\d+)min/);
    if (min) targetDurationMin = parseInt(min[1]);
  } else if (raw.startsWith("TRT")) {
    type = "TIME_TRIAL";
    targetRpe = 9;
    const km = raw.match(/(\d+(?:\.\d+)?)km/);
    if (km) targetDistanceKm = parseFloat(km[1]);
  } else if (raw.startsWith("TR")) {
    type = "REGENERATIVO";
    targetRpe = 4;
    const min = raw.match(/(\d+)min/);
    if (min) targetDurationMin = parseInt(min[1]);
  } else if (raw.startsWith("CO") || raw.startsWith("COL") || raw.startsWith("COR")) {
    type = "CONTINUO";
    targetRpe = raw.includes("Z2") ? 6 : 5;
    const km = raw.match(/(\d+(?:\.\d+)?)km/);
    if (km) targetDistanceKm = parseFloat(km[1]);
    const min = raw.match(/(\d+)min/);
    if (min) targetDurationMin = parseInt(min[1]);
  }

  return {
    id: `w${weekNum}d${dayOfWeek}`,
    dayOfWeek,
    type,
    title,
    targetDistanceKm,
    targetDurationMin,
    targetRpe,
  };
}

function buildPlanContent(weeks: Array<{ week: number; days: Array<{ day: string; workout: string }> }>, phases: string[]) {
  return weeks.map((w) => {
    const phaseIdx = Math.min(Math.floor((w.week - 1) / 4), phases.length - 1);
    const workouts = w.days
      .map((d, dayIdx) => parseWorkout(d.workout, dayIdx, w.week))
      .filter(Boolean);
    return {
      weekNumber: w.week,
      phase: phases[phaseIdx],
      workouts,
    };
  });
}

// ─── Template definitions ────────────────────────────────────────────────────

const D = "DESCANSO";
const P = "PROVA";
const DPRP = "DPRP";

function week(n: number, seg: string, ter: string, qua: string, qui: string, sex: string, sab: string, dom: string) {
  return {
    week: n,
    days: [
      { day: "SEG", workout: seg },
      { day: "TER", workout: ter },
      { day: "QUA", workout: qua },
      { day: "QUI", workout: qui },
      { day: "SEX", workout: sex },
      { day: "SAB", workout: sab },
      { day: "DOM", workout: dom },
    ],
  };
}

const TEMPLATES = [
  {
    slug: "run-3k-inic-08",
    title: "3 km — Iniciante (8 semanas)",
    description: "Prepare-se para completar os primeiros 3 km com treinos progressivos de corrida.",
    targetLevel: "Iniciante",
    weeklyKm: 15,
    sessionsPerWeek: 3,
    focus: "aerobico",
    durationWeeks: 8,
    goal: "3KM",
    phases: ["Base", "Construção", "Pico"],
    included: ["8 semanas de treinamento progressivo", "Treinos de corrida intervalada", "Periodização com semana de descarga", "Guia de pace por zonas"],
    weeks: [
      week(1, "CO 20min Z1", D, "CO 20min Z1", D, "CO 20min Z1", D, D),
      week(2, "CO 25min Z1", D, "CO 25min Z1", D, "CO 25min Z1", D, D),
      week(3, "CO 30min Z2", D, "CO 30min Z2", D, "TRT 3km", D, D),
      week(4, "TR 20min", D, "CO 25min Z1", D, "CO 25min Z1", D, D),
      week(5, "TI 4x400m Ra3", D, "CO 30min Z2", D, "TRT 3km", D, D),
      week(6, "CO 35min Z2", D, "TF 30min", D, "CO 30min Z2", D, D),
      week(7, "TI 6x400m Ra3", D, "CO 30min Z2", D, "TR 20min", D, D),
      week(8, "CO 20min Z1", D, "TR 15min", D, DPRP, P, D),
    ],
  },
  {
    slug: "run-5k-sup-08",
    title: "5 km — Superação (8 semanas)",
    description: "Plano de base para quem quer completar os primeiros 5 km com conforto.",
    targetLevel: "Iniciante",
    weeklyKm: 20,
    sessionsPerWeek: 3,
    focus: "aerobico",
    durationWeeks: 8,
    goal: "5KM",
    phases: ["Base", "Construção", "Pico"],
    included: ["8 semanas de progressão aeróbica", "Introdução ao treino intervalado", "Semana de descarga na semana 4", "Prova no final"],
    weeks: [
      week(1, "CO 25min Z1", D, "CO 25min Z1", D, "CO 25min Z1", D, D),
      week(2, "CO 30min Z1", D, "CO 30min Z1", D, "TRT 5km", D, D),
      week(3, "CO 35min Z2", D, "TF 30min", D, "CO 30min Z1", D, D),
      week(4, "TR 25min", D, "CO 30min Z1", D, "CO 30min Z2", D, D),
      week(5, "TI 5x500m Ra4", D, "CO 35min Z2", D, "TRT 5km", D, D),
      week(6, "TE 4km 80%", D, "CO 35min Z2", D, "TL 6km 70%", D, D),
      week(7, "TI 6x500m Ra4", D, "CO 30min Z2", D, "TR 25min", D, D),
      week(8, "CO 25min Z1", D, "TR 20min", D, DPRP, P, D),
    ],
  },
  {
    slug: "run-5k-evo-08",
    title: "5 km — Evolução (8 semanas)",
    description: "Para quem já corre e quer melhorar o tempo nos 5 km, com foco em ritmo e limiar.",
    targetLevel: "Intermediário",
    weeklyKm: 30,
    sessionsPerWeek: 3,
    focus: "limiar",
    durationWeeks: 8,
    goal: "5KM",
    phases: ["Base", "Construção", "Pico"],
    included: ["8 semanas de treino de qualidade", "Treinos de limiar e VO₂máx", "Periodização em 3 blocos", "Time-trial para acompanhar evolução"],
    weeks: [
      week(1, "COL 5km", D, "TI 6x400m Ra3", D, "COL 5km", D, D),
      week(2, "TF 35min", D, "TI 6x500m Ra4", D, "TE 5km 80%", D, D),
      week(3, "TL 7km 75%", D, "TI 8x400m Ra3", D, "TF 35min", D, D),
      week(4, "TR 25min", D, "COL 5km", D, "TR 25min", D, D),
      week(5, "TI 8x500m Ra4", D, "TE 6km 82%", D, "TRT 5km", D, D),
      week(6, "TL 8km 75%", D, "TI 10x400m Ra3", D, "TF 40min", D, D),
      week(7, "TI 6x600m Ra4", D, "TE 5km 85%", D, "TR 25min", D, D),
      week(8, "COL 4km", D, "TR 20min", D, DPRP, P, D),
    ],
  },
  {
    slug: "run-5k-evo-12",
    title: "5 km — Evolução (12 semanas)",
    description: "Periodização completa de 12 semanas para maximizar a performance nos 5 km.",
    targetLevel: "Intermediário",
    weeklyKm: 35,
    sessionsPerWeek: 3,
    focus: "limiar",
    durationWeeks: 12,
    goal: "5KM",
    phases: ["Base", "Construção", "Específico"],
    included: ["12 semanas de periodização completa", "3 blocos de treinamento", "Treinos de VO₂máx e limiar", "Time-trial de acompanhamento"],
    weeks: [
      week(1, "COL 5km", D, "TI 4x500m Ra4", D, "COL 5km", D, D),
      week(2, "TF 30min", D, "TI 6x400m Ra3", D, "TE 5km 78%", D, D),
      week(3, "TL 7km 72%", D, "TI 6x500m Ra4", D, "TF 35min", D, D),
      week(4, "TR 25min", D, "COL 4km", D, "TR 20min", D, D),
      week(5, "TI 8x400m Ra3", D, "TE 6km 80%", D, "TRT 5km", D, D),
      week(6, "TL 8km 75%", D, "TI 8x500m Ra4", D, "TF 40min", D, D),
      week(7, "TI 10x400m Ra3", D, "TE 5km 83%", D, "TL 8km 75%", D, D),
      week(8, "TR 25min", D, "COL 5km", D, "TR 20min", D, D),
      week(9, "TI 6x600m Ra4", D, "TE 6km 85%", D, "TRT 5km", D, D),
      week(10, "TL 9km 75%", D, "TI 8x500m Ra3", D, "TF 40min", D, D),
      week(11, "TI 6x500m Ra3", D, "TE 5km 87%", D, "TR 25min", D, D),
      week(12, "COL 4km", D, "TR 20min", D, DPRP, P, D),
    ],
  },
  {
    slug: "run-10k-sup-08",
    title: "10 km — Superação (8 semanas)",
    description: "Chegue à linha de chegada dos 10 km com segurança, construindo volume e resistência.",
    targetLevel: "Iniciante",
    weeklyKm: 28,
    sessionsPerWeek: 3,
    focus: "aerobico",
    durationWeeks: 8,
    goal: "10KM",
    phases: ["Base", "Construção", "Pico"],
    included: ["8 semanas de progressão de volume", "Corridas longas semanais", "Semana de descarga na semana 4", "Ritmo conservador e seguro"],
    weeks: [
      week(1, "COL 5km", D, "CO 30min Z1", D, "TL 6km 70%", D, D),
      week(2, "TI 4x500m Ra4", D, "CO 35min Z2", D, "TL 7km 70%", D, D),
      week(3, "TF 35min", D, "CO 35min Z2", D, "TL 8km 70%", D, D),
      week(4, "TR 25min", D, "COL 5km", D, "TL 6km 72%", D, D),
      week(5, "TI 6x500m Ra4", D, "TE 6km 80%", D, "TL 9km 72%", D, D),
      week(6, "TF 40min", D, "TE 7km 80%", D, "TL 10km 72%", D, D),
      week(7, "TI 6x600m Ra4", D, "CO 35min Z2", D, "TR 25min", D, D),
      week(8, "COL 5km", D, "TR 20min", D, DPRP, P, D),
    ],
  },
  {
    slug: "run-10k-evo-12",
    title: "10 km — Evolução (12 semanas)",
    description: "Periodização progressiva de 3 meses para melhorar o tempo e economia de corrida nos 10 km.",
    targetLevel: "Intermediário",
    weeklyKm: 45,
    sessionsPerWeek: 3,
    focus: "limiar",
    durationWeeks: 12,
    goal: "10KM",
    phases: ["Base", "Construção", "Específico"],
    included: ["12 semanas de periodização progressiva", "Corridas longas até 13 km", "Treinos de limiar e VO₂máx", "Taper e semanas de descarga"],
    weeks: [
      week(1, "COL 5km", D, "TI 4x500m Ra4", D, "TL 7km 70%", D, D),
      week(2, "TF 35min", D, "TI 6x500m Ra4", D, "TL 8km 72%", D, D),
      week(3, "TE 7km 78%", D, "TI 6x600m Ra4", D, "TL 9km 72%", D, D),
      week(4, "TR 30min", D, "COL 6km", D, "TL 7km 70%", D, D),
      week(5, "TI 8x500m Ra3", D, "TE 8km 80%", D, "TL 10km 74%", D, D),
      week(6, "TF 45min", D, "TI 8x600m Ra3", D, "TL 11km 74%", D, D),
      week(7, "TI 10x500m Ra3", D, "TE 8km 83%", D, "TL 12km 74%", D, D),
      week(8, "TR 30min", D, "COL 6km", D, "TR 25min", D, D),
      week(9, "TI 6x800m Ra4", D, "TE 8km 85%", D, "TL 12km 75%", D, D),
      week(10, "TF 45min", D, "TI 8x600m Ra3", D, "TL 13km 75%", D, D),
      week(11, "TI 8x500m Ra3", D, "TE 8km 87%", D, "TR 30min", D, D),
      week(12, "COL 5km", D, "TR 20min", D, DPRP, P, D),
    ],
  },
];

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Find any coach to own these templates (prefer the first active coach)
  let coach = await prisma.coach.findFirst({ orderBy: { createdAt: "asc" } });

  if (!coach) {
    // Create a system coach user if none exists
    await prisma.user.upsert({
      where: { email: "sistema@pacerunpro.com.br" },
      create: {
        email: "sistema@pacerunpro.com.br",
        name: "Pace Run Pro",
        role: "COACH",
        coach: {
          create: {
            credential: "Pace Run Pro",
            bio: "Planos oficiais Pace Run Pro",
            specialties: ["Corrida de rua"],
            slug: "pace-run-pro",
          },
        },
      },
      update: {},
    });
    coach = await prisma.coach.findFirst({ where: { user: { email: "sistema@pacerunpro.com.br" } } });
  }

  if (!coach) {
    return NextResponse.json({ error: "Não foi possível encontrar ou criar um coach" }, { status: 500 });
  }

  const results: Array<{ slug: string; runTplId: string; planProductId: string }> = [];

  for (const tpl of TEMPLATES) {
    const planContent = buildPlanContent(tpl.weeks, tpl.phases);

    // Create or update CoachRunTemplate
    const existingRun = await prisma.coachRunTemplate.findFirst({
      where: { coachId: coach.id, name: tpl.title },
    });

    let runTpl;
    if (existingRun) {
      runTpl = await prisma.coachRunTemplate.update({
        where: { id: existingRun.id },
        data: {
          name: tpl.title,
          description: tpl.description,
          targetLevel: tpl.targetLevel,
          weeklyKm: tpl.weeklyKm,
          sessionsPerWeek: tpl.sessionsPerWeek,
          focus: tpl.focus,
          sessions: tpl.weeks[0].days
            .filter((d) => d.workout !== "DESCANSO" && d.workout !== "DPRP")
            .map((d) => ({
              dayLabel: d.day,
              title: d.workout,
              type: "corrida",
              description: d.workout,
            })),
        },
      });
    } else {
      runTpl = await prisma.coachRunTemplate.create({
        data: {
          coachId: coach.id,
          name: tpl.title,
          description: tpl.description,
          targetLevel: tpl.targetLevel,
          weeklyKm: tpl.weeklyKm,
          sessionsPerWeek: tpl.sessionsPerWeek,
          focus: tpl.focus,
          sessions: tpl.weeks[0].days
            .filter((d) => d.workout !== "DESCANSO" && d.workout !== "DPRP")
            .map((d) => ({
              dayLabel: d.day,
              title: d.workout,
              type: "corrida",
              description: d.workout,
            })),
        },
      });
    }

    // Create or update PlanProduct
    const planProduct = await prisma.planProduct.upsert({
      where: { slug: tpl.slug },
      create: {
        coachId: coach.id,
        title: tpl.title,
        slug: tpl.slug,
        description: tpl.description,
        sport: "CORRIDA",
        level: tpl.targetLevel,
        durationWeeks: tpl.durationWeeks,
        goal: tpl.goal,
        priceCents: 4990,
        currency: "BRL",
        published: true,
        featured: tpl.slug.includes("5k-evo-12") || tpl.slug.includes("10k-evo-12"),
        included: tpl.included,
        planContent,
      },
      update: {
        title: tpl.title,
        description: tpl.description,
        level: tpl.targetLevel,
        durationWeeks: tpl.durationWeeks,
        goal: tpl.goal,
        priceCents: 4990,
        published: true,
        included: tpl.included,
        planContent,
      },
    });

    results.push({ slug: tpl.slug, runTplId: runTpl.id, planProductId: planProduct.id });
  }

  return NextResponse.json({
    ok: true,
    coachId: coach.id,
    created: results,
    message: `${results.length} templates upserted successfully`,
  });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const planProducts = await prisma.planProduct.findMany({
    select: { id: true, slug: true, title: true, priceCents: true, published: true, durationWeeks: true },
    orderBy: { createdAt: "asc" },
  });

  const runTemplates = await prisma.coachRunTemplate.count();

  return NextResponse.json({ planProducts, runTemplateCount: runTemplates });
}
