import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

const ROOT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_EXERCISE_FOLDER_ID ?? "1DqREjf34Sex1xszcSN3XA7rFST0l4oMO";

const VIDEO_MIMETYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
  "application/vnd.google-apps.video",
  "video/mpeg",
]);

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

async function listFolder(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    key: apiKey,
    fields: "files(id,name,mimeType)",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

// GET /api/coach/exercises/drive-videos
// Returns flat list: { name: string; fileId: string }[]
// Name is the filename without extension, lowercased — for fuzzy matching against exercise names.
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "COACH") return NextResponse.json({ error: "Apenas treinadores" }, { status: 403 });

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    // Return empty list rather than error — page degrades gracefully without videos
    return NextResponse.json([]);
  }

  try {
    // Level 1: root folder contents
    const rootItems = await listFolder(ROOT_FOLDER_ID, apiKey);

    const videos: Array<{ name: string; fileId: string }> = [];
    const subfolderIds: string[] = [];

    for (const item of rootItems) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        subfolderIds.push(item.id);
      } else if (VIDEO_MIMETYPES.has(item.mimeType)) {
        videos.push({
          name: item.name.replace(/\.[^.]+$/, "").toLowerCase(),
          fileId: item.id,
        });
      }
    }

    // Level 2: list each subfolder in parallel
    const subResults = await Promise.all(
      subfolderIds.map((id) => listFolder(id, apiKey))
    );
    for (const items of subResults) {
      for (const item of items) {
        if (VIDEO_MIMETYPES.has(item.mimeType)) {
          videos.push({
            name: item.name.replace(/\.[^.]+$/, "").toLowerCase(),
            fileId: item.id,
          });
        }
      }
    }

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json([]);
  }
}
