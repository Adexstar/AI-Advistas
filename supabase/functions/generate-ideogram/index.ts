import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("IDEOGRAM_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "IDEOGRAM_API_KEY not configured" }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { prompt, aspect_ratio = "ASPECT_1_1", model = "V_2" } = await req.json();
    if (!prompt) throw new Error("prompt required");

    const res = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: { "Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ image_request: { prompt, aspect_ratio, model } }),
    });
    if (!res.ok) throw new Error(`Ideogram ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const item = json.data?.[0];
    return new Response(JSON.stringify({
      id: crypto.randomUUID(),
      url: item?.url,
      provider: "ideogram",
      kind: "image",
      meta: { prompt, resolution: item?.resolution },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
