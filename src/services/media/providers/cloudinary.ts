import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaProvider } from "../types";

// Cloudinary is the primary storage/CDN. Uploads go through the media-upload
// edge function which holds the CLOUDINARY_* secrets.
export const cloudinaryProvider: MediaProvider = {
  id: "cloudinary",
  isConfigured: () => true, // configuration is server-side; assume available
  async upload(file: File): Promise<MediaAsset> {
    const form = new FormData();
    form.append("file", file);
    const { data, error } = await supabase.functions.invoke("media-upload", { body: form });
    if (error) throw error;
    return data as MediaAsset;
  },
};
