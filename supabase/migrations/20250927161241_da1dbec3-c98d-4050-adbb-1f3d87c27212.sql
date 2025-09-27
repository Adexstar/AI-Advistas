-- Update templates table to match new schema
ALTER TABLE templates DROP COLUMN IF EXISTS type;
ALTER TABLE templates DROP COLUMN IF EXISTS platform;
ALTER TABLE templates DROP COLUMN IF EXISTS template_json;

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS preview_url text,
ADD COLUMN IF NOT EXISTS schema jsonb;

-- Update existing templates with new schema format
UPDATE templates SET 
  schema = jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object('name', 'headline', 'label', 'Headline', 'type', 'text', 'default', 'Your catchy headline'),
      jsonb_build_object('name', 'description', 'label', 'Description', 'type', 'textarea', 'default', 'Explain your offer here...'),
      jsonb_build_object('name', 'cta', 'label', 'Call To Action', 'type', 'text', 'default', 'Shop Now'),
      jsonb_build_object('name', 'image', 'label', 'Main Image', 'type', 'image', 'default', 'https://placehold.co/600x400')
    ),
    'layout', jsonb_build_object(
      'headline', jsonb_build_object('x', 50, 'y', 50, 'fontSize', 24, 'color', '#000'),
      'description', jsonb_build_object('x', 50, 'y', 100, 'fontSize', 16, 'color', '#333'),
      'cta', jsonb_build_object('x', 50, 'y', 180, 'fontSize', 18, 'color', '#ff0000'),
      'image', jsonb_build_object('x', 300, 'y', 50, 'width', 200, 'height', 200)
    )
  ),
  description = 'Professional ad template with headline, description, CTA and image',
  preview_url = 'https://placehold.co/400x300'
WHERE schema IS NULL;

-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.templates(id) NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  preview_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ads table
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ads
CREATE POLICY "Users can view their own ads" 
ON public.ads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON public.ads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" 
ON public.ads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for ads updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample templates with new schema
INSERT INTO public.templates (name, description, preview_url, schema) VALUES
('Social Media Post', 'Perfect for Facebook and Instagram posts', 'https://placehold.co/400x400', 
 jsonb_build_object(
   'fields', jsonb_build_array(
     jsonb_build_object('name', 'headline', 'label', 'Headline', 'type', 'text', 'default', 'Amazing Deal!'),
     jsonb_build_object('name', 'description', 'label', 'Description', 'type', 'textarea', 'default', 'Don''t miss out on this incredible offer'),
     jsonb_build_object('name', 'cta', 'label', 'Call To Action', 'type', 'text', 'default', 'Shop Now'),
     jsonb_build_object('name', 'image', 'label', 'Product Image', 'type', 'image', 'default', 'https://placehold.co/400x400')
   ),
   'layout', jsonb_build_object(
     'headline', jsonb_build_object('x', 20, 'y', 20, 'fontSize', 28, 'color', '#000', 'fontWeight', 'bold'),
     'description', jsonb_build_object('x', 20, 'y', 80, 'fontSize', 16, 'color', '#333'),
     'cta', jsonb_build_object('x', 20, 'y', 200, 'fontSize', 18, 'color', '#fff', 'backgroundColor', '#ff4444', 'padding', '10px 20px'),
     'image', jsonb_build_object('x', 200, 'y', 20, 'width', 180, 'height', 180)
   )
 )
),
('Banner Ad', 'Wide banner format for websites', 'https://placehold.co/600x200', 
 jsonb_build_object(
   'fields', jsonb_build_array(
     jsonb_build_object('name', 'headline', 'label', 'Main Headline', 'type', 'text', 'default', 'Special Offer'),
     jsonb_build_object('name', 'subheadline', 'label', 'Sub Headline', 'type', 'text', 'default', 'Limited Time Only'),
     jsonb_build_object('name', 'cta', 'label', 'Button Text', 'type', 'text', 'default', 'Learn More'),
     jsonb_build_object('name', 'logo', 'label', 'Company Logo', 'type', 'image', 'default', 'https://placehold.co/100x50')
   ),
   'layout', jsonb_build_object(
     'headline', jsonb_build_object('x', 50, 'y', 30, 'fontSize', 32, 'color', '#000', 'fontWeight', 'bold'),
     'subheadline', jsonb_build_object('x', 50, 'y', 80, 'fontSize', 18, 'color', '#666'),
     'cta', jsonb_build_object('x', 50, 'y', 120, 'fontSize', 16, 'color', '#fff', 'backgroundColor', '#007bff', 'padding', '12px 24px'),
     'logo', jsonb_build_object('x', 450, 'y', 30, 'width', 100, 'height', 50)
   )
 )
);