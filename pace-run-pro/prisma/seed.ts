import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Super Admin
  const adminHash = await bcrypt.hash("Mlm042119@", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pacerunpro.com.br" },
    update: {},
    create: {
      email: "admin@pacerunpro.com.br",
      name: "Super Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin criado:", adminUser.email);

  // SuperAdmin / Coach — Ricardo Pace
  const coachHash = await bcrypt.hash("PaceRunPro@2026", 12);
  const coachUser = await prisma.user.upsert({
    where: { email: "ricardo@pacerunpro.com.br" },
    update: {},
    create: {
      email: "ricardo@pacerunpro.com.br",
      name: "Ricardo Luiz Pace Júnior",
      passwordHash: coachHash,
      role: "COACH",
      phone: "",
      city: "Belo Horizonte",
      state: "MG",
      coach: {
        create: {
          credential: "CREF 014626-G/MG",
          bio: "Treinador de corrida há mais de 10 anos. Especialista em provas de rua e triathlon.",
          specialties: ["Corrida de rua", "Meia maratona", "Maratona", "Triathlon"],
        },
      },
    },
  });
  console.log("✅ Coach criado:", coachUser.email);

  // Sample athlete — Camila Andrade
  const athleteHash = await bcrypt.hash("Atleta@2026", 12);
  const athleteUser = await prisma.user.upsert({
    where: { email: "camila@exemplo.com" },
    update: {},
    create: {
      email: "camila@exemplo.com",
      name: "Camila Andrade",
      passwordHash: athleteHash,
      role: "ATHLETE",
      city: "Belo Horizonte",
      state: "MG",
      athlete: {
        create: {
          goal: "VINTE_E_UM_KM",
          level: "INTERMEDIARIO",
          weeklyAvailability: 5,
          heightCm: 167,
          weightKg: 61.4,
          status: "ativo",
          adherenceRate: 0.86,
        },
      },
    },
  });
  console.log("✅ Atleta criada:", athleteUser.email);

  console.log("✅ Seed concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
