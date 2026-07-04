import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

const MW_API_KEY = process.env.MUSCLEWIKI_API_KEY ?? "";
const MW_BASE = "https://musclewiki.com/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const muscle = searchParams.get("muscle") ?? "";
  const category = searchParams.get("category") ?? "";

  const params = new URLSearchParams();
  if (q) params.set("search", q);
  if (muscle) params.set("muscles", muscle);
  if (category) params.set("category", category);
  params.set("limit", "30");

  try {
    const url = `${MW_BASE}/exercises/?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${MW_API_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ exercises: [], error: res.statusText }, { status: res.status });
    }

    const data = await res.json();
    // Normalize: API may return array or { results: [...] }
    const exercises = Array.isArray(data) ? data : (data.results ?? data.exercises ?? []);
    return NextResponse.json({ exercises });
  } catch {
    return NextResponse.json({ exercises: [], error: "Erro ao buscar exercícios" }, { status: 502 });
  }
}
