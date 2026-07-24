import { supabase } from '@/integrations/supabase/client';
import type { CreativeMetric } from './types';

const db = supabase as any;

export const CreativePerformanceService = {
  async list(campaignId: string): Promise<CreativeMetric[]> {
    const { data, error } = await db
      .from('creative_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('score', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CreativeMetric[];
  },

  scoreCreative(m: Pick<CreativeMetric, 'ctr' | 'conversions' | 'impressions'>): number {
    const ctrScore = Math.min(m.ctr * 10, 60);
    const convScore = m.impressions ? Math.min((m.conversions / m.impressions) * 1000, 40) : 0;
    return Math.round(ctrScore + convScore);
  },
};
