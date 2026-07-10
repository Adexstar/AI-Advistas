// BrandEngine — swaps brand-owned variables into a template.
// Only layers marked `brandReplaceable` or bound to a `brand.*` variable key
// are affected. If Brand Lock is enabled, non-brand layers cannot be altered
// by downstream engines even if they carry the ai_replaceable flag.

import type { TemplateInstantiateContext } from "../types";

export const BrandEngine = {
  buildVariables(ctx: TemplateInstantiateContext): Record<string, string> {
    const brand = ctx.brand;
    const vars: Record<string, string> = {};
    if (!brand) return vars;
    if (brand.logo_url) vars["brand.logo"] = brand.logo_url;
    if (brand.colors?.[0]) vars["brand.primaryColor"] = brand.colors[0];
    if (brand.colors?.[1]) vars["brand.secondaryColor"] = brand.colors[1];
    if (brand.fonts?.[0]) vars["brand.font"] = brand.fonts[0];
    if (brand.voice) vars["brand.voice"] = brand.voice;
    return vars;
  },

  isLocked(ctx: TemplateInstantiateContext): boolean {
    return !!ctx.brand?.locked;
  },
};
