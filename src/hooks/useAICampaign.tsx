import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignData {
  product: string;
  details: string;
  platforms: string[];
  audience: string;
  simpleAudience?: string;
  adType: string;
  placementOptions: Record<string, string[]>;
  websiteUrl?: string;
}

export interface PlatformCampaign {
  headlines: string[];
  body_copy: string;
  cta: string;
  targeting: {
    demographics: string;
    interests: string[];
    behaviors: string[];
  };
  placement_strategy: string;
  creative_direction: string;
}

export interface AICampaignResponse {
  campaign_overview: {
    strategy_summary: string;
    key_messaging: string;
    success_metrics: string[];
  };
  platform_campaigns: Record<string, PlatformCampaign>;
  budget_recommendations: {
    platform_allocation: string;
    recommended_daily_budget: string;
    scaling_strategy: string;
  };
  optimization_tips: string[];
}

export const useAICampaign = () => {
  return useMutation<AICampaignResponse, Error, CampaignData>({
    mutationFn: async (campaignData) => {
      const { data, error } = await supabase.functions.invoke('generate-ai-campaign', {
        body: campaignData
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate AI campaign');
      }

      return data.campaign;
    },
  });
};