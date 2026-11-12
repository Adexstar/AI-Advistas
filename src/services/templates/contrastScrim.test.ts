import { describe, expect, it } from "vitest";
import { Rect } from "fabric";
import { buildStockTemplateJSON } from "./stockLayout";
import { contrastScrimFillJSON, ensureContrastScrim, isGradientFill, SCRIM_STOPS } from "./contrastScrim";

describe("contrast scrim", () => {
  it("authors a vertical black fade instead of a solid plate", () => {
    const json = buildStockTemplateJSON(
      { image_url: "https://images.pexels.com/a.jpg", width: 4000, height: 2000 },
      1080,
      1080,
    );
    const scrim = json.objects[1] as {
      name: string;
      fill: { type: string; colorStops: { offset: number; color: string }[]; coords: { y1: number; y2: number } };
      perPixelTargetFind: boolean;
      height: number;
    };
    expect(json.objects[0].type).toBe("image");
    expect(scrim.name).toBe("Contrast scrim");
    expect(json.objects[2].name).toBe("Headline");
    expect(scrim.fill.type).toBe("linear");
    expect(scrim.fill.colorStops[0]).toEqual({ offset: 0, color: "rgba(0,0,0,0)" });
    expect(scrim.fill.colorStops.at(-1)?.color).toBe(SCRIM_STOPS.at(-1)?.color);
    expect(scrim.fill.gradientUnits).toBe("percentage");
    expect(scrim.fill.coords).toEqual({ x1: 0, y1: 0, x2: 0, y2: 1 });
    expect(scrim.perPixelTargetFind).toBe(true);
    expect(scrim.fill).toEqual(contrastScrimFillJSON());
    expect(JSON.stringify(scrim.fill)).not.toContain("rgba(8,8,14");
  });

  it("replaces a solid scrim and keeps the chosen intensity", () => {
    const rect = new Rect({
      name: "Contrast scrim",
      left: 0,
      top: 40,
      width: 120,
      height: 80,
      fill: "rgba(8,8,14,0.62)",
      opacity: 0.4,
    });
    ensureContrastScrim(rect);
    expect(rect.opacity).toBe(0.4);
    expect(isGradientFill(rect.fill)).toBe(true);
    const fill = rect.fill as { colorStops: { color: string }[]; coords: { y1: number; y2: number } };
    expect(fill.colorStops[0].color).toBe("rgba(0,0,0,0)");
    expect(fill.coords.y1).toBe(0);
    expect(fill.coords.y2).toBe(1);
    expect(rect.perPixelTargetFind).toBe(true);
  });

  it("saves and restores the fade", async () => {
    const rect = new Rect({
      name: "Contrast scrim",
      left: 0,
      top: 0,
      width: 80,
      height: 120,
      originX: "left",
      originY: "top",
      fill: "rgba(8,8,14,0.62)",
      opacity: 0.75,
    });
    ensureContrastScrim(rect);
    const saved = rect.toObject(["name", "perPixelTargetFind"]);
    expect(saved.name).toBe("Contrast scrim");
    expect(saved.opacity).toBe(0.75);
    expect(saved.perPixelTargetFind).toBe(true);
    expect(saved.fill.type).toBe("linear");
    expect(saved.fill.gradientUnits).toBe("percentage");
    expect(saved.fill.colorStops[0].color).toBe("rgba(0,0,0,0)");
    expect(saved.fill.colorStops.at(-1).color).toBe("rgba(0,0,0,0.55)");

    const revived = await Rect.fromObject(saved);
    const revivedFill = revived.fill as { type: string; colorStops: { offset: number; color: string }[]; coords: { y1: number; y2: number } };
    expect(revivedFill.type).toBe("linear");
    expect(revivedFill.colorStops.map((stop) => stop.color)).toEqual(SCRIM_STOPS.map((stop) => stop.color));
    expect(revivedFill.coords).toMatchObject({ y1: 0, y2: 1 });
    expect(revived.opacity).toBe(0.75);
    expect(revived.perPixelTargetFind).toBe(true);
  });
});
