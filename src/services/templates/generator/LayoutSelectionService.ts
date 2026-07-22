// Layout selection — rules-based blueprint chooser. Category + goal + platform
// map to proven layout archetypes. Used by AITemplateGeneratorService before
// content generation so copy is written for a known composition.

export type LayoutArchetype =
  | "minimal_product"
  | "hero_lifestyle"
  | "bold_promo"
  | "editorial_split"
  | "food_first"
  | "dashboard_focused"
  | "human_action";

export interface LayoutBlueprint {
  layout: LayoutArchetype;
  visual_focus: "product" | "person" | "food" | "space" | "ui" | "text";
  headline_position: "top" | "center" | "bottom";
  cta_style: "rounded" | "pill" | "square" | "underline";
  spacing: "airy" | "balanced" | "tight";
  color_strategy: "brand_primary" | "brand_accent" | "neutral" | "high_contrast";
  hierarchy: string[];
  aspect: { width: number; height: number };
}

const PLATFORM_ASPECT: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  facebook: { width: 1200, height: 1200 },
  tiktok: { width: 1080, height: 1920 },
  linkedin: { width: 1200, height: 628 },
  youtube: { width: 1920, height: 1080 },
  pinterest: { width: 1000, height: 1500 },
};

const CATEGORY_ARCHETYPE: Record<string, Partial<LayoutBlueprint>> = {
  beauty: { layout: "minimal_product", visual_focus: "product", spacing: "airy", cta_style: "rounded", color_strategy: "brand_primary" },
  fashion: { layout: "editorial_split", visual_focus: "person", spacing: "airy", cta_style: "underline", color_strategy: "neutral" },
  "real estate": { layout: "hero_lifestyle", visual_focus: "space", spacing: "balanced", cta_style: "square", color_strategy: "neutral" },
  restaurant: { layout: "food_first", visual_focus: "food", spacing: "balanced", cta_style: "pill", color_strategy: "brand_accent" },
  fitness: { layout: "human_action", visual_focus: "person", spacing: "tight", cta_style: "pill", color_strategy: "high_contrast" },
  saas: { layout: "dashboard_focused", visual_focus: "ui", spacing: "balanced", cta_style: "rounded", color_strategy: "brand_primary" },
  ecommerce: { layout: "bold_promo", visual_focus: "product", spacing: "balanced", cta_style: "rounded", color_strategy: "brand_accent" },
};

export const LayoutSelectionService = {
  select(ctx: { category?: string | null; goal?: string | null; platform?: string | null }): LayoutBlueprint {
    const key = (ctx.category ?? "").toLowerCase().trim();
    const base = CATEGORY_ARCHETYPE[key] ?? CATEGORY_ARCHETYPE.ecommerce;
    const aspect = PLATFORM_ASPECT[(ctx.platform ?? "instagram").toLowerCase()] ?? PLATFORM_ASPECT.instagram;
    const goal = (ctx.goal ?? "").toLowerCase();
    const headline_position: LayoutBlueprint["headline_position"] =
      goal.includes("aware") ? "top" : goal.includes("convert") ? "bottom" : "center";

    return {
      layout: base.layout ?? "minimal_product",
      visual_focus: base.visual_focus ?? "product",
      headline_position,
      cta_style: base.cta_style ?? "rounded",
      spacing: base.spacing ?? "balanced",
      color_strategy: base.color_strategy ?? "brand_primary",
      hierarchy: ["headline", base.visual_focus ?? "product", "cta", "supporting_copy"],
      aspect,
    };
  },
};
