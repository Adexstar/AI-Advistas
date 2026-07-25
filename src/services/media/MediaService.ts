// MediaService — one entry point for all media in AdVista.
// Pages never touch Cloudinary, Freepik, OpenAI Images, etc. directly.
// External providers are infrastructure; the UI never knows which was used.
import { supabase } from "@/integrations/supabase/client";
import { cloudinaryProvider } from "./providers/cloudinary";
import { openaiImagesProvider } from "./providers/openai";
import { freepikProvider } from "./providers/freepik";
import { ideogramProvider } from "./providers/ideogram";
import { leonardoProvider } from "./providers/leonardo";
import { pexelsProvider } from "./providers/pexels";
import { pixabayProvider } from "./providers/pixabay";
import { unsplashProvider } from "./providers/unsplash";
import { runwayProvider } from "./providers/runway";
import { klingProvider } from "./providers/kling";
import { veoProvider } from "./providers/veo";
import { withProviderCache } from "./cache";
import type { MediaAsset, MediaSearchContext, MediaProvider } from "./types";

const searchProviders: MediaProvider[] = [
  freepikProvider,
  pexelsProvider,
  pixabayProvider,
  unsplashProvider,
];

const imageGenProviders = {
  openai: openaiImagesProvider,
  ideogram: ideogramProvider,
  leonardo: leonardoProvider,
} as const;

const videoGenProviders = {
  runway: runwayProvider,
  kling: klingProvider,
  veo: veoProvider,
} as const;

function rankResults(results: MediaAsset[], ctx: MediaSearchContext): MediaAsset[] {
  const brand = (ctx.brandColors ?? []).map((c) => c.toLowerCase());
  const intent = ctx.intent.toLowerCase();
  return [...results].sort((a, b) => {
    const score = (r: MediaAsset) => {
      let s = 0;
      if (r.tags?.some((t) => t.toLowerCase().includes(intent))) s += 3;
      if (brand.length && r.meta && JSON.stringify(r.meta).toLowerCase().split("").some(() => false)) s += 0;
      if (r.thumbnailUrl) s += 1;
      return s;
    };
    return score(b) - score(a);
  });
}

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
    opts: {
      provider?: keyof typeof imageGenProviders;
      platform?: string;
      brandGuardrails?: string;
    } = {},
  ): Promise<MediaAsset> {
    const provider = imageGenProviders[opts.provider ?? "openai"];
    if (!provider.isConfigured()) throw new Error(`Provider ${provider.id} is not configured`);
    return provider.generate!(prompt, opts);
  },

  async generateVideo(
    prompt: string,
    opts: { provider?: keyof typeof videoGenProviders } & Record<string, unknown> = {},
  ): Promise<MediaAsset> {
    const provider = videoGenProviders[opts.provider ?? "runway"];
    if (!provider.isConfigured()) throw new Error(`Provider ${provider.id} is not configured`);
    return provider.generate!(prompt, opts);
  },

  // Intent-based media search across configured providers, cached for 24h.
  async search(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    return withProviderCache("media-search", ctx, async () => {
      const active = searchProviders.filter((p) => p.isConfigured() && p.search);
      const results = await Promise.all(active.map((p) => p.search!(ctx).catch(() => [])));
      return rankResults(results.flat(), ctx);
    });
  },

  // Smart search: identical to search() today; reserved for AI intent expansion.
  async smartSearch(ctx: MediaSearchContext): Promise<MediaAsset[]> {
    return this.search(ctx);
  },

  listProviders() {
    return [
      cloudinaryProvider,
      openaiImagesProvider,
      ideogramProvider,
      leonardoProvider,
      freepikProvider,
      pexelsProvider,
      pixabayProvider,
      unsplashProvider,
      runwayProvider,
      klingProvider,
      veoProvider,
    ].map((p) => ({ id: p.id, configured: p.isConfigured() }));
  },
};

