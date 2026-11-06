import { supabase } from '@/integrations/supabase/client';
import type { CampaignRecommendation } from './types';
import { DecisionService } from '@/services/ai/DecisionService';
import { resolveSuggestion } from '@/services/ai/resolveSuggestion';

function toRecommendation(row: any): CampaignRecommendation {
  const metadata = row.metadata ?? {};
  return { id: row.id, user_id: row.user_id, campaign_id: row.campaign_id,
    recommendation_type: row.category ?? 'general', title: row.action ?? '', description: row.signal,
    confidence: Number(row.confidence), estimated_impact: metadata.estimated_impact ?? null,
    estimated_improvement: metadata.estimated_improvement ?? 0, action_label: metadata.action_label ?? null,
    action_data: metadata.action_data ?? metadata.suggested_action ?? {}, status: row.status,
    dismissed_at: row.status === 'dismissed' ? row.resolved_at : null,
    applied_at: row.status === 'applied' ? row.resolved_at : null, created_at: row.created_at };
}
export const CampaignRecommendationService = {
  async list(campaignId: string, status?: string) {
    let query = supabase.from('decisions').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toRecommendation);
  },
  async create(campaignId: string, userId: string, input: Omit<CampaignRecommendation, 'id' | 'campaign_id' | 'user_id' | 'status' | 'dismissed_at' | 'applied_at' | 'created_at'>) {
    const row = await DecisionService.record(userId, { page: '/campaigns', trigger_source: 'campaign', campaign_id: campaignId,
      category: input.recommendation_type, signal: input.description ?? '', action: input.title, reasoning: input.estimated_impact ?? '', confidence: input.confidence,
      metadata: { estimated_impact: input.estimated_impact, estimated_improvement: input.estimated_improvement, action_label: input.action_label, action_data: input.action_data } });
    return toRecommendation(row);
  },
  async accept(id: string, campaignId: string, userId: string) {
    await resolveSuggestion({ id, status: 'accepted', userId, context: { campaignId } });
  },
  async dismiss(id: string) { await resolveSuggestion({ id, status: 'dismissed' }); },
  async apply(id: string, campaignId: string, userId: string) {
    // Acknowledgement is not execution: budget and artwork stay unchanged until a separate confirmation.
    await resolveSuggestion({ id, status: 'applied', userId, context: { campaignId } });
  },
  async get(id: string) {
    const { data, error } = await supabase.from('decisions').select('*').eq('id', id).single();
    if (error) throw error;
    return toRecommendation(data);
  },
  async getPendingCount(campaignId: string) { return (await this.list(campaignId, 'pending')).length; },
};
