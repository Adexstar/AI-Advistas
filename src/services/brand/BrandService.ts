// Re-export of the AI-layer BrandService, extended with lock + import.
// Import from "@/services/brand/BrandService" going forward.
import { supabase } from "@/integrations/supabase/client";
import { BrandService as CoreBrandService, type BrandIdentity } from "@/services/ai/BrandService";

export type { BrandIdentity } from "@/services/ai/BrandService";

export const BrandService = {
  ...CoreBrandService,

  async lock(brandId: string) {
    const { error } = await supabase
      .from("brand_kits")
      // @ts-expect-error — column added ad-hoc; safe if unsupported
      .update({ locked: true })
      .eq("id", brandId);
    if (error) throw error;
  },

  async unlock(brandId: string) {
    const { error } = await supabase
      .from("brand_kits")
      // @ts-expect-error — see lock()
      .update({ locked: false })
      .eq("id", brandId);
    if (error) throw error;
  },

  async importFromWebsite(url: string) {
    const { data, error } = await supabase.functions.invoke("brandfetch-import", {
      body: { url },
    });
    if (error) throw error;
    return data as BrandIdentity;
  },

  toPromptGuardrails(brand: BrandIdentity | null, opts: { experimental?: boolean } = {}) {
    const base = CoreBrandService.toPromptGuardrails(brand);
    if (brand?.locked && !opts.experimental) {
      return `${base} | STRICT: do not modify logo, colors, fonts, tone, or voice.`;
    }
    return base;
  },
};
