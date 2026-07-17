
-- AI metadata-aware search for templates
CREATE INDEX IF NOT EXISTS idx_templates_metadata_gin ON public.templates USING gin (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_templates_layout_dna_gin ON public.templates USING gin (layout_dna jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_templates_industry_tags_gin ON public.templates USING gin (industry_tags);
CREATE INDEX IF NOT EXISTS idx_templates_ai_tags_gin ON public.templates USING gin (ai_tags);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates (category);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON public.templates (platform);
CREATE INDEX IF NOT EXISTS idx_templates_objective ON public.templates (objective);

CREATE OR REPLACE FUNCTION public.search_templates(
  p_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_industry text DEFAULT NULL,
  p_brand_compat text DEFAULT NULL,
  p_layout_style text DEFAULT NULL,
  p_emotion text DEFAULT NULL,
  p_brand_compatible boolean DEFAULT NULL,
  p_limit int DEFAULT 60
)
RETURNS SETOF public.templates
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT *
  FROM public.templates t
  WHERE (p_query IS NULL OR (
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
$$;

GRANT EXECUTE ON FUNCTION public.search_templates(text,text,text,text,text,text,text,text,boolean,int) TO anon, authenticated, service_role;
