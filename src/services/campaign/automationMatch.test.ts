import { describe, expect, it } from "vitest";
import { budgetAfterAction, checkRule, signalsFromMetrics } from "./automationMatch";

const rule = (type: "cpa_exceeded" | "roas_above" | "ctr_dropped" | "budget_depleted" | "creative_fatigue", threshold: number) => ({
  enabled: true,
  trigger: { type, threshold },
});

describe("automation rule checks", () => {
  it("computes CPA from spend and conversions", () => {
    expect(signalsFromMetrics({ spend: 80, conversions: 2, roas: 1.5, ctr: 1.2, budget: 100 }).cpa).toBe(40);
  });

  it("matches a CPA rule only when conversions exist and the threshold is crossed", () => {
    const empty = signalsFromMetrics({ spend: 80, conversions: 0, budget: 100 });
    expect(checkRule(rule("cpa_exceeded", 30), empty).matched).toBe(false);
    const hot = signalsFromMetrics({ spend: 80, conversions: 2, budget: 100 });
    expect(checkRule(rule("cpa_exceeded", 30), hot).matched).toBe(true);
  });

  it("does not invent a creative-fatigue match", () => {
    const signals = signalsFromMetrics({ spend: 90, conversions: 1, budget: 100 });
    expect(checkRule(rule("creative_fatigue", 3), signals)).toEqual({
      matched: false,
      detail: "Frequency is not recorded, so creative fatigue cannot be checked.",
    });
  });

  it("raises or lowers the budget by the saved amount", () => {
    expect(budgetAfterAction(100, { type: "increase_budget", value: 25 })).toBe(125);
    expect(budgetAfterAction(20, { type: "decrease_budget", value: 50 })).toBe(0);
    expect(budgetAfterAction(20, { type: "notify" })).toBeNull();
  });
});
