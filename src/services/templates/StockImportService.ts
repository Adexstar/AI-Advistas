// StockImportService — the ONLY client entry point for importing third-party
// stock assets (Pexels, Unsplash, Pixabay) into AdVista's `templates` table.
// All provider traffic is server-side (edge function `import-stock-templates`),
// results are cached 24h. Selected imports stay pending. Seed and catalog
// publish approved rows so the public library can show them.
import { supabase } from "@/integrations/supabase/client";
import { readEdgeError } from "@/services/edgeError";

export type StockProvider = "pexels" | "unsplash" | "pixabay";
export type ImportProvider = StockProvider | "freepik";

export interface StockItem {
  provider: ImportProvider;
  source_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  license: string;
  author?: string;
  author_url?: string;
  page_url?: string;
  download_location?: string;
  tags?: string[];
}

export interface StockSearchResponse {
  results: StockItem[];
  providers: Record<StockProvider, boolean>;
  missing?: string[];
}

export interface ImportResponse {
  imported: number;
  skipped: number;
  message?: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("import-stock-templates", { body });
  if (error) {
    const message = await readEdgeError(error, "The template import failed.");
    if (message === "Admin only") {
      throw new Error("Only an admin can import templates. This account does not have the admin role.");
    }
    throw new Error(message);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export const StockImportService = {
  search(query: string, providers: StockProvider[], limit = 16) {
    return call<StockSearchResponse>({ mode: "search", query, providers, limit });
  },

  importItems(items: StockItem[], category?: string | null) {
    return call<ImportResponse>({ mode: "import", items, category: category ?? null });
  },

  seedStarterPack(providers: StockProvider[] = ["pexels", "unsplash", "pixabay"], perQuery = 5) {
    return call<ImportResponse>({ mode: "seed", providers, perQuery });
  },

  publishCatalog(items: Array<StockItem & { category?: string; format?: string }>) {
    return call<ImportResponse>({ mode: "catalog", items });
  },
};
