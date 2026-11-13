export const PLAN_PRICES = {
  pro: { amount: 29, currency: "USD", interval: "monthly" },
  enterprise: { amount: 99, currency: "USD", interval: "monthly" },
} as const;

export type PaidPlan = keyof typeof PLAN_PRICES;

export type ExpectedCharge = {
  txRef: string;
  amount: number;
  currency: string;
  plan: string;
};

export type VerifiedCharge = {
  status?: string;
  tx_ref?: string;
  amount?: number | string;
  currency?: string;
};

export type ReconcileResult = { ok: true } | { ok: false; reason: string };

export function reconcileCharge(expected: ExpectedCharge, verified: VerifiedCharge): ReconcileResult {
  if (expected.plan !== "pro" && expected.plan !== "enterprise") {
    return { ok: false, reason: "Unknown plan" };
  }
  if (verified.status !== "successful") return { ok: false, reason: "Payment was not successful" };
  if (!verified.tx_ref || verified.tx_ref !== expected.txRef) {
    return { ok: false, reason: "Transaction reference does not match the checkout" };
  }
  if ((verified.currency ?? "").toUpperCase() !== expected.currency.toUpperCase()) {
    return { ok: false, reason: "Currency does not match the checkout" };
  }
  const amount = typeof verified.amount === "number" ? verified.amount : Number(verified.amount);
  if (!Number.isFinite(amount) || Math.abs(amount - expected.amount) > 0.01) {
    return { ok: false, reason: "Amount does not match the checkout" };
  }
  return { ok: true };
}

/** Browser return page. Never the webhook. */
export function billingReturnUrl(origin: string, txRef: string, siteUrl?: string | null): string | null {
  let posted: URL;
  try {
    posted = new URL(origin);
  } catch {
    return null;
  }
  if (posted.protocol !== "https:" && posted.protocol !== "http:") return null;
  const local = posted.hostname === "localhost" || posted.hostname === "127.0.0.1";
  if (posted.protocol === "http:" && !local) return null;
  if (siteUrl) {
    try {
      if (new URL(siteUrl).origin !== posted.origin) return null;
    } catch {
      return null;
    }
  }
  posted.pathname = "/billing";
  posted.search = `checkout=return&tx_ref=${encodeURIComponent(txRef)}`;
  posted.hash = "";
  return posted.toString();
}
