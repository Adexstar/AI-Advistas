import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignMemoryEntry } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignMemoryService = {
  async list(campaignId: string) {
    const { data, error } = await db
      .from('campaign_memory_entries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignMemoryEntry[];
  },

  async record(
    campaignId: string,
    userId: string,
    input: Omit<CampaignMemoryEntry, 'id' | 'campaign_id' | 'user_id' | 'created_at'>,
  ) {
    const { data, error } = await db
      .from('campaign_memory_entries')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        ...input,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignMemoryEntry;
  },

  async recordWin(
    campaignId: string,
    userId: string,
    category: string,
    keyInsight: string,
    winningElements: Record<string, unknown>,
    metricName?: string,
    metricValue?: number,
  ) {
    return this.record(campaignId, userId, {
      memory_type: 'win',
      category,
      key_insight: keyInsight,
      metric_name: metricName ?? null,
      metric_value: metricValue ?? null,
      metric_change: null,
      winning_elements: winningElements,
      failed_elements: {},
      recommendation: null,
    });
  },

  async recordFailure(
    campaignId: string,
    userId: string,
    category: string,
    keyInsight: string,
    failedElements: Record<string, unknown>,
    metricName?: string,
    metricValue?: number,
  ) {
    return this.record(campaignId, userId, {
      memory_type: 'fail',
      category,
      key_insight: keyInsight,
      metric_name: metricName ?? null,
      metric_value: metricValue ?? null,
      metric_change: null,
      winning_elements: {},
      failed_elements: failedElements,
      recommendation: null,
    });
  },

  async recordInsight(
    campaignId: string,
    userId: string,
    category: string,
    keyInsight: string,
    recommendation?: string,
  ) {
    return this.record(campaignId, userId, {
      memory_type: 'insight',
      category,
      key_insight: keyInsight,
      metric_name: null,
      metric_value: null,
      metric_change: null,
      winning_elements: {},
      failed_elements: {},
      recommendation: recommendation ?? null,
    });
  },

  async getCrossCampaignMemory(userId: string, category?: string) {
    let q = db
      .from('campaign_memory_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CampaignMemoryEntry[];
  },

  async compareCampaigns(campaignIds: string[]) {
    if (campaignIds.length === 0) return [];
    const { data, error } = await db
      .from('campaign_memory_entries')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignMemoryEntry[];
  },
};
