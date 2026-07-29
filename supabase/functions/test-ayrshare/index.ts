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
        JSON.stringify({ error: "Ayrshare API key not configured. Add AYRSHARE_API_KEY." }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch("https://app.ayrshare.com/api/user", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      const body = await res.text();
      let detail: unknown;
      try { detail = JSON.parse(body); } catch { detail = body; }
      return new Response(
        JSON.stringify({ error: "Ayrshare key validation failed", status: res.status, details: detail }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ ok: true, status: res.status, data, note: "Ayrshare API key is valid" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
