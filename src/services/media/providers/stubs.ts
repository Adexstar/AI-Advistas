import type { MediaProvider } from "../types";

// Typed provider stubs. They exist so the service layer can enumerate them
// today; each is disabled until its API key/edge function is wired up.
const makeStub = (id: string): MediaProvider => ({
  id,
  isConfigured: () => false,
  search: async () => [],
});

export const ideogramProvider = makeStub("ideogram");
export const pexelsProvider = makeStub("pexels");
export const pixabayProvider = makeStub("pixabay");
export const unsplashProvider = makeStub("unsplash");
