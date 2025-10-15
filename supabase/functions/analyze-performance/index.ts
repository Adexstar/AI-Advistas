import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string[];
  budget: number;
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
  endDate: string;
}

interface NextBestAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  campaignId: string;
  campaignName: string;
  type: string;
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number;
  actionType?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaigns } = await req.json();

    if (!campaigns || !Array.isArray(campaigns)) {
      throw new Error('Invalid campaigns data');
    }

    console.log(`Analyzing ${campaigns.length} campaigns for performance insights`);

    const actions: NextBestAction[] = [];
    const activeCampaigns = campaigns.filter((c: Campaign) => c.status === 'active');

    if (activeCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ actions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate averages for benchmarking
    const avgCPC = activeCampaigns.reduce((sum, c) => sum + (c.cpc || 0), 0) / activeCampaigns.length;
    const avgCTR = activeCampaigns.reduce((sum, c) => sum + c.ctr, 0) / activeCampaigns.length;
    const avgCPA = activeCampaigns.reduce((sum, c) => sum + (c.cpa || 0), 0) / activeCampaigns.filter(c => c.cpa).length || 0;

    for (const campaign of campaigns) {
      // Rule 1: High CPC Detection
      if (campaign.cpc && avgCPC > 0 && campaign.cpc > avgCPC * 1.5 && campaign.spent > 100) {
        actions.push({
          id: `high-cpc-${campaign.id}`,
          priority: 'high',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Cost Optimization',
          title: `High CPC on "${campaign.name}"`,
          description: `CPC ($${campaign.cpc.toFixed(2)}) is 50% above average ($${avgCPC.toFixed(2)}). Consider refining audience targeting or adjusting bids.`,
          suggestedAction: 'Review Audience Targeting',
          confidence: 85,
          actionType: 'adjust_targeting',
          metadata: {
            currentValue: campaign.cpc.toFixed(2),
            targetValue: avgCPC.toFixed(2),
            impact: 'Reduce costs by up to 30%'
          }
        });
      }

      // Rule 2: Low CTR Warning
      if (campaign.ctr < 1.5 && campaign.impressions > 10000) {
        actions.push({
          id: `low-ctr-${campaign.id}`,
          priority: 'high',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Creative Optimization',
          title: `Low CTR on "${campaign.name}"`,
          description: `CTR of ${campaign.ctr.toFixed(2)}% is below industry average (2-3%). Creative refresh recommended.`,
          suggestedAction: 'Update Ad Creative',
          confidence: 78,
          actionType: 'update_creative',
          metadata: {
            currentValue: `${campaign.ctr.toFixed(2)}%`,
            targetValue: '2.5%',
            impact: 'Increase engagement by 40-60%'
          }
        });
      }

      // Rule 3: Budget Depletion Alert
      const remainingBudget = campaign.budget - campaign.spent;
      const daysRemaining = Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const campaignDuration = Math.max(1, (Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const dailySpend = campaign.spent / campaignDuration;

      if (remainingBudget < dailySpend && daysRemaining > 1 && campaign.status === 'active') {
        actions.push({
          id: `budget-alert-${campaign.id}`,
          priority: 'high',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Budget Alert',
          title: `Budget Running Low on "${campaign.name}"`,
          description: `Remaining budget ($${remainingBudget.toFixed(2)}) won't last ${daysRemaining} days at current pace ($${dailySpend.toFixed(2)}/day).`,
          suggestedAction: 'Increase Budget or Adjust Daily Spend',
          confidence: 95,
          actionType: 'increase_budget',
          metadata: {
            currentValue: `$${remainingBudget.toFixed(2)}`,
            targetValue: `$${(dailySpend * daysRemaining).toFixed(2)}`,
            impact: 'Prevent campaign interruption'
          }
        });
      }

      // Rule 4: High-Performing Campaign Scaling
      if (campaign.roas && campaign.roas > 3.5 && campaign.status === 'active') {
        actions.push({
          id: `scale-opportunity-${campaign.id}`,
          priority: 'medium',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Scaling Opportunity',
          title: `Strong ROAS on "${campaign.name}"`,
          description: `ROAS of ${campaign.roas.toFixed(1)}x indicates excellent performance. Consider scaling budget.`,
          suggestedAction: 'Increase Budget by 20-30%',
          confidence: 88,
          actionType: 'increase_budget',
          metadata: {
            currentValue: `${campaign.roas.toFixed(1)}x`,
            targetValue: 'Maintain ROAS while scaling',
            impact: 'Potential 25% revenue increase'
          }
        });
      }

      // Rule 5: High CPA Warning
      if (campaign.cpa && avgCPA > 0 && campaign.cpa > avgCPA * 1.8 && campaign.conversions && campaign.conversions > 5) {
        actions.push({
          id: `high-cpa-${campaign.id}`,
          priority: 'high',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Cost Optimization',
          title: `High CPA on "${campaign.name}"`,
          description: `Cost Per Acquisition ($${campaign.cpa.toFixed(2)}) is 80% above average. Review targeting and bidding strategy.`,
          suggestedAction: 'Optimize Conversion Funnel',
          confidence: 82,
          actionType: 'adjust_targeting',
          metadata: {
            currentValue: `$${campaign.cpa.toFixed(2)}`,
            targetValue: `$${avgCPA.toFixed(2)}`,
            impact: 'Reduce acquisition costs by 35%'
          }
        });
      }

      // Rule 6: Ad Fatigue Detection
      const campaignAge = Math.ceil((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24));
      if (campaignAge > 30 && campaign.ctr < avgCTR * 0.8 && campaign.impressions > 50000) {
        actions.push({
          id: `ad-fatigue-${campaign.id}`,
          priority: 'medium',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Ad Fatigue',
          title: `Potential Ad Fatigue on "${campaign.name}"`,
          description: `Campaign has been running for ${campaignAge} days with declining CTR (${campaign.ctr.toFixed(2)}%).`,
          suggestedAction: 'Refresh Creative Assets',
          confidence: 72,
          actionType: 'update_creative',
          metadata: {
            currentValue: `${campaignAge} days`,
            targetValue: 'Fresh creative',
            impact: 'Restore CTR by 30-50%'
          }
        });
      }

      // Rule 7: Low Conversion Rate
      if (campaign.conversions !== undefined && campaign.clicks > 100) {
        const conversionRate = (campaign.conversions / campaign.clicks) * 100;
        if (conversionRate < 1.0) {
          actions.push({
            id: `low-conversion-${campaign.id}`,
            priority: 'medium',
            campaignId: campaign.id,
            campaignName: campaign.name,
            type: 'Conversion Optimization',
            title: `Low Conversion Rate on "${campaign.name}"`,
            description: `Conversion rate of ${conversionRate.toFixed(2)}% is below average. Landing page optimization recommended.`,
            suggestedAction: 'Optimize Landing Page',
            confidence: 75,
            actionType: 'optimize_landing',
            metadata: {
              currentValue: `${conversionRate.toFixed(2)}%`,
              targetValue: '2-3%',
              impact: 'Double conversion rate potential'
            }
          });
        }
      }

      // Rule 8: Paused Campaign with Good Performance
      if (campaign.status === 'paused' && campaign.roas && campaign.roas > 2.5) {
        actions.push({
          id: `resume-opportunity-${campaign.id}`,
          priority: 'low',
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'Scaling Opportunity',
          title: `Resume High-Performing "${campaign.name}"`,
          description: `This paused campaign had a ROAS of ${campaign.roas.toFixed(1)}x. Consider resuming it.`,
          suggestedAction: 'Resume Campaign',
          confidence: 70,
          actionType: 'resume',
          metadata: {
            currentValue: 'Paused',
            targetValue: `${campaign.roas.toFixed(1)}x ROAS`,
            impact: 'Potential revenue recovery'
          }
        });
      }
    }

    // Sort by priority (high > medium > low) and confidence
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    actions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    console.log(`Generated ${actions.length} actionable recommendations`);

    return new Response(
      JSON.stringify({ actions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing performance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
