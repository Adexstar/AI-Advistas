import { sb } from './supabase';
import type { CategoryPlaybook, CampaignMemory } from './types';

export interface ConfidenceResult {
  score: number;
  factors: ConfidenceFactor[];
  label: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
}

export interface ConfidenceFactor {
  name: string;
  weight: number;
  score: number;
  detail: string;
}

export const ConfidenceEngine = {
  evaluate(
    specialist: string,
    contentType: string,
    content: string,
    context: {
      category?: CategoryPlaybook | null;
      memory?: CampaignMemory | null;
      historicalAcceptRate?: number;
      sampleSize?: number;
    },
  ): ConfidenceResult {
    const factors: ConfidenceFactor[] = [];

    /* Factor 1: Category relevance — does this align with the playbook? */
    if (context.category) {
      const categoryScore = this.scoreCategoryRelevance(contentType, content, context.category);
      factors.push(categoryScore);
    }

    /* Factor 2: Memory match — has this or similar content worked before? */
    if (context.memory) {
      const memoryScore = this.scoreMemoryMatch(contentType, content, context.memory);
      factors.push(memoryScore);
    }

    /* Factor 3: Historical acceptance rate from user feedback */
    if (context.historicalAcceptRate !== undefined) {
      factors.push({
        name: 'Historical Acceptance',
        weight: 0.2,
        score: context.historicalAcceptRate,
        detail: `User has accepted ${Math.round(context.historicalAcceptRate * 100)}% of past ${contentType} suggestions`,
      });
    }

    /* Factor 4: Content quality heuristics */
    const qualityScore = this.scoreContentQuality(contentType, content);
    factors.push(qualityScore);

    /* Factor 5: Sample size penalty */
    const sampleSize = context.sampleSize ?? 0;
    if (sampleSize > 0 && sampleSize < 10) {
      factors.push({
        name: 'Sample Size',
        weight: 0.1,
        score: sampleSize / 10,
        detail: `Limited data (${sampleSize} samples) — confidence will improve with more feedback`,
      });
    }

    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const weightedScore = factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight;
    const finalScore = Math.round(Math.min(1, Math.max(0, weightedScore)) * 100);

    return {
      score: finalScore,
      factors,
      label: this.label(finalScore),
    };
  },

  scoreCategoryRelevance(contentType: string, _content: string, playbook: CategoryPlaybook): ConfidenceFactor {
    let score = 0.5;
    const details: string[] = [];

    if (contentType === 'headline' && playbook.headline_patterns?.length > 0) {
      score = 0.7;
      details.push(`Category has ${playbook.headline_patterns.length} headline patterns`);
    }
    if (contentType === 'cta' && playbook.cta_patterns?.length > 0) {
      score = 0.7;
      details.push(`Category has ${playbook.cta_patterns.length} CTA patterns`);
    }
    if (playbook.tone_guidance) {
      score = Math.min(1, score + 0.15);
      details.push(`Tone guidance available for ${playbook.category}`);
    }

    return {
      name: 'Category Relevance',
      weight: 0.3,
      score,
      detail: details.join('; ') || 'No category-specific patterns found',
    };
  },

  scoreMemoryMatch(contentType: string, _content: string, memory: CampaignMemory): ConfidenceFactor {
    let score = 0.3;
    const details: string[] = [];

    const winningCopy = memory.best_copy || [];
    const failedCopy = memory.failed_copy || [];

    if (winningCopy.length > 0) {
      score = 0.6;
      details.push(`${winningCopy.length} winning ${contentType} examples remembered`);
    }
    if (failedCopy.length > 0) {
      score = Math.max(0.2, score - 0.05);
      details.push(`${failedCopy.length} failed examples inform avoidance`);
    }
    if (winningCopy.length + failedCopy.length > 5) {
      score = Math.min(1, score + 0.15);
      details.push('Strong memory signal from past campaigns');
    }
    if (memory.last_learning) {
      score = Math.min(1, score + 0.05);
    }

    return {
      name: 'Memory Match',
      weight: 0.25,
      score,
      detail: details.join('; ') || 'No campaign memory available for this brand',
    };
  },

  scoreContentQuality(contentType: string, content: string): ConfidenceFactor {
    let score = 0.5;
    const details: string[] = [];

    if (!content || content.trim().length === 0) {
      return { name: 'Content Quality', weight: 0.15, score: 0, detail: 'Empty content' };
    }

    if (contentType === 'headline') {
      const len = content.length;
      if (len >= 10 && len <= 60) { score = 0.8; details.push('Headline length is optimal'); }
      else if (len > 60) { score = 0.4; details.push('Headline may be too long'); }
      else { score = 0.3; details.push('Headline may be too short'); }
    } else if (contentType === 'cta') {
      if (content.length <= 30) { score = 0.85; details.push('CTA is concise'); }
      else { score = 0.4; details.push('CTA may be too verbose'); }
    } else if (contentType === 'budget') {
      const num = parseFloat(content);
      if (!isNaN(num) && num > 0) { score = 0.9; details.push('Budget is a valid positive number'); }
      else { score = 0.1; details.push('Invalid budget value'); }
    } else if (contentType === 'audience') {
      if (content.length >= 10) { score = 0.7; details.push('Audience description has sufficient detail'); }
      else { score = 0.3; details.push('Audience description is vague'); }
    }

    return {
      name: 'Content Quality',
      weight: 0.15,
      score,
      detail: details.join('; ') || 'No content quality heuristics applied',
    };
  },

  label(score: number): ConfidenceResult['label'] {
    if (score >= 90) return 'very_high';
    if (score >= 70) return 'high';
    if (score >= 45) return 'medium';
    if (score >= 25) return 'low';
    return 'very_low';
  },

  async getHistoricalAcceptRate(userId: string, sourceType: string): Promise<number> {
    try {
      const { data, error } = await sb
        .from('ai_feedback')
        .select('action')
        .eq('user_id', userId)
        .eq('source_type', sourceType);
      if (error || !data) return 0.5;
      const total = data.length;
      if (total === 0) return 0.5;
      const accepted = data.filter((r: any) => r.action === 'accepted' || r.action === 'applied').length;
      return accepted / total;
    } catch {
      return 0.5;
    }
  },
};
