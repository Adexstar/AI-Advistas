import { sb } from "./supabase";
import type { CampaignMemory } from "./types";

export const CampaignMemoryService = {
  async getForBrand(userId: string, brandId: string | null): Promise<CampaignMemory | null> {
    let q = sb.from("campaign_memory").select("*").eq("user_id", userId).limit(1);
    if (brandId) q = q.eq("brand_id", brandId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return (data ?? null) as CampaignMemory | null;
  },

  async recordWin(userId: string, brandId: string | null, kind: "template" | "copy", payload: unknown): Promise<void> {
    const existing = await this.getForBrand(userId, brandId);
    const key = kind === "template" ? "winning_templates" : "best_copy";
    const next = [...((existing as any)?.[key] ?? []), payload];
    if (existing) {
      const { error } = await sb.from("campaign_memory").update({ [key]: next, last_learning: new Date().toISOString() }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("campaign_memory").insert({ user_id: userId, brand_id: brandId, [key]: next, last_learning: new Date().toISOString() });
      if (error) throw error;
    }
  },

  async recordFailure(userId: string, brandId: string | null, kind: "template" | "copy", payload: unknown): Promise<void> {
    const existing = await this.getForBrand(userId, brandId);
    const key = kind === "template" ? "failed_templates" : "failed_copy";
    const next = [...((existing as any)?.[key] ?? []), payload];
    if (existing) {
      const { error } = await sb.from("campaign_memory").update({ [key]: next, last_learning: new Date().toISOString() }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("campaign_memory").insert({ user_id: userId, brand_id: brandId, [key]: next, last_learning: new Date().toISOString() });
      if (error) throw error;
    }
  },
};
