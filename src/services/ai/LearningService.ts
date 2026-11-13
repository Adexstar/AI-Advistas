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

function summaryFromDecisions(rows: Array<{ action: string | null; category: string | null; status: string; confidence: number | null }>): LearningSummary[] {
  const grouped = new Map<string, LearningSummary & { confidenceTotal: number }>();
  for (const row of rows) {
    if (row.status === 'pending') continue;
    const sourceType = row.category || row.action || 'suggestion';
    const entry = grouped.get(sourceType) ?? {
      sourceType,
      totalCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      appliedCount: 0,
      avgConfidence: 0,
      lastAction: null,
      confidenceTotal: 0,
    };
    entry.totalCount += 1;
    if (row.status === 'accepted') entry.acceptedCount += 1;
    if (row.status === 'applied') entry.appliedCount += 1;
    if (row.status === 'rejected' || row.status === 'dismissed') entry.rejectedCount += 1;
    entry.lastAction = row.status;
    entry.confidenceTotal += Number(row.confidence) || 0;
    grouped.set(sourceType, entry);
  }
  return Array.from(grouped.values()).map(({ confidenceTotal, ...entry }) => ({
    ...entry,
    avgConfidence: entry.totalCount ? confidenceTotal / entry.totalCount : 0,
  }));
}

export const LearningService = {
  async recordEvent(event: LearningEvent): Promise<string | null> {
    const { data, error } = await sb.rpc('record_ai_feedback', {
      p_user_id: event.userId,
      p_source_type: event.sourceType,
      p_source_label: event.sourceLabel ?? null,
      p_action: event.action,
      p_confidence: event.confidence ?? null,
      p_recommendation_id: event.recommendationId ?? null,
      p_decision_id: event.decisionId ?? null,
      p_context: event.context ?? {},
      p_metadata: event.metadata ?? {},
    });
    if (!error) return (data as string | null) ?? event.decisionId ?? null;

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
      .select('id')
      .single();
    if (!insertError) return insertData?.id ?? null;

    if (event.decisionId) return event.decisionId;

    const { data: decision, error: decisionError } = await sb
      .from('decisions')
      .insert({
        user_id: event.userId,
        status: event.action === 'rejected' ? 'rejected' : event.action,
        trigger_source: 'learning_feedback',
        action: event.sourceType,
        category: event.sourceType,
        signal: event.sourceLabel ?? event.sourceType,
        confidence: event.confidence ?? null,
        metadata: { ...(event.metadata ?? {}), context: event.context ?? {} },
        resolved_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (decisionError) {
      throw new Error(decisionError.message || 'Could not save recommendation feedback');
    }
    return decision?.id ?? null;
  },

  record(event: LearningEvent): Promise<string | null> {
    return this.recordEvent(event);
  },

  async getSummary(userId: string): Promise<LearningSummary[]> {
    const { data, error } = await sb.rpc('get_ai_learning_summary', {
      p_user_id: userId,
      p_limit: 20,
    });
    if (!error) return (data ?? []) as LearningSummary[];

    const { data: decisions, error: decisionError } = await sb
      .from('decisions')
      .select('action,category,status,confidence')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (decisionError) throw new Error(decisionError.message || 'Could not load recommendation history');
    return summaryFromDecisions(decisions ?? []);
  },

  async getTopPerformers(userId: string, limit = 5): Promise<{ sourceType: string; acceptRate: number; count: number }[]> {
    try {
      const { data, error } = await sb
        .from('ai_feedback')
        .select('source_type, action')
        .eq('user_id', userId);
      if (error || !data) {
        const summary = await this.getSummary(userId);
        return summary
          .map((entry) => ({
            sourceType: entry.sourceType,
            acceptRate: entry.totalCount ? (entry.acceptedCount + entry.appliedCount) / entry.totalCount : 0,
            count: entry.totalCount,
          }))
          .sort((a, b) => b.acceptRate - a.acceptRate)
          .slice(0, limit);
      }

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
    } catch (error) {
      throw error instanceof Error ? error : new Error('Could not load recommendation history');
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
