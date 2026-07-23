// AIPublishingAssistant — pre-flight advisor. Deterministic scoring for now.
import { PublishingValidator } from "./PublishingValidator";
import type { MarketingAsset } from "./types";

export interface PublishingReview {
  score: number;               // 0..100 estimated performance
  compatibility: Record<string, number>;
  recommendations: string[];
  warnings: string[];
  bestTime?: string;
}

const BEST_HOURS: Record<string, string> = {
  facebook:  "Wed 1:00 PM local",
  instagram: "Tue 11:00 AM local",
  tiktok:    "Thu 7:00 PM local",
  linkedin:  "Tue 9:00 AM local",
  x:         "Wed 12:00 PM local",
  pinterest: "Sat 8:00 PM local",
  youtube:   "Thu 3:00 PM local",
};

export const AIPublishingAssistant = {
  review(asset: MarketingAsset, platforms: string[]): PublishingReview {
    const compatibility: Record<string, number> = {};
    const warnings: string[] = [];
    const recommendations: string[] = [];

    for (const p of platforms) {
      const v = PublishingValidator.validate(asset, p);
      const base = v.ok ? 90 : 55;
      const penalty = v.issues.filter(i => i.level === "warning").length * 5;
      compatibility[p] = Math.max(30, base - penalty);
      v.issues.forEach((i) => (i.level === "error" ? warnings : recommendations).push(`${p}: ${i.message}`));
    }

    if (!asset.cta) recommendations.push("Add a clear CTA — expected +8% CTR.");
    if (!asset.mediaUrl) recommendations.push("Attach an image or video to boost engagement.");
    if ((asset.headline?.length ?? 0) > 60) recommendations.push("Shorten your headline to under 60 characters.");

    const values = Object.values(compatibility);
    const score = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const primary = platforms[0]?.toLowerCase();
    return {
      score,
      compatibility,
      recommendations,
      warnings,
      bestTime: primary ? BEST_HOURS[primary] : undefined,
    };
  },
};
