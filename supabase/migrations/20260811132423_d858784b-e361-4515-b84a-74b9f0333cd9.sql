ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_license text,
  ADD COLUMN IF NOT EXISTS license_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

UPDATE public.templates
   SET imported_at = COALESCE(imported_at, created_at),
       source_license = COALESCE(source_license, 'owned');

CREATE INDEX IF NOT EXISTS templates_is_active_idx ON public.templates (is_active);

CREATE OR REPLACE FUNCTION public.search_templates(p_query text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_platform text DEFAULT NULL::text, p_goal text DEFAULT NULL::text, p_industry text DEFAULT NULL::text, p_brand_compat text DEFAULT NULL::text, p_layout_style text DEFAULT NULL::text, p_emotion text DEFAULT NULL::text, p_brand_compatible boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 60)
 RETURNS SETOF public.templates
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.templates t
  WHERE t.is_active
    AND (p_query IS NULL OR (
      t.name ILIKE '%'||p_query||'%'
      OR COALESCE(t.description,'') ILIKE '%'||p_query||'%'
      OR EXISTS (SELECT 1 FROM unnest(COALESCE(t.ai_tags, ARRAY[]::text[])) tag WHERE tag ILIKE '%'||p_query||'%')
      OR EXISTS (SELECT 1 FROM unnest(COALESCE(t.industry_tags, ARRAY[]::text[])) tag WHERE tag ILIKE '%'||p_query||'%')
    ))
    AND (p_category IS NULL OR t.category = p_category)
    AND (p_platform IS NULL OR t.platform = p_platform OR t.metadata->'recommended_platforms' ? p_platform)
    AND (p_goal IS NULL OR t.objective = p_goal OR t.metadata->'recommended_goal' ? p_goal)
    AND (p_industry IS NULL OR p_industry = ANY(COALESCE(t.industry_tags, ARRAY[]::text[])))
    AND (p_brand_compat IS NULL OR t.metadata->'brand_compatibility' ? p_brand_compat)
    AND (p_layout_style IS NULL OR t.metadata->>'layout_style' = p_layout_style OR t.layout_dna->>'layout_style' = p_layout_style)
    AND (p_emotion IS NULL OR t.metadata->>'emotion' = p_emotion)
    AND (p_brand_compatible IS NULL OR t.brand_compatible = p_brand_compatible)
  ORDER BY t.popularity_score DESC NULLS LAST, t.created_at DESC
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.template_category_counts(p_source text DEFAULT NULL::text)
 RETURNS TABLE(category text, count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(t.category, 'uncategorized') AS category, COUNT(*)::bigint AS count
  FROM public.templates t
  WHERE t.is_active AND (p_source IS NULL OR t.source = p_source)
  GROUP BY 1
  ORDER BY 2 DESC;
$function$;

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.templates
     SET usage_count = COALESCE(usage_count,0)+1,
         popularity_score = COALESCE(popularity_score,0)+1
   WHERE id = template_id;
END;
$function$;

DROP POLICY IF EXISTS "Public can view templates" ON public.templates;
DROP POLICY IF EXISTS "Templates files readable" ON public.templates;
CREATE POLICY "Active templates are readable" ON public.templates
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));