import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Template structure matching the ad_templates table
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
}

/**
 * Fetch all available ad templates from Supabase
 * Sorted by popularity first, then by name
 */
export const useTemplates = () => {
  return useQuery<AdTemplate[], Error>({
    queryKey: ['ad-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_templates')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching templates:', error);
        throw new Error(`Failed to load templates: ${error.message}`);
      }

      return (data || []) as AdTemplate[];
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
        .from('ad_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        throw new Error(`Failed to load template: ${error.message}`);
      }

      return data as AdTemplate;
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 60,
  });
};
