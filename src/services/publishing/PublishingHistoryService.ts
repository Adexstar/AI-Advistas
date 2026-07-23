import { supabase } from "@/integrations/supabase/client";

export interface HistoryEntry {
  campaignId: string;
  jobId?: string;
  platform: string;
  action: "publish" | "schedule" | "retry" | "pause" | "resume" | "cancel" | "sync";
  result: "success" | "failure" | "pending";
  details?: Record<string, unknown>;
}

export const PublishingHistoryService = {
  async log(entry: HistoryEntry) {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return;
    await supabase.from("publishing_history").insert({
      campaign_id: entry.campaignId,
      user_id: userId,
      job_id: entry.jobId ?? null,
      platform: entry.platform,
      action: entry.action,
      result: entry.result,
      details: entry.details ?? {},
    });
  },

  async list(campaignId: string, limit = 50) {
    const { data, error } = await supabase
      .from("publishing_history")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
