import type { AIMode, AIContextRow, CategoryPlaybook, CampaignMemory } from './types';
import { AIContextService } from './AIContextService';
import { PromptOrchestrator, type Specialist } from './PromptOrchestrator';
import { AIGateway, type AIRequest, type AIResponse } from './AIGateway';
import { ConfidenceEngine, type ConfidenceResult } from './ConfidenceEngine';
import { LearningService, type LearningEvent } from './LearningService';
import { CreativeGenerationService, type CreativeRequest, type CreativeVariant } from './CreativeGenerationService';
import { BrandIntelligenceService, type BrandProfile } from './BrandIntelligenceService';
import { CategoryIntelligenceService, type CategoryInsight } from './CategoryIntelligenceService';
import { DecisionService } from './DecisionService';

export interface BrainRequest {
  intent: string;
  context: AIContextRow | null;
  mode: AIMode;
  page: string;
  userId: string;
  extraVars?: Record<string, string>;
  preferredProvider?: string;
}

export interface BrainResponse {
  content: string;
  specialist: Specialist;
  confidence: ConfidenceResult;
  aiResponse: AIResponse | null;
  variants?: CreativeVariant[];
}

export interface ProactiveSignal {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string;
  specialist: Specialist;
  estimatedImprovement: number | null;
  confidence: number;
  actionLabel: string;
  actionData: Record<string, unknown>;
}

export const MarketingBrain = {
  async process(request: BrainRequest): Promise<BrainResponse> {
    const { intent, context, mode, page, userId, extraVars } = request;

    const orchestrated = await PromptOrchestrator.orchestrate(intent, context, mode, page, extraVars);

    const aiRequest: AIRequest = {
      systemPrompt: orchestrated.systemPrompt,
      userPrompt: orchestrated.userPrompt,
      specialist: orchestrated.specialist,
      temperature: this.temperatureForMode(mode),
      maxTokens: 500,
      schema: orchestrated.schema as Record<string, unknown>,
    };

    const aiResponse = await AIGateway.route(aiRequest, request.preferredProvider);

    const categoryPlaybook = context?.active_category
      ? await CategoryIntelligenceService.getPlaybook(context.active_category)
      : null;

    const brandMemory = context?.brand_id
      ? await BrandIntelligenceService.getBrandMemory(userId)
      : null;

    const memoryForConfidence: CampaignMemory | null = brandMemory ? {
      id: '',
      user_id: userId,
      brand_id: context?.brand_id ?? null,
      category_id: null,
      winning_templates: brandMemory.bestPerformingFormats.map((f) => ({ format: f })),
      best_copy: [
        ...brandMemory.topHeadlines.map((h) => ({ type: 'headline', content: h })),
        ...brandMemory.topCtasets.map((c) => ({ type: 'cta', content: c })),
      ],
      best_brand_elements: {},
      failed_templates: brandMemory.failedApproaches.map((f) => ({ name: f })),
      failed_copy: brandMemory.failedApproaches.map((f) => ({ type: 'headline', content: f })),
      results_summary: {},
      last_learning: null,
      updated_at: new Date().toISOString(),
    } : null;

    const contentType = intent.includes('headline') ? 'headline'
      : intent.includes('cta') ? 'cta'
      : intent.includes('budget') ? 'budget'
      : intent.includes('audience') ? 'audience'
      : intent.includes('copy') || intent.includes('creative') ? 'copy'
      : intent.includes('image') || intent.includes('visual') || intent.includes('design') ? 'image'
      : 'headline';

    const historicalRate = await ConfidenceEngine.getHistoricalAcceptRate(userId, orchestrated.specialist);

    const confidence = ConfidenceEngine.evaluate(orchestrated.specialist, contentType, aiResponse.content, {
      category: categoryPlaybook,
      memory: memoryForConfidence,
      historicalAcceptRate: historicalRate,
      sampleSize: await this.getFeedbackSampleSize(userId, orchestrated.specialist),
    });

    if (confidence.score >= 70) {
      await DecisionService.record(userId, {
        page,
        trigger_source: intent,
        category: context?.active_category ?? null,
        campaign_id: context?.current_campaign_id ?? null,
        signal: aiResponse.content,
        action: orchestrated.specialist,
        reasoning: confidence.factors.map((f) => f.detail).join('; '),
        confidence: confidence.score / 100,
      } as any);
    }

    return {
      content: aiResponse.content,
      specialist: orchestrated.specialist,
      confidence,
      aiResponse,
    };
  },

  async generateCreatives(request: CreativeRequest): Promise<CreativeVariant[]> {
    return CreativeGenerationService.generate(request);
  },

  async getBrandProfile(brandId: string, userId: string): Promise<BrandProfile | null> {
    return BrandIntelligenceService.getProfile(brandId, userId);
  },

  async getCategoryInsight(category: string): Promise<CategoryInsight> {
    return CategoryIntelligenceService.getInsight(category);
  },

  async recordLearning(event: LearningEvent): Promise<string | null> {
    return LearningService.record(event);
  },

  async getProactiveSignals(context: AIContextRow | null, userId: string): Promise<ProactiveSignal[]> {
    const signals: ProactiveSignal[] = [];

    if (!context) return signals;

    const categoryInsight = context.active_category
      ? await CategoryIntelligenceService.getInsight(context.active_category)
      : null;

    if (categoryInsight?.seasonalityTips) {
      signals.push({
        type: 'seasonality',
        severity: 'info',
        title: 'Seasonal Opportunity',
        description: categoryInsight.seasonalityTips,
        evidence: `Based on current month and ${context.active_category} industry patterns`,
        specialist: 'campaign_optimizer',
        estimatedImprovement: 12,
        confidence: 75,
        actionLabel: 'View Seasonal Tips',
        actionData: { category: context.active_category },
      });
    }

    const summary = await LearningService.getSummary(userId);
    const lowConfidenceAreas = summary.filter((s) => s.avgConfidence < 0.5 && s.totalCount >= 3);
    for (const area of lowConfidenceAreas) {
      signals.push({
        type: 'learning_gap',
        severity: 'info',
        title: `Improve ${area.sourceType.replace('_', ' ')} Suggestions`,
        description: `Current acceptance rate is ${Math.round(area.avgConfidence * 100)}% for ${area.sourceType}. More data can improve AI recommendations.`,
        evidence: `${area.totalCount} past suggestions with ${area.acceptedCount} accepted`,
        specialist: 'general',
        estimatedImprovement: 15,
        confidence: 60,
        actionLabel: 'Review History',
        actionData: { sourceType: area.sourceType },
      });
    }

    return signals;
  },

  temperatureForMode(mode: AIMode): number {
    switch (mode) {
      case 'manual': return 0.3;
      case 'assisted': return 0.5;
      case 'smart': return 0.7;
      case 'growth': return 0.85;
      default: return 0.5;
    }
  },

  async getFeedbackSampleSize(userId: string, specialist: string): Promise<number> {
    try {
      const { sb } = await import('./supabase');
      const { data } = await (sb as any)
        .from('ai_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('source_type', specialist);
      return (data as any)?.length ?? 0;
    } catch {
      return 0;
    }
  },
};
