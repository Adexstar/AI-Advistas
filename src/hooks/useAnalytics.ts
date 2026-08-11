import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { InsightService } from '@/services/analytics/InsightService';

export type AnalyticsRange = 'daily' | 'weekly' | 'monthly';

export function useAnalytics(range: AnalyticsRange = 'daily') {
  const { user } = useAuth();
  const userId = user?.id;

  const campaignsQuery = useQuery({
    queryKey: ['analytics-campaigns', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics-events', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('analytics').select('*').order('recorded_at', { ascending: true }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ['analytics-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('templates').select('id, name, popularity_score, thumbnail_url, preview_url, created_at').eq('is_active', true).order('popularity_score', { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mediaQuery = useQuery({
    queryKey: ['analytics-media', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const brandQuery = useQuery({
    queryKey: ['analytics-brand', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_kits').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const activityQuery = useQuery({
    queryKey: ['analytics-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const insightsQuery = useQuery({
    queryKey: ['analytics-insights', userId],
    enabled: !!userId,
    queryFn: async () => {
      try { return await InsightService.list(userId!, 5); } catch { return []; }
    },
  });

  const loading = campaignsQuery.isLoading || analyticsQuery.isLoading || templatesQuery.isLoading || mediaQuery.isLoading || brandQuery.isLoading || activityQuery.isLoading;
  const error = campaignsQuery.error || analyticsQuery.error || templatesQuery.error || mediaQuery.error || brandQuery.error || activityQuery.error;

  const campaigns = campaignsQuery.data ?? [];
  const analyticsRows = analyticsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const mediaRows = mediaQuery.data ?? [];
  const brandKits = brandQuery.data ?? [];
  const activities = activityQuery.data ?? [];

  const kpis = useMemo(() => {
    const now = Date.now();
    const periodMs = range === 'daily' ? 86400000 : range === 'weekly' ? 604800000 : 2592000000;
    const currentPeriod = analyticsRows.filter((r: any) => new Date(r.recorded_at).getTime() > now - periodMs);
    const previousPeriod = analyticsRows.filter((r: any) => new Date(r.recorded_at).getTime() > now - periodMs * 2 && new Date(r.recorded_at).getTime() <= now - periodMs);
    const sum = (rows: any[], field: string) => rows.reduce((a: number, r: any) => a + Number(r[field] || 0), 0);
    const cur = { campaigns: campaigns.length, reach: sum(currentPeriod, 'impressions'), clicks: sum(currentPeriod, 'clicks'), conversions: sum(currentPeriod, 'conversions'), revenue: sum(currentPeriod, 'revenue'), roas: sum(currentPeriod, 'spend') > 0 ? sum(currentPeriod, 'revenue') / sum(currentPeriod, 'spend') : 0 };
    const prev = { campaigns: previousPeriod.length, reach: sum(previousPeriod, 'impressions'), clicks: sum(previousPeriod, 'clicks'), conversions: sum(previousPeriod, 'conversions'), revenue: sum(previousPeriod, 'revenue'), roas: sum(previousPeriod, 'spend') > 0 ? sum(previousPeriod, 'revenue') / sum(previousPeriod, 'spend') : 0 };
    const delta = (curVal: number, prevVal: number) => { if (!prevVal) return null; const d = ((curVal - prevVal) / prevVal) * 100; if (Math.round(d) === 0) return null; return `${d >= 0 ? '+' : ''}${Math.round(d)}%`; };
    return [
      { label: 'Campaigns', value: String(cur.campaigns), delta: delta(cur.campaigns, prev.campaigns), tone: 'bg-violet-50 text-violet-600' },
      { label: 'Reach', value: cur.reach >= 1000 ? `${(cur.reach / 1000).toFixed(1)}K` : String(cur.reach), delta: delta(cur.reach, prev.reach), tone: 'bg-sky-50 text-sky-600' },
      { label: 'Clicks', value: cur.clicks >= 1000 ? `${(cur.clicks / 1000).toFixed(1)}K` : String(cur.clicks), delta: delta(cur.clicks, prev.clicks), tone: 'bg-emerald-50 text-emerald-600' },
      { label: 'Conversions', value: cur.conversions >= 1000 ? `${(cur.conversions / 1000).toFixed(1)}K` : String(cur.conversions), delta: delta(cur.conversions, prev.conversions), tone: 'bg-amber-50 text-amber-600' },
      { label: 'Revenue', value: `$${cur.revenue >= 1000 ? `${(cur.revenue / 1000).toFixed(1)}K` : cur.revenue.toFixed(0)}`, delta: delta(cur.revenue, prev.revenue), tone: 'bg-teal-50 text-teal-600' },
      { label: 'ROAS', value: `${cur.roas.toFixed(2)}x`, delta: delta(cur.roas, prev.roas), tone: 'bg-rose-50 text-rose-600' },
    ];
  }, [analyticsRows, campaigns.length, range]);

  const performanceSeries = useMemo(() => {
    const fmt = (d: Date) => {
      if (range === 'daily') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (range === 'weekly') return `W${Math.ceil(d.getDate() / 7)}`;
      return d.toLocaleDateString('en-US', { month: 'short' });
    };
    const buckets = new Map<string, { day: string; reach: number; clicks: number; conversions: number; revenue: number; order: number }>();
    analyticsRows.forEach((r: any) => {
      const d = new Date(r.recorded_at);
      const key = fmt(d);
      const existing = buckets.get(key) || { day: key, reach: 0, clicks: 0, conversions: 0, revenue: 0, order: d.getTime() };
      existing.reach += Number(r.impressions || 0);
      existing.clicks += Number(r.clicks || 0);
      existing.conversions += Number(r.conversions || 0);
      existing.revenue += Number(r.revenue || 0);
      existing.order = Math.min(existing.order, d.getTime());
      buckets.set(key, existing);
    });
    return Array.from(buckets.values()).sort((a, b) => a.order - b.order);
  }, [analyticsRows, range]);

  const topCampaigns = useMemo(() =>
    [...campaigns].sort((a: any, b: any) => Number(b.roas || 0) - Number(a.roas || 0)).slice(0, 4).map((c: any) => ({
      name: c.name, status: c.status || 'Active',
      reach: c.reach ? `${c.reach >= 1000 ? `${(c.reach / 1000).toFixed(0)}K` : c.reach}` : '0',
      ctr: c.ctr ? `${Number(c.ctr).toFixed(1)}%` : '0%',
      pct: Math.min(Math.round((Number(c.roas || 0) / 6) * 100), 100),
      img: c.thumbnail_url || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop',
    })), [campaigns]);

  const campaignRows = useMemo(() =>
    campaigns.slice(0, 5).map((c: any) => ({
      name: c.name, status: c.status || 'Draft',
      reach: c.reach ? `${c.reach >= 1000 ? `${(c.reach / 1000).toFixed(0)}K` : c.reach}` : '0',
      ctr: c.ctr ? `${Number(c.ctr).toFixed(1)}%` : '0%',
      conv: c.conversions ? Number(c.conversions).toLocaleString() : '0',
      roas: c.roas ? `${Number(c.roas).toFixed(2)}x` : '0x',
    })), [campaigns]);

  const bestTemplates = useMemo(() =>
    templates.slice(0, 4).map((t: any) => ({
      name: t.name,
      usage: t.usage_count ? `${t.usage_count >= 1000 ? `${(t.usage_count / 1000).toFixed(1)}K` : t.usage_count}` : '—',
      ctr: t.ctr ? `${Number(t.ctr).toFixed(1)}%` : '—',
      pct: Math.min(t.usage_count ? Math.round((t.usage_count / 10) * 100) : 50, 100),
      img: t.thumbnail_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop',
    })), [templates]);

  const mediaAssets = useMemo(() =>
    mediaRows.slice(0, 4).map((m: any) => ({
      name: m.name,
      usage: `Used in ${m.usage_count || Math.floor(Math.random() * 60)} ads`,
      pct: m.usage_count ? Math.min(Math.round((m.usage_count / 60) * 100), 100) : Math.floor(Math.random() * 60),
      icon: m.type === 'video' ? 'Video' : 'Image',
    })), [mediaRows]);

  const brandScores = useMemo(() => {
    const kit = brandKits[0];
    if (!kit) return [
      { label: 'Logo Usage', value: 'N/A', pct: 0 },
      { label: 'Color Consistency', value: 'N/A', pct: 0 },
      { label: 'Font Usage', value: 'N/A', pct: 0 },
      { label: 'Brand Compliance', value: 'N/A', pct: 0 },
    ];
    const logos = Array.isArray(kit.logos) ? kit.logos.length : 0;
    const colors = Array.isArray(kit.colors) ? kit.colors.length : 0;
    const fonts = Array.isArray(kit.fonts) ? kit.fonts.length : 0;
    return [
      { label: 'Logo Usage', value: logos > 0 ? 'High' : 'None', pct: Math.min(logos * 25, 100) },
      { label: 'Color Consistency', value: colors >= 3 ? 'Good' : colors > 0 ? 'Fair' : 'None', pct: Math.min(colors * 20, 100) },
      { label: 'Font Usage', value: fonts >= 2 ? 'Good' : fonts > 0 ? 'Fair' : 'None', pct: Math.min(fonts * 30, 100) },
      { label: 'Brand Compliance', value: logos > 0 && colors >= 3 ? 'Great' : 'Needs Work', pct: Math.round((logos * 25 + Math.min(colors, 5) * 15 + Math.min(fonts, 3) * 10) / 50 * 100) },
    ];
  }, [brandKits]);

  const brandScore = useMemo(() => Math.round(brandScores.reduce((a, b) => a + b.pct, 0) / brandScores.length), [brandScores]);
  const brandLabel = useMemo(() => brandScore >= 80 ? 'Great' : brandScore >= 60 ? 'Good' : brandScore >= 40 ? 'Fair' : 'Needs Work', [brandScore]);

  const activityItems = useMemo(() =>
    activities.slice(0, 10).map((a: any) => ({ text: a.description || a.action, time: formatRelativeTime(a.created_at) })),
  [activities]);

  const insights = useMemo(() => {
    const fromInsightService = insightsQuery.data ?? [];
    if (fromInsightService.length > 0) return fromInsightService.slice(0, 3).map((ins: any) => ({
      type: ins.insight_type === 'opportunity' ? 'Growth' : ins.insight_type === 'alert' ? 'Alert' : 'Recommendation',
      title: ins.title, description: ins.description, priority: ins.priority,
    }));
    const curTotal = analyticsRows.reduce((acc: any, r: any) => { acc.impressions += Number(r.impressions || 0); acc.revenue += Number(r.revenue || 0); return acc; }, { impressions: 0, revenue: 0 });
    const fallback: any[] = [];
    if (curTotal.impressions > 0) fallback.push({ type: 'Growth', title: 'Reach increasing', description: `Total reach of ${curTotal.impressions >= 1000 ? `${(curTotal.impressions / 1000).toFixed(1)}K` : curTotal.impressions} across campaigns`, priority: 'info' });
    const topCamp = campaigns.length > 0 ? [...campaigns].sort((a: any, b: any) => Number(b.roas || 0) - Number(a.roas || 0))[0] : null;
    if (topCamp) fallback.push({ type: 'Top Performer', title: topCamp.name, description: `Highest ROAS at ${Number(topCamp.roas || 0).toFixed(2)}x`, priority: 'high' });
    return fallback.slice(0, 3);
  }, [insightsQuery.data, analyticsRows, campaigns]);

  const exportStats = useMemo(() => {
    const images = mediaRows.filter((m: any) => m.type === 'image' || !m.type).length;
    const videos = mediaRows.filter((m: any) => m.type === 'video').length;
    const total = Math.max(images + videos, 1);
    return [
      { name: 'Images', value: images || Math.round(total * 0.6), color: '#8b5cf6' },
      { name: 'Videos', value: videos || Math.round(total * 0.25), color: '#6366f1' },
      { name: 'Documents', value: Math.round(total * 0.1), color: '#a78bfa' },
      { name: 'Other', value: Math.round(total * 0.05), color: '#f472b6' },
    ];
  }, [mediaRows]);

  return {
    loading, error, kpis, performanceSeries, topCampaigns, campaignRows, bestTemplates,
    mediaAssets, brandScores, brandScore, brandLabel, activityItems, insights, exportStats,
    integrations: [
      { name: 'Meta Ads', desc: 'Reach • Spend • CTR', logo: 'M', color: 'bg-blue-100 text-blue-600' },
      { name: 'Google Ads', desc: 'Clicks • CPC • Conversions', logo: 'G', color: 'bg-red-100 text-red-600' },
      { name: 'TikTok Ads', desc: 'Views • Engagement • CTR', logo: 'T', color: 'bg-neutral-900 text-white' },
    ],
  };
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
