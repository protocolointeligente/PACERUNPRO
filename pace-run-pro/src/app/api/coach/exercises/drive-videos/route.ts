import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

// Public Google Sheet — exercise library. Override via env vars if the sheet layout changes.
const SHEET_ID =
  process.env.EXERCISE_SHEET_ID ?? "1PXAUaNzflNINwj2RLnIdnmszq2TE2Vp7GITtIvRlxj4";
const SHEET_GID =
  process.env.EXERCISE_SHEET_GID ?? "1335246098";

// Column indices (0-based). Column A = 0, Column G = 6.
const NAME_COL = Number(process.env.EXERCISE_NAME_COL ?? "0");  // exercise name (column A)
const VIDEO_COL = Number(process.env.EXERCISE_VIDEO_COL ?? "6"); // Vimeo URL  (column G)

// Build Vimeo player embed URL from any Vimeo share/watch URL.
// Handles: vimeo.com/{id}, vimeo.com/{id}/{hash}, player.vimeo.com/video/{id}, ?h= param.
function toVimeoEmbed(raw: string): string | null {
  if (!raw?.includes("vimeo")) return null;
  const m = raw.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?/);
  if (!m) return null;
  const id = m[1];
  const pathHash = m[2];
  if (pathHash) return `https://player.vimeo.com/video/${id}?h=${pathHash}`;
  const qHash = new URLSearchParams(raw.split("?")[1] ?? "").get("h");
  if (qHash) return `https://player.vimeo.com/video/${id}?h=${qHash}`;
  return `https://player.vimeo.com/video/${id}`;
}

// Minimal RFC 4180 CSV line parser (handles quoted fields with embedded commas/newlines).
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

// GET /api/coach/exercises/drive-videos
// Returns: { name: string; vimeoUrl: string }[]
// name = exercise name lowercased for fuzzy matching on the strength page.
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "COACH")
    return NextResponse.json({ error: "Apenas treinadores" }, { status: 403 });

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    const res = await fetch(csvUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json([]);

    const text = await res.text();
    const lines = text.split(/\r?\n/);

    const videos: Array<{ name: string; vimeoUrl: string }> = [];

    // Row 0 is the header — skip it
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      const name = cells[NAME_COL]?.trim();
      const rawUrl = cells[VIDEO_COL]?.trim();
      if (!name || !rawUrl) continue;
      const vimeoUrl = toVimeoEmbed(rawUrl);
      if (!vimeoUrl) continue;
      videos.push({ name: name.toLowerCase(), vimeoUrl });
    }

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json([]);
  }
}
