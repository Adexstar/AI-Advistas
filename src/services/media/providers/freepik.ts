import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";
import type { MediaAsset, MediaProvider, MediaSearchContext } from "../types";

export const freepikProvider: MediaProvider = {
  id: "freepik",
  isConfigured: () => true, // server-held key
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    const { data, error } = await supabase.functions.invoke("search-freepik-templates", {
      body: { query: ctx.intent, category: ctx.category, platform: ctx.platform },
    });
    if (error) throw new Error(await readEdgeError(error, "Freepik search is unavailable. Add FREEPIK_API_KEY as a Supabase secret."));
    const items = (data?.results ?? data?.data ?? []) as any[];
    return items.map((i) => ({
      id: String(i.id ?? crypto.randomUUID()),
      url: i.image?.source?.url ?? i.preview_url ?? i.url ?? "",
      thumbnailUrl: i.image?.source?.thumbnail ?? i.thumbnail_url,
      provider: "freepik",
      kind: "image",
      tags: i.tags,
      meta: i,
    }));
  },
};
