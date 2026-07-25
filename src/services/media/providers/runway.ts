import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider } from "../types";

export const runwayProvider: MediaProvider = {
  id: "runway",
  isConfigured: () => true,
  async generate(prompt: string, opts: Record<string, unknown> = {}): Promise<MediaAsset> {
    const { data, error } = await supabase.functions.invoke("generate-runway", {
      body: { prompt, ...opts },
    });
    if (error) throw error;
    return data as MediaAsset;
  },
};
