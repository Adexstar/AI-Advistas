import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignEvent, CampaignEventType } from './types';

export const CampaignEventService = {
  async list(campaignId: string, limit = 50) {
    const { data, error } = await supabase.from('activity_logs').select('*').eq('entity_id', campaignId).eq('entity_type', 'campaign').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map(row => ({ id: row.id, campaign_id: campaignId, user_id: row.user_id, event_type: row.action,
      event_label: (row.metadata as any)?.label ?? row.action, description: row.description, metadata: row.metadata as Record<string, unknown>,
      actor: (row.metadata as any)?.actor ?? 'user', created_at: row.created_at })) as CampaignEvent[];
  },

  async log(
    campaignId: string,
    userId: string,
    eventType: CampaignEventType,
    eventLabel?: string,
    description?: string,
    metadata?: Record<string, unknown>,
    actor = 'user',
  ) {
    const { data, error } = await supabase.from('activity_logs').insert({ user_id: userId, action: eventType,
      entity_type: 'campaign', entity_id: campaignId, description: description ?? eventLabel ?? null,
      metadata: { ...metadata, label: eventLabel, actor } }).select().single();
    if (error) throw error;
    return data;
  },

  async getTimeline(campaignId: string) {
    const events = await this.list(campaignId, 100);
    return events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
};
