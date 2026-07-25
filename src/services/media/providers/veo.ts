import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider } from "../types";

export const veoProvider: MediaProvider = {
  id: "veo",
  isConfigured: () => true,
  async generate(prompt: string, opts: Record<string, unknown> = {}): Promise<MediaAsset> {
    const { data, error } = await supabase.functions.invoke("generate-veo", {
      body: { prompt, ...opts },
    });
    if (error) throw error;
    return data as MediaAsset;
  },
};
