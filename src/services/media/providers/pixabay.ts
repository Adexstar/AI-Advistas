import type { MediaProvider } from "../types";
import { invokeMediaSearch } from "./invokeSearch";

export const pixabayProvider: MediaProvider = {
  id: "pixabay",
  isConfigured: () => true,
  search: (ctx) => invokeMediaSearch("search-pixabay", ctx),
};
