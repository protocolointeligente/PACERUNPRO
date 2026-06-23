// ============================================================
// Preencha os dois valores abaixo antes de rodar
// ============================================================
const CLIENT_SECRET   = "COLE_AQUI_O_SEGREDO_DO_CLIENTE";   // Strava → "Mostrar" ao lado de "Segredo do cliente"
const VERIFY_TOKEN    = "COLE_AQUI_O_MESMO_VALOR_DO_VERCEL"; // Variável STRAVA_WEBHOOK_VERIFY_TOKEN no Vercel
// ============================================================

const CLIENT_ID       = "249581";
const CALLBACK_URL    = "https://www.pacerunpro.com.br/api/webhooks/strava";

const body = new URLSearchParams({
  client_id:    CLIENT_ID,
  client_secret: CLIENT_SECRET,
  callback_url:  CALLBACK_URL,
  verify_token:  VERIFY_TOKEN,
});

const res = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: body.toString(),
});

const data = await res.json();

if (res.ok) {
  console.log("✅ Webhook registrado com sucesso!");
  console.log("   ID da assinatura:", data.id);
  console.log("   Guarde esse ID caso precise cancelar depois.");
} else {
  console.error("❌ Erro ao registrar webhook:", res.status);
  console.error(JSON.stringify(data, null, 2));
}
