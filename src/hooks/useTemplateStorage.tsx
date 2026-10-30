import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreativeService } from '@/services/creative/CreativeService';
import { useToast } from '@/hooks/use-toast';

export interface TemplateFile {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  dimensions: { width: number; height: number };
  template_source: string;
  created_at: string;
  created_by?: string;
  is_file_based: boolean;
  thumbnail_url?: string;
  preview_url?: string;
  description?: string;
  category?: string;
}

export interface UserAd {
  id: string;
  user_id: string;
  template_id?: string;
  name: string;
  content: any;
  file_path?: string;
  export_format: string;
  status: 'draft' | 'completed' | 'exported';
  created_at: string;
  updated_at: string;
}

export const useUploadTemplate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, metadata }: { 
      file: File; 
      metadata: { name: string; description?: string; dimensions?: { width: number; height: number } } 
    }) => {
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ad_templates')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ad_templates')
        .getPublicUrl(fileName);

      // Create template record
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: metadata.name,
          description: metadata.description || '',
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          dimensions: metadata.dimensions || { width: 0, height: 0 },
          is_file_based: true,
          template_source: 'internal',
          preview_url: urlData.publicUrl,
          thumbnail_url: urlData.publicUrl
        })
        .select()
        .single();

      if (templateError) {
        throw new Error(`Failed to create template record: ${templateError.message}`);
      }

      return templateData;
    },
    onSuccess: () => {
      toast({
        title: "Template uploaded successfully",
        description: "The template is now available in the library.",
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useFileBasedTemplates = () => {
  return useQuery({
    queryKey: ['templates', 'file-based'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_file_based', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        dimensions: item.dimensions as { width: number; height: number }
      })) as TemplateFile[];
    }
  });
};

export const useUserAds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['creatives', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          templates (
            name,
            thumbnail_url
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data.map(row => ({ ...row, export_format: (row.content as any)?.export_format ?? 'png' })) as unknown as (UserAd & { templates?: { name: string; thumbnail_url?: string } })[];
    }
  });
};

export const useSaveUserAd = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      content, 
      templateId, 
      status = 'draft' 
    }: { 
      name: string; 
      content: any; 
      templateId?: string; 
      status?: 'draft' | 'completed' | 'exported' 
    }) => {
      if (!user) throw new Error('Not signed in');
      return CreativeService.save(user.id, { name, content, template_id: templateId, status });
    },
    onSuccess: () => {
      toast({
        title: "Ad saved successfully",
        description: "Your ad has been saved to My Ads.",
      });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useUpdateUserAd = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<UserAd, 'name' | 'content' | 'status' | 'export_format'>> 
    }) => {
      if (!user) throw new Error('Not signed in');
      const { export_format, ...fields } = updates;
      const existing = export_format ? await CreativeService.get(user.id, id) : null;
      return CreativeService.save(user.id, { ...fields,
        ...(export_format ? { content: { ...((updates.content ?? existing?.content ?? {}) as Record<string, any>), export_format } } : {}),
      }, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useDeleteUserAd = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Ad deleted",
        description: "The ad has been removed from your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};