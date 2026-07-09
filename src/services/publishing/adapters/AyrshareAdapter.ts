import { supabase } from "@/integrations/supabase/client";
import type {
  MarketingAsset,
  PublishAdapter,
  PublishOptions,
  PublishResult,
} from "../types";

const SOCIAL = ["facebook", "instagram", "tiktok", "linkedin", "x", "twitter", "pinterest", "youtube"];

export const AyrshareAdapter: PublishAdapter = {
  id: "ayrshare",
  kind: "social",
  supports: (platform) => SOCIAL.includes(platform.toLowerCase()),
  // Configuration is validated server-side by the edge function; the client
  // treats the adapter as available and lets errors surface with a clear msg.
  isConfigured: () => true,
  async publish(asset: MarketingAsset, opts: PublishOptions): Promise<PublishResult> {
    const { data, error } = await supabase.functions.invoke("ayrshare-publish", {
      body: {
        platform: asset.platform,
        mediaUrl: asset.mediaUrl,
        text: [asset.headline, asset.body, asset.cta].filter(Boolean).join("\n\n"),
        scheduleAt: opts.scheduleAt,
      },
    });
    const publishedAt = new Date().toISOString();
    if (error) {
      return { adapter: "ayrshare", platform: asset.platform, ok: false, error: error.message, publishedAt };
    }
    return {
      adapter: "ayrshare",
      platform: asset.platform,
      ok: true,
      externalId: data?.id,
      url: data?.postUrl,
      publishedAt,
    };
  },
};
