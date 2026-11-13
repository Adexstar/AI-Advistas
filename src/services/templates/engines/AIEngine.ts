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
      if (error || !data) throw error ?? new Error("AI copy is unavailable");

      const copy = ((data as { copy?: Record<string, string> }).copy ?? data) as Record<string, string>;
      if (!copy.headline && !copy.cta && !copy.body) {
        throw new Error("AI copy is unavailable. The template text was left unchanged.");
      }
      return {
        headline: copy.headline ?? fallback.headline,
        subheadline: copy.subtitle ?? copy.subheadline ?? fallback.subheadline,
        body: copy.body ?? copy.subtitle ?? copy.description ?? fallback.body,
        cta: copy.cta ?? fallback.cta,
        offer: copy.offer ?? fallback.offer,
        website: fallback.website,
        phone: fallback.phone,
      };
    } catch (err) {
      throw err instanceof Error ? err : new Error("AI copy is unavailable. The template text was left unchanged.");
    }
  },
};
