import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

const ROOT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_EXERCISE_FOLDER_ID ?? "1DqREjf34Sex1xszcSN3XA7rFST0l4oMO";

const VIDEO_EXTENSIONS = new Set([
  "mp4", "mov", "avi", "webm", "mkv", "m4v", "mpeg", "mpg",
]);

interface ParsedFolder {
  files: Array<{ id: string; name: string }>;
  subfolderIds: string[];
}

// Scrapes the Google Drive embedded folder view — works for publicly shared folders without an API key.
// Falls back to [] on any parsing or network error.
async function scrapePublicFolder(folderId: string): Promise<ParsedFolder> {
  let html: string;
  try {
    const res = await fetch(
      `https://drive.google.com/embeddedfolderview?id=${folderId}&hl=en`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return { files: [], subfolderIds: [] };
    html = await res.text();
  } catch {
    return { files: [], subfolderIds: [] };
  }

  const files: Array<{ id: string; name: string }> = [];
  const subfolderIds: string[] = [];
  const seenFiles = new Set<string>();
  const seenFolders = new Set<string>();

  // ── Subfolder IDs ────────────────────────────────────────────────────────────
  // Pick up links to subfolders in the folder listing
  const folderRe = /https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]{20,})/g;
  let m: RegExpExecArray | null;
  while ((m = folderRe.exec(html)) !== null) {
    const id = m[1];
    if (id !== folderId && !seenFolders.has(id)) {
      seenFolders.add(id);
      subfolderIds.push(id);
    }
  }

  // ── Strategy 1: anchor tags with href (file ID) + aria-label (name) ─────────
  // Modern embedded view: <a href=".../file/d/{id}/view..." aria-label="{name}">
  const anchorRe =
    /<a[^>]*href="https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,})\/view[^"]*"[^>]*aria-label="([^"]+)"[^>]*>|<a[^>]*aria-label="([^"]+)"[^>]*href="https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,})\/view[^"]*"[^>]*>/g;

  while ((m = anchorRe.exec(html)) !== null) {
    const id = m[1] ?? m[4];
    const name = (m[2] ?? m[3] ?? "").trim();
    if (!id || !name || seenFiles.has(id)) continue;
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (VIDEO_EXTENSIONS.has(ext)) {
      seenFiles.add(id);
      files.push({ id, name });
    }
  }

  // ── Strategy 2: file hrefs + nearby flip-entry-title / title / aria-label ───
  if (files.length === 0) {
    const hrefRe =
      /href="https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,})\/view/g;
    const candidates: Array<{ id: string; pos: number }> = [];
    while ((m = hrefRe.exec(html)) !== null) {
      if (!seenFiles.has(m[1])) candidates.push({ id: m[1], pos: m.index });
    }

    const namePatterns = [
      /class="[^"]*flip-entry-title[^"]*"[^>]*>([^<]+)</,
      /aria-label="([^"]+\.[a-z0-9]{2,4})"/,
      /title="([^"]+\.[a-z0-9]{2,4})"/,
    ];

    for (const { id, pos } of candidates) {
      if (seenFiles.has(id)) continue;
      const ctx = html.slice(Math.max(0, pos - 800), pos + 300);
      for (const pattern of namePatterns) {
        const nm = ctx.match(pattern);
        if (!nm) continue;
        const name = nm[1].trim();
        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        if (VIDEO_EXTENSIONS.has(ext)) {
          seenFiles.add(id);
          files.push({ id, name });
        }
        break;
      }
    }
  }

  return { files, subfolderIds };
}

// GET /api/coach/exercises/drive-videos
// Returns flat list: { name: string; fileId: string }[]
// name = filename without extension, lowercased — for fuzzy matching against exercise names.
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "COACH")
    return NextResponse.json({ error: "Apenas treinadores" }, { status: 403 });

  try {
    const { files: rootFiles, subfolderIds } = await scrapePublicFolder(ROOT_FOLDER_ID);

    const videos: Array<{ name: string; fileId: string }> = rootFiles.map((f) => ({
      name: f.name.replace(/\.[^.]+$/, "").toLowerCase(),
      fileId: f.id,
    }));

    const subResults = await Promise.all(
      subfolderIds.map((id) => scrapePublicFolder(id))
    );
    for (const { files } of subResults) {
      for (const f of files) {
        videos.push({
          name: f.name.replace(/\.[^.]+$/, "").toLowerCase(),
          fileId: f.id,
        });
      }
    }

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json([]);
  }
}
