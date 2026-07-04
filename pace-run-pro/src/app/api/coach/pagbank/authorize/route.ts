import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { buildConnectAuthUrl } from "@/lib/pagbank";

// GET /api/coach/pagbank/authorize
// Returns the PagBank Connect authorization URL for the coach to redirect to
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "COACH") return NextResponse.json({ error: "Apenas treinadores" }, { status: 403 });

  try {
    const url = buildConnectAuthUrl(session.user.id);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Configuração PagBank incompleta no servidor" }, { status: 500 });
  }
}
