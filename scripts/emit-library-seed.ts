import { stockStarterTemplates } from "../src/services/templates/stockStarter";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlArray(values: string[]) {
  if (!values.length) return `'{}'::text[]`;
  return `ARRAY[${values.map(sqlString).join(", ")}]::text[]`;
}

const inserts = stockStarterTemplates.map((row) => {
  const columns = [
    "name", "description", "category", "platform", "objective", "format", "width", "height",
    "preview_url", "thumbnail_url", "template_json", "ai_tags", "industry_tags",
    "brand_compatible", "popularity_score", "source", "source_id", "source_license",
    "external_id", "template_source", "premium", "is_active", "is_file_based", "review_status",
    "review_note", "metadata",
  ];
  const values = [
    sqlString(row.name),
    sqlString(row.description),
    sqlString(row.category),
    sqlString(row.platform),
    sqlString(row.objective),
    sqlString(row.format),
    String(row.width),
    String(row.height),
    sqlString(row.preview_url),
    sqlString(row.thumbnail_url),
    sqlJson(row.template_json),
    sqlArray(row.ai_tags),
    sqlArray(row.industry_tags),
    "true",
    String(row.popularity_score),
    sqlString(row.source),
    sqlString(row.source_id),
    sqlString(row.source_license),
    sqlString(row.external_id),
    sqlString(row.template_source),
    "false",
    "true",
    "false",
    sqlString(row.review_status),
    sqlString("Library stock pack"),
    sqlJson(row.metadata),
  ];
  return `  INSERT INTO public.templates (${columns.join(", ")})
  SELECT ${values.join(", ")}
  WHERE NOT EXISTS (
    SELECT 1 FROM public.templates existing
    WHERE existing.source = ${sqlString(row.source)}
      AND existing.source_id = ${sqlString(row.source_id)}
      AND existing.format = ${sqlString(row.format)}
  );`;
});

const sql = `-- Publish the Pexels library catalog and let visitors read approved templates
-- without executing has_role. The catalog is fixed; the function only inserts
-- a design when that source, source id, and format are not already stored.

DROP POLICY IF EXISTS "Active templates are readable" ON public.templates;
DROP POLICY IF EXISTS "Public can view templates" ON public.templates;
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.templates;
DROP POLICY IF EXISTS "Templates files readable" ON public.templates;
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.templates;

CREATE POLICY "Approved templates are readable"
  ON public.templates
  FOR SELECT
  TO anon, authenticated
  USING (is_active AND review_status = 'approved');

CREATE POLICY "Admins can read every template"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ensure_library_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  before_count integer;
  after_count integer;
BEGIN
  SELECT count(*) INTO before_count FROM public.templates;
${inserts.join("\n").replace(/^/gm, "  ")}
  SELECT count(*) INTO after_count FROM public.templates;
  RETURN after_count - before_count;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_library_templates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_library_templates() TO anon, authenticated;

SELECT public.ensure_library_templates();
`;

process.stdout.write(sql);
