import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type Provider = {
  id: string;
  label: string;
  category: "search" | "generate-image" | "generate-video" | "media" | "brand" | "publishing" | "ai";
  envVars: string[];
  testFn?: string; // edge function to invoke as smoke test
  testBody?: Record<string, unknown>;
  docsUrl?: string;
};

const PROVIDERS: Provider[] = [
  { id: "pexels", label: "Pexels", category: "search", envVars: ["PEXELS_API_KEY"], testFn: "search-pexels", testBody: { intent: "sunset" }, docsUrl: "https://www.pexels.com/api/" },
  { id: "pixabay", label: "Pixabay", category: "search", envVars: ["PIXABAY_API_KEY"], testFn: "search-pixabay", testBody: { intent: "sunset" }, docsUrl: "https://pixabay.com/api/docs/" },
  { id: "unsplash", label: "Unsplash", category: "search", envVars: ["UNSPLASH_ACCESS_KEY"], testFn: "search-unsplash", testBody: { intent: "sunset" }, docsUrl: "https://unsplash.com/developers" },
  { id: "freepik", label: "Freepik / Magnific", category: "search", envVars: ["FREEPIK_API_KEY"], testFn: "search-freepik-templates", testBody: { query: "banner" }, docsUrl: "https://freepik.com/api" },
  { id: "brandfetch", label: "Brandfetch", category: "brand", envVars: ["BRANDFETCH_API_KEY"], docsUrl: "https://brandfetch.com/developers" },
  { id: "leonardo", label: "Leonardo AI", category: "generate-image", envVars: ["LEONARDO_API_KEY"], docsUrl: "https://leonardo.ai/api" },
  { id: "ideogram", label: "Ideogram", category: "generate-image", envVars: ["IDEOGRAM_API_KEY"], docsUrl: "https://ideogram.ai/api" },
  { id: "runway", label: "Runway", category: "generate-video", envVars: ["RUNWARE_API_KEY"], docsUrl: "https://runwayml.com/api" },
  { id: "kling", label: "Kling", category: "generate-video", envVars: ["KLING_API_KEY"], docsUrl: "https://klingai.com/" },
  { id: "veo", label: "Veo", category: "generate-video", envVars: ["VEO_API_KEY", "GOOGLE_GEMINI_API_KEY"], docsUrl: "https://deepmind.google/technologies/veo/" },
  { id: "cloudinary", label: "Cloudinary", category: "media", envVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"], docsUrl: "https://cloudinary.com/documentation" },
  { id: "ayrshare", label: "Ayrshare", category: "publishing", envVars: ["AYRSHARE_API_KEY"], docsUrl: "https://ayrshare.com/docs" },
  { id: "openai", label: "OpenAI", category: "ai", envVars: ["OPENAI_API_KEY"], docsUrl: "https://platform.openai.com/" },
  { id: "gemini", label: "Google Gemini", category: "ai", envVars: ["GOOGLE_GEMINI_API_KEY"], docsUrl: "https://ai.google.dev/" },
  { id: "groq", label: "Groq", category: "ai", envVars: ["GROQ_API_KEY"], docsUrl: "https://groq.com/" },
  { id: "lovable", label: "Lovable AI Gateway", category: "ai", envVars: ["LOVABLE_API_KEY"] },
];

async function assertAdmin(req: Request): Promise<{ ok: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return { ok: false, error: "no auth" };
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return { ok: false, error: "unauthenticated" };
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) return { ok: false, error: "not admin" };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await assertAdmin(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.error ?? "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as any));
  const action = body.action ?? "list";

  if (action === "list") {
    const list = PROVIDERS.map((p) => ({
      ...p,
      envStatus: p.envVars.map((v) => ({ name: v, present: !!Deno.env.get(v) })),
      configured: p.envVars.every((v) => !!Deno.env.get(v)),
    }));
    return new Response(JSON.stringify({ providers: list }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "test") {
    const id = String(body.id ?? "");
    const p = PROVIDERS.find((x) => x.id === id);
    if (!p) return new Response(JSON.stringify({ error: "unknown provider" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const envOk = p.envVars.every((v) => !!Deno.env.get(v));
    if (!envOk) {
      return new Response(JSON.stringify({ ok: false, error: "Missing env vars", missing: p.envVars.filter((v) => !Deno.env.get(v)) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!p.testFn) {
      return new Response(JSON.stringify({ ok: true, note: "Configured. No automated test wired for this provider." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const started = Date.now();
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${p.testFn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") ?? "",
          apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
        body: JSON.stringify(p.testBody ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      const durationMs = Date.now() - started;
      const count = Array.isArray(json?.results) ? json.results.length : undefined;
      return new Response(JSON.stringify({ ok: res.ok, status: res.status, durationMs, count, sample: json?.results?.[0], error: json?.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
