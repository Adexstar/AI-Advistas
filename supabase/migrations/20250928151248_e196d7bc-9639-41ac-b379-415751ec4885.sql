-- Create storage buckets for template management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('ad_templates', 'ad_templates', true),
  ('user_ads', 'user_ads', false),
  ('template_thumbnails', 'template_thumbnails', true);

-- Create storage policies for ad_templates bucket (admin upload, public read)
CREATE POLICY "Public can view template files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ad_templates');

CREATE POLICY "Authenticated users can upload templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ad_templates' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ad_templates' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ad_templates' AND auth.role() = 'authenticated');

-- Create storage policies for user_ads bucket (user-specific)
CREATE POLICY "Users can view their own ads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user_ads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own ads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user_ads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own ads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user_ads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user_ads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for template_thumbnails bucket (public read)
CREATE POLICY "Public can view template thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'template_thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'template_thumbnails' AND auth.role() = 'authenticated');

-- Enhance templates table for file-based templates
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{"width": 0, "height": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS is_file_based BOOLEAN DEFAULT false;

-- Create user_ads table for storing user-created ads
CREATE TABLE IF NOT EXISTS public.user_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path TEXT,
  export_format TEXT DEFAULT 'png',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'exported')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_ads
ALTER TABLE public.user_ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_ads
CREATE POLICY "Users can view their own ads" 
ON public.user_ads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" 
ON public.user_ads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON public.user_ads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" 
ON public.user_ads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for user_ads updated_at
CREATE TRIGGER update_user_ads_updated_at
BEFORE UPDATE ON public.user_ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_file_based ON public.templates(is_file_based);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);
CREATE INDEX IF NOT EXISTS idx_user_ads_user_id ON public.user_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ads_template_id ON public.user_ads(template_id);
CREATE INDEX IF NOT EXISTS idx_user_ads_status ON public.user_ads(status);