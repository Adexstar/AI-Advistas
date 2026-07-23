// PublishingValidator — pre-flight checks before a campaign leaves AdVista.
import type { MarketingAsset } from "./types";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

const PLATFORM_RULES: Record<string, { maxCaption: number; requiresMedia: boolean }> = {
  facebook:  { maxCaption: 63206, requiresMedia: false },
  instagram: { maxCaption: 2200,  requiresMedia: true },
  tiktok:    { maxCaption: 2200,  requiresMedia: true },
  linkedin:  { maxCaption: 3000,  requiresMedia: false },
  x:         { maxCaption: 280,   requiresMedia: false },
  twitter:   { maxCaption: 280,   requiresMedia: false },
  pinterest: { maxCaption: 500,   requiresMedia: true },
  youtube:   { maxCaption: 5000,  requiresMedia: true },
  google:    { maxCaption: 90,    requiresMedia: false },
};

export const PublishingValidator = {
  validate(asset: MarketingAsset, platform: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    const rule = PLATFORM_RULES[platform.toLowerCase()] ?? { maxCaption: 2200, requiresMedia: false };
    const caption = [asset.headline, asset.body, asset.cta].filter(Boolean).join("\n\n");

    if (rule.requiresMedia && !asset.mediaUrl) {
      issues.push({ level: "error", code: "MEDIA_REQUIRED", message: `${platform} requires an image or video.` });
    }
    if (caption.length > rule.maxCaption) {
      issues.push({ level: "error", code: "CAPTION_TOO_LONG", message: `Caption exceeds ${rule.maxCaption} chars for ${platform}.` });
    }
    if (!asset.headline && !asset.body) {
      issues.push({ level: "warning", code: "EMPTY_COPY", message: "No headline or body copy provided." });
    }
    if (!asset.cta) {
      issues.push({ level: "warning", code: "MISSING_CTA", message: "No call-to-action set." });
    }
    return { ok: !issues.some((i) => i.level === "error"), issues };
  },

  validateMany(asset: MarketingAsset, platforms: string[]): Record<string, ValidationResult> {
    return Object.fromEntries(platforms.map((p) => [p, this.validate(asset, p)]));
  },
};
