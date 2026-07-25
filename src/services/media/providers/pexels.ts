import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider, MediaSearchContext } from "../types";

export const pexelsProvider: MediaProvider = {
  id: "pexels",
  isConfigured: () => true, // server-side key check; edge function returns 501 if missing
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    const { data, error } = await supabase.functions.invoke("search-pexels", { body: ctx });
    if (error) return [];
    return (data?.results ?? []) as MediaAsset[];
  },
};
