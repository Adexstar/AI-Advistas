// MediaService — one entry point for all media in AdVista.
// Pages never touch Cloudinary, Freepik, OpenAI Images, etc. directly.
import { supabase } from "@/integrations/supabase/client";
import { cloudinaryProvider } from "./providers/cloudinary";
import { openaiImagesProvider } from "./providers/openai";
import { freepikProvider } from "./providers/freepik";
import {
  ideogramProvider,
  pexelsProvider,
  pixabayProvider,
  unsplashProvider,
} from "./providers/stubs";
import type { MediaAsset, MediaSearchContext } from "./types";

const searchProviders = [freepikProvider, pexelsProvider, pixabayProvider, unsplashProvider];
const genProviders = { openai: openaiImagesProvider, ideogram: ideogramProvider };

export const MediaService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },

  async upload(file: File): Promise<MediaAsset> {
    return cloudinaryProvider.upload!(file);
  },

  async generate(
    prompt: string,
    opts: { provider?: "openai" | "ideogram"; platform?: string; brandGuardrails?: string } = {}
  ): Promise<MediaAsset> {
    const provider = genProviders[opts.provider ?? "openai"];
    if (!provider.isConfigured()) throw new Error(`Provider ${provider.id} is not configured`);
    return provider.generate!(prompt, opts);
  },

  // Intent-based media search across configured providers.
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    const active = searchProviders.filter((p) => p.isConfigured() && p.search);
    const results = await Promise.all(active.map((p) => p.search!(ctx).catch(() => [])));
    const flat = results.flat();
    // Rank: brand color match > intent keyword match. Trivial ranking for now.
    return flat;
  },

  listProviders() {
    return [
      cloudinaryProvider,
      openaiImagesProvider,
      ideogramProvider,
      freepikProvider,
      pexelsProvider,
      pixabayProvider,
      unsplashProvider,
    ].map((p) => ({ id: p.id, configured: p.isConfigured() }));
  },
};
