
-- AdVista Ad Creative Fields
-- Adds columns needed by CreateAd.tsx for storing ad creative content

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS primary_text text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cta text DEFAULT 'Shop Now',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS website_url text;
