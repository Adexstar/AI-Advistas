// Blueprint -> editable Fabric.js JSON. Every object carries `variableKey`
// so the Template Engine can swap brand/AI content at instantiate time
// without touching geometry. The output is always editable — never a bitmap.

import type { FabricTemplateJSON, FabricObjectJSON } from "@/services/templates/types";
import type { TemplateBlueprint } from "./TemplateBlueprintService";

interface GeneratedCopy {
  headline: string;
  subheadline?: string;
  body?: string;
  cta: string;
  offer?: string;
}

const HEADLINE_Y_RATIO: Record<string, number> = { top: 0.1, center: 0.42, bottom: 0.7 };

export const TemplateRenderingService = {
  render(blueprint: TemplateBlueprint, copy: GeneratedCopy, heroImageUrl?: string): FabricTemplateJSON {
    const { layout, style } = blueprint;
    const W = layout.aspect.width;
    const H = layout.aspect.height;
    const pad = Math.round(W * (layout.spacing === "airy" ? 0.09 : layout.spacing === "tight" ? 0.04 : 0.065));

    const objects: FabricObjectJSON[] = [];

    // Background
    objects.push({
      type: "rect",
      left: 0, top: 0, width: W, height: H,
      fill: style.palette.bg, selectable: false, evented: false,
    });

    // Hero image placeholder (variable-driven; user can swap in editor).
    if (heroImageUrl || layout.visual_focus !== "text") {
      objects.push({
        type: "image",
        left: pad, top: Math.round(H * 0.14), width: W - pad * 2, height: Math.round(H * 0.42),
        src: heroImageUrl ?? "",
        variableKey: "hero_image",
        aiReplaceable: true, brandReplaceable: true, editable: true,
      });
    }

    // Logo (top-right)
    objects.push({
      type: "image",
      left: W - pad - 96, top: pad, width: 96, height: 96,
      src: "",
      variableKey: "brand.logo",
      brandReplaceable: true, editable: true,
    });

    // Headline
    const headlineY = Math.round(H * (HEADLINE_Y_RATIO[layout.headline_position] ?? 0.42));
    objects.push({
      type: "textbox",
      left: pad, top: headlineY, width: W - pad * 2,
      text: copy.headline,
      fill: style.palette.text,
      fontFamily: style.font.heading,
      fontSize: Math.round(W * 0.075),
      fontWeight: "700",
      textAlign: layout.headline_position === "center" ? "center" : "left",
      variableKey: "headline",
      aiReplaceable: true, editable: true,
    });

    // Subheadline / body
    if (copy.subheadline || copy.body) {
      objects.push({
        type: "textbox",
        left: pad, top: headlineY + Math.round(W * 0.11), width: W - pad * 2,
        text: copy.subheadline ?? copy.body ?? "",
        fill: style.palette.muted,
        fontFamily: style.font.body,
        fontSize: Math.round(W * 0.032),
        textAlign: layout.headline_position === "center" ? "center" : "left",
        variableKey: copy.subheadline ? "subheadline" : "body",
        aiReplaceable: true, editable: true,
      });
    }

    // CTA button
    const btnW = Math.round(W * 0.44);
    const btnH = Math.round(H * 0.07);
    const btnX = layout.headline_position === "center" ? Math.round((W - btnW) / 2) : pad;
    const btnY = H - pad - btnH - Math.round(H * 0.03);
    const rx = layout.cta_style === "pill" ? btnH / 2 : layout.cta_style === "rounded" ? 12 : 0;

    objects.push({
      type: "rect",
      left: btnX, top: btnY, width: btnW, height: btnH,
      fill: style.palette.primary, rx, ry: rx,
      editable: true,
    });
    objects.push({
      type: "textbox",
      left: btnX, top: btnY + Math.round(btnH * 0.28), width: btnW,
      text: copy.cta,
      fill: style.palette.onPrimary,
      fontFamily: style.font.body,
      fontSize: Math.round(W * 0.032),
      fontWeight: "600",
      textAlign: "center",
      variableKey: "cta",
      aiReplaceable: true, editable: true,
    });

    // Offer chip
    if (copy.offer) {
      objects.push({
        type: "textbox",
        left: pad, top: btnY - Math.round(H * 0.05), width: W - pad * 2,
        text: copy.offer,
        fill: style.palette.primary,
        fontFamily: style.font.body,
        fontSize: Math.round(W * 0.026),
        fontWeight: "600",
        textAlign: layout.headline_position === "center" ? "center" : "left",
        variableKey: "offer",
        aiReplaceable: true, editable: true,
      });
    }

    return {
      version: "5.3.0",
      background: style.palette.bg,
      objects,
      width: W,
      height: H,
    };
  },
};
