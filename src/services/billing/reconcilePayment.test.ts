import { describe, expect, it } from "vitest";
import { billingReturnUrl, reconcileCharge } from "../../../supabase/functions/_shared/reconcile";

const expected = { txRef: "sub_user_1", amount: 29, currency: "USD", plan: "pro" };

describe("payment reconciliation", () => {
  it("accepts a verified charge that matches the stored checkout", () => {
    expect(reconcileCharge(expected, { status: "successful", tx_ref: "sub_user_1", amount: "29.00", currency: "usd" })).toEqual({ ok: true });
  });

  it("rejects a mismatched amount, currency, reference, or status", () => {
    expect(reconcileCharge(expected, { status: "successful", tx_ref: "sub_user_1", amount: 99, currency: "USD" }).ok).toBe(false);
    expect(reconcileCharge(expected, { status: "successful", tx_ref: "sub_user_1", amount: 29, currency: "NGN" }).ok).toBe(false);
    expect(reconcileCharge(expected, { status: "successful", tx_ref: "other", amount: 29, currency: "USD" }).ok).toBe(false);
    expect(reconcileCharge(expected, { status: "failed", tx_ref: "sub_user_1", amount: 29, currency: "USD" }).ok).toBe(false);
  });

  it("sends the shopper to the billing page, not the webhook", () => {
    expect(billingReturnUrl("https://advista.example", "sub_user_1")).toBe(
      "https://advista.example/billing?checkout=return&tx_ref=sub_user_1",
    );
    expect(billingReturnUrl("https://evil.example", "sub_user_1", "https://advista.example")).toBeNull();
    expect(billingReturnUrl("http://192.168.1.8", "sub_user_1")).toBeNull();
  });
});
