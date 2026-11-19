import type { CampaignHealth } from './types';
import type { Database } from '@/integrations/supabase/types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

export const CampaignHealthService = {
  hasActivity(campaign: Pick<CampaignRow, 'spend' | 'impressions' | 'clicks' | 'conversions'>): boolean {
    return Number(campaign.spend || 0) > 0
      || Number(campaign.impressions || 0) > 0
      || Number(campaign.clicks || 0) > 0
      || Number(campaign.conversions || 0) > 0;
  },

  calculate(campaign: CampaignRow): CampaignHealth {
    const budgetEfficiency = this.calculateBudgetEfficiency(campaign);
    const creativeQuality = this.calculateCreativeQuality(campaign);
    const audienceMatch = this.calculateAudienceMatch(campaign);
    const optimizationLevel = this.calculateOptimizationLevel(campaign);
    const overall = Math.round(
      (budgetEfficiency * 0.25) +
      (creativeQuality * 0.25) +
      (audienceMatch * 0.25) +
      (optimizationLevel * 0.25),
    );
    return {
      overall: Math.min(100, Math.max(0, overall)),
      creative_quality: Math.min(100, Math.max(0, creativeQuality)),
      audience_match: Math.min(100, Math.max(0, audienceMatch)),
      budget_efficiency: Math.min(100, Math.max(0, budgetEfficiency)),
      optimization_level: Math.min(100, Math.max(0, optimizationLevel)),
    };
  },

  calculateBudgetEfficiency(campaign: CampaignRow): number {
    if (!this.hasActivity(campaign) || campaign.budget <= 0) return 0;
    const utilization = Number(campaign.spend) / Number(campaign.budget);
    const roasScore = Math.min(Number(campaign.roas || 0) / 4, 1) * 40;
    return Math.round(Math.min(1, utilization) * 60 + roasScore);
  },

  calculateCreativeQuality(campaign: CampaignRow): number {
    if (!this.hasActivity(campaign)) return 0;
    const ctrScore = Math.min(Number(campaign.ctr || 0) / 5, 1) * 60;
    const convScore = Math.min((campaign.conversions || 0) / 100, 1) * 40;
    return Math.round(ctrScore + convScore);
  },

  calculateAudienceMatch(campaign: CampaignRow): number {
    if (!this.hasActivity(campaign)) return 0;
    const roasScore = Math.min(Number(campaign.roas || 0) / 4, 1) * 60;
    const ctrScore = Math.min(Number(campaign.ctr || 0) / 5, 1) * 40;
    return Math.round(roasScore + ctrScore);
  },

  calculateOptimizationLevel(campaign: CampaignRow): number {
    let score = 0;
    if (campaign.start_date) score += 25;
    if (campaign.end_date) score += 25;
    if (campaign.objective) score += 25;
    if (campaign.budget > 0) score += 25;
    return Math.min(100, score);
  },

  getStatusLabel(score: number): { label: string; color: string } {
    if (score >= 90) return { label: 'Excellent', color: '#22C55E' };
    if (score >= 75) return { label: 'Good', color: '#3B82F6' };
    if (score >= 50) return { label: 'Fair', color: '#F59E0B' };
    return { label: 'Needs Attention', color: '#EF4444' };
  },
};
