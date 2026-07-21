import { z } from "zod";

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Data inválida");

export const createWorkoutSchema = z.object({
  athleteId: z.string().min(1),
  date: calendarDate,
  title: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(60),
  structured: z.boolean().optional().default(false),
  blocks: z.unknown().optional(),
  targetDistanceKm: z.number().finite().nonnegative().optional(),
  targetDurationMin: z.number().int().positive().max(24 * 60).optional(),
  targetPaceSecPerKm: z.number().int().positive().max(3600).optional(),
  targetRpe: z.number().finite().min(0).max(10).optional(),
  objective: z.string().trim().max(1000).optional(),
  sport: z.string().trim().max(40).optional(),
});

export const copyWeekSchema = z.object({
  sourceAthleteId: z.string().min(1),
  weekStart: calendarDate,
  targetWeekStart: calendarDate.optional(),
  targetAthleteIds: z.array(z.string().min(1)).min(1).max(100),
});

export function validationError(error: z.ZodError) {
  return { error: "Dados inválidos", fields: error.flatten().fieldErrors };
}
