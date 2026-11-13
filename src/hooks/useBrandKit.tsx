import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  addAsset,
  addColor,
  addFont,
  applyBrandUpdate,
  emptyBrandWrite,
  readAssets,
  readBrandKit,
  readColors,
  readFonts,
  removeColor,
  type BrandAssetItem,
  type BrandColorItem,
  type BrandFontItem,
  type BrandKitRow,
  type BrandKitView,
} from '@/services/brand/brandKitDocument';

export const BRAND_BUCKET = 'brand-assets';

export type BrandKit = BrandKitView;
export type BrandColor = BrandColorItem;
export type BrandFont = BrandFontItem;
export type BrandAsset = BrandAssetItem;

const sb: any = supabase;

async function loadRow(id: string): Promise<BrandKitRow> {
  const { data, error } = await sb
    .from('brand_kits')
    .select('id,user_id,name,logos,colors,fonts,created_at,updated_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as BrandKitRow;
}

async function saveDocument(id: string, write: { name: string; logos: unknown[]; colors: unknown[]; fonts: unknown[] }) {
  const { error } = await sb.from('brand_kits').update(write).eq('id', id);
  if (error) throw error;
}

export const useBrandKits = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['brand-kits', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await sb
        .from('brand_kits')
        .select('id,user_id,name,logos,colors,fonts,created_at,updated_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as BrandKitRow[]).map(readBrandKit);
    },
  });
};

export const useBrandColors = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-colors', brandId],
    enabled: !!brandId,
    queryFn: async () => readColors(await loadRow(brandId!)),
  });

export const useBrandFonts = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-fonts', brandId],
    enabled: !!brandId,
    queryFn: async () => readFonts(await loadRow(brandId!)),
  });

export const useBrandAssets = (brandId?: string) =>
  useQuery({
    queryKey: ['brand-assets', brandId],
    enabled: !!brandId,
    queryFn: async () => readAssets(await loadRow(brandId!)),
  });

export const useCreateBrandKit = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<BrandKit>) => {
      if (!user) throw new Error('Not authenticated');
      const write = emptyBrandWrite(input.name || 'Untitled brand', input);
      const { data, error } = await sb
        .from('brand_kits')
        .insert({ ...write, user_id: user.id })
        .select('id,user_id,name,logos,colors,fonts,created_at,updated_at')
        .single();
      if (error) throw error;
      return readBrandKit(data as BrandKitRow);
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
      const row = await loadRow(id);
      await saveDocument(id, applyBrandUpdate(row, updates));
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
      qc.invalidateQueries({ queryKey: ['brand-colors', variables.id] });
      qc.invalidateQueries({ queryKey: ['brand-assets', variables.id] });
      toast({ title: 'Saved' });
    },
    onError: (e: any) => toast({ title: 'Could not save brand kit', description: e.message, variant: 'destructive' }),
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
      const row = await loadRow(input.brand_id);
      await saveDocument(input.brand_id, addColor(row, input));
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['brand-colors', v.brand_id] });
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
};

export const useDeleteBrandColor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, brand_id }: { id: string; brand_id: string }) => {
      const row = await loadRow(brand_id);
      await saveDocument(brand_id, removeColor(row, id));
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['brand-colors', v.brand_id] });
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
    },
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
      const row = await loadRow(input.brand_id);
      await saveDocument(input.brand_id, addAsset(row, input));
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['brand-assets', v.brand_id] });
      qc.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
};

export const useAddBrandFont = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { brand_id: string; name: string; role: string; font_url?: string; font_type?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const row = await loadRow(input.brand_id);
      await saveDocument(input.brand_id, addFont(row, input));
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
