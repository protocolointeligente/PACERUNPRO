import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function reset() {
  console.log("🗑️  Limpando banco de dados...");

  // Dependências mais profundas primeiro
  await prisma.exerciseVideo.deleteMany();
  await prisma.strengthBlock.deleteMany();
  await prisma.strengthWorkout.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.trainingWeek.deleteMany();
  await prisma.trainingPlan.deleteMany();
  await prisma.feedLike.deleteMany();
  await prisma.feedComment.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.race.deleteMany();
  await prisma.performanceTest.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.coachPlan.deleteMany();
  await prisma.coachStrengthTemplate.deleteMany();
  await prisma.coachRunTemplate.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billingSettings.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.connectedDevice.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Banco limpo.");
}

async function seed() {
  console.log("🌱 Criando usuários de teste...");

  // ── 1. Super Admin ─────────────────────────────────────────────────────────
  // Password read from env var — never hardcode credentials in source.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("SEED_ADMIN_PASSWORD env var required (ex: openssl rand -base64 16)");
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.create({
    data: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@pacerunpro.com.br",
      name: "Super Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", adminUser.email, "/ (senha definida via SEED_ADMIN_PASSWORD)");

  // ── 2. Treinador — teste ────────────────────────────────────────────────────
  const coachPassword = process.env.SEED_COACH_PASSWORD ?? adminPassword;
  const coachHash = await bcrypt.hash(coachPassword, 12);
  const coachUser = await prisma.user.create({
    data: {
      email: "ricardo@pacerunpro.com.br",
      name: "Ricardo Luiz Pace Júnior",
      passwordHash: coachHash,
      role: "COACH",
      city: "Belo Horizonte",
      state: "MG",
      coach: {
        create: {
          credential: "CREF 014626-G/MG",
          bio: "Treinador de corrida há mais de 10 anos. Especialista em provas de rua e triathlon.",
          specialties: ["Corrida de rua", "Meia maratona", "Maratona", "Triathlon"],
          slug: "ricardo-pace",
        },
      },
      // Assinatura em TRIAL para testar o fluxo de pagamento
      subscriptions: {
        create: {
          plan: "COACH",
          status: "TRIAL",
        },
      },
    },
  });
  console.log("✅ Coach:", coachUser.email, "/ (senha via SEED_COACH_PASSWORD ou SEED_ADMIN_PASSWORD)");

  // ── 3. Atleta — teste ──────────────────────────────────────────────────────
  const athletePassword = process.env.SEED_ATHLETE_PASSWORD ?? adminPassword;
  const athleteHash = await bcrypt.hash(athletePassword, 12);
  const coachRecord = await prisma.coach.findUnique({ where: { userId: coachUser.id } });

  const athleteUser = await prisma.user.create({
    data: {
      email: "camila@exemplo.com",
      name: "Camila Andrade",
      passwordHash: athleteHash,
      role: "ATHLETE",
      city: "Belo Horizonte",
      state: "MG",
      athlete: {
        create: {
          coachId: coachRecord!.id,
          goal: "VINTE_E_UM_KM",
          level: "INTERMEDIARIO",
          weeklyAvailability: 5,
          heightCm: 167,
          weightKg: 61.4,
          status: "ativo",
          adherenceRate: 0,
        },
      },
    },
  });
  console.log("✅ Atleta:", athleteUser.email, "/ (senha via SEED_ATHLETE_PASSWORD ou SEED_ADMIN_PASSWORD)");

  console.log("\n🎉 Seed concluído. Sistema pronto para testes.");
}

async function main() {
  await reset();
  await seed();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
