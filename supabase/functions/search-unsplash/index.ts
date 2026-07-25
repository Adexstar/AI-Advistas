import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

async function cacheKey(input: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY not configured", results: [] }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.intent ?? body.query ?? "").trim();
    if (!query) throw new Error("intent required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ck = await cacheKey({ p: "unsplash", q: query });
    const { data: cached } = await supabase
      .from("provider_search_cache").select("results, expires_at")
      .eq("provider", "unsplash").eq("cache_key", ck).maybeSingle();
    if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
      return new Response(JSON.stringify({ results: cached.results, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=24&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const json = await res.json();
    const results = (json.results ?? []).map((p: any) => ({
      id: `unsplash-${p.id}`,
      url: p.urls?.regular,
      thumbnailUrl: p.urls?.thumb,
      provider: "unsplash", kind: "image",
      width: p.width, height: p.height,
      tags: (p.tags ?? []).map((t: any) => t.title),
      meta: { user: p.user?.name, link: p.links?.html },
    }));

    await supabase.from("provider_search_cache").upsert({
      provider: "unsplash", cache_key: ck, results,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }, { onConflict: "provider,cache_key" });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, results: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
