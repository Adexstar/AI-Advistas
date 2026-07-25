// Unified 24h cache for external provider search results.
// Adapters call this instead of hitting provider APIs directly on every request.
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

async function hashKey(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function withProviderCache<T>(
  provider: string,
  keyParts: unknown,
  loader: () => Promise<T>,
): Promise<T> {
  const cacheKey = await hashKey(JSON.stringify(keyParts));
  try {
    const { data } = await db
      .from("provider_search_cache")
      .select("results, expires_at")
      .eq("provider", provider)
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (data && new Date(data.expires_at).getTime() > Date.now()) {
      return data.results as T;
    }
  } catch {
    /* cache read failure — fall through to loader */
  }

  const fresh = await loader();

  // Best-effort write; RLS restricts writes to service_role, so this may
  // no-op for anon/authenticated clients. Edge functions perform the
  // authoritative cache writes.
  try {
    await db
      .from("provider_search_cache")
      .upsert(
        {
          provider,
          cache_key: cacheKey,
          results: fresh as unknown,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "provider,cache_key" },
      );
  } catch {
    /* ignore */
  }

  return fresh;
}
