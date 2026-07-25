import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider, MediaSearchContext } from "../types";

export const unsplashProvider: MediaProvider = {
  id: "unsplash",
  isConfigured: () => true,
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    const { data, error } = await supabase.functions.invoke("search-unsplash", { body: ctx });
    if (error) return [];
    return (data?.results ?? []) as MediaAsset[];
  },
};
