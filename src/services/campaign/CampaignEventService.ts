import { supabase } from '@/integrations/supabase/client';
import type { CampaignEvent, CampaignEventType } from './types';

export const CampaignEventService = {
  async list(campaignId: string, limit = 50) {
    const { data, error } = await supabase
      .from('campaign_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as CampaignEvent[];
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
    const { data, error } = await supabase.rpc('log_campaign_event', {
      p_campaign_id: campaignId,
      p_user_id: userId,
      p_event_type: eventType,
      p_event_label: eventLabel ?? null,
      p_description: description ?? null,
      p_metadata: (metadata ?? {}) as any,
      p_actor: actor,
    });
    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('campaign_events')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          event_type: eventType,
          event_label: eventLabel ?? null,
          description: description ?? null,
          metadata: (metadata ?? {}) as any,
          actor,
        })
        .select()
        .single();
      if (fallbackError) throw fallbackError;
      return fallback;
    }
    return data;
  },

  async getTimeline(campaignId: string) {
    const events = await this.list(campaignId, 100);
    return events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
};
