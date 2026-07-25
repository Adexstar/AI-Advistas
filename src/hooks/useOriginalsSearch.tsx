import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OriginalTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  objective: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  ai_tags: string[] | null;
  industry_tags: string[] | null;
  brand_compatible: boolean | null;
  popularity_score: number | null;
  metadata: Record<string, any> | null;
  layout_dna: Record<string, any> | null;
  template_json: any;
  created_at: string;
}

export interface OriginalsSearchFilters {
  query?: string;
  category?: string;
  platform?: string;
  goal?: string;
  industry?: string;
  brandCompat?: string;
  layoutStyle?: string;
  emotion?: string;
  brandCompatibleOnly?: boolean;
}

export const useOriginalsSearch = (filters: OriginalsSearchFilters) => {
  return useQuery<OriginalTemplate[], Error>({
    queryKey: ['originals-search', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_templates', {
        p_query: filters.query || null,
        p_category: filters.category || null,
        p_platform: filters.platform || null,
        p_goal: filters.goal || null,
        p_industry: filters.industry || null,
        p_brand_compat: filters.brandCompat || null,
        p_layout_style: filters.layoutStyle || null,
        p_emotion: filters.emotion || null,
        p_brand_compatible: filters.brandCompatibleOnly === true ? true : null,
        p_limit: 120,
      });
      if (error) throw error;
      return (data ?? []) as OriginalTemplate[];
    },
    staleTime: 60_000,
  });
};
