import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("LEONARDO_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LEONARDO_API_KEY not configured" }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const { prompt, width = 1024, height = 1024, modelId = "aa77f04e-3eec-4034-9c07-d0f619684628" } = await req.json();
    if (!prompt) throw new Error("prompt required");

    const kick = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width, height, modelId, num_images: 1 }),
    });
    if (!kick.ok) throw new Error(`Leonardo ${kick.status}: ${await kick.text()}`);
    const kickJson = await kick.json();
    const genId = kickJson.sdGenerationJob?.generationId;
    if (!genId) throw new Error("no generation id");

    // Poll for completion (up to ~30s)
    let url: string | undefined;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const pj = await poll.json();
      const status = pj.generations_by_pk?.status;
      if (status === "COMPLETE") {
        url = pj.generations_by_pk?.generated_images?.[0]?.url;
        break;
      }
    }
    if (!url) throw new Error("timeout waiting for Leonardo generation");

    return new Response(JSON.stringify({
      id: crypto.randomUUID(), url, provider: "leonardo", kind: "image",
      meta: { prompt, generationId: genId },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
