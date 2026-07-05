import { sb } from "./supabase";
import type { Decision } from "./types";

export interface RecordDecisionInput {
  page: string;
  trigger_source: string;
  category?: string | null;
  campaign_id?: string | null;
  signal: string;
  action: string;
  reasoning: string;
  confidence: number;
}

export const DecisionService = {
  async record(userId: string, input: RecordDecisionInput): Promise<Decision> {
    const { data, error } = await sb
      .from("decisions")
      .insert({ user_id: userId, status: "pending", ...input })
      .select("*")
      .single();
    if (error) throw error;
    return data as Decision;
  },

  async list(userId: string, opts: { status?: string; limit?: number } = {}): Promise<Decision[]> {
    let q = sb.from("decisions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Decision[];
  },

  async resolve(id: string, status: "accepted" | "dismissed" | "applied"): Promise<void> {
    const { error } = await sb
      .from("decisions")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
