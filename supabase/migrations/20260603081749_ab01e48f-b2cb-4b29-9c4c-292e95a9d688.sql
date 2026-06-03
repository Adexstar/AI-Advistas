
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT 'awareness',
  ADD COLUMN IF NOT EXISTS impressions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
