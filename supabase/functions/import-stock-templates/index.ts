// Admin-only stock template importer.
// Modes:
//   search -> normalized provider results (nothing written)
//   import -> writes selected normalized items into public.templates as PENDING
//   seed   -> bulk starter pack across all providers, all PENDING
// Providers: Pexels, Unsplash, and Pixabay.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PEXELS_KEY = Deno.env.get("PEXELS_API_KEY");
const UNSPLASH_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
const PIXABAY_KEY = Deno.env.get("PIXABAY_API_KEY");

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface StockItem {
  provider: "pexels" | "unsplash" | "pixabay";
  source_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  license: string;
  author?: string;
  author_url?: string;
  page_url?: string;
  download_location?: string;
  tags?: string[];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- providers ----------

async function searchPexels(query: string, limit: number): Promise<StockItem[]> {
  if (!PEXELS_KEY) return [];
  const params = new URLSearchParams({ query, per_page: String(limit) });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!res.ok) {
    console.error("pexels search failed", res.status, await res.text());
    return [];
  }
  const body = await res.json();
  const rows = (body?.photos ?? []) as any[];
  return rows.map((p) => ({
    provider: "pexels" as const,
    source_id: String(p.id),
    name: String(p.alt || `Pexels photo ${p.id}`).slice(0, 140),
    image_url: p.src?.large2x ?? p.src?.large ?? p.src?.original ?? "",
    thumbnail_url: p.src?.medium ?? p.src?.small ?? p.src?.large ?? "",
    width: Number(p.width) || 1080,
    height: Number(p.height) || 1080,
    license: "pexels:free",
    author: p.photographer,
    page_url: p.url,
  })).filter((i) => i.image_url);
}

async function searchUnsplash(query: string, limit: number): Promise<StockItem[]> {
  if (!UNSPLASH_KEY) return [];
  const params = new URLSearchParams({ query, per_page: String(Math.min(limit, 30)) });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, "Accept-Version": "v1" },
  });
  if (!res.ok) {
    console.error("unsplash search failed", res.status, await res.text());
    return [];
  }
  const body = await res.json();
  return ((body?.results ?? []) as any[]).map((p) => {
    const authorUrl = p.user?.links?.html
      ? `${p.user.links.html}?utm_source=advista&utm_medium=referral`
      : undefined;
    return {
      provider: "unsplash" as const,
      source_id: String(p.id),
      name: String(p.alt_description || p.description || `Unsplash photo ${p.id}`).slice(0, 140),
      image_url: p.urls?.regular ?? p.urls?.full ?? "",
      thumbnail_url: p.urls?.small ?? p.urls?.thumb ?? "",
      width: Number(p.width) || 1080,
      height: Number(p.height) || 1080,
      license: "unsplash:license",
      author: p.user?.name,
      author_url: authorUrl,
      page_url: p.links?.html,
      download_location: p.links?.download_location,
      tags: (p.tags ?? []).slice(0, 8).map((tag: any) => tag.title).filter(Boolean),
    };
  }).filter((item) => item.image_url);
}

async function searchPixabay(query: string, limit: number): Promise<StockItem[]> {
  if (!PIXABAY_KEY) return [];
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: query,
    image_type: "all",
    per_page: String(Math.min(limit, 200)),
  });
  const res = await fetch(`https://pixabay.com/api/?${params}`);
  if (!res.ok) {
    console.error("pixabay search failed", res.status, await res.text());
    return [];
  }
  const body = await res.json();
  return ((body?.hits ?? []) as any[]).map((image) => ({
    provider: "pixabay" as const,
    source_id: String(image.id),
    name: String(image.tags || `Pixabay image ${image.id}`).slice(0, 140),
    image_url: image.largeImageURL ?? image.webformatURL ?? "",
    thumbnail_url: image.previewURL ?? image.webformatURL ?? "",
    width: Number(image.imageWidth) || 1080,
    height: Number(image.imageHeight) || 1080,
    license: "pixabay:content-license",
    author: image.user,
    page_url: image.pageURL,
    tags: String(image.tags ?? "").split(",").map((tag: string) => tag.trim()).filter(Boolean).slice(0, 8),
  })).filter((item) => item.image_url);
}

async function searchProviders(providers: string[], query: string, limit: number) {
  const jobs: Promise<StockItem[]>[] = [];
  if (providers.includes("pexels")) jobs.push(searchPexels(query, limit).catch(() => []));
  if (providers.includes("unsplash")) jobs.push(searchUnsplash(query, limit).catch(() => []));
  if (providers.includes("pixabay")) jobs.push(searchPixabay(query, limit).catch(() => []));
  const out = await Promise.all(jobs);
  return out.flat();
}

// ---------- cache ----------

async function cachedSearch(
  admin: ReturnType<typeof createClient>,
  providers: string[],
  query: string,
  limit: number,
): Promise<StockItem[]> {
  const cacheKey = `${providers.slice().sort().join("+")}|${query.toLowerCase()}|${limit}`;
  const { data: hit } = await admin
    .from("provider_search_cache")
    .select("results, expires_at")
    .eq("provider", "stock-templates")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  if (hit && new Date(hit.expires_at as string).getTime() > Date.now()) {
    return hit.results as unknown as StockItem[];
  }
  const results = await searchProviders(providers, query, limit);
  if (results.length) {
    try {
      await admin.from("provider_search_cache").upsert(
        {
          provider: "stock-templates",
          cache_key: cacheKey,
          results: results as unknown as Record<string, unknown>,
          expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        },
        { onConflict: "provider,cache_key" },
      );
    } catch (err) {
      console.warn("cache write skipped", err);
    }
  }
  return results;
}

// ---------- template building ----------

function pickFormat(w: number, h: number) {
  const ratio = w / Math.max(h, 1);
  if (ratio > 1.35) return { format: "landscape", width: 1200, height: 628 };
  if (ratio < 0.72) return { format: "story", width: 1080, height: 1920 };
  if (ratio < 0.95) return { format: "portrait", width: 1080, height: 1350 };
  return { format: "square", width: 1080, height: 1080 };
}

function buildTemplateJSON(item: StockItem, W: number, H: number) {
  // Cover-fit the source image onto the artboard.
  const scale = Math.max(W / Math.max(item.width, 1), H / Math.max(item.height, 1));
  const pad = Math.round(W * 0.08);

  return {
    version: "6.0.0",
    background: "#0b0b0f",
    width: W,
    height: H,
    objects: [
      {
        type: "image",
        name: "Background image",
        src: item.image_url,
        crossOrigin: "anonymous",
        left: W / 2,
        top: H / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
        lockMovementX: true,
        lockMovementY: true,
        meta: { role: "hero_image", variable: "hero_image", locked: true },
      },
      {
        type: "rect",
        name: "Contrast scrim",
        left: 0,
        top: H * 0.42,
        width: W,
        height: H * 0.58,
        fill: "rgba(8,8,14,0.62)",
        selectable: true,
        meta: { role: "scrim" },
      },
      {
        type: "textbox",
        name: "Headline",
        text: "{{headline}}",
        left: pad,
        top: Math.round(H * 0.56),
        width: W - pad * 2,
        fontSize: Math.round(W * 0.085),
        fontWeight: "700",
        fontFamily: "{{brand.font}}",
        fill: "#ffffff",
        lineHeight: 1.1,
        editable: true,
        meta: { role: "headline", variable: "headline" },
      },
      {
        type: "textbox",
        name: "Subheadline",
        text: "{{subheadline}}",
        left: pad,
        top: Math.round(H * 0.72),
        width: W - pad * 2,
        fontSize: Math.round(W * 0.042),
        fontFamily: "{{brand.font}}",
        fill: "rgba(255,255,255,0.86)",
        lineHeight: 1.25,
        editable: true,
        meta: { role: "subheadline", variable: "subheadline" },
      },
      {
        type: "rect",
        name: "CTA background",
        left: pad,
        top: Math.round(H * 0.83),
        width: Math.round(W * 0.42),
        height: Math.round(H * 0.075),
        rx: Math.round(H * 0.0375),
        ry: Math.round(H * 0.0375),
        fill: "{{brand.primaryColor}}",
        meta: { role: "cta_bg" },
      },
      {
        type: "textbox",
        name: "CTA",
        text: "{{cta}}",
        left: pad,
        top: Math.round(H * 0.848),
        width: Math.round(W * 0.42),
        textAlign: "center",
        fontSize: Math.round(W * 0.036),
        fontWeight: "600",
        fontFamily: "{{brand.font}}",
        fill: "#ffffff",
        editable: true,
        meta: { role: "cta", variable: "cta" },
      },
    ],
  };
}

function toTemplateRow(item: StockItem, category: string | null, userId: string) {
  const { format, width, height } = pickFormat(item.width, item.height);
  return {
    name: item.name,
    description: item.author
      ? `Photo by ${item.author}${item.provider === "unsplash" ? " on Unsplash" : ` on ${item.provider === "pexels" ? "Pexels" : "Pixabay"}`}`
      : null,
    category,
    platform: format === "story" ? "Instagram Story" : "Instagram",
    objective: "awareness",
    format,
    width,
    height,
    preview_url: item.image_url,
    thumbnail_url: item.thumbnail_url || item.image_url,
    template_json: buildTemplateJSON(item, width, height),
    ai_tags: item.tags ?? (category ? [category] : []),
    industry_tags: category ? [category] : [],
    brand_compatible: true,
    premium: false,
    popularity_score: 0,
    is_active: false,
    review_status: "pending",
    template_source: item.provider,
    source: item.provider,
    source_id: item.source_id,
    source_license: item.license,
    external_id: item.source_id,
    imported_at: new Date().toISOString(),
    created_by: userId,
    metadata: {
      author: item.author ?? null,
      author_url: item.author_url ?? null,
      page_url: item.page_url ?? null,
      download_location: item.download_location ?? null,
      original_width: item.width,
      original_height: item.height,
      recommended_platforms: ["Instagram", "Facebook"],
    },
  };
}

const SEED_QUERIES: { query: string; category: string }[] = [
  { query: "beauty skincare product", category: "Beauty" },
  { query: "fashion model studio", category: "Fashion" },
  { query: "restaurant food plating", category: "Restaurant & Food" },
  { query: "gym fitness training", category: "Fitness" },
  { query: "modern house real estate", category: "Real Estate" },
  { query: "software startup workspace", category: "SaaS & Technology" },
  { query: "online shopping product", category: "E-commerce" },
  { query: "healthcare clinic doctor", category: "Healthcare" },
  { query: "education learning classroom", category: "Education" },
  { query: "automotive car dealership", category: "Automotive" },
  { query: "finance fintech business", category: "Finance" },
  { query: "travel destination resort", category: "Travel" },
  { query: "creative marketing agency", category: "Agency" },
  { query: "seasonal holiday promotion", category: "Seasonal" },
  { query: "professional business team", category: "Business" },
];

async function trackUnsplashDownloads(items: StockItem[]) {
  if (!UNSPLASH_KEY) return;
  await Promise.all(items.filter((item) => item.provider === "unsplash" && item.download_location).map(async (item) => {
    try {
      const url = new URL(item.download_location!);
      if (url.origin !== "https://api.unsplash.com") return;
      await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, "Accept-Version": "v1" } });
    } catch (err) {
      console.warn("unsplash download tracking failed", err);
    }
  }));
}

// ---------- handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const mode = String(body.mode ?? "search");
    const validProviders = ["pexels", "unsplash", "pixabay"];
    const providers: string[] = Array.isArray(body.providers) && body.providers.length
      ? [...new Set(body.providers.filter((p: string) => validProviders.includes(p)))]
      : validProviders;

    if (mode === "search") {
      const query = String(body.query ?? "").trim();
      if (!query) return json({ error: "query is required" }, 400);
      const limit = Math.min(Math.max(Number(body.limit) || 16, 1), 40);
      const results = await cachedSearch(admin, providers, query, limit);
      return json({
        results,
        providers: {
          pexels: !!PEXELS_KEY,
          unsplash: !!UNSPLASH_KEY,
          pixabay: !!PIXABAY_KEY,
        },
      });
    }

    if (mode === "import" || mode === "seed") {
      let items: StockItem[] = [];
      let categoryOf = new Map<string, string | null>();

      if (mode === "import") {
        items = (Array.isArray(body.items) ? body.items : []) as StockItem[];
        if (!items.length) return json({ error: "items is required" }, 400);
        items = items.slice(0, 60);
        const cat = body.category ? String(body.category) : null;
        items.forEach((i) => categoryOf.set(`${i.provider}:${i.source_id}`, cat));
      } else {
        const perQuery = Math.min(Math.max(Number(body.perQuery) || 5, 1), 12);
        for (const q of SEED_QUERIES) {
          const found = await cachedSearch(admin, providers, q.query, perQuery);
          for (const f of found) {
            items.push(f);
            categoryOf.set(`${f.provider}:${f.source_id}`, q.category);
          }
        }
      }

      // Dedupe within the batch and against existing rows.
      const seen = new Set<string>();
      items = items.filter((i) => {
        const k = `${i.provider}:${i.source_id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return !!i.image_url;
      });

      const { data: existing } = await admin
        .from("templates")
        .select("source, source_id")
        .in("source", providers)
        .in("source_id", items.map((i) => i.source_id));
      const existingKeys = new Set((existing ?? []).map((e: any) => `${e.source}:${e.source_id}`));

      const fresh = items.filter((i) => !existingKeys.has(`${i.provider}:${i.source_id}`));
      if (!fresh.length) {
        return json({ imported: 0, skipped: items.length, message: "Everything was already imported" });
      }

      const rows = fresh.map((i) =>
        toTemplateRow(i, categoryOf.get(`${i.provider}:${i.source_id}`) ?? null, userData.user.id)
      );

      const { data: inserted, error: insErr } = await admin
        .from("templates")
        .insert(rows)
        .select("id");
      if (insErr) {
        console.error("insert failed", insErr);
        return json({ error: insErr.message }, 500);
      }

      await trackUnsplashDownloads(fresh);

      return json({
        imported: inserted?.length ?? 0,
        skipped: items.length - fresh.length,
      });
    }

    return json({ error: `Unknown mode: ${mode}` }, 400);
  } catch (err) {
    console.error("import-stock-templates error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
