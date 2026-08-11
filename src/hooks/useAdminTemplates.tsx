import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  objective: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  template_json: any;
  ai_tags: string[] | null;
  industry_tags: string[] | null;
  premium: boolean;
  brand_compatible: boolean;
  popularity_score: number;
  usage_count: number;
  is_active: boolean;
  source: string;
  source_id: string | null;
  source_license: string | null;
  license_expires_at: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminTemplateInput = Partial<AdminTemplate> & { name: string };

export const useAdminTemplates = () => {
  return useQuery<AdminTemplate[], Error>({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AdminTemplate[];
    },
  });
};

export const useSaveTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminTemplateInput) => {
      const { id, created_at, updated_at, ...rest } = input as any;
      if (id) {
        const { error } = await supabase.from('templates').update(rest).eq('id', id);
        if (error) throw new Error(error.message);
        return id as string;
      }
      const { data, error } = await supabase
        .from('templates')
        .insert(rest)
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
      qc.invalidateQueries({ queryKey: ['ad-templates'] });
      toast.success('Template saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useToggleTemplateActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('templates').update({ is_active }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-templates'] });
      qc.invalidateQueries({ queryKey: ['ad-templates'] });
      toast.success(vars.is_active ? 'Template activated' : 'Template deactivated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
