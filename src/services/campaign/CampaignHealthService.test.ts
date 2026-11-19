import { describe, expect, it } from "vitest";
import { CampaignHealthService } from "./CampaignHealthService";

const draft = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  budget: 0,
  roas: 0,
  ctr: 0,
  start_date: null,
  end_date: null,
  objective: "awareness",
} as any;

describe("campaign health", () => {
  it("does not score a draft that has no recorded activity", () => {
    expect(CampaignHealthService.hasActivity(draft)).toBe(false);
    const health = CampaignHealthService.calculate(draft);
    expect(health.creative_quality).toBe(0);
    expect(health.audience_match).toBe(0);
    expect(health.budget_efficiency).toBe(0);
  });

  it("scores budget efficiency from real spend", () => {
    const health = CampaignHealthService.calculate({
      ...draft,
      budget: 100,
      spend: 50,
      clicks: 10,
      roas: 2,
    });
    expect(health.budget_efficiency).toBeGreaterThan(0);
    expect(health.budget_efficiency).toBeLessThanOrEqual(100);
  });
});