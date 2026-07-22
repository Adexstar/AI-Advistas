// Marketing copy — client-side facade. The real generation runs in the
// `generate-ai-template` Edge Function; this service exists so pages/services
// have a stable local API and a deterministic fallback when AI is unavailable.

import type { TemplateBlueprint } from "./TemplateBlueprintService";

export interface GeneratedCopy {
  headline: string;
  subheadline?: string;
  body?: string;
  cta: string;
  offer?: string;
}

const CTA_BY_GOAL: Record<string, string> = {
  conversions: "Shop Now",
  traffic: "Learn More",
  awareness: "Discover",
  leads: "Get Started",
  engagement: "Join Us",
};

export const MarketingCopyService = {
  // Rules-based fallback if the edge function fails. Keeps generation resilient.
  fallback(blueprint: TemplateBlueprint): GeneratedCopy {
    const brand = blueprint.context.brandName ?? "Your Brand";
    const product = blueprint.context.productName ?? blueprint.context.category ?? "our latest";
    const goal = (blueprint.context.goal ?? "conversions").toLowerCase();
    return {
      headline: `Discover ${product}`,
      subheadline: `Made for you by ${brand}.`,
      cta: CTA_BY_GOAL[goal] ?? "Shop Now",
      offer: goal === "conversions" ? "Free shipping today" : undefined,
    };
  },
};
