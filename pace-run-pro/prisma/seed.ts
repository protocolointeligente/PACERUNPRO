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
  const adminHash = await bcrypt.hash("Mlm042119@", 12);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@pacerunpro.com.br",
      name: "Super Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", adminUser.email, "/ Mlm042119@");

  // ── 2. Treinador — Ricardo Pace ────────────────────────────────────────────
  const coachHash = await bcrypt.hash("PaceRunPro@2026", 12);
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
  console.log("✅ Coach:", coachUser.email, "/ PaceRunPro@2026");

  // ── 3. Atleta — Camila Andrade (vinculada ao Ricardo) ─────────────────────
  const athleteHash = await bcrypt.hash("Atleta@2026", 12);
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
  console.log("✅ Atleta:", athleteUser.email, "/ Atleta@2026");

  console.log("\n🎉 Seed concluído. Sistema pronto para testes.");
}

async function main() {
  await reset();
  await seed();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
