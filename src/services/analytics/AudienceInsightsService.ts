import { supabase } from '@/integrations/supabase/client';
import type { AudienceMetric } from './types';

const db = supabase as any;

export const AudienceInsightsService = {
  async list(campaignId: string): Promise<AudienceMetric[]> {
    const { data, error } = await db
      .from('audience_metrics')
      .select('*')
      .eq('campaign_id', campaignId);
    if (error) throw error;
    return (data ?? []) as AudienceMetric[];
  },

  bestSegment(metrics: AudienceMetric[]) {
    if (!metrics.length) return null;
    return [...metrics].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];
  },

  groupBy(metrics: AudienceMetric[], type: string) {
    return metrics.filter((m) => m.segment_type === type);
  },
};
