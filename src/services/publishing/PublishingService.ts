// PublishingService — the single orchestrator every page uses to publish.
// Handles: validation -> job persistence -> adapter dispatch -> history log -> retry.
import { supabase } from "@/integrations/supabase/client";
import { PublishingEngine } from "./PublishingEngine";
import { PublishingValidator, type ValidationResult } from "./PublishingValidator";
import { PublishingHistoryService } from "./PublishingHistoryService";
import type { MarketingAsset, PublishOptions, PublishResult } from "./types";

export type PublishMode = "now" | "schedule" | "draft";

export interface PublishTarget {
  platform: string;
  mode?: "social" | "paid";
}

export interface PublishRequest {
  campaignId: string;
  asset: MarketingAsset;
  targets: PublishTarget[];
  when: PublishMode;
  scheduledAt?: string;
  options?: PublishOptions;
}

export interface PublishJobRow {
  id: string;
  campaign_id: string;
  platform: string;
  provider: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  retry_count: number;
  external_ids: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export const PublishingService = {
  validator: PublishingValidator,

  async validate(request: PublishRequest): Promise<Record<string, ValidationResult>> {
    return PublishingValidator.validateMany(request.asset, request.targets.map((t) => t.platform));
  },

  async publish(request: PublishRequest): Promise<PublishJobRow[]> {
    const userId = await currentUserId();
    const validation = await this.validate(request);

    // Fail fast if any target has a hard error
    const blocked = Object.entries(validation).filter(([, v]) => !v.ok);
    if (blocked.length > 0) {
      const msg = blocked.map(([p, v]) => `${p}: ${v.issues.filter(i => i.level === "error").map(i => i.message).join(", ")}`).join(" | ");
      throw new Error(`Validation failed — ${msg}`);
    }

    const status = request.when === "draft" ? "draft" : request.when === "schedule" ? "scheduled" : "queued";

    // Insert jobs for each target
    const rows = request.targets.map((t) => ({
      campaign_id: request.campaignId,
      user_id: userId,
      platform: t.platform,
      provider: t.mode === "paid" ? `${t.platform}-ads` : "ayrshare",
      mode: t.mode ?? "social",
      status,
      scheduled_at: request.when === "schedule" ? request.scheduledAt ?? null : null,
      payload: {
        headline: request.asset.headline,
        body: request.asset.body,
        cta: request.asset.cta,
        mediaUrl: request.asset.mediaUrl,
      } as Record<string, unknown>,
    }));

    const { data: jobs, error } = await supabase
      .from("publishing_jobs")
      .insert(rows)
      .select();
    if (error) throw error;

    // Mark campaign status
    await supabase
      .from("campaigns")
      .update({ status: request.when === "schedule" ? "scheduled" : request.when === "draft" ? "draft" : "publishing" })
      .eq("id", request.campaignId);

    // Immediate publish → dispatch now
    if (request.when === "now") {
      await Promise.all((jobs ?? []).map((job) => this.dispatchJob(job as PublishJobRow, request.asset, request.options)));
    } else {
      // Log scheduled/draft
      await Promise.all((jobs ?? []).map((job) =>
        PublishingHistoryService.log({
          campaignId: request.campaignId,
          jobId: (job as any).id,
          platform: (job as any).platform,
          action: request.when === "schedule" ? "schedule" : "publish",
          result: "pending",
          details: { scheduledAt: request.scheduledAt },
        })
      ));
    }

    return (jobs ?? []) as PublishJobRow[];
  },

  async dispatchJob(job: PublishJobRow, asset: MarketingAsset, opts: PublishOptions = {}): Promise<PublishResult> {
    await supabase.from("publishing_jobs").update({ status: "publishing" }).eq("id", job.id);
    const [result] = await PublishingEngine.publish(
      { ...asset, platform: job.platform },
      [{ platform: job.platform, mode: (job as any).mode ?? "social" }],
      opts,
    );
    const newStatus = result.ok ? "published" : "failed";
    await supabase.from("publishing_jobs").update({
      status: newStatus,
      published_at: result.ok ? result.publishedAt : null,
      error_message: result.ok ? null : result.error ?? "Unknown error",
      external_ids: result.ok ? { [result.adapter]: result.externalId, url: result.url } : {},
    }).eq("id", job.id);

    await PublishingHistoryService.log({
      campaignId: job.campaign_id,
      jobId: job.id,
      platform: job.platform,
      action: "publish",
      result: result.ok ? "success" : "failure",
      details: { error: result.error, url: result.url, externalId: result.externalId },
    });
    return result;
  },

  async retry(jobId: string, asset: MarketingAsset) {
    const { data: job, error } = await supabase.from("publishing_jobs").select("*").eq("id", jobId).single();
    if (error || !job) throw error ?? new Error("Job not found");
    const next = (job.retry_count ?? 0) + 1;
    await supabase.from("publishing_jobs").update({ retry_count: next, status: "queued", error_message: null }).eq("id", jobId);
    await PublishingHistoryService.log({
      campaignId: job.campaign_id,
      jobId,
      platform: job.platform,
      action: "retry",
      result: "pending",
      details: { attempt: next },
    });
    return this.dispatchJob(job as PublishJobRow, asset);
  },

  async cancel(jobId: string) {
    const { data: job } = await supabase.from("publishing_jobs").select("campaign_id, platform").eq("id", jobId).maybeSingle();
    await supabase.from("publishing_jobs").update({ status: "cancelled" }).eq("id", jobId);
    if (job) {
      await PublishingHistoryService.log({
        campaignId: job.campaign_id,
        jobId,
        platform: job.platform,
        action: "cancel",
        result: "success",
      });
    }
  },

  async listJobs(campaignId: string): Promise<PublishJobRow[]> {
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PublishJobRow[];
  },
};
