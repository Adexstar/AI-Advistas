import { supabase } from '@/integrations/supabase/client';
import { AnalyticsService } from './AnalyticsService';
import { BenchmarkService } from './BenchmarkService';
import type { UnifiedCampaignAnalytics } from './types';

const db = supabase as any;

export interface Insight {
  id: string;
  insight_type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation' | 'alert';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  confidence: number;
  supporting_data: Record<string, unknown>;
  created_at: string;
}

export const InsightService = {
  async list(workspaceId: string, limit = 20): Promise<Insight[]> {
    const { data, error } = await supabase.functions.invoke('get-workspace-insights', {
      body: { workspaceId, limit },
    });
    if (error) {
      const { data: fallback, error: fallbackError } = await db.rpc('get_workspace_insights', {
        p_workspace_id: workspaceId,
        p_limit: limit,
      });
      if (fallbackError) throw fallbackError;
      return (fallback ?? []) as Insight[];
    }
    return (data?.insights ?? []) as Insight[];
  },

  async create(insight: Omit<Insight, 'id' | 'created_at'> & { workspace_id: string }) {
    const { data, error } = await db.from('ai_insights').insert(insight as any).select().single();
    if (error) throw error;
    return data as Insight;
  },

  async dismiss(id: string) {
    const { error } = await db.from('ai_insights').update({ status: 'dismissed' }).eq('id', id);
    if (error) throw error;
  },

  /** Generate natural-language insights from unified analytics */
  synthesize(params: {
    workspaceId: string;
    userId: string;
    campaignId?: string;
    category?: string | null;
    previous?: UnifiedCampaignAnalytics;
    current: UnifiedCampaignAnalytics;
  }): Omit<Insight, 'id' | 'created_at'> & { workspace_id: string }[] {
    const { workspaceId, userId, campaignId, category, previous, current } = params;
    const insights: (Omit<Insight, 'id' | 'created_at'> & { workspace_id: string })[] = [];

    const { totals } = current;

    // ==============================
    // Trend: period-over-period comparison
    // ==============================
    if (previous && previous.totals.impressions > 0) {
      const ctrChange = previous.totals.ctr > 0
        ? ((totals.ctr - previous.totals.ctr) / previous.totals.ctr) * 100
        : 0;

      if (Math.abs(ctrChange) > 10) {
        insights.push({
          workspace_id: workspaceId,
          insight_type: 'trend',
          title: `CTR ${ctrChange > 0 ? 'increased' : 'dropped'} ${Math.abs(Math.round(ctrChange))}%`,
          description: ctrChange > 0
            ? `Your click-through rate rose to ${totals.ctr.toFixed(2)}% from ${previous.totals.ctr.toFixed(2)}%. The improved engagement suggests your current creative or targeting is working well.`
            : `Your click-through rate fell to ${totals.ctr.toFixed(2)}% from ${previous.totals.ctr.toFixed(2)}%. Consider testing new headlines or refreshing your creative.`,
          priority: Math.abs(ctrChange) > 25 ? 'high' : 'medium',
          category: 'engagement',
          confidence: 85,
          supporting_data: { current: totals.ctr, previous: previous.totals.ctr, change: ctrChange },
        });
      }

      const spendChange = previous.totals.spend > 0
        ? ((totals.spend - previous.totals.spend) / previous.totals.spend) * 100
        : 0;

      if (Math.abs(spendChange) > 20) {
        insights.push({
          workspace_id: workspaceId,
          insight_type: 'trend',
          title: `Spend ${spendChange > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(spendChange))}%`,
          description: spendChange > 0
            ? `Campaign spend grew to $${totals.spend.toLocaleString()} from $${previous.totals.spend.toLocaleString()}. Ensure ROAS remains healthy as you scale.`
            : `Campaign spend decreased to $${totals.spend.toLocaleString()} from $${previous.totals.spend.toLocaleString()}. This could indicate budget exhaustion or manual pauses.`,
          priority: Math.abs(spendChange) > 50 ? 'high' : 'medium',
          category: 'budget',
          confidence: 90,
          supporting_data: { current: totals.spend, previous: previous.totals.spend, change: spendChange },
        });
      }
    }

    // ==============================
    // Benchmark comparison
    // ==============================
    if (totals.impressions > 500) {
      const ctrBench = BenchmarkService.compare(category, 'ctr', totals.ctr);
      if (!ctrBench.better && Math.abs(ctrBench.diff) > 15) {
        insights.push({
          workspace_id: workspaceId,
          insight_type: 'recommendation',
          title: `CTR ${Math.abs(ctrBench.diff)}% below ${category || 'industry'} benchmark`,
          description: `Your CTR of ${totals.ctr.toFixed(2)}% is ${Math.abs(ctrBench.diff)}% below the ${category || 'industry'} average of ${ctrBench.benchmark}%. Test benefit-driven headlines under 8 words.`,
          priority: 'high',
          category: 'creative',
          confidence: 84,
          supporting_data: { ctr: totals.ctr, benchmark: ctrBench.benchmark, diff: ctrBench.diff },
        });
      }

      const roasBench = BenchmarkService.compare(category, 'roas', totals.roas);
      if (roasBench.better && roasBench.diff > 20) {
        insights.push({
          workspace_id: workspaceId,
          insight_type: 'opportunity',
          title: `ROAS ${roasBench.diff}% above ${category || 'industry'} benchmark`,
          description: `Your ROAS of ${totals.roas.toFixed(2)}x outperforms the ${category || 'industry'} average by ${roasBench.diff}%. Consider increasing budget 20-30% to capture more conversions.`,
          priority: 'high',
          category: 'budget',
          confidence: 88,
          supporting_data: { roas: totals.roas, benchmark: roasBench.benchmark, diff: roasBench.diff },
        });
      }
    }

    // ==============================
    // Platform comparison
    // ==============================
    if (current.byPlatform.length >= 2) {
      const sorted = [...current.byPlatform].sort((a, b) => b.roas - a.roas);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      if (best.roas > worst.roas * 1.5 && worst.spend > 50) {
        insights.push({
          workspace_id: workspaceId,
          insight_type: 'recommendation',
          title: `${best.platform} outperforms ${worst.platform}`,
          description: `${best.platform} delivers ${best.roas.toFixed(1)}x ROAS vs ${worst.roas.toFixed(1)}x on ${worst.platform}. Consider shifting 20% of ${worst.platform} budget to ${best.platform}.`,
          priority: 'medium',
          category: 'platform',
          confidence: 82,
          supporting_data: { best: { platform: best.platform, roas: best.roas }, worst: { platform: worst.platform, roas: worst.roas } },
        });
      }
    }

    // ==============================
    // Budget/ROAS alerts
    // ==============================
    if (totals.roas < 1.5 && totals.spend > 100) {
      insights.push({
        workspace_id: workspaceId,
        insight_type: 'alert',
        title: 'ROAS below 1.5x — review campaign',
        description: `Your ROAS of ${totals.roas.toFixed(2)}x is below the 1.5x threshold. Review audience targeting, creative quality, and landing page experience.`,
        priority: 'critical',
        category: 'budget',
        confidence: 92,
        supporting_data: { roas: totals.roas, threshold: 1.5, spend: totals.spend },
      });
    }

    if (totals.roas > 4 && totals.spend > 100) {
      insights.push({
        workspace_id: workspaceId,
        insight_type: 'opportunity',
        title: 'Strong ROAS — consider scaling',
        description: `ROAS of ${totals.roas.toFixed(2)}x with $${totals.spend.toLocaleString()} spend. There is likely room to scale budget 20-30% while maintaining profitability.`,
        priority: 'high',
        category: 'budget',
        confidence: 88,
        supporting_data: { roas: totals.roas, spend: totals.spend },
      });
    }

    return insights;
  },

  /** Automatically persist synthesized insights */
  async synthesizeAndPersist(params: {
    workspaceId: string;
    userId: string;
    campaignId?: string;
    category?: string | null;
    previous?: UnifiedCampaignAnalytics;
    current: UnifiedCampaignAnalytics;
  }): Promise<Insight[]> {
    const insights = this.synthesize(params);
    const created: Insight[] = [];
    for (const insight of insights) {
      try {
        const record = await this.create(insight);
        created.push(record);
      } catch {
        /* skip duplicates or failures */
      }
    }
    return created;
  },
};
