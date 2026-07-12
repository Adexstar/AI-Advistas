
-- Extend templates
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS layout_dna jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS collection_slug text;

CREATE INDEX IF NOT EXISTS idx_templates_collection_slug ON public.templates(collection_slug);
CREATE INDEX IF NOT EXISTS idx_templates_source ON public.templates(source);

-- Collections
CREATE TABLE IF NOT EXISTS public.template_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.template_collections TO anon;
GRANT SELECT ON public.template_collections TO authenticated;
GRANT ALL ON public.template_collections TO service_role;

ALTER TABLE public.template_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view template collections"
  ON public.template_collections FOR SELECT
  USING (true);

CREATE TRIGGER trg_template_collections_updated_at
  BEFORE UPDATE ON public.template_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collection items
CREATE TABLE IF NOT EXISTS public.template_collection_items (
  collection_id uuid NOT NULL REFERENCES public.template_collections(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, template_id)
);

GRANT SELECT ON public.template_collection_items TO anon;
GRANT SELECT ON public.template_collection_items TO authenticated;
GRANT ALL ON public.template_collection_items TO service_role;

ALTER TABLE public.template_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view template collection items"
  ON public.template_collection_items FOR SELECT
  USING (true);

-- Seed 15 AdVista Originals collections
INSERT INTO public.template_collections (slug, name, description, icon, sort_order, is_featured) VALUES
  ('beauty',           'Beauty',              'Cosmetics, skincare, and beauty brand templates', 'Sparkles',   10, true),
  ('fashion',          'Fashion',             'Apparel, accessories, and fashion campaigns',      'Shirt',      20, true),
  ('real-estate',      'Real Estate',         'Property listings and real estate marketing',      'Home',       30, true),
  ('restaurant-food',  'Restaurant & Food',   'Menus, promotions, and food service ads',          'UtensilsCrossed', 40, true),
  ('fitness',          'Fitness',             'Gyms, wellness, and training programs',            'Dumbbell',   50, true),
  ('saas-technology',  'SaaS & Technology',   'Software, apps, and tech product launches',        'Cpu',        60, true),
  ('healthcare',       'Healthcare',          'Clinics, medical services, and wellness',          'HeartPulse', 70, false),
  ('education',        'Education',           'Courses, schools, and learning platforms',         'GraduationCap', 80, false),
  ('automotive',       'Automotive',          'Dealerships, service, and vehicle promotions',     'Car',        90, false),
  ('finance',          'Finance',             'Banking, fintech, and financial services',         'Landmark',   100, false),
  ('travel',           'Travel',              'Destinations, hotels, and tourism',                'Plane',      110, false),
  ('ecommerce',        'E-commerce',          'Online store promotions and product ads',          'ShoppingBag', 120, false),
  ('agency',           'Agency',              'Marketing, creative, and consulting agencies',     'Briefcase',  130, false),
  ('seasonal',         'Seasonal',            'Holiday and seasonal campaign templates',          'Snowflake',  140, false),
  ('business',         'Business',            'General business and corporate templates',         'Building2',  150, false)
ON CONFLICT (slug) DO NOTHING;
