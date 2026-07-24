import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import type { CampaignMetric } from './types';

export const CampaignAnalyticsService = {
  async getMetrics(campaignId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as CampaignMetric[];
  },

  async recordMetric(campaignId: string, userId: string, metric: Omit<CampaignMetric, 'id' | 'campaign_id' | 'user_id' | 'recorded_at'>) {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        ...metric,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as CampaignMetric;
  },

  async getAggregates(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as CampaignMetric | null;
  },

  async getPerformanceSummary(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('impressions, clicks, conversions, spend, revenue, ctr, roas')
      .eq('campaign_id', campaignId)
      .order('recorded_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    const metrics = (data ?? []) as Pick<CampaignMetric, 'impressions' | 'clicks' | 'conversions' | 'spend' | 'revenue' | 'ctr' | 'roas'>[];
    if (metrics.length === 0) return null;
    return {
      total_impressions: metrics.reduce((s, m) => s + m.impressions, 0),
      total_clicks: metrics.reduce((s, m) => s + m.clicks, 0),
      total_conversions: metrics.reduce((s, m) => s + m.conversions, 0),
      total_spend: metrics.reduce((s, m) => s + Number(m.spend), 0),
      total_revenue: metrics.reduce((s, m) => s + Number(m.revenue), 0),
      avg_ctr: metrics.length > 0 ? metrics.reduce((s, m) => s + Number(m.ctr), 0) / metrics.length : 0,
      avg_roas: metrics.length > 0 ? metrics.reduce((s, m) => s + Number(m.roas), 0) / metrics.length : 0,
    };
  },

  async getTrend(campaignId: string, metric: 'ctr' | 'roas' | 'cpc' | 'cpa' | 'spend', days = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select(`recorded_at, ${metric}`)
      .eq('campaign_id', campaignId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((d: any) => ({
      date: d.recorded_at,
      value: Number(d[metric]),
    }));
  },
};
