import previewAsset from "@/assets/originals/30-day-reset.jpg.asset.json";
import { canvas, image, rect, resetZ, textbox, type OriginalTemplateModule } from "../templateBuilder";

resetZ();

const W = 1080;
const H = 1920;

export const thirtyDayReset: OriginalTemplateModule = {
  slug: "30-day-reset",
  name: "30-Day Reset",
  description:
    "High-energy fitness Instagram Story with condensed headline, athlete silhouette, and program CTA.",
  category: "Fitness",
  collection_slug: "fitness",
  platform: "Instagram Story",
  objective: "Traffic",
  format: "story",
  width: W,
  height: H,
  ai_tags: ["fitness", "bold", "high-energy", "vertical", "program launch"],
  industry_tags: ["Fitness", "Wellness", "Coaching"],
  metadata: {
    emotion: "Energetic",
    audience: "Adults 20-40 fitness enthusiasts",
    layout_style: "Hero Poster",
    visual_weight: "top-heavy",
    visual_style: "Bold",
    primary_color: "#E11D2C",
    recommended_platforms: ["Instagram Story", "TikTok", "Snapchat"],
    recommended_goal: ["Traffic", "Sign-ups"],
    brand_compatibility: ["Bold", "Athletic", "Motivational"],
  },
  layout_dna: {
    hero_position: "center",
    text_alignment: "left",
    cta_position: "bottom",
    image_priority: "hero",
    visual_balance: "asymmetrical",
    spacing: "tight",
    content_density: "high",
    style: "bold",
  },
  variables: [
    { key: "brand.primaryColor", label: "Accent color", default: "#E11D2C", brand_locked: true },
    { key: "subheadline", label: "Kicker", default: "RESET. REFOCUS. RECHARGE.", ai_editable: true },
    { key: "headline", label: "Headline", default: "30-DAY RESET", ai_editable: true },
    { key: "body", label: "Description", default: "30 days to become your strongest self.", ai_editable: true },
    { key: "cta", label: "Call to action", default: "Join the Program", ai_editable: true },
    { key: "hero_image", label: "Hero image", default: previewAsset.url },
  ],
  preview_url: previewAsset.url,
  thumbnail_url: previewAsset.url,
  template_json: canvas("#0A0A0A", [
    image({
      name: "hero",
      left: 0, top: 0, width: W, height: H,
      src: "{{hero_image}}",
      variableKey: "hero_image",
      aiReplaceable: true,
      opacity: 0.6,
    }),
    rect({ name: "top-fade", left: 0, top: 0, width: W, height: 600, fill: "#0A0A0A", opacity: 0.55 }),
    textbox({
      name: "kicker",
      left: 80, top: 140, width: 920,
      text: "{{subheadline}}",
      variableKey: "subheadline",
      fontFamily: "Inter", fontSize: 32, fontWeight: 700,
      fill: "#FFFFFF", textAlign: "left", letterSpacing: 300,
    }),
    textbox({
      name: "headline",
      left: 80, top: 220, width: 920,
      text: "{{headline}}",
      variableKey: "headline",
      fontFamily: "Impact", fontSize: 220, fontWeight: 900,
      fill: "#E11D2C", textAlign: "left", lineHeight: 0.95, letterSpacing: -30,
    }),
    textbox({
      name: "body",
      left: 80, top: H - 480, width: 920,
      text: "{{body}}",
      variableKey: "body",
      fontFamily: "Inter", fontSize: 34, fontWeight: 700,
      fill: "#FFFFFF", textAlign: "left", lineHeight: 1.25,
    }),
    rect({ name: "cta-bg", left: 80, top: H - 260, width: 500, height: 100, fill: "#E11D2C", rx: 8, ry: 8, brandReplaceable: true, variableKey: "brand.primaryColor" }),
    textbox({
      name: "cta",
      left: 330, top: H - 210, width: 500,
      text: "{{cta}}",
      variableKey: "cta",
      fontFamily: "Inter", fontSize: 34, fontWeight: 800,
      fill: "#FFFFFF", textAlign: "center", letterSpacing: 100,
      originX: "center", originY: "center",
    }),
  ]),
};
