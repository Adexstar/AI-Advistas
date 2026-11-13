import { describe, expect, it } from "vitest";
import { addColor, applyBrandUpdate, readAssets, readBrandKit, readColors, type BrandKitRow } from "./brandKitDocument";

const row: BrandKitRow = {
  id: "kit-1",
  user_id: "user-1",
  name: "Northwind",
  logos: [],
  colors: [],
  fonts: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("brand kit JSON document", () => {
  it("stores profile, colors, and files in the existing JSON columns", () => {
    const write = applyBrandUpdate(row, {
      name: "Northwind",
      industry: "Retail",
      website: "https://northwind.example",
      primary_color: "#112233",
      logo_url: "https://cdn.example/logo.png",
    });
    const saved = { ...row, ...write };
    const view = readBrandKit(saved);
    expect(view.industry).toBe("Retail");
    expect(view.website).toBe("https://northwind.example");
    expect(view.primary_color).toBe("#112233");
    expect(view.logo_url).toBe("https://cdn.example/logo.png");
    expect(readColors(saved)[0]).toMatchObject({ hex: "#112233", is_primary: true });
    expect(readAssets(saved)).toEqual([
      expect.objectContaining({ asset_type: "logo", asset_url: "https://cdn.example/logo.png" }),
    ]);
  });

  it("appends and removes colors without a separate table", () => {
    const withColor = { ...row, ...addColor(row, { hex: "#abcdef", name: "Accent" }) };
    expect(readColors(withColor)).toHaveLength(1);
    const id = readColors(withColor)[0].id;
    const removed = { ...withColor, colors: readColors(withColor).filter((color) => color.id !== id) };
    expect(readColors(removed)).toHaveLength(0);
  });
});
