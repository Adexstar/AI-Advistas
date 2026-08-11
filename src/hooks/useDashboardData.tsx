import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Range = 'daily' | 'weekly' | 'monthly';

export interface CampaignRow {
  id: string;
  name: string;
  status: string;
  reach: number;
  clicks: number;
  ctr: number;
  roas: number;
  created_at: string;
}

export interface AnalyticsRow {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  recorded_at: string;
}

export interface TemplateRow {
  id: string;
  name: string;
  usage_count?: number;
  popularity_score?: number | null;
  thumbnail_url: string | null;
  preview_url?: string | null;
  created_at: string;
}

export interface MediaRow {
  id: string;
  name: string;
  type: string;
  file_size: number;
  created_at: string;
}

export interface BrandKitRow {
  id: string;
  name: string;
  logos: unknown[];
  colors: unknown[];
  fonts: unknown[];
}

export interface ActivityRow {
  id: string;
  action: string;
  description: string | null;
  entity_type: string | null;
  created_at: string;
}

// Storage cap per user (5 GB)
export const STORAGE_CAP_BYTES = 5 * 1024 * 1024 * 1024;

const groupAnalytics = (rows: AnalyticsRow[], range: Range) => {
  const fmt = (d: Date) => {
    if (range === 'daily') {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    if (range === 'weekly') {
      const week = Math.ceil(d.getDate() / 7);
      return `W${week}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short' });
  };

  const buckets = new Map<string, { name: string; reach: number; clicks: number; conversions: number; revenue: number; order: number }>();
  rows.forEach((r) => {
    const d = new Date(r.recorded_at);
    const key = fmt(d);
    const existing = buckets.get(key);
    const order = d.getTime();
    if (existing) {
      existing.reach += r.impressions;
      existing.clicks += r.clicks;
      existing.conversions += r.conversions;
      existing.revenue += Number(r.revenue);
      existing.order = Math.min(existing.order, order);
    } else {
      buckets.set(key, {
        name: key,
        reach: r.impressions,
        clicks: r.clicks,
        conversions: r.conversions,
        revenue: Number(r.revenue),
        order,
      });
    }
  });
  return Array.from(buckets.values()).sort((a, b) => a.order - b.order);
};

export const useDashboardData = (range: Range = 'daily') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const campaigns = useQuery({
    queryKey: ['dash-campaigns', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CampaignRow[];
    },
  });

  const analytics = useQuery({
    queryKey: ['dash-analytics', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('recorded_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
  });

  const templates = useQuery({
    queryKey: ['dash-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, popularity_score, thumbnail_url, preview_url, created_at')
        .order('popularity_score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as TemplateRow[];
    },
  });

  const media = useQuery({
    queryKey: ['dash-media', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });

  const brandKits = useQuery({
    queryKey: ['dash-brand-kits', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*');
      if (error) throw error;
      return (data ?? []) as unknown as BrandKitRow[];
    },
  });

  const activity = useQuery({
    queryKey: ['dash-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['dash-campaigns', userId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['dash-analytics', userId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_assets', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['dash-media', userId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_kits', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['dash-brand-kits', userId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['dash-activity', userId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_templates' },
        () => queryClient.invalidateQueries({ queryKey: ['dash-templates'] }))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Derived KPIs
  const analyticsRows = analytics.data ?? [];
  const campaignRows = campaigns.data ?? [];
  const mediaRows = media.data ?? [];
  const brandKitRows = brandKits.data ?? [];

  const totals = {
    campaigns: campaignRows.length,
    reach: analyticsRows.reduce((a, r) => a + (r.impressions || 0), 0),
    clicks: analyticsRows.reduce((a, r) => a + (r.clicks || 0), 0),
    conversions: analyticsRows.reduce((a, r) => a + (r.conversions || 0), 0),
    revenue: analyticsRows.reduce((a, r) => a + Number(r.revenue || 0), 0),
    roas: analyticsRows.length
      ? analyticsRows.reduce((a, r) => a + Number(r.roas || 0), 0) / analyticsRows.length
      : 0,
  };

  const storageUsed = mediaRows.reduce((a, m) => a + (m.file_size || 0), 0);
  const imageCount = mediaRows.filter((m) => m.type === 'image').length;
  const videoCount = mediaRows.filter((m) => m.type === 'video').length;

  const performanceSeries = groupAnalytics(analyticsRows, range);

  const topCampaigns = [...campaignRows]
    .sort((a, b) => Number(b.roas) - Number(a.roas))
    .slice(0, 5);

  const brandKit = brandKitRows[0];
  const brandCounts = {
    logos: brandKit ? (Array.isArray(brandKit.logos) ? brandKit.logos.length : 0) : 0,
    colors: brandKit ? (Array.isArray(brandKit.colors) ? brandKit.colors.length : 0) : 0,
    fonts: brandKit ? (Array.isArray(brandKit.fonts) ? brandKit.fonts.length : 0) : 0,
  };

  const loading =
    campaigns.isLoading || analytics.isLoading || templates.isLoading || media.isLoading || brandKits.isLoading || activity.isLoading;

  const error =
    campaigns.error || analytics.error || templates.error || media.error || brandKits.error || activity.error;

  const refetchAll = () => {
    campaigns.refetch();
    analytics.refetch();
    templates.refetch();
    media.refetch();
    brandKits.refetch();
    activity.refetch();
  };

  return {
    loading,
    error,
    refetchAll,
    totals,
    performanceSeries,
    campaigns: campaignRows,
    topCampaigns,
    templates: templates.data ?? [],
    media: mediaRows,
    imageCount,
    videoCount,
    storageUsed,
    brandKit,
    brandCounts,
    activity: activity.data ?? [],
  };
};
