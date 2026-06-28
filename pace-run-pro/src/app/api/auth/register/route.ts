import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authRegisterLimiter } from "@/lib/rate-limit";
import { SubscriptionPlan } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.pacerunpro.com.br";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);

function recommendPlanId(athleteCount: number): string {
  if (athleteCount <= 1) return "b2b-free";
  if (athleteCount <= 20) return "b2b-starter";
  if (athleteCount <= 80) return "b2b-pro";
  if (athleteCount <= 250) return "b2b-assessoria";
  return "b2b-unlimited";
}

const WELCOME_HTML = (name: string, role: "COACH" | "ATHLETE") =>
  role === "COACH"
    ? `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0a0c0f;padding:32px 40px;border-radius:12px 12px 0 0">
    <h1 style="color:#C6F24E;font-size:24px;margin:0 0 8px">Bem-vindo ao PACE RUN PRO, ${name}!</h1>
    <p style="color:#9ca3af;margin:0">Sua conta está ativa. Comece agora.</p>
  </div>
  <div style="background:#f9fafb;padding:32px 40px;border-radius:0 0 12px 12px">
    <h2 style="font-size:18px;margin:0 0 16px">Comece por aqui — passo a passo</h2>
    <ol style="padding-left:20px;line-height:2">
      <li><strong>Cadastre seus atletas</strong> — acesse <a href="${BASE_URL}/treinador/atletas">Atletas</a> e compartilhe o link de convite</li>
      <li><strong>Configure sua página pública</strong> — vá em <a href="${BASE_URL}/treinador/minha-pagina">Minha página</a> e insira sua foto e planos</li>
      <li><strong>Calcule o VDOT</strong> — em <a href="${BASE_URL}/treinador/prescricao/corrida">Prescrição de corrida</a> insira o resultado de uma prova recente</li>
      <li><strong>Monte a periodização</strong> — use <a href="${BASE_URL}/treinador/prescricao/periodizacao">Periodização</a> para gerar o macrociclo completo</li>
      <li><strong>Conheça o sistema</strong> — o guia completo está em <a href="${BASE_URL}/treinador/conheca-o-sistema">Conheça o sistema</a></li>
    </ol>
    <div style="margin-top:24px">
      <a href="${BASE_URL}/treinador/dashboard" style="background:#C6F24E;color:#0a0c0f;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block">
        Acessar meu painel →
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#6b7280">
      Dúvidas? Responda este e-mail — estamos aqui para ajudar.<br/>
      Equipe PACE RUN PRO
    </p>
  </div>
</div>`
    : `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0a0c0f;padding:32px 40px;border-radius:12px 12px 0 0">
    <h1 style="color:#C6F24E;font-size:24px;margin:0 0 8px">Bem-vindo ao PACE RUN PRO, ${name}!</h1>
    <p style="color:#9ca3af;margin:0">Sua conta de atleta está pronta.</p>
  </div>
  <div style="background:#f9fafb;padding:32px 40px;border-radius:0 0 12px 12px">
    <h2 style="font-size:18px;margin:0 0 16px">Comece por aqui</h2>
    <ol style="padding-left:20px;line-height:2">
      <li><strong>Acesse seu dashboard</strong> — veja os treinos de hoje</li>
      <li><strong>Faça o check-in</strong> — registre seu RPE, sono e fadiga após cada treino</li>
      <li><strong>Conecte o Strava</strong> — sincronize suas atividades automaticamente</li>
    </ol>
    <div style="margin-top:24px">
      <a href="${BASE_URL}/atleta/dashboard" style="background:#C6F24E;color:#0a0c0f;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block">
        Acessar meu painel →
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#6b7280">Equipe PACE RUN PRO</p>
  </div>
</div>`;

export async function POST(req: NextRequest) {
  const rl = authRegisterLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const { name, email, password, phone, city, goal, role, studentCount, coachId, tosAccepted } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Formato de e-mail inválido." }, { status: 400 });
    }
    if (!tosAccepted) {
      return NextResponse.json({ error: "É necessário aceitar os Termos de Serviço para criar sua conta." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isCoach = role === "COACH";
    const tosAcceptedAt = new Date();

    // Look up (or create) coach record when coachId (user ID) is provided for athlete registration
    let coachRecord: { id: string } | null = null;
    if (!isCoach && coachId) {
      const coachUser = await prisma.user.findUnique({
        where: { id: coachId, role: "COACH" },
        select: { id: true },
      });
      if (coachUser) {
        coachRecord = await prisma.coach.upsert({
          where: { userId: coachId },
          update: {},
          create: { userId: coachId, specialties: [] },
          select: { id: true },
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone ?? null,
        city: city ?? null,
        tosAcceptedAt,
        role: isCoach ? "COACH" : "ATHLETE",
        ...(isCoach
          ? { coach: { create: { specialties: [] } } }
          : { athlete: { create: { goal: goal ?? null, ...(coachRecord ? { coachId: coachRecord.id } : {}) } } }),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Auto-activate free plan for coaches — no admin approval required
    if (isCoach) {
      const freeEnd = new Date();
      freeEnd.setDate(freeEnd.getDate() + 14); // 14-day free access to explore
      await prisma.subscription.create({
        data: { userId: user.id, plan: SubscriptionPlan.COACH, status: "ACTIVE", renewsAt: freeEnd },
      });

      // Notify admins via DB notification + email
      const adminUsers = ADMIN_EMAILS.length
        ? await prisma.user.findMany({ where: { email: { in: ADMIN_EMAILS } }, select: { id: true, email: true } })
        : [];

      if (adminUsers.length) {
        await prisma.notification.createMany({
          data: adminUsers.map((a) => ({
            userId: a.id,
            title: "Nova assessoria cadastrada",
            body: `${name} (${email}) criou uma conta de treinador e já está ativa.`,
          })),
        });
        // Fire-and-forget admin email
        sendEmail({
          to: adminUsers.map((a) => a.email).join(","),
          subject: `[PACE RUN PRO] Nova assessoria: ${name}`,
          html: `<p><strong>${name}</strong> (${email}) criou uma conta de treinador.<br/>O acesso foi ativado automaticamente no plano gratuito.<br/>Receita gerada: R$ 0,00 (plano grátis).</p>`,
        }).catch(() => null);
      }

      // Welcome email with onboarding guide
      sendEmail({
        to: email,
        subject: "Bem-vindo ao PACE RUN PRO — sua conta está ativa!",
        html: WELCOME_HTML(name, "COACH"),
      }).catch(() => null);
    } else {
      // Welcome athlete
      sendEmail({
        to: email,
        subject: "Bem-vindo ao PACE RUN PRO!",
        html: WELCOME_HTML(name, "ATHLETE"),
      }).catch(() => null);
    }

    const recommendedPlanId = isCoach ? recommendPlanId(Number(studentCount) || 1) : null;

    return NextResponse.json({ user, recommendedPlanId }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
