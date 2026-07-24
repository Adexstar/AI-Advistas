import { supabase } from '@/integrations/supabase/client';
import type { AIRecommendation, UnifiedCampaignAnalytics } from './types';
import { BudgetOptimizerService } from './BudgetOptimizerService';
import { BenchmarkService } from './BenchmarkService';

const db = supabase as any;

export const RecommendationService = {
  async list(userId: string, campaignId?: string): Promise<AIRecommendation[]> {
    let q = db.from('ai_recommendations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (campaignId) q = q.eq('campaign_id', campaignId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AIRecommendation[];
  },

  async create(rec: Omit<AIRecommendation, 'id' | 'created_at'>) {
    const { data, error } = await db.from('ai_recommendations').insert(rec as any).select().single();
    if (error) throw error;
    return data as AIRecommendation;
  },

  async updateStatus(id: string, status: AIRecommendation['status']) {
    const patch: any = { status };
    if (status === 'accepted') patch.accepted_at = new Date().toISOString();
    if (status === 'rejected') patch.rejected_at = new Date().toISOString();
    const { error } = await db.from('ai_recommendations').update(patch).eq('id', id);
    if (error) throw error;
  },

  /** Generate deterministic recommendations from unified analytics; explainable + reversible. */
  synthesize(params: {
    userId: string;
    campaignId?: string;
    category?: string | null;
    unified: UnifiedCampaignAnalytics;
  }): Omit<AIRecommendation, 'id' | 'created_at'>[] {
    const { userId, campaignId, category, unified } = params;
    const out: Omit<AIRecommendation, 'id' | 'created_at'>[] = [];

    const ctrBench = BenchmarkService.compare(category, 'ctr', unified.totals.ctr);
    if (!ctrBench.better && unified.totals.impressions > 1000) {
      out.push({
        campaign_id: campaignId ?? null,
        user_id: userId,
        category: 'creative',
        title: 'CTR below industry benchmark',
        description: `Your CTR of ${unified.totals.ctr.toFixed(2)}% is ${Math.abs(ctrBench.diff)}% below the ${category || 'industry'} average of ${ctrBench.benchmark}%. Test shorter, benefit-driven headlines.`,
        reasoning: 'Historical winners in this category use punchier hooks under 8 words.',
        supporting_data: { ctr: unified.totals.ctr, benchmark: ctrBench.benchmark },
        suggested_action: { type: 'generate_variations', count: 5 },
        confidence: 84,
        priority: 'high',
        status: 'pending',
      });
    }

    for (const shift of BudgetOptimizerService.suggestShifts(unified)) {
      out.push({
        campaign_id: campaignId ?? null,
        user_id: userId,
        category: 'budget',
        title: `Shift $${shift.amount} from ${shift.from} to ${shift.to}`,
        description: `${shift.reasoning} Expected conversion lift ~${shift.expectedLift}%.`,
        reasoning: shift.reasoning,
        supporting_data: { from: shift.from, to: shift.to, amount: shift.amount },
        suggested_action: { type: 'budget_shift', ...shift },
        confidence: shift.confidence,
        priority: 'medium',
        status: 'pending',
      });
    }

    if (unified.totals.roas > 4 && unified.totals.spend > 100) {
      out.push({
        campaign_id: campaignId ?? null,
        user_id: userId,
        category: 'budget',
        title: 'Scale winning campaign',
        description: `ROAS of ${unified.totals.roas.toFixed(2)}x is strong. Consider increasing budget 20-30% to capture more of the audience.`,
        reasoning: 'Sustained ROAS above 4x with adequate spend typically has room to scale.',
        supporting_data: { roas: unified.totals.roas, spend: unified.totals.spend },
        suggested_action: { type: 'increase_budget', percent: 25 },
        confidence: 88,
        priority: 'high',
        status: 'pending',
      });
    }

    return out;
  },
};
