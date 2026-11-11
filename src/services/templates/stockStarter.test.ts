import { describe, expect, it } from "vitest";
import { artboardFor, buildStockTemplateJSON, isStockTemplateId } from "./stockLayout";
import { stockStarterTemplates, withStockStarter } from "./stockStarter";
import { suggestionsForCampaign } from "@/components/campaigns/CampaignRecommendations";
import type { LearnedSuggestion } from "@/services/ai/suggestionLearning";

describe("stock starter templates", () => {
  it("covers square, story, and landscape artboards", () => {
    expect(artboardFor("square")).toMatchObject({ width: 1080, height: 1080 });
    expect(artboardFor("story")).toMatchObject({ width: 1080, height: 1920, platform: "Instagram Story" });
    expect(artboardFor("landscape")).toMatchObject({ width: 1200, height: 628, platform: "Facebook" });
    const formats = new Set(stockStarterTemplates.map((item) => item.format));
    expect(formats).toEqual(new Set(["square", "story", "landscape"]));
    for (const item of stockStarterTemplates) {
      expect(item.review_status).toBe("approved");
      expect(item.is_active).toBe(true);
      expect(item.template_json.objects.length).toBeGreaterThan(3);
      expect(item.preview_url).toContain("images.pexels.com");
      expect(isStockTemplateId(item.id)).toBe(true);
    }
  });

  it("keeps saved templates and adds the stock designs that are missing", () => {
    const saved = { id: "db-1", source: "pexels", source_id: "1", format: "square", preview_url: "https://example.com/saved.jpg" };
    const merged = withStockStarter([saved]);
    expect(merged[0]).toEqual(saved);
    expect(merged).toHaveLength(stockStarterTemplates.length + 1);
    expect(withStockStarter([])).toHaveLength(stockStarterTemplates.length);
    expect(withStockStarter(null, true)).toHaveLength(stockStarterTemplates.length);
    const categories = new Set(stockStarterTemplates.map((item) => item.category));
    for (const category of ["Beauty", "Fashion", "Restaurant & Food", "Real Estate", "Fitness", "E-commerce", "SaaS & Technology"]) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it("cover-fits the photo onto the chosen artboard", () => {
    const json = buildStockTemplateJSON({ image_url: "https://images.pexels.com/a.jpg", width: 4000, height: 2000 }, 1200, 628);
    const image = json.objects[0];
    expect(image.scaleX).toBeCloseTo(Math.max(1200 / 4000, 628 / 2000));
    expect(json.width).toBe(1200);
    expect(json.height).toBe(628);
  });
});

describe("campaign assistant suggestions", () => {
  const item = (campaignId: string | null, angle: string): LearnedSuggestion => ({
    angle,
    title: angle,
    reasoning: "because",
    preview: "preview",
    confidence: 80,
    campaignId,
    decisionId: null,
  });

  it("keeps suggestions for this campaign and drops other campaigns", () => {
    const scoped = suggestionsForCampaign([
      item("c1", "scale:conversions"),
      item(null, "style:story"),
      item("c2", "format:facebook"),
    ], "c1");
    expect(scoped.map((row) => row.angle)).toEqual(["scale:conversions", "style:story"]);
  });
});
