GRANT SELECT ON public.templates TO anon;
GRANT SELECT ON public.templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

GRANT SELECT ON public.ad_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_templates TO authenticated;
GRANT ALL ON public.ad_templates TO service_role;

CREATE OR REPLACE FUNCTION public.template_category_counts(p_source text DEFAULT NULL)
RETURNS TABLE(category text, count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(t.category, 'uncategorized') AS category, COUNT(*)::bigint AS count
  FROM public.templates t
  WHERE p_source IS NULL OR t.source = p_source
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.template_category_counts(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.template_category_counts(text) TO anon, authenticated, service_role;