import type { AIContextRow } from './types';
import { sb } from './supabase';

export interface CreativeRequest {
  type: 'headline' | 'cta' | 'body' | 'description' | 'full_ad' | 'variation';
  context: AIContextRow | null;
  brand?: { name?: string; tone?: string; colors?: string[] };
  productName?: string;
  platform?: string;
  count?: number;
  existingContent?: string;
  constraints?: string[];
}

export interface CreativeVariant {
  id: string;
  type: string;
  content: string;
  reasoning: string;
}

function variantsFromCopy(request: CreativeRequest, copy: Record<string, unknown>): CreativeVariant[] {
  const headline = typeof copy.headline === 'string' ? copy.headline : '';
  const subtitle = typeof copy.subtitle === 'string' ? copy.subtitle : typeof copy.body === 'string' ? copy.body : '';
  const cta = typeof copy.cta === 'string' ? copy.cta : '';
  const alternatives = Array.isArray(copy.alternativeHeadlines)
    ? copy.alternativeHeadlines.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const pieces: Array<{ type: string; content: string }> = [];
  if (request.type === 'headline') {
    if (headline) pieces.push({ type: 'headline', content: headline });
    alternatives.forEach((content) => pieces.push({ type: 'headline', content }));
  } else if (request.type === 'cta') {
    if (cta) pieces.push({ type: 'cta', content: cta });
  } else if (request.type === 'body' || request.type === 'description') {
    if (subtitle) pieces.push({ type: request.type, content: subtitle });
  } else if (headline || subtitle || cta) {
    pieces.push({ type: request.type, content: [headline, subtitle, cta].filter(Boolean).join('\n\n') });
    alternatives.forEach((content) => pieces.push({ type: 'headline', content }));
  }
  const limit = request.count ?? pieces.length;
  return pieces.slice(0, Math.max(limit, 1)).map((piece, index) => ({
    id: `creative-${Date.now()}-${index}`,
    type: piece.type,
    content: piece.content,
    reasoning: 'Returned by the copy provider. Nothing was filled in locally.',
  }));
}

export const CreativeGenerationService = {
  async generate(request: CreativeRequest): Promise<CreativeVariant[]> {
    const productName = request.productName ?? request.brand?.name ?? '';
    if (!productName.trim()) throw new Error('Add a product or brand name before generating copy.');
    const { data, error } = await sb.functions.invoke('generate-ad-copy', {
      body: {
        productName,
        templateType: request.type,
        platform: request.platform ?? request.context?.active_platform ?? 'social',
        targetAudience: request.context?.active_category ?? '',
        additionalContext: [request.existingContent, ...(request.constraints ?? [])].filter(Boolean).join('\n'),
      },
    });
    if (error) throw new Error(error.message || 'AI copy is unavailable');
    const copy = (data as { copy?: Record<string, unknown> } | null)?.copy;
    if (!copy) throw new Error('AI copy is unavailable. No placeholder copy was created.');
    const variants = variantsFromCopy(request, copy).filter((variant) => variant.content.trim());
    if (!variants.length) throw new Error('The copy provider returned an empty result.');
    await this.logGeneration(request, variants);
    return variants;
  },

  async logGeneration(request: CreativeRequest, variants: CreativeVariant[]): Promise<void> {
    try {
      await sb.from('ai_jobs').insert({
        user_id: request.context?.user_id ?? 'system',
        job_type: `generate_${request.type}`,
        status: 'completed',
        input: { type: request.type, productName: request.productName, platform: request.platform },
        output: { variants: variants.map((v) => ({ content: v.content, type: v.type })) },
        completed_at: new Date().toISOString(),
      });
    } catch {
      /* non-critical */
    }
  },
};
