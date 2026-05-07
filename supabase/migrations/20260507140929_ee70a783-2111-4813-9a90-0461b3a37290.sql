
-- Lock down SECURITY DEFINER functions from being called by anon/authenticated via REST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;

-- Restrict storage bucket listing/read to authenticated users
DROP POLICY IF EXISTS "Public read ad_templates" ON storage.objects;
CREATE POLICY "Auth read ad_templates" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ad_templates');

-- Replace permissive insert policies on template tables with admin-only
DROP POLICY IF EXISTS "Authenticated insert templates" ON public.ad_templates;
CREATE POLICY "Admins insert ad_templates" ON public.ad_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Auth insert templates files" ON public.templates;
-- templates already has "Admins manage templates files" ALL policy, no insert policy needed
