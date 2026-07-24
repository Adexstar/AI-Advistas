import { sb } from './supabase';
import type { CampaignMemory } from './types';

export interface BrandProfile {
  id: string;
  name: string;
  industry: string | null;
  tone: string | null;
  colors: string[];
  fonts: string[];
  logoUrl: string | null;
  assetCount: number;
  memory: CampaignMemory | null;
  learning: {
    topHeadlines: string[];
    topCtasets: string[];
    failedApproaches: string[];
    bestPerformingFormats: string[];
  };
}

export const BrandIntelligenceService = {
  async getProfile(brandId: string, userId: string): Promise<BrandProfile | null> {
    try {
      const { data: brand, error: brandError } = await sb
        .from('brand_kits')
        .select('*, brand_colors(*), brand_fonts(*)')
        .eq('id', brandId)
        .eq('user_id', userId)
        .single();
      if (brandError || !brand) return null;

      const { data: memory } = await sb
        .from('campaign_memory')
        .select('*')
        .eq('brand_id', brandId)
        .eq('user_id', userId)
        .single();

      const { data: assets } = await sb
        .from('brand_assets')
        .select('id')
        .eq('brand_id', brandId);

      const { data: feedback } = await sb
        .from('ai_feedback')
        .select('source_type, action, metadata')
        .eq('user_id', userId)
        .eq('context->>brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(100);

      const colors = (brand as any).brand_colors?.map((c: any) => c.hex) ?? [];
      const fontNames = (brand as any).brand_fonts?.map((f: any) => f.name ?? f.font_url) ?? [];
      const brandMemory = memory as CampaignMemory | null;

      const topHeadlines: string[] = [];
      const topCtasets: string[] = [];
      const failedApproaches: string[] = [];
      const bestFormats: string[] = [];

      if (brandMemory) {
        const bestCopy = brandMemory.best_copy ?? [];
        topHeadlines.push(...bestCopy.filter((c: any) => c?.type === 'headline').map((c: any) => c.content));
        topCtasets.push(...bestCopy.filter((c: any) => c?.type === 'cta').map((c: any) => c.content));

        const failedCopy = brandMemory.failed_copy ?? [];
        failedApproaches.push(...failedCopy.filter((c: any) => c?.type === 'headline').map((c: any) => c.content));

        const winningTemplates = brandMemory.winning_templates ?? [];
        bestFormats.push(...winningTemplates.map((t: any) => t?.format ?? t?.type).filter(Boolean));
      }

      if (feedback) {
        const accepted = feedback.filter((f: any) => f.action === 'accepted' || f.action === 'applied');
        accepted.forEach((f: any) => {
          if (f.source_type === 'headline' && f.metadata?.content) {
            topHeadlines.push(f.metadata.content);
          }
          if (f.source_type === 'cta' && f.metadata?.content) {
            topCtasets.push(f.metadata.content);
          }
        });
      }

      return {
        id: brandId,
        name: (brand as any).name ?? 'Unknown Brand',
        industry: (brand as any).industry ?? null,
        tone: (brand as any).description ?? null,
        colors,
        fonts: fontNames,
        logoUrl: (brand as any).logo_url ?? null,
        assetCount: assets?.length ?? 0,
        memory: brandMemory,
        learning: {
          topHeadlines: [...new Set(topHeadlines)],
          topCtasets: [...new Set(topCtasets)],
          failedApproaches: [...new Set(failedApproaches)],
          bestPerformingFormats: [...new Set(bestFormats)],
        },
      };
    } catch (e) {
      console.error('BrandIntelligenceService.getProfile error:', e);
      return null;
    }
  },

  async getBrandMemory(userId: string): Promise<BrandProfile['learning'] | null> {
    try {
      const { data: memory, error } = await sb
        .from('campaign_memory')
        .select('*')
        .eq('user_id', userId)
        .order('last_learning', { ascending: false })
        .limit(1);
      if (error || !memory || memory.length === 0) return null;

      const latest = memory[0] as CampaignMemory;
      const bestCopy = latest.best_copy ?? [];
      const failedCopy = latest.failed_copy ?? [];
      const winningTemplates = latest.winning_templates ?? [];
      const failedTemplates = latest.failed_templates ?? [];

      return {
        topHeadlines: bestCopy.filter((c: any) => c?.type === 'headline').map((c: any) => c.content),
        topCtasets: bestCopy.filter((c: any) => c?.type === 'cta').map((c: any) => c.content),
        failedApproaches: [
          ...failedCopy.filter((c: any) => c?.type === 'headline').map((c: any) => c.content),
          ...failedTemplates.map((t: any) => t?.name ?? t?.type).filter(Boolean),
        ],
        bestPerformingFormats: winningTemplates.map((t: any) => t?.format ?? t?.type).filter(Boolean),
      };
    } catch {
      return null;
    }
  },
};
