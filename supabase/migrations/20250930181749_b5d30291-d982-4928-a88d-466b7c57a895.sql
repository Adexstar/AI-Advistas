-- Add category column to templates table
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'business';

-- Add index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);

-- Update existing templates with appropriate categories based on their names and descriptions
UPDATE public.templates 
SET category = 'social_media'
WHERE name ILIKE '%social%' 
   OR name ILIKE '%instagram%' 
   OR name ILIKE '%facebook%'
   OR description ILIKE '%social media%';

UPDATE public.templates 
SET category = 'agency_marketing'
WHERE name ILIKE '%agency%' 
   OR name ILIKE '%marketing%' 
   OR name ILIKE '%advertising%'
   OR description ILIKE '%agency%'
   OR description ILIKE '%marketing%';

-- All others remain as 'business' (the default)