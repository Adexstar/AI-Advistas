import { describe, expect, it } from "vitest";
import {
  edgeFreepikToTemplates,
  freepikPayloadToTemplates,
  importableTemplates,
  keyRejectedMessage,
  maskKey,
  mediaHitsToTemplates,
  missingKeyMessage,
  missingStockSecrets,
  sourceById,
} from "./templateSources";

describe("template source keys", () => {
  it("names the secret when a provider rejects the saved key", () => {
    const pexels = sourceById("pexels");
    expect(pexels).toBeTruthy();
    expect(keyRejectedMessage(pexels!, 401)).toContain("PEXELS_API_KEY");
    expect(keyRejectedMessage(sourceById("pixabay")!, 400)).toContain("PIXABAY_API_KEY");
    expect(keyRejectedMessage(sourceById("lovable")!, 403)).toContain("LOVABLE_API_KEY");
    expect(missingKeyMessage("FREEPIK_API_KEY")).toContain("FREEPIK_API_KEY");
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
  });

  it("reads Freepik resources and reports which stock secrets are missing", () => {
    const templates = freepikPayloadToTemplates({
      data: [{ id: 42, title: "Sale banner", image: { source: { url: "https://img.freepik.com/sale.jpg" } }, thumbnail: { url: "https://img.freepik.com/sale-sm.jpg" } }],
    });
    expect(templates[0]).toMatchObject({ provider: "freepik", source_id: "42", name: "Sale banner" });
    expect(missingStockSecrets({ pexels: true, pixabay: false, unsplash: false })).toEqual(["PIXABAY_API_KEY", "UNSPLASH_ACCESS_KEY"]);
    expect(missingStockSecrets(undefined)).toEqual([]);
    const fromEdge = edgeFreepikToTemplates([{
      id: "freepik-7",
      freepik_id: "7",
      name: "Launch post",
      preview_url: "https://img.freepik.com/launch.jpg",
      thumbnail_url: "https://img.freepik.com/launch-sm.jpg",
    }]);
    expect(fromEdge[0]).toMatchObject({ provider: "freepik", source_id: "7", name: "Launch post" });
    expect(importableTemplates([...fromEdge, {
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
