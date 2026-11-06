import { describe, expect, it } from "vitest";
import {
  angleWeight,
  budgetEfficiency,
  learnSuggestions,
  tallyDecisions,
  type CampaignTrackRecord,
} from "./suggestionLearning";

const campaign = (patch: Partial<CampaignTrackRecord>): CampaignTrackRecord => ({
  id: "c1",
  name: "Harbor",
  objective: "Conversions",
  platform: "Instagram",
  ctr: 1.2,
  roas: 3,
  budget: 100,
  spend: 80,
  revenue: 300,
  budgetEfficiency: 3,
  creativeStyle: "carousel",
  ...patch,
});

describe("suggestion learning", () => {
  it("stops recommending an angle the user keeps rejecting", () => {
    const tally = tallyDecisions([
      { status: "rejected", action: "style:carousel", category: null, metadata: { angle: "style:carousel" } },
      { status: "dismissed", action: "style:carousel", category: null, metadata: { angle: "style:carousel" } },
    ]);
    expect(angleWeight(tally.get("style:carousel"))).toBe(0);

    const suggestions = learnSuggestions({
      track: [campaign({ id: "winner", name: "Glow", ctr: 4.2, creativeStyle: "carousel" })],
      decisions: [
        { status: "rejected", category: null, action: "style:carousel", metadata: { angle: "style:carousel" } },
        { status: "rejected", category: null, action: "style:carousel", metadata: { angle: "style:carousel" } },
      ],
    });
    expect(suggestions.some((item) => item.angle === "style:carousel")).toBe(false);
  });

  it("weights an accepted strategy above a new one", () => {
    const suggestions = learnSuggestions({
      track: [
        campaign({ id: "a", name: "Glow", ctr: 4, roas: 3.5, objective: "Conversions", creativeStyle: "story" }),
        campaign({ id: "b", name: "Launch", ctr: 1, roas: 0.4, objective: "Awareness", creativeStyle: "static", platform: "Facebook" }),
      ],
      focus: campaign({ id: "b", name: "Launch", ctr: 1, roas: 0.4, objective: "Awareness", creativeStyle: "static", platform: "Facebook" }),
      decisions: [
        { status: "accepted", category: null, action: "scale:conversions", metadata: { angle: "scale:conversions" } },
        { status: "applied", category: null, action: "scale:conversions", metadata: { angle: "scale:conversions" } },
      ],
    });
    const scale = suggestions.find((item) => item.angle === "scale:conversions");
    expect(scale).toBeTruthy();
    expect(scale!.confidence).toBe(95);
    expect(scale!.reasoning).toContain("accepted this direction");
    expect(suggestions[0].angle).toBe("scale:conversions");
  });

  it("uses measured CTR and budget efficiency and stays quiet without results", () => {
    expect(budgetEfficiency(100, 40, 250)).toBe(2.5);
    const suggestions = learnSuggestions({
      track: [campaign({ name: "Glow", ctr: 4.25, roas: 3, revenue: 250, budget: 100, budgetEfficiency: 2.5, creativeStyle: "story" })],
      decisions: [],
    });
    expect(suggestions.find((item) => item.angle === "style:story")?.reasoning).toContain("4.25% CTR");
    expect(suggestions.find((item) => item.angle === "scale:conversions")?.reasoning).toContain("3.00x ROAS");
    expect(suggestions.find((item) => item.angle === "scale:conversions")?.reasoning).toContain("2.50x return on budget");

    expect(learnSuggestions({
      track: [campaign({ ctr: 0, roas: 0, revenue: 0, budget: 0, spend: 0, creativeStyle: null })],
      decisions: [],
    })).toEqual([]);
  });
});
