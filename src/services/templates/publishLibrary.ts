import { supabase } from "@/integrations/supabase/client";
import { StockImportService } from "./StockImportService";
import {
  libraryIdentityKeys,
  mergeLibraryTemplates,
  stockCatalogItems,
  withStockStarter,
} from "./stockStarter";

type LibraryRow = {
  id: string;
  source?: string | null;
  source_id?: string | null;
  format?: string | null;
  preview_url?: string | null;
};

const approved = () =>
  supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .eq("review_status", "approved")
    .order("popularity_score", { ascending: false });

function missingCatalog(remote: LibraryRow[]) {
  const seen = new Set(remote.flatMap((row) => libraryIdentityKeys(row)));
  return stockCatalogItems().filter((item) => {
    const keys = libraryIdentityKeys({
      source: item.provider,
      source_id: item.source_id,
      format: item.format,
      preview_url: item.image_url,
    });
    return !keys.some((key) => seen.has(key));
  });
}

let inflight: Promise<LibraryRow[]> | null = null;

/**
 * Read approved templates, then ask import-stock-templates to store any
 * missing Pexels designs. The gallery still includes those designs when
 * the import call is refused, so the catalog is not gated on that write.
 */
export function loadLibraryTemplates() {
  if (!inflight) {
    inflight = readAndPublish().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function readAndPublish(): Promise<LibraryRow[]> {
  const first = await approved();
  const remote = first.error || !first.data ? [] : (first.data as LibraryRow[]);
  const missing = missingCatalog(remote);
  if (missing.length) {
    try {
      await StockImportService.publishCatalog(missing);
    } catch {
      // The import API is admin-only. The merged catalog still renders.
    }
  }

  if (missing.length) {
    const second = await approved();
    if (!second.error && second.data) return mergeLibraryTemplates(second.data as LibraryRow[]);
  }
  if (first.error || !first.data) return withStockStarter<LibraryRow>([], true);
  return mergeLibraryTemplates(remote);
}
