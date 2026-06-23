import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Resposta idêntica independente de o e-mail existir, para não revelar
    // quais e-mails estão cadastrados.
    const genericResponse = NextResponse.json({
      message: "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    });

    if (!user) return genericResponse;

    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = new URL("/redefinir-senha", request.url);
    resetUrl.searchParams.set("token", token);

    const safeName = user.name
      ? user.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      : null;
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: "Redefinir senha — Pace Run Pro",
      html: `
        <p>Olá${safeName ? `, ${safeName}` : ""}!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no Pace Run Pro.</p>
        <p><a href="${resetUrl.toString()}">Clique aqui para criar uma nova senha</a></p>
        <p>Este link expira em 1 hora. Se você não pediu essa alteração, pode ignorar este e-mail.</p>
      `,
    });
    if (!emailResult.ok && !emailResult.skipped) {
      console.error(`[forgot-password] Failed to deliver reset email to ${normalizedEmail}`);
    }

    return genericResponse;
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
