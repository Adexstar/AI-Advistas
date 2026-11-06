import { supabase } from '@/integrations/supabase/client';
import { DecisionService } from '@/services/ai/DecisionService';
import { resolveSuggestion } from '@/services/ai/resolveSuggestion';
import type { AIRecommendation, UnifiedCampaignAnalytics } from './types';
import { BudgetOptimizerService } from './BudgetOptimizerService';
import { BenchmarkService } from './BenchmarkService';


export const RecommendationService = {
  async list(userId: string, campaignId?: string): Promise<AIRecommendation[]> {
    let query = supabase.from('decisions').select('*').eq('user_id', userId).eq('trigger_source', 'analytics').order('created_at', { ascending: false });
    if (campaignId) query = query.eq('campaign_id', campaignId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(row => {
      const metadata = row.metadata as Record<string, any>;
      return { id: row.id, user_id: row.user_id, campaign_id: row.campaign_id, category: row.category ?? 'general',
        title: metadata.title ?? row.action ?? '', description: metadata.description ?? row.signal ?? '', reasoning: row.reasoning,
        supporting_data: metadata.supporting_data ?? {}, suggested_action: metadata.suggested_action ?? {},
        confidence: Number(row.confidence), priority: metadata.priority ?? 'medium', status: row.status, created_at: row.created_at };
    });
  },
  async create(rec: Omit<AIRecommendation, 'id' | 'created_at'>) {
    return DecisionService.record(rec.user_id, { page: '/analytics', trigger_source: 'analytics', campaign_id: rec.campaign_id,
      category: rec.category, signal: rec.description, action: rec.title, reasoning: rec.reasoning ?? '', confidence: rec.confidence,
      metadata: { title: rec.title, description: rec.description, supporting_data: rec.supporting_data, suggested_action: rec.suggested_action, priority: rec.priority } });
  },
  async updateStatus(id: string, status: AIRecommendation['status']) {
    if (!['accepted', 'dismissed', 'applied', 'rejected'].includes(status)) throw new Error('Invalid decision status');
    await resolveSuggestion({ id, status: status as 'accepted' | 'dismissed' | 'applied' | 'rejected' });
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
