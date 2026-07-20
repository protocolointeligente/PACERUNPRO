import type { PaceLesson } from "./pace-university";

export type PaceLessonQuality = {
  valid: boolean;
  estimatedMinutes: number;
  wordCount: number;
  issues: string[];
};

const WORDS_PER_MINUTE = 150;

export function estimatePaceLessonMinutes(lesson: PaceLesson): number {
  const text = [lesson.content, lesson.example, lesson.activity, lesson.summary]
    .filter(Boolean)
    .join(" ");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const quizMinutes = (lesson.quiz?.length ?? 0) * 2;
  const referenceMinutes = (lesson.references?.length ?? 0) > 0 ? 1 : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE + quizMinutes + referenceMinutes));
}

export function validatePaceLesson(lesson: PaceLesson): PaceLessonQuality {
  const text = [lesson.content, lesson.example, lesson.activity, lesson.summary]
    .filter(Boolean)
    .join(" ")
    .trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const estimatedMinutes = estimatePaceLessonMinutes(lesson);
  const issues: string[] = [];

  if (!lesson.objective.trim()) issues.push("objetivo ausente");
  if (!lesson.content?.trim()) issues.push("conteúdo ausente");
  if (!lesson.example?.trim()) issues.push("exemplo prático ausente");
  if (!lesson.activity?.trim()) issues.push("atividade ausente");
  if (!lesson.summary?.trim()) issues.push("resumo ausente");
  if (!lesson.quiz?.length) issues.push("verificação de aprendizagem ausente");
  if (lesson.durationMin > 0 && Math.abs(estimatedMinutes - lesson.durationMin) / lesson.durationMin > 0.25) {
    issues.push(`duração divergente: indicada ${lesson.durationMin} min, estimada ${estimatedMinutes} min`);
  }

  return { valid: issues.length === 0, estimatedMinutes, wordCount, issues };
}

export function canPublishPaceLesson(lesson: PaceLesson): boolean {
  return validatePaceLesson(lesson).valid && lesson.status !== "draft" && lesson.status !== "archived";
}
