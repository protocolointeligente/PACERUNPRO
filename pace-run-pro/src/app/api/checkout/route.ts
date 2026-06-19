import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPixOrder, createCreditCardOrder } from "@/lib/pagbank";

export async function POST(req: NextRequest) {
  const session = await auth();

  const body = (await req.json()) as {
    method: string;
    planId: string;
    planName: string;
    amountCents: number;
    customerName: string;
    customerEmail: string;
    customerCpf: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  };

  const { method, planId, planName, amountCents, customerName, customerEmail, customerCpf } = body;

  if (!method || !planId || !amountCents || !customerName || !customerEmail) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "https://www.pacerunpro.com.br";
  const notificationUrl = `${origin}/api/webhooks/pagbank`;

  // Inclui userId no referenceId para ativação automática no webhook
  // Formato: userId_planId_timestamp (ou "anon_planId_timestamp" se não autenticado)
  const userId = session?.user?.id ?? "anon";
  const referenceId = `${userId}_${planId}_${Date.now()}`;

  try {
    if (method === "pix") {
      if (!customerCpf) {
        return NextResponse.json(
          { error: "CPF obrigatório para pagamento PIX." },
          { status: 400 }
        );
      }
      const result = await createPixOrder({
        referenceId,
        customerName,
        customerEmail,
        customerCpf,
        amountCents,
        planName,
        notificationUrl,
      });
      return NextResponse.json(result);
    }

    if (method === "cartao") {
      const { cardNumber, cardName, cardExpiry, cardCvv } = body;
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        return NextResponse.json(
          { error: "Dados do cartão incompletos." },
          { status: 400 }
        );
      }
      const [expMonth, expYear] = cardExpiry.split("/");
      const result = await createCreditCardOrder({
        referenceId,
        customerName,
        customerEmail,
        customerCpf: customerCpf ?? "",
        amountCents,
        planName,
        cardNumber,
        cardExpMonth: expMonth,
        cardExpYear: expYear?.length === 2 ? `20${expYear}` : expYear,
        cardCvv,
        cardHolderName: cardName,
        notificationUrl,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Método de pagamento inválido." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
