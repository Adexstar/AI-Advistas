import { NotImplementedError, type PublishAdapter } from "../types";

// Paid ads adapters are seams for future OAuth-based integration.
// They intentionally throw so we never silently no-op a spend action.

const makePaid = (id: string, platforms: string[]): PublishAdapter => ({
  id,
  kind: "paid",
  supports: (p) => platforms.includes(p.toLowerCase()),
  isConfigured: () => false,
  publish: async () => {
    throw new NotImplementedError(id);
  },
});

export const MetaAdsAdapter = makePaid("meta-ads", ["facebook", "instagram"]);
export const TikTokAdsAdapter = makePaid("tiktok-ads", ["tiktok"]);
export const GoogleAdsAdapter = makePaid("google-ads", ["google", "youtube", "search", "display"]);
