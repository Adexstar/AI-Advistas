import { sb } from './supabase';
import { budgetEfficiency, creativeStyleFrom, type CampaignTrackRecord } from './suggestionLearning';

export interface LearningEvent {
  userId: string;
  sourceType: string;
  sourceLabel?: string;
  action: 'accepted' | 'rejected' | 'dismissed' | 'applied' | 'edited';
  confidence?: number;
  recommendationId?: string;
  decisionId?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface LearningSummary {
  sourceType: string;
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  appliedCount: number;
  avgConfidence: number;
  lastAction: string | null;
}

export const LearningService = {
  async recordEvent(event: LearningEvent): Promise<string | null> {
    try {
      const { data, error } = await sb.rpc('record_ai_feedback', {
        p_user_id: event.userId,
        p_source_type: event.sourceType,
        p_source_label: event.sourceLabel ?? null,
        p_action: event.action,
        p_confidence: event.confidence ?? null,
        p_recommendation_id: event.recommendationId ?? null,
        p_decision_id: event.decisionId ?? null,
        p_context: JSON.stringify(event.context ?? {}),
        p_metadata: JSON.stringify(event.metadata ?? {}),
      });
      if (error) {
        const { data: insertData, error: insertError } = await sb
          .from('ai_feedback')
          .insert({
            user_id: event.userId,
            source_type: event.sourceType,
            source_label: event.sourceLabel ?? null,
            action: event.action,
            confidence: event.confidence ?? null,
            recommendation_id: event.recommendationId ?? null,
            decision_id: event.decisionId ?? null,
            context: event.context ?? {},
            metadata: event.metadata ?? {},
          })
          .select()
          .single();
        if (insertError) throw insertError;
        return insertData?.id ?? null;
      }
      return data as string | null;
    } catch (e) {
      console.error('LearningService.recordEvent error:', e);
      return null;
    }
  },

  record(event: LearningEvent): Promise<string | null> {
    return this.recordEvent(event);
  },

  async getSummary(userId: string): Promise<LearningSummary[]> {
    try {
      const { data, error } = await sb.rpc('get_ai_learning_summary', {
        p_user_id: userId,
        p_limit: 20,
      });
      if (error) throw error;
      return (data ?? []) as LearningSummary[];
    } catch {
      return [];
    }
  },

  async getTopPerformers(userId: string, limit = 5): Promise<{ sourceType: string; acceptRate: number; count: number }[]> {
    try {
      const { data, error } = await sb
        .from('ai_feedback')
        .select('source_type, action')
        .eq('user_id', userId);
      if (error || !data) return [];

      const grouped = new Map<string, { total: number; accepted: number }>();
      data.forEach((r: any) => {
        const entry = grouped.get(r.source_type) ?? { total: 0, accepted: 0 };
        entry.total++;
        if (r.action === 'accepted' || r.action === 'applied') entry.accepted++;
        grouped.set(r.source_type, entry);
      });

      return Array.from(grouped.entries())
        .map(([sourceType, stats]) => ({
          sourceType,
          acceptRate: stats.total > 0 ? stats.accepted / stats.total : 0,
          count: stats.total,
        }))
        .sort((a, b) => b.acceptRate - a.acceptRate)
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  async getTrackRecord(userId: string): Promise<CampaignTrackRecord[]> {
    try {
      const { data: campaigns, error } = await sb
        .from('campaigns')
        .select('id,name,objective,platform,ctr,roas,budget,spend,revenue,settings')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(25);
      if (error || !campaigns) return [];

      const { data: ads } = await sb
        .from('ads')
        .select('campaign_id,content')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(80);
      const styleByCampaign = new Map<string, string>();
      for (const ad of ads ?? []) {
        if (!ad.campaign_id || styleByCampaign.has(ad.campaign_id)) continue;
        const style = creativeStyleFrom(ad.content);
        if (style) styleByCampaign.set(ad.campaign_id, style);
      }

      return campaigns.map((row: any) => {
        const budget = Number(row.budget) || 0;
        const spend = Number(row.spend) || 0;
        const revenue = Number(row.revenue) || 0;
        return {
          id: row.id,
          name: row.name ?? 'Campaign',
          objective: row.objective ?? '',
          platform: row.platform ?? null,
          ctr: Number(row.ctr) || 0,
          roas: Number(row.roas) || 0,
          budget,
          spend,
          revenue,
          budgetEfficiency: budgetEfficiency(budget, spend, revenue),
          creativeStyle: styleByCampaign.get(row.id) ?? creativeStyleFrom(row.settings),
        };
      });
    } catch (e) {
      console.error('LearningService.getTrackRecord error:', e);
      return [];
    }
  },
};
