import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";

// In-memory store (replace with DB model PushSubscription when schema is extended)
// Required env vars to enable delivery:
//   VAPID_PUBLIC_KEY=<base64url>
//   VAPID_PRIVATE_KEY=<base64url>
//   VAPID_SUBJECT=mailto:seu@email.com
// Generate with: npx web-push generate-vapid-keys
const subscriptions = new Map<string, object>();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sub = await req.json();
  subscriptions.set(session.user.id, sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  subscriptions.delete(session.user.id);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Returns VAPID public key so clients can subscribe
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return NextResponse.json({ error: "Push não configurado" }, { status: 503 });
  return NextResponse.json({ vapidPublicKey: key });
}
