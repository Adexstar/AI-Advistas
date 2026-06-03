import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export const CAMPAIGN_OBJECTIVES = ['awareness', 'traffic', 'leads', 'sales', 'engagement'] as const;
export const CAMPAIGN_PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'Google', 'LinkedIn'] as const;

async function logActivity(userId: string, action: string, description: string, entityId?: string) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    description,
    entity_type: 'campaign',
    entity_id: entityId ?? null,
    metadata: {},
  });
}

export function useCampaigns(opts?: { includeArchived?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['campaigns', userId, opts?.includeArchived ?? false],
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (!opts?.includeArchived) q = q.eq('archived', false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CampaignRow[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`campaigns-live-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['campaigns'] });
          qc.invalidateQueries({ queryKey: ['dash-campaigns', userId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  return query;
}

export function useCreateCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CampaignInsert, 'user_id'>) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity(user.id, 'campaign_created', `Created campaign "${data.name}"`, data.id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CampaignUpdate }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (user) await logActivity(user.id, 'campaign_updated', `Updated campaign "${data.name}"`, id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDuplicateCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: CampaignRow) => {
      if (!user) throw new Error('Not signed in');
      const { id, created_at, updated_at, impressions, clicks, conversions, revenue, reach, spend, ctr, roas, ...rest } = campaign;
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...rest, name: `${campaign.name} (Copy)`, status: 'draft', user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity(user.id, 'campaign_duplicated', `Duplicated "${campaign.name}"`, data.id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: CampaignRow) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', campaign.id);
      if (error) throw error;
      if (user) await logActivity(user.id, 'campaign_deleted', `Deleted "${campaign.name}"`, campaign.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
