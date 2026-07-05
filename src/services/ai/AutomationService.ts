import { sb } from "./supabase";
import type { AutomationRule } from "./types";

// Infrastructure only. Rules are stored but not executed yet.
// The Growth Agent level remains disabled until autonomous execution is wired up.
export const AutomationService = {
  async list(userId: string): Promise<AutomationRule[]> {
    const { data, error } = await sb
      .from("automation_rules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AutomationRule[];
  },

  async create(
    userId: string,
    rule: Pick<AutomationRule, "name" | "trigger" | "condition" | "action"> & { enabled?: boolean }
  ): Promise<AutomationRule> {
    const { data, error } = await sb
      .from("automation_rules")
      .insert({ user_id: userId, enabled: rule.enabled ?? false, ...rule })
      .select("*")
      .single();
    if (error) throw error;
    return data as AutomationRule;
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const { error } = await sb.from("automation_rules").update({ enabled }).eq("id", id);
    if (error) throw error;
  },
};
