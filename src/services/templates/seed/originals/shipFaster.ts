import previewAsset from "@/assets/originals/ship-faster.jpg.asset.json";
import { canvas, image, rect, resetZ, textbox, type OriginalTemplateModule } from "../templateBuilder";

resetZ();

const W = 1200;
const H = 627;

export const shipFaster: OriginalTemplateModule = {
  slug: "ship-faster",
  name: "Ship Faster",
  description:
    "Bold dark-mode SaaS launch template with product screenshot slot. Sized for LinkedIn and X share cards.",
  category: "SaaS & Technology",
  collection_slug: "saas-technology",
  platform: "LinkedIn",
  objective: "Awareness",
  format: "landscape",
  width: W,
  height: H,
  ai_tags: ["saas", "product launch", "dark mode", "split layout", "bold"],
  industry_tags: ["SaaS", "Technology", "B2B"],
  metadata: {
    emotion: "Confident",
    audience: "Founders & Product Teams",
    layout_style: "Split",
    visual_weight: "left-heavy",
    visual_style: "Modern",
    primary_color: "#22D3EE",
    recommended_platforms: ["LinkedIn", "X", "Facebook"],
    recommended_goal: ["Awareness", "Traffic"],
    brand_compatibility: ["Modern", "Tech", "Bold"],
  },
  layout_dna: {
    hero_position: "right",
    text_alignment: "left",
    cta_position: "bottom",
    image_priority: "product",
    visual_balance: "asymmetrical",
    spacing: "comfortable",
    content_density: "medium",
    style: "bold",
  },
  variables: [
    { key: "brand.logo", label: "Brand logo", default: "", brand_locked: true },
    { key: "brand.primaryColor", label: "Accent color", default: "#22D3EE", brand_locked: true },
    { key: "headline", label: "Headline", default: "Ship Faster", ai_editable: true },
    { key: "body", label: "Description", default: "The all-in-one platform for modern teams to build, ship, and scale software.", ai_editable: true },
    { key: "cta", label: "Call to action", default: "Start Shipping Today", ai_editable: true },
    { key: "product_image", label: "Product screenshot", default: previewAsset.url },
  ],
  preview_url: previewAsset.url,
  thumbnail_url: previewAsset.url,
  template_json: canvas("#0B1220", [
    rect({ name: "accent-strip", left: 0, top: 0, width: 8, height: H, fill: "#22D3EE", brandReplaceable: true, variableKey: "brand.primaryColor" }),
    textbox({
      name: "brand-name",
      left: 60, top: 60, width: 400,
      text: "{{brand.name}}",
      variableKey: "brand.name",
      brandReplaceable: true,
      fontFamily: "Inter", fontSize: 22, fontWeight: 700,
      fill: "#FFFFFF", textAlign: "left", letterSpacing: 200,
    }),
    textbox({
      name: "headline",
      left: 60, top: 140, width: 560,
      text: "{{headline}}",
      variableKey: "headline",
      fontFamily: "Inter", fontSize: 96, fontWeight: 800,
      fill: "#FFFFFF", textAlign: "left", lineHeight: 1.0,
    }),
    textbox({
      name: "body",
      left: 60, top: 340, width: 520,
      text: "{{body}}",
      variableKey: "body",
      fontFamily: "Inter", fontSize: 22, fill: "#CBD5E1",
      textAlign: "left", lineHeight: 1.4,
    }),
    rect({ name: "cta-bg", left: 60, top: 500, width: 280, height: 60, fill: "#22D3EE", rx: 12, ry: 12, brandReplaceable: true, variableKey: "brand.primaryColor" }),
    textbox({
      name: "cta",
      left: 200, top: 530, width: 280,
      text: "{{cta}}",
      variableKey: "cta",
      fontFamily: "Inter", fontSize: 20, fontWeight: 700,
      fill: "#0B1220", textAlign: "center",
      originX: "center", originY: "center",
    }),
    image({
      name: "product-screenshot",
      left: 640, top: 90, width: 500, height: 440,
      src: "{{product_image}}",
      variableKey: "product_image",
      aiReplaceable: true,
    }),
  ]),
};
