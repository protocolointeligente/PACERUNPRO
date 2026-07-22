import type { SubscriptionPlan } from "@prisma/client";

export const BILLING_PLANS = {
  "b2b-free": { name: "Grátis", amountCents: 0, subscriptionPlan: "COACH" },
  "b2b-starter": { name: "Starter", amountCents: 9700, subscriptionPlan: "COACH" },
  "b2b-pro": { name: "Pro", amountCents: 19700, subscriptionPlan: "TEAM" },
  "b2b-assessoria": { name: "Assessoria", amountCents: 39700, subscriptionPlan: "TEAM" },
} as const satisfies Record<string, {
  name: string;
  amountCents: number;
  subscriptionPlan: SubscriptionPlan;
}>;

export type BillingPlanId = keyof typeof BILLING_PLANS;

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return typeof value === "string" && value in BILLING_PLANS;
}

export function subscriptionToBillingPlan(plan: SubscriptionPlan): BillingPlanId {
  if (plan === "TEAM") return "b2b-pro";
  return "b2b-starter";
}
