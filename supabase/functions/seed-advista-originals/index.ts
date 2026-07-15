import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import data from "./data.json" with { type: "json" };

type OriginalRow = {
  slug: string;
  name: string;
  description: string;
  category: string;
  collection_slug: string;
  platform: string;
  objective: string;
  format: string;
  width: number;
  height: number;
  ai_tags: string[];
  industry_tags: string[];
  metadata: Record<string, unknown>;
  layout_dna: Record<string, unknown>;
  variables: unknown;
  preview_url: string;
  thumbnail_url: string;
  template_json: { objects: unknown[]; [k: string]: unknown };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rows = data as OriginalRow[];
  const results: { name: string; status: "inserted" | "skipped" | "error"; error?: string }[] = [];

  // Preload collection id map.
  const { data: collections, error: colErr } = await supabase
    .from("template_collections")
    .select("id, slug");
  if (colErr) {
    return new Response(JSON.stringify({ error: colErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const colBySlug = new Map((collections ?? []).map((c) => [c.slug, c.id as string]));

  for (const r of rows) {
    try {
      // Skip if a template with this name already exists (idempotent).
      const { data: existing } = await supabase
        .from("templates")
        .select("id")
        .eq("name", r.name)
        .eq("source", "advista_original")
        .maybeSingle();
      if (existing?.id) {
        results.push({ name: r.name, status: "skipped" });
        continue;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("templates")
        .insert({
          name: r.name,
          description: r.description,
          category: r.category,
          platform: r.platform,
          objective: r.objective,
          format: r.format,
          width: r.width,
          height: r.height,
          template_json: r.template_json,
          ai_tags: r.ai_tags,
          industry_tags: r.industry_tags,
          brand_compatible: true,
          popularity_score: 100,
          source: "advista_original",
          template_source: "advista_original",
          is_file_based: false,
          premium: false,
          metadata: r.metadata,
          layout_dna: r.layout_dna,
          collection_slug: r.collection_slug,
          preview_url: r.preview_url,
          thumbnail_url: r.thumbnail_url,
          placeholders: r.variables,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw insErr ?? new Error("insert failed");

      const collectionId = colBySlug.get(r.collection_slug);
      if (collectionId) {
        await supabase
          .from("template_collection_items")
          .insert({ template_id: inserted.id, collection_id: collectionId, sort_order: 0 })
          .then(() => {}, () => {});
      }

      await supabase.from("template_versions").insert({
        template_id: inserted.id,
        version_number: 1,
        template_json: r.template_json,
        layers: r.template_json.objects,
        note: "Initial AdVista Originals release",
      });

      results.push({ name: r.name, status: "inserted" });
    } catch (e) {
      results.push({ name: r.name, status: "error", error: (e as Error).message });
    }
  }

  return new Response(
    JSON.stringify({
      total: rows.length,
      inserted: results.filter((r) => r.status === "inserted").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error"),
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
