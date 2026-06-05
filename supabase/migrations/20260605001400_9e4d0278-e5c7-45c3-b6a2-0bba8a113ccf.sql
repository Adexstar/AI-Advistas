
CREATE POLICY "media-library public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-library');

CREATE POLICY "media-library user upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "media-library user update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "media-library user delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);
