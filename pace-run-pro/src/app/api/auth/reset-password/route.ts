import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationToken.findUnique({ where: { token } });
    if (!verification || verification.expires < new Date()) {
      if (verification) {
        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: verification.identifier, token } },
        });
      }
      return NextResponse.json(
        { error: "Este link de redefinição é inválido ou expirou. Solicite um novo." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: verification.identifier } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.verificationToken.deleteMany({ where: { identifier: verification.identifier } });

    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
