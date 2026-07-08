import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const env = fs.readFileSync('/workspaces/PACERUNPRO/pace-run-pro/.env.local', 'utf8');
  const url = env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
  if (!url) throw new Error('DATABASE_URL not found');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'Ricardo', mode: 'insensitive' } },
      select: {
        name: true,
        coach: {
          select: {
            credential: true,
            athletes: {
              select: {
                id: true,
                adherenceRate: true,
                goal: true,
                level: true,
                user: { select: { name: true } },
                checkins: { orderBy: { date: 'desc' }, take: 1, select: { date: true } },
              },
            },
          },
        },
      },
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
