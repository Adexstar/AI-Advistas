-- 1. Media library: remove public read, restrict to owner folder
DROP POLICY IF EXISTS "media-library public read" ON storage.objects;
CREATE POLICY "media-library owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media-library' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. ad_templates: restrict wide authenticated read to published library assets or admins
DROP POLICY IF EXISTS "Auth read ad_templates" ON storage.objects;
CREATE POLICY "Auth read published ad_templates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ad_templates'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.file_path = storage.objects.name
         OR t.preview_url LIKE '%' || storage.objects.name
         OR t.thumbnail_url LIKE '%' || storage.objects.name
    )
  )
);

-- 3. SECURITY DEFINER function exposure
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;

-- keep RLS policy evaluation working for signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- harden the only client-callable definer function with an in-function auth check
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
  UPDATE public.templates SET usage_count = COALESCE(usage_count,0)+1 WHERE id = template_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(uuid) TO authenticated;