import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  return useQuery({
    queryKey: ['user_ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ads')
        .select(`
          *,
          templates (
            name,
            thumbnail_url
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as (UserAd & { templates?: { name: string; thumbnail_url?: string } })[];
    }
  });
};

export const useSaveUserAd = () => {
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
      const { data, error } = await supabase
        .from('user_ads')
        .insert({
          name,
          content,
          template_id: templateId,
          status
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Ad saved successfully",
        description: "Your ad has been saved to My Ads.",
      });
      queryClient.invalidateQueries({ queryKey: ['user_ads'] });
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
      const { data, error } = await supabase
        .from('user_ads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_ads'] });
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
        .from('user_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Ad deleted",
        description: "The ad has been removed from your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ['user_ads'] });
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