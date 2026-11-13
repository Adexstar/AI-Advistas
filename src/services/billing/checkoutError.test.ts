import { describe, expect, it } from "vitest";
import { checkoutFailure } from "./checkoutError";

describe("checkout errors", () => {
  it("labels an unconfigured provider as unavailable", () => {
    expect(checkoutFailure({ error: "Payments are unavailable until Flutterwave is configured.", unavailable: true }, "failed")).toEqual({
      message: "Payments are unavailable until Flutterwave is configured.",
      unavailable: true,
    });
  });

  it("keeps a normal provider error from hiding the plans", () => {
    expect(checkoutFailure({ error: "Card was declined" }, "failed").unavailable).toBe(false);
  });
});