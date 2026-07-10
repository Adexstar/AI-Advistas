// Search over the templates library. Queries Supabase directly for now; the
// same signature will front the future `template-search` edge function that
// fans out to third-party providers (Freepik, Canva, Bannerbear, ...).

import { supabase } from "@/integrations/supabase/client";
import type { TemplateRecord } from "./types";

export interface TemplateSearchFilters {
  query?: string;
  category?: string;
  platform?: string;
  objective?: string;
  industry?: string;
  limit?: number;
}

export const TemplateSearchService = {
  async search(filters: TemplateSearchFilters = {}): Promise<TemplateRecord[]> {
    let q = supabase.from("templates").select("*").limit(filters.limit ?? 60);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.platform) q = q.eq("platform", filters.platform);
    if (filters.objective) q = q.eq("objective", filters.objective);
    if (filters.industry) q = q.contains("industry_tags", [filters.industry]);
    if (filters.query) {
      const like = `%${filters.query}%`;
      q = q.or(`name.ilike.${like},description.ilike.${like}`);
    }
    const { data, error } = await q.order("popularity_score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as TemplateRecord[];
  },
};
