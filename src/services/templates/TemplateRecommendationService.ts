// Ranks templates against the active AI Context (brand/category/goal/platform)
// and returns explainable scores. Deterministic and side-effect-free so it can
// be reused by the library page, quick-picker, and future autonomous flows.

import type { TemplateRecord } from "./types";

export interface RecommendationContext {
  category?: string | null;
  goal?: string | null;
  platform?: string | null;
  brandColors?: string[];
  industry?: string | null;
}

export interface RecommendationResult {
  template: TemplateRecord;
  score: number;
  reasons: string[];
}

function overlap(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.reduce((n, x) => (set.has(x.toLowerCase()) ? n + 1 : n), 0);
}

export const TemplateRecommendationService = {
  rank(templates: TemplateRecord[], ctx: RecommendationContext): RecommendationResult[] {
    return templates
      .map((template) => {
        const reasons: string[] = [];
        let score = 0;

        if (ctx.category && template.category?.toLowerCase() === ctx.category.toLowerCase()) {
          score += 40;
          reasons.push(`Matches category: ${template.category}`);
        }
        if (ctx.goal && template.objective?.toLowerCase() === ctx.goal.toLowerCase()) {
          score += 25;
          reasons.push(`Matches goal: ${template.objective}`);
        }
        if (ctx.platform && template.platform?.toLowerCase() === ctx.platform.toLowerCase()) {
          score += 20;
          reasons.push(`Optimized for ${template.platform}`);
        }
        if (ctx.industry && overlap(template.industry_tags, [ctx.industry]) > 0) {
          score += 10;
          reasons.push(`Industry: ${ctx.industry}`);
        }
        // Popularity as a small tiebreaker (0-5 pts).
        score += Math.min(5, Math.floor((template.popularity_score ?? 0) / 20));
        if (template.brand_compatible) reasons.push("Brand-safe");
        return { template, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  },
};
