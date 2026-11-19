import type { MediaProvider } from "../types";
import { invokeMediaSearch } from "./invokeSearch";

export const pexelsProvider: MediaProvider = {
  id: "pexels",
  isConfigured: () => true,
  search: (ctx) => invokeMediaSearch("search-pexels", ctx),
};
