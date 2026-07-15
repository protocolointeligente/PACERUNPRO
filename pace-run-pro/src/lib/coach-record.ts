import { prisma as defaultPrisma } from "@/lib/prisma";

type CoachRecordClient = {
  coach: {
    upsert(args: {
      where: { userId: string };
      update: Record<string, never>;
      create: { userId: string; specialties: string[] };
      select: { id: true; userId: true };
    }): Promise<{ id: string; userId: string }>;
  };
};

export async function ensureCoachRecord(
  userId: string,
  prisma: CoachRecordClient = defaultPrisma,
) {
  return prisma.coach.upsert({
    where: { userId },
    update: {},
    create: { userId, specialties: [] },
    select: { id: true, userId: true },
  });
}
