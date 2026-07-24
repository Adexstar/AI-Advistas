import { sb } from './supabase';
import type { CategoryPlaybook } from './types';

export interface CategoryInsight {
  playbook: CategoryPlaybook | null;
  recommendedTone: string | null;
  recommendedFormats: string[];
  recommendedEmotionalTriggers: string[];
  seasonalityTips: string | null;
  benchmarkMetrics: Record<string, number> | null;
}

const INDUSTRY_BENCHMARKS: Record<string, Record<string, number>> = {
  beauty: { ctr: 2.8, conversionRate: 3.2, engagementRate: 4.5, avgCPA: 18 },
  restaurant: { ctr: 3.1, conversionRate: 4.0, engagementRate: 5.2, avgCPA: 12 },
  real_estate: { ctr: 2.2, conversionRate: 1.8, engagementRate: 3.0, avgCPA: 45 },
  saas: { ctr: 2.5, conversionRate: 3.5, engagementRate: 2.8, avgCPA: 65 },
  fitness: { ctr: 3.5, conversionRate: 4.2, engagementRate: 6.0, avgCPA: 22 },
  ecommerce: { ctr: 2.0, conversionRate: 2.5, engagementRate: 3.5, avgCPA: 20 },
  finance: { ctr: 1.8, conversionRate: 2.0, engagementRate: 2.2, avgCPA: 80 },
  education: { ctr: 2.7, conversionRate: 3.8, engagementRate: 4.0, avgCPA: 35 },
  healthcare: { ctr: 2.1, conversionRate: 2.8, engagementRate: 3.2, avgCPA: 50 },
  entertainment: { ctr: 4.0, conversionRate: 3.0, engagementRate: 7.0, avgCPA: 15 },
};

export const CategoryIntelligenceService = {
  async getInsight(category: string): Promise<CategoryInsight> {
    const playbook = await this.getPlaybook(category);
    const benchmarks = INDUSTRY_BENCHMARKS[category] ?? null;

    return {
      playbook,
      recommendedTone: playbook?.tone_guidance ?? null,
      recommendedFormats: this.getRecommendedFormats(category),
      recommendedEmotionalTriggers: playbook?.emotional_triggers ?? this.defaultTriggers(category),
      seasonalityTips: this.getSeasonalityTips(category),
      benchmarkMetrics: benchmarks,
    };
  },

  async getPlaybook(category: string): Promise<CategoryPlaybook | null> {
    try {
      const { data, error } = await sb
        .from('category_playbooks')
        .select('*')
        .eq('category', category)
        .single();
      if (error || !data) return null;
      return data as CategoryPlaybook;
    } catch {
      return null;
    }
  },

  async listPlaybooks(): Promise<CategoryPlaybook[]> {
    try {
      const { data, error } = await sb.from('category_playbooks').select('*');
      if (error || !data) return [];
      return data as CategoryPlaybook[];
    } catch {
      return [];
    }
  },

  getRecommendedFormats(category: string): string[] {
    const formatMap: Record<string, string[]> = {
      beauty: ['carousel', 'video_tutorial', 'before_after', 'lifestyle'],
      restaurant: ['video', 'carousel_menu', 'story', 'user_generated'],
      real_estate: ['carousel', 'video_tour', 'image_showcase', 'testimonial'],
      saas: ['demo_video', 'case_study', 'comparison', 'testimonial'],
      fitness: ['video_workout', 'transformation', 'challenge', 'story'],
      ecommerce: ['product_showcase', 'carousel', 'story', 'user_generated'],
      finance: ['infographic', 'testimonial', 'explainer_video', 'article'],
      education: ['video_lecture', 'infographic', 'carousel_tips', 'ebook'],
      healthcare: ['testimonial', 'educational_video', 'infographic', 'article'],
      entertainment: ['video_clip', 'behind_scenes', 'interactive', 'story'],
    };
    return formatMap[category] ?? ['image', 'video', 'carousel'];
  },

  defaultTriggers(category: string): string[] {
    const triggerMap: Record<string, string[]> = {
      beauty: ['aspiration', 'confidence', 'transformation'],
      restaurant: ['hunger', 'comfort', 'celebration'],
      real_estate: ['trust', 'security', 'future'],
      saas: ['efficiency', 'roi', 'innovation'],
      fitness: ['motivation', 'community', 'achievement'],
      ecommerce: ['convenience', 'value', 'exclusivity'],
      finance: ['security', 'growth', 'trust'],
      education: ['curiosity', 'achievement', 'career'],
      healthcare: ['wellness', 'trust', 'peace_of_mind'],
      entertainment: ['curiosity', 'excitement', 'nostalgia'],
    };
    return triggerMap[category] ?? ['trust', 'value', 'convenience'];
  },

  getSeasonalityTips(category: string): string | null {
    const month = new Date().getMonth();
    const tips: Record<string, Record<number, string>> = {
      beauty: {
        0: 'New Year skincare resolutions peak — emphasize self-care',
        5: 'Summer body season — highlight sun protection and lightweight products',
        10: 'Holiday gifting — bundle sets and limited editions',
      },
      ecommerce: {
        10: 'Black Friday prep — build audiences and test creatives now',
        11: 'Holiday rush — focus on shipping deadlines and gift guides',
      },
    };
    return tips[category]?.[month] ?? null;
  },
};
