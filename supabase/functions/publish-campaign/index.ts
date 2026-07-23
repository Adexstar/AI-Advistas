// publish-campaign — server-side dispatcher for the Publishing Engine.
// Routes a publish request to the right provider (Ayrshare / paid ad APIs).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface PublishBody {
  platform: string;
  mode?: "social" | "paid";
  text?: string;
  mediaUrl?: string;
  scheduleAt?: string;
  budget?: number;
}

const PAID_ENV: Record<string, string[]> = {
  "meta-ads":   ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
  "tiktok-ads": ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
  "google-ads": ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
};

async function publishSocial(body: PublishBody) {
  const key = Deno.env.get("AYRSHARE_API_KEY");
  if (!key) {
    return { status: 501, body: { error: "Ayrshare not configured (AYRSHARE_API_KEY missing)." } };
  }
  const platform = body.platform.toLowerCase() === "x" ? "twitter" : body.platform.toLowerCase();
  const payload: Record<string, unknown> = { post: body.text ?? "", platforms: [platform] };
  if (body.mediaUrl) payload.mediaUrls = [body.mediaUrl];
  if (body.scheduleAt) payload.scheduleDate = body.scheduleAt;
  const res = await fetch("https://app.ayrshare.com/api/post", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: res.ok ? { id: data.id ?? data.postId, url: data.postUrl, raw: data } : { error: "Ayrshare error", details: data } };
}

function paidStub(provider: string) {
  const required = PAID_ENV[provider] ?? [];
  const missing = required.filter((k) => !Deno.env.get(k));
  return {
    status: 501,
    body: {
      error: `Paid ads adapter '${provider}' not yet configured.`,
      missingSecrets: missing,
      hint: "Add these secrets and implement the provider call in publish-campaign.",
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
    let out;
    if (mode === "paid") {
      const provider =
        ["facebook", "instagram"].includes(body.platform.toLowerCase()) ? "meta-ads" :
        body.platform.toLowerCase() === "tiktok" ? "tiktok-ads" :
        "google-ads";
      out = paidStub(provider);
    } else {
      out = await publishSocial(body);
    }
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
