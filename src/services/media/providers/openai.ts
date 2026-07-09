import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider } from "../types";

export const openaiImagesProvider: MediaProvider = {
  id: "openai",
  isConfigured: () => true,
  async generate(prompt: string, opts: Record<string, unknown> = {}): Promise<MediaAsset> {
    const { data, error } = await supabase.functions.invoke("generate-ad-image", {
      body: { product: prompt, ...opts },
    });
    if (error) throw error;
    return {
      id: crypto.randomUUID(),
      url: data.imageUrl,
      provider: "openai",
      kind: "image",
      meta: { prompt: data.prompt },
    };
  },
};
