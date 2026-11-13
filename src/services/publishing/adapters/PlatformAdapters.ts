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

async function providerError(error: unknown, data: unknown): Promise<string> {
  const body = data as { error?: string } | null;
  if (body?.error) return body.error;
  const context = (error as { context?: { json?: () => Promise<{ error?: string }> } } | null)?.context;
  if (context && typeof context.json === "function") {
    try {
      const parsed = await context.json();
      if (parsed?.error) return parsed.error;
    } catch {
      /* The client already consumed the body. */
    }
  }
  return error instanceof Error ? error.message : "Publish failed";
}

function makeAdapter(
  id: string,
  kind: "social" | "paid",
  platforms: string[],
): PublishAdapter {
  return {
    id,
    kind,
    supports: (p) => platforms.includes(p.toLowerCase()),
    isConfigured: () => false,
    async publish(asset: MarketingAsset, opts: PublishOptions = {}): Promise<PublishResult> {
      const publishedAt = new Date().toISOString();
      if (kind === "paid") {
        return {
          adapter: id,
          platform: asset.platform,
          ok: false,
          error: "Paid ads stay unavailable until that provider workflow is connected.",
          publishedAt,
        };
      }
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
      if (error || (data as { error?: string } | null)?.error) {
        return { adapter: id, platform: asset.platform, ok: false, error: await providerError(error, data), publishedAt };
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
