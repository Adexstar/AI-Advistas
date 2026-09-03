// StockImportService — the ONLY client entry point for importing third-party
// stock assets (Freepik, Pexels) into AdVista's `templates` table.
// All provider traffic is server-side (edge function `import-stock-templates`),
// results are cached 24h, and every import lands as pending (is_active=false).
import { supabase } from "@/integrations/supabase/client";

export type StockProvider = "freepik" | "pexels";

export interface StockItem {
  provider: StockProvider;
  source_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  license: string;
  author?: string;
  page_url?: string;
  tags?: string[];
}

export interface StockSearchResponse {
  results: StockItem[];
  providers: Record<StockProvider, boolean>;
}

export interface ImportResponse {
  imported: number;
  skipped: number;
  message?: string;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("import-stock-templates", { body });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const StockImportService = {
  search(query: string, providers: StockProvider[], limit = 16) {
    return call<StockSearchResponse>({ mode: "search", query, providers, limit });
  },

  importItems(items: StockItem[], category?: string | null) {
    return call<ImportResponse>({ mode: "import", items, category: category ?? null });
  },

  seedStarterPack(providers: StockProvider[] = ["freepik", "pexels"], perQuery = 5) {
    return call<ImportResponse>({ mode: "seed", providers, perQuery });
  },
};
