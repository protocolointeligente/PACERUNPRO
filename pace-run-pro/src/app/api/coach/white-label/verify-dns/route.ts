import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function checkDnsRecords(domain: string): Promise<{ verified: boolean; records: string[] }> {
  const records: string[] = [];

  // Check CNAME
  try {
    const cnameRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
      { headers: { Accept: "application/dns-json" } }
    );
    const cnameData = (await cnameRes.json()) as { Answer?: { type: number; data: string }[] };
    const cnameAnswers = cnameData.Answer ?? [];
    const hasCname = cnameAnswers.some(
      (a) =>
        a.type === 5 &&
        (a.data.includes("pacerunpro") || a.data.includes("vercel"))
    );
    for (const a of cnameAnswers) {
      if (a.type === 5) records.push(`CNAME → ${a.data}`);
    }
    if (hasCname) {
      return { verified: true, records };
    }
  } catch {
    // DNS lookup failed — continue to A record check
  }

  // Check A record as fallback
  try {
    const aRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    );
    const aData = (await aRes.json()) as { Answer?: { type: number; data: string }[] };
    const aAnswers = aData.Answer ?? [];
    const hasA = aAnswers.some((a) => a.type === 1);
    for (const a of aAnswers) {
      if (a.type === 1) records.push(`A → ${a.data}`);
    }
    if (hasA) {
      return { verified: true, records };
    }
  } catch {
    // DNS lookup failed
  }

  return { verified: false, records };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as { domain?: string };
  const domain = body.domain?.trim();

  if (!domain) {
    return NextResponse.json({ error: "Domínio é obrigatório" }, { status: 400 });
  }

  if (!DOMAIN_REGEX.test(domain)) {
    return NextResponse.json({ error: "Formato de domínio inválido" }, { status: 400 });
  }

  const { verified, records } = await checkDnsRecords(domain);

  if (verified) {
    await prisma.billingSettings.upsert({
      where: { userId: session.user.id },
      update: {
        customDomain: domain,
        domainVerified: true,
        domainVerifiedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        customDomain: domain,
        domainVerified: true,
        domainVerifiedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ verified, domain, records });
}
