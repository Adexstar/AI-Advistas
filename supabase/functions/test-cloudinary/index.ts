import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({
          error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=1`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      let detail: unknown;
      try { detail = JSON.parse(body); } catch { detail = body; }
      return new Response(
        JSON.stringify({ error: "Cloudinary credential validation failed", status: res.status, details: detail }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({
        ok: true,
        status: res.status,
        data: { totalImages: data.total_count, cloudName },
        note: "Cloudinary credentials are valid",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
