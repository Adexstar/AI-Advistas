import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("BRANDFETCH_API_KEY");
    if (!key) {
      return new Response(
        JSON.stringify({ error: "Brandfetch is not configured. Add BRANDFETCH_API_KEY." }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { url } = await req.json();
    if (!url) throw new Error("url required");
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const body = await res.text();
      return new Response(JSON.stringify({ error: "Brandfetch error", status: res.status, details: body }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bf = await res.json();
    const normalized = {
      name: bf.name ?? domain,
      colors: (bf.colors ?? []).map((c: any) => c.hex).filter(Boolean),
      fonts: (bf.fonts ?? []).map((f: any) => f.name).filter(Boolean),
      logo_url: bf.logos?.[0]?.formats?.[0]?.src,
      source: "brandfetch",
      source_domain: domain,
    };
    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
