import { sb } from "./supabase";
import type { AIJob, AIJobType } from "./types";

// Every AI request enters this queue. Callers do not talk to model providers
// directly from page components — they enqueue a job here and observe status.
export const AIJobService = {
  async enqueue(userId: string, jobType: AIJobType, input: Record<string, unknown>): Promise<AIJob> {
    const { data, error } = await sb
      .from("ai_jobs")
      .insert({ user_id: userId, job_type: jobType, status: "queued", input })
      .select("*")
      .single();
    if (error) throw error;
    return data as AIJob;
  },

  async markRunning(id: string): Promise<void> {
    const { error } = await sb
      .from("ai_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async complete(id: string, output: Record<string, unknown>): Promise<void> {
    const { error } = await sb
      .from("ai_jobs")
      .update({ status: "completed", output, completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async fail(id: string, output: Record<string, unknown>): Promise<void> {
    const { error } = await sb
      .from("ai_jobs")
      .update({ status: "failed", output, completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async recent(userId: string, limit = 20): Promise<AIJob[]> {
    const { data, error } = await sb
      .from("ai_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AIJob[];
  },
};
