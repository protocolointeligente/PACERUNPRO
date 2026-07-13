import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function isProductionLikeDatabase() {
  return (
    process.env.NODE_ENV === "production" ||
    /prod|production/i.test(connectionString)
  );
}

function requireProductionSeedOptIn() {
  if (isProductionLikeDatabase() && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error(
      "Refusing to run seed against a production-like database. Set ALLOW_PRODUCTION_SEED=true only after taking a verified backup."
    );
  }
}

function requireDestructiveResetOptIn() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error("Refusing destructive reset. Set ALLOW_DESTRUCTIVE_SEED=true to confirm.");
  }

  if (isProductionLikeDatabase() && process.env.ALLOW_PRODUCTION_SEED_RESET !== "true") {
    throw new Error(
      "Refusing destructive reset against a production-like database. Set ALLOW_PRODUCTION_SEED_RESET=true only after taking a verified backup."
    );
  }
}

function requirePassword(envName: string) {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`Missing ${envName}. Seed passwords must come from local environment variables.`);
  }
  return value;
}

async function reset() {
  requireDestructiveResetOptIn();

  console.warn("Running destructive database reset for seed data.");

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

  console.warn("Destructive seed reset completed.");
}

async function seed() {
  console.log("Creating development seed users...");

  const adminHash = await bcrypt.hash(requirePassword("SEED_ADMIN_PASSWORD"), 12);
  const coachHash = await bcrypt.hash(requirePassword("SEED_COACH_PASSWORD"), 12);
  const athleteHash = await bcrypt.hash(requirePassword("SEED_ATHLETE_PASSWORD"), 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pacerunpro.com.br" },
    update: {
      name: "Super Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
    create: {
      email: "admin@pacerunpro.com.br",
      name: "Super Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("Seeded admin user:", adminUser.email);

  const coachUser = await prisma.user.upsert({
    where: { email: "ricardo@pacerunpro.com.br" },
    update: {
      name: "Ricardo Luiz Pace Junior",
      passwordHash: coachHash,
      role: "COACH",
      city: "Belo Horizonte",
      state: "MG",
    },
    create: {
      email: "ricardo@pacerunpro.com.br",
      name: "Ricardo Luiz Pace Junior",
      passwordHash: coachHash,
      role: "COACH",
      city: "Belo Horizonte",
      state: "MG",
    },
  });

  const coachRecord = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {
      credential: "CREF 014626-G/MG",
      bio: "Treinador de corrida ha mais de 10 anos. Especialista em provas de rua e triathlon.",
      specialties: ["Corrida de rua", "Meia maratona", "Maratona", "Triathlon"],
      slug: "ricardo-pace",
    },
    create: {
      userId: coachUser.id,
      credential: "CREF 014626-G/MG",
      bio: "Treinador de corrida ha mais de 10 anos. Especialista em provas de rua e triathlon.",
      specialties: ["Corrida de rua", "Meia maratona", "Maratona", "Triathlon"],
      slug: "ricardo-pace",
    },
  });

  const existingCoachSubscription = await prisma.subscription.findFirst({
    where: { userId: coachUser.id, plan: "COACH" },
  });

  if (!existingCoachSubscription) {
    await prisma.subscription.create({
      data: {
        userId: coachUser.id,
        plan: "COACH",
        status: "TRIAL",
      },
    });
  }

  console.log("Seeded coach user:", coachUser.email);

  const athleteUser = await prisma.user.upsert({
    where: { email: "camila@exemplo.com" },
    update: {
      name: "Camila Andrade",
      passwordHash: athleteHash,
      role: "ATHLETE",
      city: "Belo Horizonte",
      state: "MG",
    },
    create: {
      email: "camila@exemplo.com",
      name: "Camila Andrade",
      passwordHash: athleteHash,
      role: "ATHLETE",
      city: "Belo Horizonte",
      state: "MG",
    },
  });

  await prisma.athlete.upsert({
    where: { userId: athleteUser.id },
    update: {
      coachId: coachRecord.id,
      goal: "VINTE_E_UM_KM",
      level: "INTERMEDIARIO",
      weeklyAvailability: 5,
      heightCm: 167,
      weightKg: 61.4,
      status: "ativo",
      adherenceRate: 0,
    },
    create: {
      userId: athleteUser.id,
      coachId: coachRecord.id,
      goal: "VINTE_E_UM_KM",
      level: "INTERMEDIARIO",
      weeklyAvailability: 5,
      heightCm: 167,
      weightKg: 61.4,
      status: "ativo",
      adherenceRate: 0,
    },
  });

  console.log("Seeded athlete user:", athleteUser.email);
  console.log("Seed completed.");
}

async function main() {
  requireProductionSeedOptIn();

  if (process.env.ALLOW_DESTRUCTIVE_SEED === "true") {
    await reset();
  } else {
    console.log("Skipping destructive reset. Set ALLOW_DESTRUCTIVE_SEED=true to reset local seed data.");
  }

  await seed();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
