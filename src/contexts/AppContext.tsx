// Compatibility facade: canonical campaign/creative data is owned by React Query.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCampaigns, type CampaignRow } from '@/hooks/useCampaigns';
import { CampaignService } from '@/services/campaign/CampaignService';
import { CreativeService } from '@/services/creative/CreativeService';
import type { Json } from '@/integrations/supabase/types';

// Types
export type BudgetPeriod = 'daily' | 'total';
export type AudienceMode = 'advantage_plus' | 'manual';
export type AudienceGender = 'all' | 'male' | 'female';

export interface CampaignDraftSettings {
  budget: number;
  budgetPeriod: BudgetPeriod;
  startDate: string;
  endDate?: string;
  runContinuously: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  platform: string[];
  budget: number;
  budgetPeriod?: BudgetPeriod;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions?: number;
  cpa?: number;
  cpc?: number;
  roas?: number;
  revenue?: number;
  startDate: string;
  endDate?: string;
  runContinuously?: boolean;
  createdAt: string;
  adContent?: AdContent;
}

export interface Ad {
  id: string;
  name: string;
  campaignId: string;
  status: 'active' | 'paused' | 'draft';
  format: 'image' | 'video' | 'carousel';
  impressions: number;
  clicks: number;
  ctr: number;
  content: AdContent;
  createdAt: string;
}

export interface AdContent {
  product: string;
  details: string;
  websiteUrl: string;
  adType: 'image' | 'video' | 'carousel';
  platforms: string[];
  audience: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  headline?: string;
  description?: string;
  cta?: string;
  placementOptions?: Record<string, string[]>;
  simpleAudience?: string;
  audienceMode?: AudienceMode;
  ageRange?: {
    min: number;
    max: number;
  };
  locations?: string[];
  interests?: string[];
  gender?: AudienceGender;
  suggestedHeadlines?: string[];
  aiGenerated?: boolean;
  aiMetadata?: {
    suggestedHeadlines?: string[];
    suggestedCTA?: string;
    confidence?: number;
  };
}

export interface AppState {
  campaigns: Campaign[];
  ads: Ad[];
  selectedCampaign: Campaign | null;
  selectedAd: Ad | null;
  isLoading: boolean;
  activeMetric: 'impressions' | 'clicks' | 'ctr' | 'conversions';
  timeRange: '7days' | '30days' | '90days';
}


function campaignView(row: CampaignRow): Campaign {
  return { id: row.id, name: row.name, status: row.status as Campaign['status'], platform: row.platform?.split(',') ?? [],
    budget: row.budget, spent: row.spend, impressions: row.impressions, clicks: row.clicks, ctr: row.ctr,
    conversions: row.conversions, revenue: row.revenue, roas: row.roas,
    startDate: row.start_date ?? '', endDate: row.end_date ?? undefined, createdAt: row.created_at };
}
function campaignPayload(input: Partial<Campaign>) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.platform !== undefined ? { platform: input.platform.join(',') } : {}),
    ...(input.budget !== undefined ? { budget: input.budget } : {}),
    ...(input.startDate !== undefined ? { start_date: input.startDate || null } : {}),
    ...(input.endDate !== undefined ? { end_date: input.endDate || null } : {}),
  };
}
const AppContext = createContext<ReturnType<typeof useCanonicalApp> | null>(null);
function useCanonicalApp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const campaigns = useCampaigns();
  const creatives = useQuery({ queryKey: ['creatives', user?.id], enabled: !!user, queryFn: () => {
    if (!user) throw new Error('Not signed in');
    return CreativeService.list(user.id);
  } });
  const [selectedCampaign, selectCampaign] = useState<Campaign | null>(null);
  const [selectedAd, selectAd] = useState<Ad | null>(null);
  const [activeMetric, setActiveMetric] = useState<AppState['activeMetric']>('impressions');
  const [timeRange, setTimeRange] = useState<AppState['timeRange']>('30days');
  const refresh = () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); qc.invalidateQueries({ queryKey: ['creatives'] }); };
  const requireUser = () => { if (!user) throw new Error('Not signed in'); return user.id; };
  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const { error } = await supabase.from('campaigns').update(campaignPayload(updates)).eq('id', id).eq('user_id', requireUser());
    if (error) throw error;
    refresh();
  };
  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id).eq('user_id', requireUser());
    if (error) throw error;
    refresh();
  };
  const state: AppState = {
    campaigns: (campaigns.data ?? []).map(campaignView),
    ads: (creatives.data ?? []).map(row => ({ id: row.id, name: row.name, campaignId: row.campaign_id ?? '',
      status: row.status as Ad['status'], format: 'image', impressions: 0, clicks: 0, ctr: 0,
      content: row.content as unknown as AdContent, createdAt: row.created_at })),
    selectedCampaign, selectedAd, activeMetric, timeRange, isLoading: campaigns.isLoading || creatives.isLoading,
  };
  const actions = {
    createCampaign: async (input: Omit<Campaign, 'id' | 'createdAt'>) => {
      const userId = requireUser();
      const { data, error } = await supabase.from('campaigns').insert({ ...campaignPayload(input), name: input.name, user_id: userId }).select().single();
      if (error) throw error;
      if (input.adContent) await CreativeService.save(userId, { campaign_id: data.id, name: input.name, content: input.adContent as unknown as Json });
      refresh();
    },
    updateCampaign, deleteCampaign,
    bulkUpdateCampaigns: async (ids: string[], updates: Partial<Campaign>) => { await Promise.all(ids.map(id => updateCampaign(id, updates))); },
    bulkDeleteCampaigns: async (ids: string[]) => { await Promise.all(ids.map(deleteCampaign)); },
    duplicateCampaigns: async (ids: string[]) => {
      for (const id of ids) { const source = campaigns.data?.find(row => row.id === id); if (source) await CampaignService.duplicate(requireUser(), source); }
      refresh();
    },
    createAd: async (input: Omit<Ad, 'id' | 'createdAt'>) => {
      await CreativeService.save(requireUser(), { name: input.name, campaign_id: input.campaignId || null, content: input.content as unknown as Json, status: input.status }); refresh();
    },
    updateAd: async (id: string, updates: Partial<Ad>) => {
      await CreativeService.save(requireUser(), { ...(updates.name ? { name: updates.name } : {}), ...(updates.status ? { status: updates.status } : {}), ...(updates.content ? { content: updates.content as unknown as Json } : {}) }, id); refresh();
    },
    deleteAd: async (id: string) => { const { error } = await supabase.from('ads').delete().eq('id', id).eq('user_id', requireUser()); if (error) throw error; refresh(); },
    selectCampaign, selectAd, setActiveMetric, setTimeRange,
    toggleCampaignStatus: async (id: string) => updateCampaign(id, { status: state.campaigns.find(c => c.id === id)?.status === 'active' ? 'paused' : 'active' }),
    toggleAdStatus: async (id: string) => { const row = state.ads.find(a => a.id === id); await CreativeService.save(requireUser(), { status: row?.status === 'active' ? 'paused' : 'active' }, id); refresh(); },
  };
  return { state, actions };
}
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const value = useCanonicalApp();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useApp = () => { const value = useContext(AppContext); if (!value) throw new Error('useApp must be used within AppProvider'); return value; };
