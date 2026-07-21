import { createHash } from "node:crypto";

const mode = process.argv[2] ?? "valid";
const url = process.env.PAGBANK_WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/pagbank";
const token = process.env.PAGBANK_TOKEN ?? "local-pagbank-token";
const event = {
  id: mode === "duplicate" ? "ORDE_SIMULATED_DUPLICATE" : "ORDE_SIMULATED_VALID",
  reference_id: "user_test_plan_test_purchase_20260721",
  charges: [{ id: "CHAR_SIMULATED", status: "PAID", reference_id: "user_test_plan_test_purchase_20260721", amount: { value: 9900 } }],
};
const body = JSON.stringify(event);
const signature = mode === "invalid"
  ? "invalid-signature"
  : createHash("sha256").update(`${token}-${body}`).digest("hex");

const response = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "x-authenticity-token": signature },
  body,
});
console.log(JSON.stringify({ mode, status: response.status, body: await response.text() }, null, 2));
if (!response.ok && mode !== "invalid") process.exitCode = 1;
