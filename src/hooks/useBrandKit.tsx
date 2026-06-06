import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const BRAND_BUCKET = 'brand-assets';

export type BrandKit = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  cover_image_url: string | null;
  brand_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type BrandColor = { id: string; brand_id: string; name: string | null; hex: string; rgb: string | null; is_primary: boolean };
export type BrandFont = { id: string; brand_id: string; name: string; font_url: string | null; font_type: string | null; role: string | null };
export type BrandAsset = { id: string; brand_id: string; name: string | null; asset_url: string; asset_type: string | null };

const sb: any = supabase;

export const useBrandKits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['brand-kits', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await sb.from('brand_kits').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BrandKit[];
    },
  });
};

export const useBrandColors = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-colors', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await sb.from('brand_colors').select('*').eq('brand_id', brandId).order('created_at');
      if (error) throw error;
      return (data || []) as BrandColor[];
    },
  });

export const useBrandFonts = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-fonts', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await sb.from('brand_fonts').select('*').eq('brand_id', brandId).order('created_at');
      if (error) throw error;
      return (data || []) as BrandFont[];
    },
  });

export const useBrandAssets = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-assets', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await sb.from('brand_assets').select('*').eq('brand_id', brandId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BrandAsset[];
    },
  });

export const useCreateBrandKit = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<BrandKit>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await sb
        .from('brand_kits')
        .insert({ ...input, user_id: user.id, brand_score: 40 })
        .select()
        .single();
      if (error) throw error;
      return data as BrandKit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
      toast({ title: 'Brand kit created' });
    },
    onError: (e: any) => toast({ title: 'Could not create', description: e.message, variant: 'destructive' }),
  });
};

export const useUpdateBrandKit = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BrandKit> }) => {
      const { error } = await sb.from('brand_kits').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
      toast({ title: 'Saved' });
    },
  });
};

export const useDeleteBrandKit = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('brand_kits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
      toast({ title: 'Brand deleted' });
    },
  });
};

export const useAddBrandColor = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { brand_id: string; hex: string; name?: string; is_primary?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await sb.from('brand_colors').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['brand-colors', v.brand_id] }),
  });
};

export const useDeleteBrandColor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; brand_id: string }) => {
      const { error } = await sb.from('brand_colors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['brand-colors', v.brand_id] }),
  });
};

export const useUploadBrandFile = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, prefix }: { file: File; prefix: string }) => {
      if (!user) throw new Error('Not authenticated');
      const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${prefix}/${Date.now()}-${clean}`;
      const { error } = await supabase.storage.from(BRAND_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(path);
      return { url: pub.publicUrl, path };
    },
  });
};

export const useAddBrandAsset = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { brand_id: string; asset_url: string; asset_type: string; name?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await sb.from('brand_assets').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['brand-assets', v.brand_id] }),
  });
};

export const useAddBrandFont = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { brand_id: string; name: string; role: string; font_url?: string; font_type?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await sb.from('brand_fonts').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['brand-fonts', v.brand_id] }),
  });
};

export const computeBrandScore = (k: {
  logo_url?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  industry?: string | null;
  colors: number;
  fonts: number;
  assets: number;
}) => {
  let s = 0;
  if (k.logo_url) s += 20;
  if (k.cover_image_url) s += 10;
  if (k.description) s += 10;
  if (k.industry) s += 10;
  s += Math.min(20, k.colors * 5);
  s += Math.min(15, k.fonts * 5);
  s += Math.min(15, k.assets * 3);
  return Math.min(100, s);
};
