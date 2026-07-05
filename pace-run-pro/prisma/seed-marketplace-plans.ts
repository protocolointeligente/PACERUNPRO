/**
 * Seed 20 platform marketplace plans — 5 sports × 4 levels at R$49,90 each.
 *
 * Run: npm run seed:marketplace-plans
 *
 * Safe to re-run: uses upsert by slug. Existing products are updated, not duplicated.
 * Products are created under the system coach (sistema@pacerunpro.com.br).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const PRICE_CENTS = 4990; // R$49,90

type SportDef = { key: string; label: string; emoji: string };
type LevelDef = { key: string; label: string; levelEnum: string; durationWeeks: number };

const SPORTS: SportDef[] = [
  { key: "corrida",    label: "Corrida de Rua",  emoji: "🏃" },
  { key: "natacao",    label: "Natação",          emoji: "🏊" },
  { key: "ciclismo",   label: "Ciclismo",         emoji: "🚴" },
  { key: "triatlon",   label: "Triátlon",         emoji: "🏅" },
  { key: "musculacao", label: "Musculação",        emoji: "🏋️" },
];

const LEVELS: LevelDef[] = [
  { key: "iniciante",    label: "Iniciante",    levelEnum: "Iniciante",    durationWeeks: 8  },
  { key: "intermediario",label: "Intermediário", levelEnum: "Intermediário", durationWeeks: 12 },
  { key: "avancado",     label: "Avançado",     levelEnum: "Avançado",     durationWeeks: 16 },
  { key: "pro",          label: "Pro / Elite",   levelEnum: "Pro",          durationWeeks: 20 },
];

// Sport DB value (uppercase, no accent) used in the sport column
const SPORT_DB: Record<string, string> = {
  corrida:    "CORRIDA",
  natacao:    "NATACAO",
  ciclismo:   "CICLISMO",
  triatlon:   "TRIATLON",
  musculacao: "MUSCULACAO",
};

function buildDescription(sport: SportDef, level: LevelDef): string {
  const intros: Record<string, Record<string, string>> = {
    corrida: {
      iniciante:    "Planilha completa de 8 semanas para quem está começando na corrida de rua. Volume gradual, cadência e prevenção de lesões.",
      intermediario:"12 semanas de periodização com intervalado, limiar e longões progressivos para evoluir seu 5 km ou 10 km.",
      avancado:     "16 semanas de treinamento de alto volume com blocos de VO₂máx, limiar e taper para corredores experientes.",
      pro:          "20 semanas de preparação de elite com planilha periodizada, testes de performance e protocolo de pico para provas de maratona e além.",
    },
    natacao: {
      iniciante:    "8 semanas de planilha progressiva para iniciantes na natação: técnica de crawl, respiração bilateral e volume controlado.",
      intermediario:"12 semanas de natação intermediária com séries de velocidade, pull, kick e resistência aeróbica.",
      avancado:     "16 semanas de planilha avançada com treinos de alta intensidade, viragens, partidas e pace de prova.",
      pro:          "20 semanas de preparação de alto rendimento para natação competitiva, com séries de VO₂máx, específico de distância e taper.",
    },
    ciclismo: {
      iniciante:    "8 semanas de planilha para iniciantes no ciclismo: rodadas em Z1-Z2, técnica de pedalada e primeiras subidas.",
      intermediario:"12 semanas de periodização para ciclistas intermediários com intervalado, FTP e fundo de resistência.",
      avancado:     "16 semanas de treino avançado em ciclismo com blocos de potência, Sweet Spot e taper para granfondos.",
      pro:          "20 semanas de preparação elite para ciclistas: VO₂máx, potência neuromuscular, periodização em bloco e preparação de pico.",
    },
    triatlon: {
      iniciante:    "8 semanas de introdução ao triátlon com equilíbrio entre natação, ciclismo e corrida, técnica de transição.",
      intermediario:"12 semanas de periodização multidisciplinar para triatletas intermediários visando Sprint ou Olímpico.",
      avancado:     "16 semanas de treinamento avançado de triátlon com volume elevado, brick workouts e periodização por bloco.",
      pro:          "20 semanas de preparação de alto rendimento para triátlon longo (Half e Full Ironman) com taper estruturado.",
    },
    musculacao: {
      iniciante:    "8 semanas de musculação para iniciantes: movimentos fundamentais, Full Body 3x, técnica segura e progressão de carga.",
      intermediario:"12 semanas de musculação intermediária: divisão AB ou ABC, progressão de volume e intensidade.",
      avancado:     "16 semanas de musculação avançada: periodização ondulatória, ABCD, força máxima e hipertrofia específica.",
      pro:          "20 semanas de musculação de alto nível: bloco de força, potência e pico para atletas e competidores.",
    },
  };

  return intros[sport.key]?.[level.key] ?? `Planilha de ${sport.label} — ${level.label}`;
}

function buildIncluded(sport: SportDef, level: LevelDef): string[] {
  const base = [
    `${level.durationWeeks} semanas de treino periodizado`,
    `Nível ${level.label}`,
    "Progressão de volume e intensidade",
    "Semanas de deload incluídas",
  ];

  const sportExtras: Record<string, string[]> = {
    corrida:    ["Treinos: regenerativo, contínuo, intervalado, fartlek e longão", "Guia de ritmo por zona"],
    natacao:    ["Treinos: técnica, resistência e velocidade", "Séries estruturadas por metro"],
    ciclismo:   ["Treinos: endurance, intervalado e recuperação", "Referência de potência e cadência"],
    triatlon:   ["Natação + Ciclismo + Corrida integrados", "Brick workouts e transições"],
    musculacao: ["Exercícios por grupo muscular", "Sets, reps e descanso detalhados", "Progressão de carga semanal"],
  };

  return [...base, ...(sportExtras[sport.key] ?? [])];
}

async function main() {
  console.log("🌱 seed-marketplace-plans: iniciando...\n");

  // 1. Find or create system coach
  let coach = await prisma.coach.findFirst({ where: { user: { email: "sistema@pacerunpro.com.br" } } });
  if (!coach) {
    console.log("  → Criando coach sistema...");
    await prisma.user.upsert({
      where: { email: "sistema@pacerunpro.com.br" },
      create: {
        email: "sistema@pacerunpro.com.br",
        name: "Pace Run Pro",
        role: "COACH",
        coach: {
          create: {
            credential: "Pace Run Pro",
            bio: "Planos oficiais da plataforma Pace Run Pro",
            specialties: ["Corrida de Rua", "Natação", "Ciclismo", "Triátlon", "Musculação"],
            slug: "pace-run-pro",
          },
        },
      },
      update: {},
    });
    coach = await prisma.coach.findFirst({ where: { user: { email: "sistema@pacerunpro.com.br" } } });
  }
  if (!coach) throw new Error("Coach não encontrado após upsert");
  console.log(`  ✓ Coach sistema: ${coach.id}`);

  // 2. Find or create marketplace store for system coach
  let store = await prisma.marketplaceStore.findUnique({ where: { coachId: coach.id }, select: { id: true } });
  if (!store) {
    console.log("  → Criando loja da plataforma...");
    store = await prisma.marketplaceStore.create({
      data: {
        coachId: coach.id,
        name: "Pace Run Pro — Planos Oficiais",
        slug: "pace-run-pro",
        description: "Planos de treino oficiais da plataforma para corrida, natação, ciclismo, triátlon e musculação.",
        commissionPct: 0,
        isActive: true,
      },
      select: { id: true },
    });
  }
  console.log(`  ✓ Loja: ${store.id}\n`);

  // 3. Create 20 marketplace products (5 sports × 4 levels)
  console.log("📦 Criando 20 planos de treino...\n");

  let created = 0;
  let updated = 0;

  for (const sport of SPORTS) {
    for (const level of LEVELS) {
      const slug = `plano-${sport.key}-${level.key}`;
      const title = `${sport.label} — ${level.label}`;
      const description = buildDescription(sport, level);
      const included = buildIncluded(sport, level);

      await prisma.marketplaceProduct.upsert({
        where: { slug },
        create: {
          storeId: store.id,
          coachId: coach.id,
          type: "PLANILHA",
          title,
          slug,
          description,
          priceCents: PRICE_CENTS,
          currency: "BRL",
          level: level.levelEnum,
          sport: SPORT_DB[sport.key],
          durationWeeks: level.durationWeeks,
          included,
          published: true,
          listingStatus: "APPROVED",
          featured: level.key === "pro" || sport.key === "triatlon",
        },
        update: {
          title,
          description,
          included,
          priceCents: PRICE_CENTS,
          published: true,
          listingStatus: "APPROVED",
          level: level.levelEnum,
          sport: SPORT_DB[sport.key],
          durationWeeks: level.durationWeeks,
        },
      });

      const isNew = !(await prisma.marketplaceProduct.findUnique({ where: { slug }, select: { createdAt: true } }));
      console.log(`  ✓ ${sport.emoji} ${title} → ${slug}`);
      if (isNew) created++; else updated++;
    }
  }

  console.log(`\n🎉 Concluído! ${SPORTS.length * LEVELS.length} planos disponíveis na loja.`);
  console.log(`   Criados: ${created} | Atualizados: ${updated}`);
  console.log(`\n⚠️  ATENÇÃO: Para pagamentos PIX funcionarem, configure PAGBANK_TOKEN e PAGBANK_ACCOUNT_ID nas env vars.`);
  console.log(`   Produtos de plataforma (sem coach PagBank) usam pagamento direto para a conta da plataforma.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
