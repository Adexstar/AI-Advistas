import { supabase } from "@/integrations/supabase/client";

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

let inflight: Promise<LibraryRow[]> | null = null;

/** Approved, active rows only. Unsaved starter designs are not mixed in. */
export function loadLibraryTemplates() {
  if (!inflight) {
    inflight = approvedRows().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function approvedRows(): Promise<LibraryRow[]> {
  const { data, error } = await approved();
  if (error) throw new Error(error.message);
  return (data ?? []) as LibraryRow[];
}
