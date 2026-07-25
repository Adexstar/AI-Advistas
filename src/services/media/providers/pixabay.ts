import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider, MediaSearchContext } from "../types";

export const pixabayProvider: MediaProvider = {
  id: "pixabay",
  isConfigured: () => true,
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    const { data, error } = await supabase.functions.invoke("search-pixabay", { body: ctx });
    if (error) return [];
    return (data?.results ?? []) as MediaAsset[];
  },
};
