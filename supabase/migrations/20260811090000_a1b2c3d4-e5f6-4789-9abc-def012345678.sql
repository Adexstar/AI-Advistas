
-- Seed AdVista Originals starter templates + category counts
-- Idempotent: safe to run repeatedly.

-- 1. Ensure templates are publicly readable (in addition to existing policies)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='templates' AND policyname='Templates are publicly readable') THEN
    CREATE POLICY "Templates are publicly readable" ON public.templates FOR SELECT USING (true);
  END IF;
END $$;
GRANT SELECT ON public.templates TO anon;

-- 2. Category counts helper (used to display real template counts per category)
CREATE OR REPLACE FUNCTION public.template_category_counts(p_source text DEFAULT 'advista_original')
RETURNS TABLE(category text, template_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT category, COUNT(*)::bigint AS template_count
  FROM public.templates
  WHERE source = p_source AND category IS NOT NULL
  GROUP BY category
  ORDER BY template_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.template_category_counts(text) TO anon, authenticated, service_role;

-- 3. Seed 13 AdVista Originals starter templates
--    No photo URLs — template cards render category-gradient placeholders.
--    Clean any photos already applied by a previous run of this migration.
UPDATE public.templates
SET preview_url = NULL, thumbnail_url = NULL
WHERE external_id LIKE 'advista-starter-%';

INSERT INTO public.templates (
  external_id, name, description, category, platform, objective, format,
  width, height, ai_tags, industry_tags,
  source, premium, popularity_score, brand_compatible, is_file_based,
  template_source, metadata
)
SELECT
  x.external_id, x.name, x.description, x.category, x.platform, x.objective, x.format,
  x.width, x.height, x.ai_tags, x.industry_tags,
  x.source, x.premium, x.popularity_score, x.brand_compatible, x.is_file_based,
  x.template_source, x.metadata
FROM (
  VALUES
    ('advista-starter-glow-naturally', 'Glow Naturally', 'Clean beauty launch with soft editorial styling, ideal for Instagram product drops.', 'beauty', 'Instagram', 'Awareness', 'post_square', 1080, 1080,
     ARRAY['beauty','glow','skincare','minimal']::text[],
     ARRAY['Beauty','Skincare']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Fresh","audience":"Women 20-35"}'::jsonb),
    ('advista-starter-clean-beauty-story', 'Clean Beauty Story', 'Full-screen story ad for a clean beauty brand with bold product hero.', 'beauty', 'Instagram Story', 'Awareness', 'story', 1080, 1920,
     ARRAY['beauty','story','clean','vertical']::text[],
     ARRAY['Beauty','Skincare']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Fresh","audience":"Women 20-35"}'::jsonb),
    ('advista-starter-skincare-collection', 'Skincare Collection', 'Facebook feed ad showcasing a skincare product collection.', 'beauty', 'Facebook', 'Sales', 'feed_horizontal', 1200, 628,
     ARRAY['beauty','collection','skincare','promo']::text[],
     ARRAY['Beauty','Skincare']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Polished","audience":"Women 25-45"}'::jsonb),
    ('advista-starter-new-collection-drop', 'New Collection Drop', 'Fashion drop announcement with bold typography and campaign energy.', 'fashion', 'Instagram', 'Awareness', 'post_square', 1080, 1080,
     ARRAY['fashion','drop','launch','bold']::text[],
     ARRAY['Fashion','Apparel']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Trendy","audience":"Gen Z"}'::jsonb),
    ('advista-starter-street-style-drop', 'Street Style Drop', 'TikTok story-style ad for a streetwear drop with movement and grit.', 'fashion', 'TikTok', 'Engagement', 'story', 1080, 1920,
     ARRAY['fashion','streetwear','tiktok','urban']::text[],
     ARRAY['Fashion','Apparel']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Gritty","audience":"Gen Z"}'::jsonb),
    ('advista-starter-dream-home-lead', 'Dream Home Lead', 'Lead-generation Facebook ad for a real estate listing.', 'real_estate', 'Facebook', 'Lead Generation', 'feed_horizontal', 1200, 628,
     ARRAY['real_estate','home','listing','lead']::text[],
     ARRAY['Real Estate','Property']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Aspirational","audience":"Home buyers"}'::jsonb),
    ('advista-starter-luxury-property-showcase', 'Luxury Property Showcase', 'Instagram showcase of a luxury property with premium framing.', 'real_estate', 'Instagram', 'Awareness', 'post_square', 1080, 1080,
     ARRAY['real_estate','luxury','property','premium']::text[],
     ARRAY['Real Estate','Property']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Luxury","audience":"High-net-worth"}'::jsonb),
    ('advista-starter-fresh-dish-showcase', 'Fresh Dish Showcase', 'Appetite-driving Instagram ad for a restaurant signature dish.', 'food', 'Instagram', 'Engagement', 'post_square', 1080, 1080,
     ARRAY['food','restaurant','dish','appetizing']::text[],
     ARRAY['Restaurant','Food']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Appetizing","audience":"Food lovers"}'::jsonb),
    ('advista-starter-daily-special-offer', 'Daily Special Offer', 'Urgent Facebook feed ad promoting a daily food special.', 'food', 'Facebook', 'Sales', 'feed_horizontal', 1200, 628,
     ARRAY['food','offer','special','discount']::text[],
     ARRAY['Restaurant','Food']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Urgent","audience":"Local diners"}'::jsonb),
    ('advista-starter-saas-roi-ad', 'SaaS ROI Ad', 'LinkedIn ad focused on ROI and conversion for a SaaS product.', 'saas', 'LinkedIn', 'Lead Generation', 'feed_horizontal', 1200, 627,
     ARRAY['saas','software','roi','b2b']::text[],
     ARRAY['SaaS','Technology']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Professional","audience":"B2B buyers"}'::jsonb),
    ('advista-starter-product-demo-cta', 'Product Demo CTA', 'Facebook ad with clear product demo call to action for a SaaS tool.', 'saas', 'Facebook', 'Conversions', 'feed_horizontal', 1200, 628,
     ARRAY['saas','demo','cta','product']::text[],
     ARRAY['SaaS','Technology']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Actionable","audience":"SMB owners"}'::jsonb),
    ('advista-starter-motivation-quote-post', 'Motivation Quote Post', 'Inspirational quote post for fitness brands on Instagram.', 'fitness', 'Instagram', 'Engagement', 'post_square', 1080, 1080,
     ARRAY['fitness','motivation','quote','gym']::text[],
     ARRAY['Fitness','Wellness']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Motivating","audience":"Fitness enthusiasts"}'::jsonb),
    ('advista-starter-30-day-challenge', '30 Day Challenge', 'High-urgency story ad promoting a 30-day fitness challenge.', 'fitness', 'Instagram Story', 'Engagement', 'story', 1080, 1920,
     ARRAY['fitness','challenge','30day','transform']::text[],
     ARRAY['Fitness','Wellness']::text[],
     'advista_original', false, 0, true, false, 'advista_original', '{"emotion":"Urgent","audience":"Fitness enthusiasts"}'::jsonb)
) AS x(
  external_id, name, description, category, platform, objective, format,
  width, height, ai_tags, industry_tags,
  source, premium, popularity_score, brand_compatible, is_file_based,
  template_source, metadata
)
WHERE NOT EXISTS (SELECT 1 FROM public.templates t WHERE t.external_id = x.external_id);
