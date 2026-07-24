import { sb } from "./supabase";

// Thin adapter over existing brand_kits table. Enforces the "Brand Lock"
// principle: AI actions must consult a brand's identity before generating.
export interface BrandIdentity {
  id: string;
  name: string;
  colors?: string[];
  fonts?: string[];
  tone?: string;
  logo_url?: string;
  writing_style?: string;
  voice?: string;
  locked?: boolean;
}

export const BrandService = {
  async listForUser(userId: string): Promise<BrandIdentity[]> {
    const { data, error } = await sb
      .from("brand_kits")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as BrandIdentity[];
  },

  async get(id: string): Promise<BrandIdentity | null> {
    const { data, error } = await sb.from("brand_kits").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as BrandIdentity | null;
  },

  // Compact system-prompt fragment describing brand constraints for AI jobs.
  toPromptGuardrails(brand: BrandIdentity | null): string {
    if (!brand) return "";
    const parts: string[] = [`Brand: ${brand.name}`];
    if (brand.tone) parts.push(`Tone: ${brand.tone}`);
    if (brand.writing_style) parts.push(`Writing style: ${brand.writing_style}`);
    if (brand.colors?.length) parts.push(`Colors: ${brand.colors.join(", ")}`);
    if (brand.fonts?.length) parts.push(`Fonts: ${brand.fonts.join(", ")}`);
    if (brand.locked) parts.push("Brand Lock: enabled — do not alter branding.");
    return parts.join(" | ");
  },
};
