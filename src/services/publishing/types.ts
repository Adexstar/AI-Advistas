export interface MarketingAsset {
  id: string;
  userId: string;
  brandId?: string | null;
  campaignId?: string | null;
  category?: string | null;
  platform: string;
  goal?: string | null;
  audience?: Record<string, unknown> | null;
  status: "draft" | "scheduled" | "published" | "failed";
  mediaUrl?: string;
  headline?: string;
  body?: string;
  cta?: string;
  variants?: unknown[];
  performance?: Record<string, unknown>;
  history?: PublishResult[];
}

export interface PublishOptions {
  scheduleAt?: string; // ISO
  budget?: number;
  extra?: Record<string, unknown>;
}

export interface PublishResult {
  adapter: string;
  platform: string;
  ok: boolean;
  externalId?: string;
  url?: string;
  error?: string;
  publishedAt: string;
}

export interface MetricsSnapshot {
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  raw?: Record<string, unknown>;
}

export interface PublishAdapter {
  id: string;
  kind: "social" | "paid";
  supports(platform: string): boolean;
  isConfigured(): boolean;
  publish(asset: MarketingAsset, opts: PublishOptions): Promise<PublishResult>;
  fetchMetrics?(externalId: string): Promise<MetricsSnapshot>;
}

export class NotImplementedError extends Error {
  constructor(adapter: string) {
    super(`${adapter} is not implemented yet`);
    this.name = "NotImplementedError";
  }
}
