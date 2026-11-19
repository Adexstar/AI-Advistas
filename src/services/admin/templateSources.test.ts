import { describe, expect, it } from "vitest";
import {
  importableTemplates,
  keyRejectedMessage,
  maskKey,
  mediaHitsToTemplates,
  missingKeyMessage,
  missingStockSecrets,
  sourceById,
  TEMPLATE_SOURCES,
} from "./templateSources";

describe("template source keys", () => {
  it("names the secret when a provider rejects the saved key", () => {
    const pexels = sourceById("pexels");
    expect(pexels).toBeTruthy();
    expect(keyRejectedMessage(pexels!, 401)).toContain("PEXELS_API_KEY");
    expect(keyRejectedMessage(sourceById("pixabay")!, 400)).toContain("PIXABAY_API_KEY");
    expect(keyRejectedMessage(sourceById("lovable")!, 403)).toContain("LOVABLE_API_KEY");
    expect(missingKeyMessage("PEXELS_API_KEY")).toContain("PEXELS_API_KEY");
  });

  it("lists the live template sources", () => {
    expect(TEMPLATE_SOURCES.map((source) => source.id)).toEqual(["pexels", "pixabay", "unsplash", "lovable"]);
  });

  it("masks a saved key and maps live search hits into importable templates", () => {
    expect(maskKey("pexels-secret-1234")).toBe("••••1234");
    const templates = mediaHitsToTemplates(sourceById("pexels")!, [{
      id: "pexels-99",
      url: "https://images.pexels.com/photos/99/pexels-photo-99.jpeg",
      thumbnailUrl: "https://images.pexels.com/photos/99/small.jpg",
      width: 1000,
      height: 800,
      tags: ["serum bottle"],
      meta: { photographer: "Ada" },
    }]);
    expect(templates).toEqual([expect.objectContaining({
      provider: "pexels",
      source_id: "99",
      name: "serum bottle",
      image_url: "https://images.pexels.com/photos/99/pexels-photo-99.jpeg",
      author: "Ada",
    })]);
    expect(missingStockSecrets({ pexels: true, pixabay: false, unsplash: false })).toEqual(["PIXABAY_API_KEY", "UNSPLASH_ACCESS_KEY"]);
    expect(importableTemplates([...templates, {
      provider: "lovable",
      source_id: "copy",
      name: "Glow serum",
      image_url: "",
      thumbnail_url: "",
      width: 1080,
      height: 1350,
      license: "lovable:copy",
    }])).toHaveLength(1);
  });
});
