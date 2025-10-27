import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CanvaTemplate {
  id: string;
  name: string;
  thumbnail_url: string;
  template_source: 'canva';
  canvas_data?: any;
}

export const useSearchCanvaTemplates = (query: string) => {
  return useQuery({
    queryKey: ['canva-templates', query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('search-canva-templates', {
        body: { query }
      });
      
      if (error) throw error;
      return data.templates as CanvaTemplate[];
    },
    enabled: !!query,
    retry: 1
  });
};

export const useImportCanvaTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: CanvaTemplate) => {
      const { data, error } = await supabase.functions.invoke('import-canva-template', {
        body: { template }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Canva template imported successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to import Canva template:', error);
      toast.error(`Failed to import template: ${error.message}`);
    }
  });
};
