export type ExerciseMediaKind = "video" | "image" | "none";

interface ExerciseVideoLike {
  url?: string | null;
}

interface ExerciseMediaSource {
  imageUrl?: string | null;
  videos?: ExerciseVideoLike[] | null;
}

function normalizeDriveUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const googleDriveMatch = trimmed.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (googleDriveMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${googleDriveMatch[1]}`;
  }

  return trimmed;
}

export function resolveExerciseMedia(exercise: ExerciseMediaSource) {
  const videoUrl = normalizeDriveUrl(exercise.videos?.[0]?.url);
  if (videoUrl) {
    return { kind: "video" as const, url: videoUrl };
  }

  if (exercise.imageUrl) {
    return { kind: "image" as const, url: exercise.imageUrl };
  }

  return { kind: "none" as const, url: null };
}
