import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type MediaAsset = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  file_path: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  file_size: number;
  mime_type: string | null;
  folder: string | null;
  tags: string[];
  source: string;
  usage_count: number;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaFolder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export const BUCKET = 'media-library';

export const detectType = (mime: string): 'image' | 'video' | 'audio' | 'document' => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
};

const logActivity = async (userId: string, action: string, details: any) => {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: 'media_asset',
      details,
    } as any);
  } catch (e) {
    /* non-blocking */
  }
};

export const useMediaAssets = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`media-live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_assets', filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: ['media-assets', userId] });
        qc.invalidateQueries({ queryKey: ['dash-media', userId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  return useQuery({
    queryKey: ['media-assets', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MediaAsset[];
    },
  });
};

export const useMediaFolders = () => {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['media-folders', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_folders')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MediaFolder[];
    },
  });
};

export const useCreateFolder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('media_folders')
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (error) throw error;
      await logActivity(user.id, 'folder_created', { name });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-folders'] });
      toast({ title: 'Folder created' });
    },
    onError: (e: any) => toast({ title: 'Could not create folder', description: e.message, variant: 'destructive' }),
  });
};

export const useUploadAssets = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ files, folder }: { files: File[]; folder?: string | null }) => {
      if (!user) throw new Error('Not authenticated');
      const results: MediaAsset[] = [];
      for (const file of files) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${Date.now()}-${cleanName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        if (upErr) throw upErr;
        const url = await signedMediaUrl(path, BUCKET);
        const type = detectType(file.type || '');
        const { data, error } = await supabase
          .from('media_assets')
          .insert({
            user_id: user.id,
            name: file.name,
            type,
            mime_type: file.type,
            file_path: path,
            file_url: url,
            thumbnail_url: type === 'image' ? url : null,
            file_size: file.size,
            folder: folder || null,
            source: 'upload',
          } as any)
          .select()
          .single();
        if (error) throw error;
        await logActivity(user.id, 'asset_uploaded', { name: file.name, type });
        results.push(data as MediaAsset);
      }
      return results;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['media-assets'] });
      toast({ title: `Uploaded ${res.length} file${res.length === 1 ? '' : 's'}` });
    },
    onError: (e: any) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });
};

export const useDeleteAsset = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (asset: MediaAsset) => {
      if (asset.file_path) {
        await supabase.storage.from(BUCKET).remove([asset.file_path]);
      }
      const { error } = await supabase.from('media_assets').delete().eq('id', asset.id);
      if (error) throw error;
      if (user) await logActivity(user.id, 'asset_deleted', { name: asset.name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-assets'] });
      toast({ title: 'Asset deleted' });
    },
    onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });
};

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: MediaAsset) => {
      const { error } = await supabase
        .from('media_assets')
        .update({ favorite: !asset.favorite })
        .eq('id', asset.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-assets'] }),
  });
};

export const useUpdateAsset = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaAsset> }) => {
      const { error } = await supabase.from('media_assets').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-assets'] });
      toast({ title: 'Updated' });
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });
};
