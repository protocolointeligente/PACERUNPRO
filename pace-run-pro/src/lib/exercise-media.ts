export type ExerciseMediaKind = "video" | "embed" | "image" | "none";

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

function normalizeYoutubeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;
    if (parsed.hostname === "youtu.be") videoId = parsed.pathname.slice(1).split("/")[0] || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      videoId = parsed.searchParams.get("v") || parsed.pathname.match(/\/embed\/([^/]+)/)?.[1] || parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1] || null;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export function resolveExerciseMedia(exercise: ExerciseMediaSource) {
  const videoUrl = normalizeDriveUrl(exercise.videos?.[0]?.url);
  if (videoUrl) {
    const youtubeUrl = normalizeYoutubeUrl(videoUrl);
    if (youtubeUrl) return { kind: "embed" as const, url: youtubeUrl };
    return { kind: "video" as const, url: videoUrl };
  }

  if (exercise.imageUrl) {
    return { kind: "image" as const, url: exercise.imageUrl };
  }

  return { kind: "none" as const, url: null };
}
