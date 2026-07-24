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

export const CreativeGenerationService = {
  async generate(request: CreativeRequest): Promise<CreativeVariant[]> {
    const count = request.count ?? 3;
    const variants: CreativeVariant[] = [];

    for (let i = 0; i < count; i++) {
      const variant = this.generateVariant(request, i);
      variants.push(variant);
    }

    await this.logGeneration(request, variants);
    return variants;
  },

  generateVariant(request: CreativeRequest, index: number): CreativeVariant {
    const brandName = request.brand?.name ?? request.context?.brand_id ?? 'your brand';
    const platform = request.platform ?? request.context?.active_platform ?? 'social media';
    const product = request.productName ?? 'your product';

    const content = this.mockContent(request.type, brandName, product, platform, index);
    const reasoning = this.reasoning(request.type, index);

    return {
      id: `creative-${Date.now()}-${index}`,
      type: request.type,
      content,
      reasoning,
    };
  },

  mockContent(type: string, brand: string, product: string, platform: string, index: number): string {
    const headlines = [
      `Discover the Power of ${product} Today`,
      `Transform Your ${product.split(' ').pop() ?? 'Experience'} with ${brand}`,
      `Why Top Marketers Choose ${product}`,
      `Unlock ${product} — The Smarter Way`,
      `${product}: Built for Results, Backed by Data`,
    ];
    const ctas = [
      'Get Started Free',
      'Claim Your Offer',
      'See It in Action',
      'Learn More',
      'Shop Now',
    ];
    const bodies = [
      `${brand} helps you achieve more with ${product}. Trusted by thousands of marketers worldwide.`,
      `Experience the next generation of ${product}. ${brand} delivers performance you can measure.`,
      `Stop guessing. Start growing. ${product} from ${brand} gives you the insights you need.`,
    ];

    switch (type) {
      case 'headline': return headlines[index % headlines.length];
      case 'cta': return ctas[index % ctas.length];
      case 'body':
      case 'description': return bodies[index % bodies.length];
      case 'full_ad': return `${headlines[index % headlines.length]}\n\n${bodies[index % bodies.length]}\n\n${ctas[index % ctas.length]}`;
      default: return `AI-generated ${type} for ${brand} on ${platform}`;
    }
  },

  reasoning(type: string, index: number): string {
    const reasons = [
      `Optimized for engagement based on ${type} best practices`,
      `Tailored to platform-specific audience behavior patterns`,
      `Designed to maximize conversion rate through persuasive framing`,
    ];
    return reasons[index % reasons.length];
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
