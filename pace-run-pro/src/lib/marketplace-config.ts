import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "default";

export async function getMarketplaceConfig() {
  return prisma.marketplaceConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, defaultCommissionPct: 0.15 },
  });
}
