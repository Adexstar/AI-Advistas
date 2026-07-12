import previewAsset from "@/assets/originals/glow-naturally.jpg.asset.json";
import { canvas, image, rect, resetZ, textbox, type OriginalTemplateModule } from "../templateBuilder";

resetZ();

const W = 1080;
const H = 1350;

export const glowNaturally: OriginalTemplateModule = {
  slug: "glow-naturally",
  name: "Glow Naturally",
  description:
    "Luxury minimal skincare template with editorial serif headline and product hero. Ideal for clean beauty launches on Instagram.",
  category: "Beauty",
  collection_slug: "beauty",
  platform: "Instagram",
  objective: "Conversions",
  format: "portrait",
  width: W,
  height: H,
  ai_tags: ["luxury", "minimal", "editorial", "clean beauty", "product focus"],
  industry_tags: ["Beauty", "Skincare", "Cosmetics"],
  metadata: {
    emotion: "Luxury",
    audience: "Women 20-35",
    layout_style: "Product Focus",
    visual_weight: "balanced",
    visual_style: "Minimal",
    primary_color: "#F4D9C6",
    recommended_platforms: ["Instagram", "Facebook"],
    recommended_goal: ["Sales", "Conversions"],
    brand_compatibility: ["Luxury", "Organic", "Premium"],
  },
  layout_dna: {
    hero_position: "center",
    text_alignment: "center",
    cta_position: "bottom",
    image_priority: "product",
    visual_balance: "symmetrical",
    spacing: "spacious",
    content_density: "medium",
    style: "editorial",
  },
  variables: [
    { key: "brand.logo", label: "Brand logo", default: "", brand_locked: true },
    { key: "brand.primaryColor", label: "Primary color", default: "#F4D9C6", brand_locked: true },
    { key: "headline", label: "Headline", default: "Glow Naturally", ai_editable: true },
    { key: "subheadline", label: "Kicker", default: "Radiance. Balance. You.", ai_editable: true },
    { key: "body", label: "Description", default: "Clean beauty that nourishes your skin and your soul.", ai_editable: true },
    { key: "cta", label: "Call to action", default: "Shop the Serum", ai_editable: true },
    { key: "product_image", label: "Product image", default: previewAsset.url },
  ],
  preview_url: previewAsset.url,
  thumbnail_url: previewAsset.url,
  template_json: canvas("#FBEFE6", [
    rect({ name: "bg-band", left: 0, top: H - 120, width: W, height: 120, fill: "#F4D9C6" }),
    textbox({
      name: "kicker",
      left: W / 2, top: 120, width: 900,
      text: "{{subheadline}}",
      variableKey: "subheadline",
      fontFamily: "Inter", fontSize: 24, fontWeight: 600,
      fill: "#B87A5A", textAlign: "center", letterSpacing: 400,
      originX: "center",
    }),
    textbox({
      name: "headline",
      left: W / 2, top: 200, width: 960,
      text: "{{headline}}",
      variableKey: "headline",
      fontFamily: "Playfair Display", fontSize: 140, fontWeight: 400,
      fill: "#B87A5A", textAlign: "center", lineHeight: 1.02,
      originX: "center",
    }),
    textbox({
      name: "body",
      left: W / 2, top: 500, width: 720,
      text: "{{body}}",
      variableKey: "body",
      fontFamily: "Inter", fontSize: 26, fill: "#7A5642",
      textAlign: "center", lineHeight: 1.4,
      originX: "center",
    }),
    image({
      name: "product",
      left: W / 2, top: 640, width: 360, height: 520,
      src: "{{product_image}}",
      variableKey: "product_image",
      aiReplaceable: true,
      originX: "center",
    }),
    rect({ name: "cta-bg", left: W / 2, top: H - 90, width: 320, height: 60, fill: "#B87A5A", rx: 30, ry: 30, originX: "center", originY: "center", brandReplaceable: true, variableKey: "brand.primaryColor" }),
    textbox({
      name: "cta",
      left: W / 2, top: H - 90, width: 320,
      text: "{{cta}}",
      variableKey: "cta",
      fontFamily: "Inter", fontSize: 22, fontWeight: 600,
      fill: "#FFFFFF", textAlign: "center",
      originX: "center", originY: "center",
    }),
  ]),
};
