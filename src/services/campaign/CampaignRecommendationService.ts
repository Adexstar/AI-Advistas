import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignRecommendation } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignRecommendationService = {
  async list(campaignId: string, status?: string) {
    let q = db
      .from('campaign_recommendations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CampaignRecommendation[];
  },

  async create(
    campaignId: string,
    userId: string,
    input: Omit<CampaignRecommendation, 'id' | 'campaign_id' | 'user_id' | 'status' | 'dismissed_at' | 'applied_at' | 'created_at'>,
  ) {
    const { data, error } = await db
      .from('campaign_recommendations')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        ...input,
        status: 'pending',
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignRecommendation;
  },

  async accept(id: string, campaignId: string, userId: string) {
    const { error } = await db
      .from('campaign_recommendations')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (error) throw error;
  },

  async dismiss(id: string) {
    const { error } = await db
      .from('campaign_recommendations')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async apply(id: string, campaignId: string, userId: string) {
    const { error } = await db
      .from('campaign_recommendations')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    const rec = await this.get(id);
    await CampaignEventService.log(campaignId, userId, 'recommendation_applied', `Applied: ${rec.title}`, rec.description ?? undefined);
  },

  async get(id: string) {
    const { data, error } = await db
      .from('campaign_recommendations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as CampaignRecommendation;
  },

  async getPendingCount(campaignId: string) {
    const { count, error } = await db
      .from('campaign_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    if (error) throw error;
    return count ?? 0;
  },
};
