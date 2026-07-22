// Blueprint = the design decisions AI made BEFORE any pixels were placed.
// A blueprint is deterministic, cheap, inspectable, and JSON-serializable.
// The renderer converts a blueprint into Fabric.js JSON.

import { LayoutSelectionService, type LayoutBlueprint } from "./LayoutSelectionService";
import { VisualStyleService, type VisualStyle } from "./VisualStyleService";
import type { BrandIdentity } from "@/services/ai/BrandService";

export interface TemplateBlueprint {
  layout: LayoutBlueprint;
  style: VisualStyle;
  context: {
    brandId?: string | null;
    brandName?: string | null;
    category?: string | null;
    goal?: string | null;
    platform?: string | null;
    productName?: string | null;
    targetAudience?: string | null;
    campaignId?: string | null;
  };
}

export const TemplateBlueprintService = {
  build(input: {
    brand?: BrandIdentity | null;
    category?: string | null;
    goal?: string | null;
    platform?: string | null;
    productName?: string | null;
    targetAudience?: string | null;
    campaignId?: string | null;
    hasUserAssets?: boolean;
    hasBrandAssets?: boolean;
  }): TemplateBlueprint {
    const layout = LayoutSelectionService.select({
      category: input.category,
      goal: input.goal,
      platform: input.platform,
    });
    const style = VisualStyleService.resolve({
      brand: input.brand,
      category: input.category,
      hasUserAssets: input.hasUserAssets,
      hasBrandAssets: input.hasBrandAssets,
    });
    return {
      layout,
      style,
      context: {
        brandId: input.brand?.id ?? null,
        brandName: input.brand?.name ?? null,
        category: input.category ?? null,
        goal: input.goal ?? null,
        platform: input.platform ?? null,
        productName: input.productName ?? null,
        targetAudience: input.targetAudience ?? null,
        campaignId: input.campaignId ?? null,
      },
    };
  },
};
