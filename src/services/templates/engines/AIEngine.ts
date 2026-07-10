// AIEngine — resolves AI-owned content variables (headline, body, CTA, ...).
// Calls the existing `generate-ad-copy` edge function; falls back to static
// context values so instantiation never blocks on the model.

import { supabase } from "@/integrations/supabase/client";
import type { TemplateInstantiateContext, TemplateRecord } from "../types";

export const AIEngine = {
  async personalize(
    template: TemplateRecord,
    ctx: TemplateInstantiateContext
  ): Promise<Record<string, string>> {
    const fallback: Record<string, string> = {
      headline: ctx.productName ?? template.name,
      subheadline: template.description ?? "",
      body: template.description ?? "",
      cta: "Shop Now",
      website: "",
      phone: "",
      offer: "",
    };

    if (ctx.skipAI) return fallback;

    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-copy", {
        body: {
          productName: ctx.productName ?? template.name,
          platform: ctx.platform ?? template.platform ?? "instagram",
          targetAudience: ctx.targetAudience ?? template.metadata?.audience ?? "",
          goal: ctx.goal ?? template.objective ?? "Conversion",
          category: ctx.category ?? template.category ?? "",
          brand: ctx.brand
            ? {
                name: ctx.brand.name,
                voice: ctx.brand.voice,
                colors: ctx.brand.colors,
              }
            : undefined,
        },
      });
      if (error) throw error;

      const copy = (data ?? {}) as Record<string, string>;
      return {
        ...fallback,
        headline: copy.headline ?? fallback.headline,
        subheadline: copy.subheadline ?? fallback.subheadline,
        body: copy.body ?? copy.description ?? fallback.body,
        cta: copy.cta ?? fallback.cta,
        offer: copy.offer ?? fallback.offer,
      };
    } catch (err) {
      console.warn("[AIEngine] falling back to static copy", err);
      return fallback;
    }
  },
};
