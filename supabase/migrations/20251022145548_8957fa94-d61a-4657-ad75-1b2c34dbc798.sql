-- Create the ad_templates table for storing reusable ad templates
CREATE TABLE IF NOT EXISTS public.ad_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Template Metadata
  name text NOT NULL,
  description text,
  goal text CHECK (goal IN ('Conversion', 'Awareness', 'Traffic', 'Engagement')),
  platforms text[] NOT NULL DEFAULT '{}',
  is_popular boolean DEFAULT false,
  
  -- The critical field: stores the complete ad form data as JSON
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Optional: Track usage for analytics
  usage_count integer DEFAULT 0,
  
  -- Optional: Support template categorization
  category text,
  tags text[] DEFAULT '{}'
);

-- Create indexes for common queries
CREATE INDEX idx_ad_templates_goal ON public.ad_templates(goal);
CREATE INDEX idx_ad_templates_popular ON public.ad_templates(is_popular) WHERE is_popular = true;
CREATE INDEX idx_ad_templates_usage ON public.ad_templates(usage_count DESC);

-- Enable RLS
ALTER TABLE public.ad_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read templates (public library)
CREATE POLICY "Templates are viewable by everyone"
  ON public.ad_templates
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only authenticated users can create templates (for future admin panel)
CREATE POLICY "Authenticated users can create templates"
  ON public.ad_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ad_templates_updated_at
  BEFORE UPDATE ON public.ad_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Initial Template Data
INSERT INTO public.ad_templates (name, description, goal, platforms, is_popular, template_json, category, tags) VALUES
(
  'E-commerce Sale Blitz',
  'Optimized for quick purchases with clear CTAs and urgency.',
  'Conversion',
  ARRAY['Facebook', 'Instagram'],
  true,
  '{
    "product": "Flash Sale - Up to 50% Off",
    "details": "Massive holiday savings! Limited time only. Shop now and save up to 50% on all items. Free shipping on orders over $50.",
    "adType": "carousel",
    "websiteUrl": "https://yourshop.com/sale",
    "audience": "Broad Retargeting Audience (18-65, interested in shopping)",
    "platforms": ["facebook", "instagram"],
    "suggestedHeadlines": [
      "50% Off Everything - Today Only!",
      "Flash Sale Alert: Massive Savings Inside",
      "Don''t Miss Out: Limited Time Offer"
    ]
  }'::jsonb,
  'E-commerce',
  ARRAY['sale', 'conversion', 'urgency']
),
(
  'TikTok Viral Video',
  'Short-form video template built for high retention and shareability on TikTok/Reels.',
  'Engagement',
  ARRAY['TikTok', 'Instagram'],
  true,
  '{
    "product": "Trending App Feature",
    "details": "Engaging short-form video content designed for virality. Hook viewers in the first 3 seconds, showcase transformation, end with clear CTA.",
    "adType": "video",
    "audience": "Gen Z & Millennials (16-35, high social media engagement)",
    "platforms": ["tiktok", "instagram"],
    "suggestedHeadlines": [
      "You Won''t Believe What Happens Next...",
      "This Changed Everything For Me",
      "POV: You Finally Discovered [Product]"
    ]
  }'::jsonb,
  'Social Media',
  ARRAY['video', 'viral', 'engagement', 'tiktok']
),
(
  'B2B Lead Generation',
  'Professional layout optimized for collecting high-quality leads on LinkedIn.',
  'Traffic',
  ARRAY['LinkedIn', 'Google'],
  false,
  '{
    "product": "Enterprise Software Solution",
    "details": "Professional B2B solution for enterprise clients. Drive qualified leads with clear value proposition, social proof, and gated content offer.",
    "adType": "image",
    "websiteUrl": "https://yoursaas.com/demo",
    "audience": "Decision Makers (35-55, managers and C-suite)",
    "platforms": ["linkedin", "google"],
    "suggestedHeadlines": [
      "Trusted by 500+ Fortune 1000 Companies",
      "See Why Industry Leaders Choose [Product]",
      "Schedule Your Free Demo Today"
    ]
  }'::jsonb,
  'B2B',
  ARRAY['lead-gen', 'professional', 'enterprise']
),
(
  'Brand Awareness Campaign',
  'Build brand recognition with storytelling and emotional connection.',
  'Awareness',
  ARRAY['Facebook', 'Instagram', 'YouTube'],
  true,
  '{
    "product": "Your Brand Story",
    "details": "Tell your brand''s origin story, mission, and values. Focus on emotional connection rather than direct selling.",
    "adType": "video",
    "audience": "Broad Audience (18-65, aligned with brand values)",
    "platforms": ["facebook", "instagram", "youtube"],
    "suggestedHeadlines": [
      "This Is Why We Started [Brand]",
      "More Than Just a Product - It''s a Movement",
      "Meet the Team Behind [Brand]"
    ]
  }'::jsonb,
  'Brand',
  ARRAY['awareness', 'storytelling', 'brand']
),
(
  'App Install Campaign',
  'Drive mobile app downloads with compelling features showcase.',
  'Traffic',
  ARRAY['Facebook', 'Instagram', 'Google'],
  true,
  '{
    "product": "Mobile App",
    "details": "Showcase your app''s key features and benefits. Include app store ratings, user testimonials, and clear download CTA.",
    "adType": "video",
    "audience": "Mobile Users (18-45, high smartphone usage)",
    "platforms": ["facebook", "instagram", "google"],
    "suggestedHeadlines": [
      "Rated 4.8★ by 100K+ Users",
      "The App Everyone Is Talking About",
      "Download Now & Get 30 Days Free"
    ]
  }'::jsonb,
  'App',
  ARRAY['app-install', 'mobile', 'download']
);

-- Create a function to safely increment usage_count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_templates
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = template_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_template_usage(uuid) TO anon, authenticated;