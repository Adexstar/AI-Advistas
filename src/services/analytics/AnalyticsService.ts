import { supabase } from '@/integrations/supabase/client';
import type { CampaignMetric, UnifiedCampaignAnalytics } from './types';

const db = supabase as any;

export const AnalyticsService = {
  async getMetrics(campaignId: string, days = 30): Promise<CampaignMetric[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await db
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as CampaignMetric[];
  },

  async recordMetric(payload: Partial<CampaignMetric> & { campaign_id: string; user_id: string }) {
    const { data, error } = await db.from('campaign_metrics').insert(payload as any).select().single();
    if (error) throw error;
    return data as CampaignMetric;
  },

  unify(metrics: CampaignMetric[]): UnifiedCampaignAnalytics {
    const totals = metrics.reduce(
      (acc, m) => {
        acc.impressions += m.impressions || 0;
        acc.reach += m.reach || 0;
        acc.clicks += m.clicks || 0;
        acc.conversions += m.conversions || 0;
        acc.spend += Number(m.spend || 0);
        acc.revenue += Number(m.revenue || 0);
        return acc;
      },
      { impressions: 0, reach: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0, ctr: 0, roas: 0, cpa: 0, cpc: 0, conversion_rate: 0 }
    );
    totals.ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.roas = totals.spend ? totals.revenue / totals.spend : 0;
    totals.cpa = totals.conversions ? totals.spend / totals.conversions : 0;
    totals.cpc = totals.clicks ? totals.spend / totals.clicks : 0;
    totals.conversion_rate = totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0;

    const platformMap = new Map<string, any>();
    metrics.forEach((m) => {
      const key = m.platform || 'unknown';
      const cur = platformMap.get(key) || { platform: key, impressions: 0, clicks: 0, ctr: 0, conversions: 0, roas: 0, spend: 0, revenue: 0 };
      cur.impressions += m.impressions;
      cur.clicks += m.clicks;
      cur.conversions += m.conversions;
      cur.spend += Number(m.spend);
      cur.revenue += Number(m.revenue);
      platformMap.set(key, cur);
    });
    const byPlatform = Array.from(platformMap.values()).map((p) => ({
      ...p,
      ctr: p.impressions ? (p.clicks / p.impressions) * 100 : 0,
      roas: p.spend ? p.revenue / p.spend : 0,
    }));

    const timelineMap = new Map<string, any>();
    metrics.forEach((m) => {
      const date = m.recorded_at.slice(0, 10);
      const cur = timelineMap.get(date) || { date, impressions: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0 };
      cur.impressions += m.impressions;
      cur.clicks += m.clicks;
      cur.conversions += m.conversions;
      cur.revenue += Number(m.revenue);
      cur.spend += Number(m.spend);
      timelineMap.set(date, cur);
    });
    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { totals, byPlatform, timeline };
  },
};
