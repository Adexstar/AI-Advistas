import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Template card shape used across the library UI.
 * Backed by the single `templates` table (AdVista Originals + imported sources).
 */
export interface AdTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  goal: 'Conversion' | 'Awareness' | 'Traffic' | 'Engagement' | null;
  platforms: string[];
  is_popular: boolean;
  template_json: {
    product?: string;
    details?: string;
    adType?: 'image' | 'video' | 'carousel';
    websiteUrl?: string;
    audience?: string;
    platforms?: string[];
    suggestedHeadlines?: string[];
    [key: string]: any;
  };
  usage_count?: number;
  category?: string | null;
  tags?: string[];
  industry?: string | null;
  performance_score?: number | null;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  estimated_setup_time_minutes?: number | null;
  preview_url?: string | null;
  thumbnail_url?: string | null;
  source?: string | null;
}

const POPULAR_THRESHOLD = 70;

/** Map a `templates` row onto the AdTemplate shape the cards expect. */
export const mapTemplateRow = (row: any): AdTemplate => {
  const metadata = (row?.metadata ?? {}) as Record<string, any>;
  const recommended: string[] = Array.isArray(metadata.recommended_platforms)
    ? metadata.recommended_platforms
    : [];
  const platforms = Array.from(
    new Set([row?.platform, ...recommended].filter(Boolean) as string[])
  );

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: row.name,
    description: row.description ?? null,
    goal: (row.objective ?? null) as AdTemplate['goal'],
    platforms,
    is_popular: (row.popularity_score ?? 0) >= POPULAR_THRESHOLD,
    template_json: (row.template_json ?? {}) as AdTemplate['template_json'],
    usage_count: row.popularity_score ?? 0,
    category: row.category ?? null,
    tags: (row.ai_tags ?? []) as string[],
    industry: Array.isArray(row.industry_tags) ? row.industry_tags[0] ?? null : null,
    performance_score: row.popularity_score ?? null,
    difficulty_level: (metadata.difficulty_level ?? null) as AdTemplate['difficulty_level'],
    estimated_setup_time_minutes: metadata.estimated_setup_time_minutes ?? null,
    preview_url: row.preview_url ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
    source: row.source ?? null,
  };
};

/**
 * Fetch all available templates, most popular first.
 */
export const useTemplates = () => {
  return useQuery<AdTemplate[], Error>({
    queryKey: ['ad-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('popularity_score', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching templates:', error);
        throw new Error(`Failed to load templates: ${error.message}`);
      }

      return ((data ?? []) as any[]).map(mapTemplateRow);
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 2,
  });
};

/**
 * Track template usage when a user selects it
 */
export const useTrackTemplateUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.rpc('increment_template_usage', {
        template_id: templateId
      });

      if (error) {
        console.warn('Failed to track template usage:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-templates'] });
    }
  });
};

/**
 * Fetch a single template by ID
 */
export const useTemplate = (templateId: string | undefined) => {
  return useQuery<AdTemplate | null, Error>({
    queryKey: ['ad-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load template: ${error.message}`);
      }

      return data ? mapTemplateRow(data) : null;
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 60,
  });
};
