import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("AYRSHARE_API_KEY");
    if (!key) {
      return new Response(
        JSON.stringify({ error: "Ayrshare is not configured. Add AYRSHARE_API_KEY." }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { platform, text, mediaUrl, scheduleAt } = await req.json();
    if (!platform) throw new Error("platform required");

    const body: Record<string, unknown> = {
      post: text ?? "",
      platforms: [platform.toLowerCase() === "x" ? "twitter" : platform.toLowerCase()],
    };
    if (mediaUrl) body.mediaUrls = [mediaUrl];
    if (scheduleAt) body.scheduleDate = scheduleAt;

    const res = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Ayrshare error", status: res.status, details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ id: data.id ?? data.postId, postUrl: data.postUrl, raw: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
