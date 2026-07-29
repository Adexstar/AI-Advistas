// publish-campaign — server-side dispatcher for AdVista's Publishing Engine.
// Routes to Meta, TikTok, or Google APIs (organic + paid). Each provider
// returns 501 with the list of missing secrets until real credentials are set.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface PublishBody {
  platform: string;
  mode?: "social" | "paid";
  text?: string;
  mediaUrl?: string;
  scheduleAt?: string;
  budget?: number;
}

const PROVIDER_ENV: Record<string, string[]> = {
  "meta":       ["META_ACCESS_TOKEN", "META_PAGE_ID"],
  "meta-ads":   ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
  "tiktok":     ["TIKTOK_ACCESS_TOKEN"],
  "tiktok-ads": ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
  "google":     ["GOOGLE_ACCESS_TOKEN"],
  "google-ads": ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
};

function resolveProvider(platform: string, mode: "social" | "paid"): string {
  const p = platform.toLowerCase();
  const family =
    p === "facebook" || p === "instagram" ? "meta" :
    p === "tiktok" ? "tiktok" :
    p === "google" || p === "youtube" || p === "search" || p === "display" ? "google" :
    p;
  return mode === "paid" ? `${family}-ads` : family;
}

function stub(provider: string, extra: Record<string, unknown> = {}) {
  const required = PROVIDER_ENV[provider] ?? [];
  const missing = required.filter((k) => !Deno.env.get(k));
  return {
    status: 501,
    body: {
      error: `Provider '${provider}' is not yet configured.`,
      missingSecrets: missing,
      hint: `Add these secrets to enable ${provider}: ${missing.join(", ") || "n/a"}.`,
      ...extra,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as PublishBody;
    if (!body?.platform) {
      return new Response(JSON.stringify({ error: "platform required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mode = body.mode ?? "social";
    const provider = resolveProvider(body.platform, mode);

    // All providers are currently stubbed until real credentials are wired.
    // Real API calls (Meta Graph, TikTok Business, Google Ads) plug in here.
    const out = stub(provider, { platform: body.platform, mode });

    return new Response(JSON.stringify(out.body), {
      status: out.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
