// PublishingEngine — single gateway for every publish action in AdVista.
// Pages call PublishingEngine.publish(asset, targets); adapters do the rest.
import { AyrshareAdapter } from "./adapters/AyrshareAdapter";
import {
  GoogleAdsAdapter,
  MetaAdsAdapter,
  TikTokAdsAdapter,
} from "./adapters/PaidAdsAdapters";
import type {
  MarketingAsset,
  MetricsSnapshot,
  PublishAdapter,
  PublishOptions,
  PublishResult,
} from "./types";

const ADAPTERS: PublishAdapter[] = [
  AyrshareAdapter,
  MetaAdsAdapter,
  TikTokAdsAdapter,
  GoogleAdsAdapter,
];

function resolveAdapter(platform: string, mode: "social" | "paid" = "social") {
  return ADAPTERS.find((a) => a.kind === mode && a.supports(platform));
}

export const PublishingEngine = {
  adapters: ADAPTERS,

  async publish(
    asset: MarketingAsset,
    targets: Array<{ platform: string; mode?: "social" | "paid" }>,
    opts: PublishOptions = {}
  ): Promise<PublishResult[]> {
    const jobs = targets.map(async (t) => {
      const adapter = resolveAdapter(t.platform, t.mode ?? "social");
      if (!adapter) {
        return {
          adapter: "none",
          platform: t.platform,
          ok: false,
          error: `No adapter for ${t.platform} (${t.mode ?? "social"})`,
          publishedAt: new Date().toISOString(),
        } as PublishResult;
      }
      const scoped: MarketingAsset = { ...asset, platform: t.platform };
      try {
        return await adapter.publish(scoped, opts);
      } catch (e: any) {
        return {
          adapter: adapter.id,
          platform: t.platform,
          ok: false,
          error: e?.message ?? String(e),
          publishedAt: new Date().toISOString(),
        } as PublishResult;
      }
    });
    return Promise.all(jobs);
  },

  async fetchMetrics(adapterId: string, externalId: string): Promise<MetricsSnapshot | null> {
    const adapter = ADAPTERS.find((a) => a.id === adapterId);
    if (!adapter?.fetchMetrics) return null;
    return adapter.fetchMetrics(externalId);
  },

  listIntegrations() {
    return ADAPTERS.map((a) => ({ id: a.id, kind: a.kind, configured: a.isConfigured() }));
  },
};
