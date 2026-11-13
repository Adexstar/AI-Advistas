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
        .select('id,name,logos,colors,fonts')
        .eq('id', brandId)
        .eq('user_id', userId)
        .single();
      if (brandError || !brand) return null;

      const { data: memory } = await sb
        .from('campaign_memory')
        .select('*')
        .eq('brand_id', brandId)
        .eq('user_id', userId)
        .maybeSingle();

      const { data: feedback } = await sb
        .from('ai_feedback')
        .select('source_type, action, metadata')
        .eq('user_id', userId)
        .eq('context->>brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(100);

      const colors = Array.isArray((brand as any).colors)
        ? (brand as any).colors.map((c: any) => c?.hex).filter(Boolean)
        : [];
      const fontNames = Array.isArray((brand as any).fonts)
        ? (brand as any).fonts.map((f: any) => f?.name ?? f?.font_url).filter(Boolean)
        : [];
      const logos = Array.isArray((brand as any).logos) ? (brand as any).logos : [];
      const logoUrl = logos.find((item: any) => item?.asset_type === 'logo' && item.asset_url)?.asset_url ?? null;
      const assetCount = logos.filter((item: any) => item?.asset_url && item.asset_type !== 'profile').length;
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

      const profile = logos.find((item: any) => item?.asset_type === 'profile') ?? {};
      return {
        id: brandId,
        name: (brand as any).name ?? 'Unknown Brand',
        industry: profile.industry ?? null,
        tone: profile.description ?? null,
        colors,
        fonts: fontNames,
        logoUrl,
        assetCount,
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
