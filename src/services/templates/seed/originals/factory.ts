// Compact factory that composes an editable Fabric.js template from a
// declarative config. Every template exposes headline / subheadline / body /
// cta / product_image variables plus brand color/logo — the same variable
// contract the Template Engine and Visual Editor already understand.

import { canvas, image, rect, resetZ, textbox, type LayoutDNA, type OriginalTemplateModule } from "../templateBuilder";

export type Format = "portrait" | "square" | "landscape" | "story";

const DIMS: Record<Format, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  landscape: { w: 1200, h: 627 },
  story: { w: 1080, h: 1920 },
};

export interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  category: string;
  collection_slug: string;
  platform: string;
  objective: string;
  format: Format;
  ai_tags: string[];
  industry_tags: string[];
  emotion: string;
  audience: string;
  layout_style: string;
  visual_style: string;
  bg: string;
  accent: string;
  ink: string;
  cta_ink?: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  headline_font?: string;
  hero_position?: LayoutDNA["hero_position"];
  text_alignment?: LayoutDNA["text_alignment"];
  style?: LayoutDNA["style"];
  preview_url?: string;
}

const PLACEHOLDER = "/placeholder.svg";

export function makeTemplate(cfg: TemplateConfig): OriginalTemplateModule {
  resetZ();
  const { w: W, h: H } = DIMS[cfg.format];
  const align = cfg.text_alignment ?? "center";
  const originX = align === "center" ? "center" : align === "right" ? "right" : "left";
  const anchorX = align === "center" ? W / 2 : align === "right" ? W - 80 : 80;
  const cta_ink = cfg.cta_ink ?? "#FFFFFF";
  const headlineSize = cfg.format === "landscape" ? 72 : cfg.format === "story" ? 130 : 110;
  const bodySize = cfg.format === "landscape" ? 22 : 26;

  const heroSize = Math.min(W - 160, H * 0.42);
  const heroTop =
    cfg.hero_position === "top" ? 80 :
    cfg.hero_position === "bottom" ? H - heroSize - 200 :
    cfg.hero_position === "left" || cfg.hero_position === "right" ? H / 2 - heroSize / 2 :
    H / 2 - heroSize / 4;
  const heroLeft =
    cfg.hero_position === "left" ? 80 :
    cfg.hero_position === "right" ? W - heroSize - 80 :
    W / 2 - heroSize / 2;

  const template_json = canvas(cfg.bg, [
    // decorative accent bar
    rect({ name: "accent-bar", left: 0, top: 0, width: W, height: 12, fill: cfg.accent, brandReplaceable: true, variableKey: "brand.primaryColor" }),

    image({
      name: "hero-image",
      left: heroLeft, top: heroTop,
      width: heroSize, height: heroSize,
      src: "{{product_image}}",
      variableKey: "product_image",
      aiReplaceable: true,
    }),

    textbox({
      name: "kicker",
      left: anchorX, top: 100, width: W - 160,
      text: "{{subheadline}}",
      variableKey: "subheadline",
      fontFamily: "Inter", fontSize: 22, fontWeight: 600,
      fill: cfg.accent, textAlign: align, letterSpacing: 300,
      originX,
    }),

    textbox({
      name: "headline",
      left: anchorX, top: 160, width: W - 160,
      text: "{{headline}}",
      variableKey: "headline",
      fontFamily: cfg.headline_font ?? "Inter", fontSize: headlineSize, fontWeight: 800,
      fill: cfg.ink, textAlign: align, lineHeight: 1.05,
      originX,
    }),

    textbox({
      name: "body",
      left: anchorX, top: H - 260, width: W - 200,
      text: "{{body}}",
      variableKey: "body",
      fontFamily: "Inter", fontSize: bodySize,
      fill: cfg.ink, textAlign: align, lineHeight: 1.4,
      originX, opacity: 0.85,
    }),

    rect({
      name: "cta-bg",
      left: anchorX, top: H - 100,
      width: 320, height: 64, fill: cfg.accent, rx: 32, ry: 32,
      originX: originX, originY: "center",
      brandReplaceable: true, variableKey: "brand.primaryColor",
    }),

    textbox({
      name: "cta",
      left: anchorX, top: H - 100, width: 320,
      text: "{{cta}}",
      variableKey: "cta",
      fontFamily: "Inter", fontSize: 22, fontWeight: 700,
      fill: cta_ink, textAlign: "center",
      originX: originX, originY: "center",
    }),

    image({
      name: "brand-logo",
      left: 80, top: H - 80, width: 120, height: 40,
      src: "{{brand.logo}}",
      variableKey: "brand.logo",
      brandReplaceable: true,
    }),
  ]);

  return {
    slug: cfg.slug,
    name: cfg.name,
    description: cfg.description,
    category: cfg.category,
    collection_slug: cfg.collection_slug,
    platform: cfg.platform,
    objective: cfg.objective,
    format: cfg.format,
    width: W,
    height: H,
    ai_tags: cfg.ai_tags,
    industry_tags: cfg.industry_tags,
    metadata: {
      emotion: cfg.emotion,
      audience: cfg.audience,
      layout_style: cfg.layout_style,
      visual_weight: "balanced",
      visual_style: cfg.visual_style,
      primary_color: cfg.accent,
      recommended_platforms: [cfg.platform],
      recommended_goal: [cfg.objective],
    },
    layout_dna: {
      hero_position: cfg.hero_position ?? "center",
      text_alignment: align,
      cta_position: "bottom",
      image_priority: "hero",
      visual_balance: align === "center" ? "symmetrical" : "asymmetrical",
      spacing: "comfortable",
      content_density: "medium",
      style: cfg.style ?? "bold",
    },
    variables: [
      { key: "brand.logo", label: "Brand logo", default: "", brand_locked: true },
      { key: "brand.primaryColor", label: "Primary color", default: cfg.accent, brand_locked: true },
      { key: "headline", label: "Headline", default: cfg.headline, ai_editable: true },
      { key: "subheadline", label: "Kicker", default: cfg.subheadline, ai_editable: true },
      { key: "body", label: "Description", default: cfg.body, ai_editable: true },
      { key: "cta", label: "Call to action", default: cfg.cta, ai_editable: true },
      { key: "product_image", label: "Hero image", default: cfg.preview_url ?? PLACEHOLDER },
    ],
    preview_url: cfg.preview_url ?? PLACEHOLDER,
    thumbnail_url: cfg.preview_url ?? PLACEHOLDER,
    template_json,
  };
}
