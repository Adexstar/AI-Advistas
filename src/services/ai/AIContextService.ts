import { sb } from "./supabase";
import type { AIContextRow } from "./types";

export const AIContextService = {
  async get(userId: string): Promise<AIContextRow | null> {
    const { data, error } = await sb
      .from("ai_context")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async upsert(userId: string, patch: Partial<AIContextRow>): Promise<AIContextRow> {
    const { data, error } = await sb
      .from("ai_context")
      .upsert(
        { user_id: userId, ...patch, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as AIContextRow;
  },
};
