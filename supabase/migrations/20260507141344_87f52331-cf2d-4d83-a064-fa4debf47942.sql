
-- Profiles: restrict reads to the owner
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

-- Storage: admin-only write/update/delete on ad_templates bucket
DROP POLICY IF EXISTS "Auth upload ad_templates" ON storage.objects;
DROP POLICY IF EXISTS "Auth update ad_templates" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete ad_templates" ON storage.objects;
DROP POLICY IF EXISTS "Auth read ad_templates" ON storage.objects;

CREATE POLICY "Admins upload ad_templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ad_templates' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update ad_templates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ad_templates' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete ad_templates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ad_templates' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Auth read ad_templates" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ad_templates');

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'ad_templates';
