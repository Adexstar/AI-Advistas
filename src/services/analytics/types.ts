export interface CampaignMetric {
  id: string;
  campaign_id: string;
  user_id: string;
  platform: string | null;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversion_rate: number;
  cpa: number;
  spend: number;
  revenue: number;
  roas: number;
  raw_data: Record<string, unknown>;
  recorded_at: string;
  created_at: string;
}

export interface CreativeMetric {
  id: string;
  campaign_id: string;
  user_id: string;
  creative_id: string | null;
  creative_type: string | null;
  creative_name: string | null;
  thumbnail_url: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  score: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface AudienceMetric {
  id: string;
  campaign_id: string;
  user_id: string;
  segment_type: string;
  segment_value: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  spend: number;
  revenue: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface AIRecommendation {
  id: string;
  campaign_id: string | null;
  user_id: string;
  category: 'budget' | 'creative' | 'audience' | 'platform' | 'schedule' | 'general' | string;
  title: string;
  description: string;
  reasoning: string | null;
  supporting_data: Record<string, unknown>;
  suggested_action: Record<string, unknown>;
  confidence: number;
  priority: 'high' | 'medium' | 'low' | string;
  status: 'pending' | 'accepted' | 'rejected' | 'dismissed' | string;
  created_at: string;
}

export interface UnifiedCampaignAnalytics {
  totals: {
    impressions: number;
    reach: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    roas: number;
    cpa: number;
    cpc: number;
    conversion_rate: number;
  };
  byPlatform: Array<{ platform: string; impressions: number; clicks: number; ctr: number; conversions: number; roas: number; spend: number; revenue: number }>;
  timeline: Array<{ date: string; impressions: number; clicks: number; conversions: number; revenue: number; spend: number }>;
}
