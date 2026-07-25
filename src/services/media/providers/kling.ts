import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider } from "../types";

export const klingProvider: MediaProvider = {
  id: "kling",
  isConfigured: () => true,
  async generate(prompt: string, opts: Record<string, unknown> = {}): Promise<MediaAsset> {
    const { data, error } = await supabase.functions.invoke("generate-kling", {
      body: { prompt, ...opts },
    });
    if (error) throw error;
    return data as MediaAsset;
  },
};
