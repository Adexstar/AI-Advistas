import { json, requireUser } from "../_shared/guard.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Reads the public title and caption of an Instagram or TikTok post.
// It does not watch the video. The caller says so in the UI.

const HOSTS = [/(^|\.)instagram\.com$/i, /(^|\.)tiktok\.com$/i];

function meta(html: string, key: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return "";
}

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireUser(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  let target: URL;
  try {
    target = new URL(String(body.url ?? ""));
  } catch {
    return json({ error: "That does not look like a link." }, 400);
  }
  if (target.protocol !== "https:" || !HOSTS.some((pattern) => pattern.test(target.hostname))) {
    return json({ error: "Only Instagram and TikTok links work here." }, 400);
  }

  try {
    const response = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AdVistaBot/1.0)", "Accept-Language": "en" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const html = (await response.text()).slice(0, 400_000);
    const title = meta(html, "og:title") || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
    const description = meta(html, "og:description") || meta(html, "description");
    if (!title && !description) {
      return json({ error: "The post could not be read. It may be private or blocked." }, 422);
    }
    return json({ title, description });
  } catch {
    return json({ error: "The post could not be reached." }, 502);
  }
});
