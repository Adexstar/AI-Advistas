import { sb } from "./supabase";
import type { CategoryPlaybook } from "./types";

export const CategoryService = {
  async list(): Promise<CategoryPlaybook[]> {
    const { data, error } = await sb
      .from("category_playbooks")
      .select("*")
      .order("category", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CategoryPlaybook[];
  },

  async get(category: string): Promise<CategoryPlaybook | null> {
    const { data, error } = await sb
      .from("category_playbooks")
      .select("*")
      .eq("category", category)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as CategoryPlaybook | null;
  },
};
