import type { CampaignHealth } from './types';
import type { Database } from '@/integrations/supabase/types';

type CampaignRow = Database['public']['Tables']['campaigns']['Row'];

export const CampaignHealthService = {
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
    if (campaign.budget <= 0) return 80;
    const utilization = Number(campaign.spend) / Number(campaign.budget);
    if (utilization < 0.1) return 90;
    if (utilization > 0.95) return 70;
    const roasScore = Math.min(Number(campaign.roas || 0) / 6, 1) * 30;
    return Math.round(Math.min(1, utilization) * 50 + roasScore + 20);
  },

  calculateCreativeQuality(campaign: CampaignRow): number {
    const ctrScore = Math.min(Number(campaign.ctr || 0) / 5, 1) * 40;
    const convScore = Math.min((campaign.conversions || 0) / 500, 1) * 30;
    return Math.round(ctrScore + convScore + 30);
  },

  calculateAudienceMatch(campaign: CampaignRow): number {
    const roasScore = Math.min(Number(campaign.roas || 0) / 6, 1) * 40;
    const ctrScore = Math.min(Number(campaign.ctr || 0) / 5, 1) * 30;
    return Math.round(roasScore + ctrScore + 30);
  },

  calculateOptimizationLevel(campaign: CampaignRow): number {
    let score = 50;
    if (campaign.start_date) score += 10;
    if (campaign.end_date) score += 10;
    if (campaign.objective && campaign.objective !== 'awareness') score += 10;
    if ((campaign as any).platforms && (campaign as any).platforms.length > 1) score += 10;
    if (campaign.budget > 0) score += 10;
    return Math.min(100, score);
  },

  getStatusLabel(score: number): { label: string; color: string } {
    if (score >= 90) return { label: 'Excellent', color: '#22C55E' };
    if (score >= 75) return { label: 'Good', color: '#3B82F6' };
    if (score >= 50) return { label: 'Fair', color: '#F59E0B' };
    return { label: 'Needs Attention', color: '#EF4444' };
  },
};
