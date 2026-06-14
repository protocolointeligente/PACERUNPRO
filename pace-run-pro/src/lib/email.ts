interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envia e-mail via API HTTP do Resend (sem dependência extra no projeto).
 * Se RESEND_API_KEY/EMAIL_FROM não estiverem configurados, registra o
 * conteúdo no log do servidor em vez de falhar — útil em ambientes
 * de demonstração sem provedor de e-mail configurado.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      `[email] RESEND_API_KEY/EMAIL_FROM não configurados — e-mail não enviado.\nPara: ${to}\nAssunto: ${subject}\n${html}`
    );
    return { ok: false as const, skipped: true as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Falha ao enviar via Resend (${res.status}): ${body}`);
    return { ok: false as const, skipped: false as const };
  }

  return { ok: true as const, skipped: false as const };
}
