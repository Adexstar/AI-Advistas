// Visual style — resolves colors, fonts, and image strategy from Brand + Category.
// Prefers brand-owned assets first; falls back to category defaults; only requests
// AI image generation when no suitable source exists.

import type { BrandIdentity } from "@/services/ai/BrandService";

export interface VisualStyle {
  palette: { bg: string; surface: string; primary: string; onPrimary: string; text: string; muted: string };
  font: { heading: string; body: string };
  imageStrategy: "user" | "brand" | "library" | "generate";
  logoUrl?: string;
}

const CATEGORY_PALETTE: Record<string, VisualStyle["palette"]> = {
  beauty: { bg: "#FFF7F5", surface: "#FFFFFF", primary: "#E88DA0", onPrimary: "#FFFFFF", text: "#1F1B24", muted: "#7A6C74" },
  fashion: { bg: "#0E0E10", surface: "#161618", primary: "#F5F5F0", onPrimary: "#0E0E10", text: "#F5F5F0", muted: "#8E8E93" },
  "real estate": { bg: "#0F1B2D", surface: "#152840", primary: "#D4AF37", onPrimary: "#0F1B2D", text: "#FFFFFF", muted: "#B8C1CF" },
  restaurant: { bg: "#1A0F0A", surface: "#241611", primary: "#E85D2A", onPrimary: "#FFFFFF", text: "#FFF3E6", muted: "#C9A98E" },
  fitness: { bg: "#0A0A0A", surface: "#141414", primary: "#C6FF3A", onPrimary: "#0A0A0A", text: "#FFFFFF", muted: "#9AA0A6" },
  saas: { bg: "#0B1220", surface: "#111A2E", primary: "#5B8CFF", onPrimary: "#FFFFFF", text: "#F5F7FB", muted: "#8892A6" },
  ecommerce: { bg: "#FFFFFF", surface: "#F7F7F8", primary: "#111111", onPrimary: "#FFFFFF", text: "#111111", muted: "#6B7280" },
};

const CATEGORY_FONT: Record<string, VisualStyle["font"]> = {
  beauty: { heading: "Playfair Display", body: "Inter" },
  fashion: { heading: "Bodoni Moda", body: "Inter" },
  "real estate": { heading: "Cormorant Garamond", body: "Inter" },
  restaurant: { heading: "Fraunces", body: "Inter" },
  fitness: { heading: "Anton", body: "Inter" },
  saas: { heading: "Space Grotesk", body: "Inter" },
  ecommerce: { heading: "Inter", body: "Inter" },
};

export const VisualStyleService = {
  resolve(input: {
    brand?: BrandIdentity | null;
    category?: string | null;
    hasUserAssets?: boolean;
    hasBrandAssets?: boolean;
  }): VisualStyle {
    const key = (input.category ?? "ecommerce").toLowerCase().trim();
    const palette = { ...(CATEGORY_PALETTE[key] ?? CATEGORY_PALETTE.ecommerce) };
    const font = { ...(CATEGORY_FONT[key] ?? CATEGORY_FONT.ecommerce) };

    if (input.brand?.colors?.length) {
      palette.primary = input.brand.colors[0];
      if (input.brand.colors[1]) palette.bg = input.brand.colors[1];
    }
    if (input.brand?.fonts?.length) {
      font.heading = input.brand.fonts[0];
      if (input.brand.fonts[1]) font.body = input.brand.fonts[1];
    }

    const imageStrategy: VisualStyle["imageStrategy"] = input.hasUserAssets
      ? "user"
      : input.hasBrandAssets
        ? "brand"
        : "library";

    return { palette, font, imageStrategy, logoUrl: input.brand?.logo_url };
  },
};
