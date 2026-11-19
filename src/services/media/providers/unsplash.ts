import type { MediaProvider } from "../types";
import { invokeMediaSearch } from "./invokeSearch";

export const unsplashProvider: MediaProvider = {
  id: "unsplash",
  isConfigured: () => true,
  search: (ctx) => invokeMediaSearch("search-unsplash", ctx),
};
