import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authRegisterLimiter } from "@/lib/rate-limit";
import { Goal, SubscriptionPlan } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const RegisterSchema = z.object({
  name:         z.string().min(2).max(100),
  email:        z.string().email(),
  password:     z.string().min(8).max(128),
  tosAccepted:  z.literal(true),
  role:         z.enum(["COACH", "ATHLETE"]).optional(),
  phone:        z.string().max(20).optional().nullable(),
  city:         z.string().max(100).optional().nullable(),
  goal:         z.nativeEnum(Goal).optional().nullable(),
  studentCount: z.coerce.number().int().min(0).max(10000).optional(),
  coachId:      z.string().optional().nullable(),
  inviteToken:  z.string().max(200).optional().nullable(),
});

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
  const rl = await authRegisterLimiter(req);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const raw = await req.json();
    const parsed = RegisterSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first?.message ?? "Dados inválidos." }, { status: 400 });
    }
    const { name, email, password, phone, city, goal, role, studentCount, coachId, inviteToken, tosAccepted } = parsed.data;
    void tosAccepted; // always true per schema

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const isCoach = role === "COACH";
    const tosAcceptedAt = new Date();

    // Look up coach record via inviteToken (preferred) or coachId (legacy)
    let coachRecord: { id: string } | null = null;
    let resolvedInviteId: string | null = null;
    if (!isCoach) {
      if (inviteToken) {
        const invite = await prisma.athleteInvite.findUnique({
          where: { token: inviteToken },
          select: { id: true, coachId: true, usedAt: true, expiresAt: true },
        });
        if (invite && !invite.usedAt && invite.expiresAt > new Date()) {
          coachRecord = { id: invite.coachId };
          resolvedInviteId = invite.id;
        }
      } else if (coachId) {
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
          : coachRecord
            ? { athlete: { create: { goal: goal ?? null, coachId: coachRecord.id } } }
            : { athlete: { create: { goal: goal ?? null } } }),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Mark invite as used and notify coach when athlete registers via invite token
    if (!isCoach && resolvedInviteId && coachRecord) {
      await prisma.athleteInvite.update({ where: { id: resolvedInviteId }, data: { usedAt: new Date() } });
      const coachUser = await prisma.coach.findUnique({ where: { id: coachRecord.id }, select: { userId: true } });
      if (coachUser) {
        await prisma.notification.create({
          data: {
            userId: coachUser.userId,
            title: "Novo atleta no seu grupo!",
            body: `${name} acabou de se cadastrar pelo seu link de convite.`,
            link: `/treinador/atletas`,
          },
        });
      }
    }

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
