import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProcessPSD } from './usePSDProcessor';

export interface UnifiedTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  template_source: 'freepik' | 'internal';
  freepik_id?: string | null;
  external_id?: string | null;
  cached_data?: any;
  freepik_download_url?: string | null;
  schema?: any;
  canvas_data?: any;
  customizable_fields?: any;
  platforms?: string[];
  template_json?: any;
  goal?: string | null;
  industry?: string | null;
  difficulty_level?: string | null;
  performance_score?: number | null;
  estimated_setup_time_minutes?: number | null;
  is_popular?: boolean;
  usage_count?: number;
  category?: string | null;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

// Legacy type for backward compatibility
export interface FreepikTemplate extends UnifiedTemplate {}

export interface FreepikSearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface FreepikSearchResponse {
  templates: UnifiedTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  source: 'freepik' | 'cache';
  fallback?: boolean;
  message?: string;
}

export const useSearchFreepikTemplates = () => {
  const { toast } = useToast();

  return useMutation<FreepikSearchResponse, Error, FreepikSearchParams>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke('search-freepik-templates', {
        body: params
      });

      if (error) {
        throw new Error(error.message || 'Failed to search Freepik templates');
      }

      // Show fallback message if needed
      if (data.fallback && data.message) {
        toast({
          title: "Freepik Integration",
          description: data.message,
          variant: "default",
        });
      }

      return data;
    },
  });
};

export const useGetFreepikTemplate = () => {
  const { toast } = useToast();

  return useMutation<{ template: UnifiedTemplate; source: string }, Error, { freepik_id: string }>({
    mutationFn: async ({ freepik_id }) => {
      const { data, error } = await supabase.functions.invoke('get-freepik-template', {
        body: { freepik_id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get Freepik template');
      }

      return data;
    },
    onError: (error) => {
      toast({
        title: "Error Loading Template",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useImportFreepikTemplate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { freepikTemplate: UnifiedTemplate }>({
    mutationFn: async ({ freepikTemplate }) => {
      // First, process the PSD
      const { data: processData, error: processError } = await supabase.functions.invoke('process-freepik-psd', {
        body: { 
          templateId: freepikTemplate.id, 
          freepikDownloadUrl: freepikTemplate.freepik_download_url 
        }
      });

      if (processError) {
        throw new Error(processError.message || 'Failed to process PSD');
      }

      // Then insert into the unified templates table
      const { error: insertError } = await supabase
        .from('templates')
        .insert({
          name: freepikTemplate.name,
          description: freepikTemplate.description,
          template_source: 'freepik',
          source: 'freepik',
          external_id: freepikTemplate.freepik_id,
          canvas_data: processData.processedData.canvas_data,
          placeholders: processData.processedData.placeholders,
          template_json: {},
        });

      if (insertError) {
        throw insertError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Template Imported",
        description: "Freepik template has been added to your library",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useCombinedTemplates = (searchParams?: FreepikSearchParams) => {
  const [freepikTemplates, setFreepikTemplates] = useState<UnifiedTemplate[]>([]);
  const [isSearchingFreepik, setIsSearchingFreepik] = useState(false);
  
  const searchFreepik = useSearchFreepikTemplates();
  const processPSD = useProcessPSD();
  const queryClient = useQueryClient();

  // Get all templates from database (unified `templates` table)
  const { data: internalTemplates = [], isLoading: isLoadingInternal } = useQuery({
    queryKey: ['ad-templates', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as UnifiedTemplate[];
    }
  });

  const searchAllTemplates = async (params: FreepikSearchParams = {}) => {
    setIsSearchingFreepik(true);
    try {
      const freepikResult = await searchFreepik.mutateAsync(params);
      setFreepikTemplates(freepikResult.templates);
    } catch (error) {
      console.error('Error searching Freepik templates:', error);
      setFreepikTemplates([]);
    } finally {
      setIsSearchingFreepik(false);
    }
  };

  const processFreepikPSD = async (templateId: string, freepikDownloadUrl: string) => {
    try {
      await processPSD.mutateAsync({ templateId, freepikDownloadUrl });
      return true;
    } catch (error) {
      console.error('Failed to process PSD:', error);
      return false;
    }
  };

  const allTemplates = [...internalTemplates, ...freepikTemplates];
  const isLoading = isLoadingInternal || isSearchingFreepik;

  return {
    templates: allTemplates,
    internalTemplates,
    freepikTemplates,
    isLoading,
    searchAllTemplates,
    searchFreepik: searchFreepik.mutate,
    isSearchingFreepik,
    processFreepikPSD,
    isProcessingPSD: processPSD.isPending,
  };
};
