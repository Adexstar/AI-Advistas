import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";
import type { StockItem } from "@/services/templates/StockImportService";

export const TEMPLATE_SOURCE_PLATFORM = "template-source";

export type TemplateSourceId = "pexels" | "pixabay" | "unsplash" | "freepik" | "lovable";

export type TemplateSource = {
  id: TemplateSourceId;
  label: string;
  secret: string;
  kind: "stock" | "freepik" | "lovable";
};

export const TEMPLATE_SOURCES: TemplateSource[] = [
  { id: "pexels", label: "Pexels", secret: "PEXELS_API_KEY", kind: "stock" },
  { id: "pixabay", label: "Pixabay", secret: "PIXABAY_API_KEY", kind: "stock" },
  { id: "unsplash", label: "Unsplash", secret: "UNSPLASH_ACCESS_KEY", kind: "stock" },
  { id: "freepik", label: "Freepik", secret: "FREEPIK_API_KEY", kind: "freepik" },
  { id: "lovable", label: "Lovable AI", secret: "LOVABLE_API_KEY", kind: "lovable" },
];

export type SavedTemplateKey = {
  id: string;
  provider: TemplateSourceId;
  last4: string;
  accessToken: string;
  updatedAt: string;
};

export type FetchedTemplate = Omit<StockItem, "provider"> & { provider: TemplateSourceId };

export function sourceById(id: string): TemplateSource | undefined {
  return TEMPLATE_SOURCES.find((source) => source.id === id);
}

export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

export function missingKeyMessage(secret: string): string {
  return `${secret} is not set. Save it on this account, or add it as a Supabase secret.`;
}

export function keyRejectedMessage(source: TemplateSource, status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return `${source.label} rejected this key. Check ${source.secret}.`;
  }
  if (status === 429) return `${source.label} accepted the key and then rate-limited the request.`;
  return `${source.label} returned HTTP ${status}. Check ${source.secret} and try again.`;
}

type MediaHit = {
  id?: string;
  url?: string;
  thumbnailUrl?: string;
  provider?: string;
  width?: number;
  height?: number;
  tags?: string[];
  meta?: { user?: string; photographer?: string; link?: string; pageURL?: string };
};

export function mediaHitsToTemplates(source: TemplateSource, hits: MediaHit[]): FetchedTemplate[] {
  return hits.flatMap((hit) => {
    const url = hit.url?.trim();
    if (!url) return [];
    const rawId = String(hit.id ?? "").replace(new RegExp(`^${source.id}-`), "");
    const sourceId = rawId || url;
    const name = (hit.tags ?? []).filter(Boolean).slice(0, 6).join(", ") || `${source.label} ${sourceId}`;
    return [{
      provider: source.id,
      source_id: sourceId,
      name: name.slice(0, 140),
      image_url: url,
      thumbnail_url: hit.thumbnailUrl || url,
      width: Number(hit.width) || 1080,
      height: Number(hit.height) || 1080,
      license: `${source.id}:fetched`,
      author: hit.meta?.user || hit.meta?.photographer,
      page_url: hit.meta?.link || hit.meta?.pageURL,
      tags: hit.tags,
    }];
  });
}

export function freepikPayloadToTemplates(payload: { data?: unknown; templates?: unknown }): FetchedTemplate[] {
  const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.templates) ? payload.templates : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as {
      id?: string | number;
      title?: string;
      name?: string;
      image?: { source?: { url?: string }; url?: string };
      thumbnail?: { url?: string };
      preview?: { url?: string };
      preview_url?: string;
      thumbnail_url?: string;
    };
    const image = item.image?.source?.url || item.image?.url || item.preview?.url || item.preview_url || "";
    const thumb = item.thumbnail?.url || item.thumbnail_url || image;
    if (!image || item.id == null) return [];
    return [{
      provider: "freepik" as const,
      source_id: String(item.id).replace(/^freepik-/, ""),
      name: String(item.title || item.name || `Freepik ${item.id}`).slice(0, 140),
      image_url: image,
      thumbnail_url: thumb,
      width: 1080,
      height: 1080,
      license: "freepik:api",
    }];
  });
}

export function edgeFreepikToTemplates(rows: unknown): FetchedTemplate[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as { id?: string | number; freepik_id?: string | number; name?: string; title?: string; preview_url?: string; thumbnail_url?: string };
    const image = item.preview_url || item.thumbnail_url || "";
    const sourceId = String(item.freepik_id ?? item.id ?? "").replace(/^freepik-/, "");
    if (!image || !sourceId) return [];
    return [{
      provider: "freepik" as const,
      source_id: sourceId,
      name: String(item.name || item.title || `Freepik ${sourceId}`).slice(0, 140),
      image_url: image,
      thumbnail_url: item.thumbnail_url || image,
      width: 1080,
      height: 1080,
      license: "freepik:api",
    }];
  });
}

export function importableTemplates(items: FetchedTemplate[]): StockItem[] {
  return items.flatMap((item) => {
    if (item.provider === "lovable" || !item.image_url.trim()) return [];
    return [{ ...item, provider: item.provider }];
  });
}

export function missingStockSecrets(flags: Partial<Record<"pexels" | "pixabay" | "unsplash", boolean>> | undefined): string[] {
  if (!flags) return [];
  return (["pexels", "pixabay", "unsplash"] as const)
    .filter((id) => flags[id] === false)
    .map((id) => sourceById(id)?.secret ?? id);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const body = await response.json();
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export async function testSavedTemplateKey(source: TemplateSource, key: string): Promise<string> {
  const trimmed = key.trim();
  if (!trimmed) throw new Error(missingKeyMessage(source.secret));
  if (source.id === "lovable") {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${trimmed}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: "Reply with the word OK and nothing else." },
          { role: "user", content: "ping" },
        ],
      }),
    });
    if (!response.ok) throw new Error(keyRejectedMessage(source, response.status));
    return "Lovable accepted LOVABLE_API_KEY.";
  }
  const fetched = await fetchWithSavedKey(source, trimmed, "skincare");
  if (!fetched.length) return `${source.label} accepted ${source.secret}, and that search returned no templates.`;
  return `${source.label} accepted ${source.secret}. ${fetched.length} template${fetched.length === 1 ? "" : "s"} came back.`;
}

export async function fetchWithSavedKey(source: TemplateSource, key: string, query: string): Promise<FetchedTemplate[]> {
  const trimmed = key.trim();
  const term = query.trim();
  if (!trimmed) throw new Error(missingKeyMessage(source.secret));
  if (term.length < 2) throw new Error("Enter at least 2 characters to search.");
  if (source.id === "lovable") {
    throw new Error("Lovable writes copy, not a photo. Use Test saved key, then import from a stock or Freepik result.");
  }

  if (source.id === "pexels") {
    const response = await fetch(`https://api.pexels.com/v1/search?per_page=8&query=${encodeURIComponent(term)}`, {
      headers: { Authorization: trimmed },
    });
    if (!response.ok) throw new Error(keyRejectedMessage(source, response.status));
    const body = await readJson(response);
    const photos = Array.isArray(body.photos) ? body.photos as Array<Record<string, unknown>> : [];
    return mediaHitsToTemplates(source, photos.map((photo) => {
      const src = photo.src as { large?: string; medium?: string } | undefined;
      return {
        id: String(photo.id ?? ""),
        url: src?.large,
        thumbnailUrl: src?.medium,
        width: Number(photo.width),
        height: Number(photo.height),
        tags: [String(photo.alt || term)],
        meta: { photographer: String(photo.photographer || ""), link: String(photo.url || "") },
      };
    }));
  }

  if (source.id === "pixabay") {
    const response = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(trimmed)}&per_page=8&q=${encodeURIComponent(term)}`);
    if (!response.ok) throw new Error(keyRejectedMessage(source, response.status));
    const body = await readJson(response);
    const hits = Array.isArray(body.hits) ? body.hits as Array<Record<string, unknown>> : [];
    return mediaHitsToTemplates(source, hits.map((hit) => ({
      id: String(hit.id ?? ""),
      url: String(hit.largeImageURL || hit.webformatURL || ""),
      thumbnailUrl: String(hit.previewURL || ""),
      width: Number(hit.imageWidth),
      height: Number(hit.imageHeight),
      tags: String(hit.tags || term).split(",").map((tag) => tag.trim()),
      meta: { user: String(hit.user || ""), pageURL: String(hit.pageURL || "") },
    })));
  }

  if (source.id === "unsplash") {
    const response = await fetch(`https://api.unsplash.com/search/photos?per_page=8&query=${encodeURIComponent(term)}`, {
      headers: { Authorization: `Client-ID ${trimmed}` },
    });
    if (!response.ok) throw new Error(keyRejectedMessage(source, response.status));
    const body = await readJson(response);
    const results = Array.isArray(body.results) ? body.results as Array<Record<string, unknown>> : [];
    return mediaHitsToTemplates(source, results.map((photo) => {
      const urls = photo.urls as { regular?: string; small?: string } | undefined;
      const user = photo.user as { name?: string; links?: { html?: string } } | undefined;
      return {
        id: String(photo.id ?? ""),
        url: urls?.regular,
        thumbnailUrl: urls?.small,
        width: Number(photo.width),
        height: Number(photo.height),
        tags: [String(photo.alt_description || term)],
        meta: { user: user?.name, link: user?.links?.html },
      };
    }));
  }

  const response = await fetch(`https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}&limit=8&page=1`, {
    headers: { "x-freepik-api-key": trimmed, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(keyRejectedMessage(source, response.status));
  return freepikPayloadToTemplates(await readJson(response));
}

export async function fetchWithProjectSecret(source: TemplateSource, query: string): Promise<FetchedTemplate[]> {
  const term = query.trim();
  if (term.length < 2 && source.kind !== "lovable") throw new Error("Enter at least 2 characters to search.");
  if (source.id === "lovable") {
    const { data, error } = await supabase.functions.invoke("generate-ai-template", {
      body: {
        prompt: term || "A short skincare headline",
        blueprint: {
          context: { brandName: "AdVista", category: "Beauty", goal: "conversions", platform: "instagram", productName: term || "Serum" },
          layout: { layout: "poster", cta_style: "pill", spacing: "regular", headline_position: "bottom", visual_focus: "product", aspect: { width: 1080, height: 1350 } },
        },
      },
    });
    if (error) throw new Error(await readEdgeError(error, missingKeyMessage(source.secret)));
    if (!data?.success || !data?.copy?.headline) {
      throw new Error(typeof data?.error === "string" ? data.error : missingKeyMessage(source.secret));
    }
    return [{
      provider: "lovable",
      source_id: `copy-${Date.now()}`,
      name: String(data.copy.headline).slice(0, 140),
      image_url: "",
      thumbnail_url: "",
      width: 1080,
      height: 1350,
      license: "lovable:copy",
      tags: [String(data.copy.cta || "")].filter(Boolean),
    }];
  }

  const functionName = source.id === "freepik"
    ? "search-freepik-templates"
    : source.id === "pexels"
      ? "search-pexels"
      : source.id === "pixabay"
        ? "search-pixabay"
        : "search-unsplash";
  const body = source.id === "freepik" ? { query: term, limit: 8 } : { intent: term, query: term };
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw new Error(await readEdgeError(error, missingKeyMessage(source.secret)));
  if (data?.error && !Array.isArray(data?.results) && !Array.isArray(data?.templates)) {
    throw new Error(String(data.error));
  }
  if (source.id === "freepik") {
    if (data?.fallback || (typeof data?.error === "string" && !Array.isArray(data?.templates))) {
      const detail = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : "";
      if (/auth|api key|FREEPIK_API_KEY|rejected/i.test(detail)) throw new Error(keyRejectedMessage(source, 401));
      throw new Error(detail || keyRejectedMessage(source, 401));
    }
    const fromEdge = edgeFreepikToTemplates(data?.templates);
    if (fromEdge.length) return fromEdge;
    return freepikPayloadToTemplates(data ?? {});
  }
  const results = Array.isArray(data?.results) ? data.results as MediaHit[] : [];
  return mediaHitsToTemplates(source, results);
}

export async function loadSavedTemplateKeys(): Promise<SavedTemplateKey[]> {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, provider, access_token, updated_at, is_active")
    .eq("platform", TEMPLATE_SOURCE_PLATFORM)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const source = sourceById(row.provider);
    const token = row.access_token?.trim();
    if (!source || !token) return [];
    return [{
      id: row.id,
      provider: source.id,
      last4: maskKey(token),
      accessToken: token,
      updatedAt: row.updated_at,
    }];
  });
}

export async function saveTemplateKey(source: TemplateSource, key: string): Promise<SavedTemplateKey> {
  const trimmed = key.trim();
  if (trimmed.length < 8) throw new Error(`${source.secret} looks too short to be a real key.`);
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError || !userRes.user) throw new Error("Sign in before saving a key.");
  const userId = userRes.user.id;
  const { error: retireError } = await supabase
    .from("platform_connections")
    .update({ is_active: false })
    .eq("platform", TEMPLATE_SOURCE_PLATFORM)
    .eq("provider", source.id)
    .eq("user_id", userId);
  if (retireError) throw new Error(retireError.message);
  const { data, error } = await supabase
    .from("platform_connections")
    .insert({
      user_id: userId,
      platform: TEMPLATE_SOURCE_PLATFORM,
      provider: source.id,
      account_name: maskKey(trimmed),
      access_token: trimmed,
      is_active: true,
      metadata: { secret_name: source.secret },
    })
    .select("id, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message || "The key was not saved.");
  return { id: data.id, provider: source.id, last4: maskKey(trimmed), accessToken: trimmed, updatedAt: data.updated_at };
}

export async function forgetTemplateKey(id: string): Promise<void> {
  const { error } = await supabase.from("platform_connections").update({ is_active: false, access_token: null }).eq("id", id);
  if (error) throw new Error(error.message);
}
