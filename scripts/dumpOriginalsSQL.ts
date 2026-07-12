// Emits SQL to insert AdVista Originals into public.templates,
// public.template_collection_items, and public.template_versions (v1).
// Run with `bun scripts/dumpOriginalsSQL.ts > /tmp/seed.sql`.
import { ADVISTA_ORIGINALS } from "../src/services/templates/seed";

const esc = (s: string) => s.replace(/'/g, "''");
const j = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const arr = (a: string[]) =>
  `ARRAY[${a.map((s) => `'${esc(s)}'`).join(",")}]::text[]`;

const lines: string[] = [];
lines.push("BEGIN;");

for (const t of ADVISTA_ORIGINALS) {
  lines.push(
    `-- ${t.name}`,
    `WITH ins AS (`,
    `  INSERT INTO public.templates (`,
    `    name, description, category, platform, objective, format,`,
    `    width, height, template_json, ai_tags, industry_tags,`,
    `    brand_compatible, popularity_score, source, premium,`,
    `    metadata, layout_dna, collection_slug, preview_url, thumbnail_url,`,
    `    placeholders, template_source, is_file_based`,
    `  ) VALUES (`,
    `    '${esc(t.name)}',`,
    `    '${esc(t.description)}',`,
    `    '${esc(t.category)}',`,
    `    '${esc(t.platform)}',`,
    `    '${esc(t.objective)}',`,
    `    '${esc(t.format)}',`,
    `    ${t.width}, ${t.height},`,
    `    ${j(t.template_json)},`,
    `    ${arr(t.ai_tags)},`,
    `    ${arr(t.industry_tags)},`,
    `    true, 100, 'advista_original', false,`,
    `    ${j(t.metadata)},`,
    `    ${j(t.layout_dna)},`,
    `    '${esc(t.collection_slug)}',`,
    `    '${esc(t.preview_url)}',`,
    `    '${esc(t.thumbnail_url)}',`,
    `    ${j(t.variables)},`,
    `    'advista_original',`,
    `    false`,
    `  )`,
    `  ON CONFLICT DO NOTHING`,
    `  RETURNING id`,
    `),`,
    `link AS (`,
    `  INSERT INTO public.template_collection_items (collection_id, template_id, sort_order)`,
    `  SELECT c.id, ins.id, 0 FROM public.template_collections c, ins`,
    `  WHERE c.slug = '${esc(t.collection_slug)}'`,
    `  ON CONFLICT DO NOTHING`,
    `  RETURNING template_id`,
    `)`,
    `INSERT INTO public.template_versions (template_id, version_number, template_json, layers, note)`,
    `SELECT ins.id, 1, ${j(t.template_json)}, ${j(t.template_json.objects)}, 'Initial AdVista Originals release'`,
    `FROM ins;`,
    ``,
  );
}

lines.push("COMMIT;");
console.log(lines.join("\n"));
