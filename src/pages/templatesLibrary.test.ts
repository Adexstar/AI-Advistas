import { describe, expect, it } from "vitest";
import { categoryCounts, matchesFormat, matchesPlatform, relativeUpdated } from "./templatesLibrary";

describe("template library filters", () => {
  it("matches platform names without caring about case", () => {
    expect(matchesPlatform("instagram", "Instagram")).toBe(true);
    expect(matchesPlatform("TikTok", "Facebook")).toBe(false);
    expect(matchesPlatform(null, "All")).toBe(true);
  });

  it("groups square, story, and landscape formats", () => {
    expect(matchesFormat("post_square", "square")).toBe(true);
    expect(matchesFormat("story", "story")).toBe(true);
    expect(matchesFormat("feed_horizontal", "landscape")).toBe(true);
    expect(matchesFormat("story", "square")).toBe(false);
  });

  it("counts real categories and ignores empty ones", () => {
    const counts = categoryCounts(["beauty", "Beauty & Skincare", "fashion", null, ""]);
    expect(counts.get("beauty")).toBe(2);
    expect(counts.get("fashion")).toBe(1);
    expect(counts.get("ecommerce")).toBeUndefined();
  });

  it("labels update time from the record timestamp", () => {
    const now = Date.parse("2026-11-05T20:00:00Z");
    expect(relativeUpdated("2026-11-05T18:00:00Z", now)).toBe("Updated 2 hours ago");
    expect(relativeUpdated(null, now)).toBe("");
  });
});
