import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type PlaygroundField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  default?: string;
  placeholder?: string;
  options?: string[];
};

type Provider = {
  id: string;
  label: string;
  category: "search" | "generate-image" | "generate-video" | "media" | "brand" | "publishing" | "ai";
  envVars: string[];
  testFn?: string;
  testBody?: Record<string, unknown>;
  playgroundFn?: string;
  playgroundKind?: "image" | "video" | "search" | "json";
  playgroundFields?: PlaygroundField[];
  docsUrl?: string;
};

const AI_TEST_BODY = {
  systemPrompt: "Reply with only the word OK",
  userPrompt: "test",
  specialist: "general",
  maxTokens: 10,
};

const AI_PLAYGROUND_FIELDS: PlaygroundField[] = [
  { key: "systemPrompt", label: "System prompt", type: "textarea", default: "You are a helpful assistant." },
  { key: "userPrompt", label: "User prompt", type: "textarea", default: "Explain what you do in one sentence." },
  { key: "temperature", label: "Temperature", type: "text", default: "0.7" },
  { key: "maxTokens", label: "Max tokens", type: "text", default: "200" },
];

const PROVIDERS: Provider[] = [
  {
    id: "pexels", label: "Pexels", category: "search", envVars: ["PEXELS_API_KEY"],
    testFn: "search-pexels", testBody: { intent: "sunset" },
    playgroundFn: "search-pexels", playgroundKind: "search",
    playgroundFields: [{ key: "intent", label: "Query", type: "text", default: "sunset over mountains" }],
    docsUrl: "https://www.pexels.com/api/",
  },
  {
    id: "pixabay", label: "Pixabay", category: "search", envVars: ["PIXABAY_API_KEY"],
    testFn: "search-pixabay", testBody: { intent: "sunset" },
    playgroundFn: "search-pixabay", playgroundKind: "search",
    playgroundFields: [{ key: "intent", label: "Query", type: "text", default: "coffee shop" }],
    docsUrl: "https://pixabay.com/api/docs/",
  },
  {
    id: "unsplash", label: "Unsplash", category: "search", envVars: ["UNSPLASH_ACCESS_KEY"],
    testFn: "search-unsplash", testBody: { intent: "sunset" },
    playgroundFn: "search-unsplash", playgroundKind: "search",
    playgroundFields: [{ key: "intent", label: "Query", type: "text", default: "minimal workspace" }],
    docsUrl: "https://unsplash.com/developers",
  },
  {
    id: "freepik", label: "Freepik / Magnific", category: "search", envVars: ["FREEPIK_API_KEY"],
    testFn: "search-freepik-templates", testBody: { query: "banner" },
    playgroundFn: "search-freepik-templates", playgroundKind: "search",
    playgroundFields: [{ key: "query", label: "Query", type: "text", default: "instagram banner" }],
    docsUrl: "https://freepik.com/api",
  },
  {
    id: "brandfetch", label: "Brandfetch", category: "brand", envVars: ["BRANDFETCH_API_KEY"],
    testFn: "brandfetch-import", testBody: { url: "https://apple.com" },
    playgroundFn: "brandfetch-import", playgroundKind: "json",
    playgroundFields: [{ key: "url", label: "Domain URL", type: "text", default: "https://apple.com" }],
    docsUrl: "https://brandfetch.com/developers",
  },
  {
    id: "cloudinary", label: "Cloudinary", category: "media", envVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    testFn: "test-cloudinary",
    docsUrl: "https://cloudinary.com/documentation",
  },
  {
    id: "meta", label: "Meta (Facebook / Instagram)", category: "publishing",
    envVars: ["META_ACCESS_TOKEN", "META_PAGE_ID", "META_AD_ACCOUNT_ID"],
    testFn: "publish-campaign", testBody: { platform: "facebook", mode: "social", text: "AdVista test" },
    docsUrl: "https://developers.facebook.com/docs/marketing-apis/",
  },
  {
    id: "tiktok", label: "TikTok", category: "publishing",
    envVars: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
    testFn: "publish-campaign", testBody: { platform: "tiktok", mode: "social", text: "AdVista test" },
    docsUrl: "https://developers.tiktok.com/doc/tiktok-api-v2-overview/",
  },
  {
    id: "google", label: "Google Ads / YouTube", category: "publishing",
    envVars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
    testFn: "publish-campaign", testBody: { platform: "google", mode: "paid", text: "AdVista test" },
    docsUrl: "https://developers.google.com/google-ads/api/docs/start",
  },
  {
    id: "leonardo", label: "Leonardo AI", category: "generate-image", envVars: ["LEONARDO_API_KEY"],
    testFn: "generate-leonardo", testBody: { prompt: "a simple test — solid blue background", width: 512, height: 512 },
    playgroundFn: "generate-leonardo", playgroundKind: "image",
    playgroundFields: [
      { key: "prompt", label: "Prompt", type: "textarea", default: "cinematic product shot of a sneaker on marble, studio light" },
      { key: "width", label: "Width", type: "text", default: "1024" },
      { key: "height", label: "Height", type: "text", default: "1024" },
    ],
    docsUrl: "https://leonardo.ai/api",
  },
  {
    id: "ideogram", label: "Ideogram", category: "generate-image", envVars: ["IDEOGRAM_API_KEY"],
    testFn: "generate-ideogram", testBody: { prompt: "a simple test — solid green background", aspect_ratio: "ASPECT_1_1" },
    playgroundFn: "generate-ideogram", playgroundKind: "image",
    playgroundFields: [
      { key: "prompt", label: "Prompt", type: "textarea", default: "bold poster that says SALE 50% OFF, neon typography" },
      { key: "aspect_ratio", label: "Aspect", type: "select", default: "ASPECT_1_1", options: ["ASPECT_1_1", "ASPECT_16_9", "ASPECT_9_16", "ASPECT_4_5"] },
    ],
    docsUrl: "https://ideogram.ai/api",
  },
  {
    id: "runway", label: "Runway", category: "generate-video", envVars: ["RUNWAY_API_KEY"],
    testFn: "generate-runway", testBody: { prompt: "a simple test — slow zoom on a solid gray wall" },
    playgroundFn: "generate-runway", playgroundKind: "video",
    playgroundFields: [{ key: "prompt", label: "Prompt", type: "textarea", default: "slow dolly-in on a coffee cup, cinematic" }],
    docsUrl: "https://runwayml.com/api",
  },
  {
    id: "kling", label: "Kling", category: "generate-video", envVars: ["KLING_API_KEY"],
    testFn: "generate-kling", testBody: { prompt: "a simple test — a static shot of a blue wall" },
    playgroundFn: "generate-kling", playgroundKind: "video",
    playgroundFields: [{ key: "prompt", label: "Prompt", type: "textarea", default: "a cat walking on a beach at sunset" }],
    docsUrl: "https://klingai.com/",
  },
  {
    id: "veo", label: "Veo", category: "generate-video", envVars: ["VEO_API_KEY"],
    testFn: "generate-veo", testBody: { prompt: "a simple test — a static shot of a red wall" },
    playgroundFn: "generate-veo", playgroundKind: "video",
    playgroundFields: [{ key: "prompt", label: "Prompt", type: "textarea", default: "aerial shot of a city at night" }],
    docsUrl: "https://deepmind.google/technologies/veo/",
  },
  {
    id: "openai", label: "OpenAI", category: "ai", envVars: ["OPENAI_API_KEY"],
    testFn: "ai-gateway", testBody: { ...AI_TEST_BODY, preferredProvider: "openai" },
    playgroundFn: "ai-gateway", playgroundKind: "json",
    playgroundFields: AI_PLAYGROUND_FIELDS,
    docsUrl: "https://platform.openai.com/",
  },
  {
    id: "gemini", label: "Google Gemini", category: "ai", envVars: ["GOOGLE_GEMINI_API_KEY"],
    testFn: "ai-gateway", testBody: { ...AI_TEST_BODY, preferredProvider: "gemini" },
    playgroundFn: "ai-gateway", playgroundKind: "json",
    playgroundFields: AI_PLAYGROUND_FIELDS,
    docsUrl: "https://ai.google.dev/",
  },
  {
    id: "groq", label: "Groq", category: "ai", envVars: ["GROQ_API_KEY"],
    testFn: "ai-gateway", testBody: { ...AI_TEST_BODY, preferredProvider: "groq" },
    playgroundFn: "ai-gateway", playgroundKind: "json",
    playgroundFields: AI_PLAYGROUND_FIELDS,
    docsUrl: "https://groq.com/",
  },
  {
    id: "claude", label: "Anthropic Claude", category: "ai", envVars: ["ANTHROPIC_API_KEY"],
    testFn: "ai-gateway", testBody: { ...AI_TEST_BODY, preferredProvider: "claude" },
    playgroundFn: "ai-gateway", playgroundKind: "json",
    playgroundFields: AI_PLAYGROUND_FIELDS,
    docsUrl: "https://anthropic.com/",
  },
  { id: "lovable", label: "Lovable AI Gateway", category: "ai", envVars: ["LOVABLE_API_KEY"] },
];

async function assertAuthenticated(req: Request): Promise<{ ok: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return { ok: false, error: "no auth" };
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return { ok: false, error: "unauthenticated" };
  return { ok: true };
}

async function invokeFn(fn: string, body: unknown, auth: string) {
  const started = Date.now();
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, durationMs: Date.now() - started, json };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await assertAuthenticated(req);
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: gate.error ?? "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as any));
  const action = body.action ?? "list";
  const authHeader = req.headers.get("Authorization") ?? "";
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (action === "list") {
    const list = PROVIDERS.map((p) => ({
      ...p,
      envStatus: p.envVars.map((v) => ({ name: v, present: !!Deno.env.get(v) })),
      configured: p.envVars.every((v) => !!Deno.env.get(v)),
    }));
    return new Response(JSON.stringify({ providers: list }), { headers: jsonHeaders });
  }

  if (action === "test" || action === "playground") {
    const id = String(body.id ?? "");
    const p = PROVIDERS.find((x) => x.id === id);
    if (!p) return new Response(JSON.stringify({ error: "unknown provider" }), { status: 404, headers: jsonHeaders });

    const missing = p.envVars.filter((v) => !Deno.env.get(v));
    if (missing.length) {
      return new Response(JSON.stringify({ ok: false, error: "Missing env vars", missing }), { headers: jsonHeaders });
    }

    const fn = action === "playground" ? (p.playgroundFn ?? p.testFn) : (p.testFn ?? p.playgroundFn);
    if (!fn) {
      return new Response(JSON.stringify({ ok: true, note: "Configured. No adapter wired." }), { headers: jsonHeaders });
    }

    const payload = action === "playground" ? (body.input ?? {}) : (p.testBody ?? {});
    try {
      const r = await invokeFn(fn, payload, authHeader);
      const results = Array.isArray(r.json?.results) ? r.json.results : undefined;
      return new Response(JSON.stringify({
        ok: r.ok,
        status: r.status,
        durationMs: r.durationMs,
        count: results?.length,
        results,
        data: r.json,
        error: r.ok ? undefined : (r.json?.error ?? `HTTP ${r.status}`),
      }), { headers: jsonHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { headers: jsonHeaders });
    }
  }

  return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: jsonHeaders });
});
