// Platform adapters route both organic (social) and paid publishing through
// the publish-campaign edge function, which holds Meta / TikTok / Google
// credentials server-side.
import { supabase } from "@/integrations/supabase/client";
import type {
  MarketingAsset,
  PublishAdapter,
  PublishOptions,
  PublishResult,
} from "../types";

function makeAdapter(
  id: string,
  kind: "social" | "paid",
  platforms: string[],
): PublishAdapter {
  return {
    id,
    kind,
    supports: (p) => platforms.includes(p.toLowerCase()),
    // Availability is validated server-side by the edge function.
    isConfigured: () => true,
    async publish(asset: MarketingAsset, opts: PublishOptions = {}): Promise<PublishResult> {
      const publishedAt = new Date().toISOString();
      const { data, error } = await supabase.functions.invoke("publish-campaign", {
        body: {
          platform: asset.platform,
          mode: kind,
          text: [asset.headline, asset.body, asset.cta].filter(Boolean).join("\n\n"),
          mediaUrl: asset.mediaUrl,
          scheduleAt: opts.scheduleAt,
          budget: (opts as any).budget,
        },
      });
      if (error) {
        return { adapter: id, platform: asset.platform, ok: false, error: error.message, publishedAt };
      }
      if ((data as any)?.error) {
        return { adapter: id, platform: asset.platform, ok: false, error: (data as any).error, publishedAt };
      }
      return {
        adapter: id,
        platform: asset.platform,
        ok: true,
        externalId: (data as any)?.id,
        url: (data as any)?.url,
        publishedAt,
      };
    },
  };
}

// Organic / social publishing (Meta, TikTok, Google/YouTube).
export const MetaSocialAdapter   = makeAdapter("meta",   "social", ["facebook", "instagram"]);
export const TikTokSocialAdapter = makeAdapter("tiktok", "social", ["tiktok"]);
export const GoogleSocialAdapter = makeAdapter("google", "social", ["google", "youtube"]);

// Paid ads adapters.
export const MetaAdsAdapter   = makeAdapter("meta-ads",   "paid", ["facebook", "instagram"]);
export const TikTokAdsAdapter = makeAdapter("tiktok-ads", "paid", ["tiktok"]);
export const GoogleAdsAdapter = makeAdapter("google-ads", "paid", ["google", "youtube", "search", "display"]);
