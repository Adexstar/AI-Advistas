import { supabase } from "@/integrations/supabase/client";
import {
  mergeLibraryTemplates,
  stockStarterTemplates,
  withStockStarter,
  libraryIdentityKeys,
} from "./stockStarter";

type LibraryRow = {
  id: string;
  source?: string | null;
  source_id?: string | null;
  format?: string | null;
  preview_url?: string | null;
};

export function libraryInsertRow(record: (typeof stockStarterTemplates)[number]) {
  return {
    name: record.name,
    description: record.description,
    category: record.category,
    platform: record.platform,
    objective: record.objective,
    format: record.format,
    width: record.width,
    height: record.height,
    preview_url: record.preview_url,
    thumbnail_url: record.thumbnail_url,
    template_json: record.template_json,
    ai_tags: record.ai_tags,
    industry_tags: record.industry_tags,
    brand_compatible: record.brand_compatible,
    popularity_score: record.popularity_score,
    source: record.source,
    source_id: record.source_id,
    source_license: record.source_license,
    external_id: record.external_id,
    template_source: record.template_source,
    premium: record.premium,
    is_active: record.is_active,
    is_file_based: false,
    review_status: record.review_status,
    review_note: "Library stock pack",
    reviewed_at: new Date().toISOString(),
    imported_at: new Date().toISOString(),
    metadata: record.metadata,
  };
}

export function missingLibraryRows<T extends LibraryRow>(remote: T[]) {
  const seen = new Set(remote.flatMap((row) => libraryIdentityKeys(row)));
  return stockStarterTemplates.filter((item) => !libraryIdentityKeys(item).some((key) => seen.has(key)));
}

const approved = () =>
  supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .eq("review_status", "approved")
    .order("popularity_score", { ascending: false });

let inflight: Promise<LibraryRow[]> | null = null;

/**
 * Read the approved library, then store any missing Pexels designs.
 * The fixed catalog is written by ensure_library_templates when that
 * function is deployed, and by a direct insert when the signed-in user
 * can manage templates. Either way the returned list includes every
 * stock design, so the gallery is not limited to the rows already saved.
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
  if (first.error || !first.data) {
    await supabase.rpc("ensure_library_templates");
    const retry = await approved();
    if (!retry.error && retry.data) return mergeLibraryTemplates(retry.data as LibraryRow[]);
    return withStockStarter<LibraryRow>([], true);
  }

  const remote = first.data as LibraryRow[];
  const missing = missingLibraryRows(remote);
  if (!missing.length) return mergeLibraryTemplates(remote);

  const rpc = await supabase.rpc("ensure_library_templates");
  let published = !rpc.error;
  if (!published) {
    const inserted = await supabase.from("templates").insert(missing.map(libraryInsertRow) as never);
    published = !inserted.error;
  }

  if (!published) return mergeLibraryTemplates(remote);

  const second = await approved();
  if (second.error || !second.data) return mergeLibraryTemplates(remote);
  return mergeLibraryTemplates(second.data as LibraryRow[]);
}
