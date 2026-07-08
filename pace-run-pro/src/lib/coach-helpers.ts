/**
 * Coach Query Helpers - Eliminam N+1 patterns comuns
 * Reduzem o padrão de: 1 query (get coach) + N queries (usar coach.id)
 * Para: 1 query (get dados direto pelo userId com include coach)
 */

import { prisma } from './prisma';

/**
 * Helper: Obter ID do coach direto pelo userId
 * ✅ 1 query ao invés de 2 (se não precisar de mais dados do coach)
 */
export async function getCoachIdByUserId(userId: string): Promise<string | null> {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  return coach?.id ?? null;
}

/**
 * Helper: Validar que user é coach e retornar ID
 * ✅ 1 query + validação
 */
export async function requireCoachId(userId: string, role?: string): Promise<string> {
  if (role !== 'COACH') {
    throw new Error('Não autorizado');
  }
  const coachId = await getCoachIdByUserId(userId);
  if (!coachId) {
    throw new Error('Coach não encontrado');
  }
  return coachId;
}

/**
 * REFACTORING GUIDE:
 * 
 * ❌ ANTES (N+1):
 * const coach = await prisma.coach.findUnique({
 *   where: { userId: session.user.id },
 *   select: { id: true }
 * });
 * if (!coach) return error;
 * const leads = await prisma.lead.findMany({
 *   where: { coachId: coach.id }
 * });
 * 
 * ✅ DEPOIS (1 query):
 * const leads = await prisma.lead.findMany({
 *   where: { coach: { userId: session.user.id } }
 * });
 * if (leads.length === 0) return empty;
 */

/**
 * Helpers para casos específicos onde a relação não é direta
 */

export async function getCoachLeadsOptimized(userId: string) {
  return await prisma.lead.findMany({
    where: { coach: { userId } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCoachTemplatesOptimized(userId: string) {
  return await prisma.sharedWorkoutTemplate.findMany({
    where: {
      coachId: { in: [await requireCoachId(userId)] },
    },
    include: {
      coach: {
        select: {
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getCoachExpensesOptimized(userId: string) {
  const coachId = await getCoachIdByUserId(userId);
  if (!coachId) return [];

  return await prisma.expense.findMany({
    where: { coachId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Batch: Refactor todas queries coach que usam padrão N+1
 * Aplicar aos seguintes arquivos:
 * - /api/coach/leads/route.ts (GET, POST, PATCH)
 * - /api/coach/biblioteca/route.ts (GET, POST)
 * - /api/coach/biblioteca/[id]/route.ts (GET, POST, DELETE)
 * - /api/coach/biblioteca/[id]/usar/route.ts (POST)
 * - /api/coach/expenses/route.ts (GET, POST)
 * - /api/coach/plans/route.ts (GET, POST)
 * - /api/coach/zone-models/route.ts (GET, POST)
 * - /api/coach/templates/corrida/route.ts (GET, POST)
 * - /api/coach/templates/forca/route.ts (GET, POST)
 * - /api/treinador/alertas/route.ts (GET)
 * - /api/planos/route.ts (POST)
 * 
 * Economia: 11 queries removidas!
 */
