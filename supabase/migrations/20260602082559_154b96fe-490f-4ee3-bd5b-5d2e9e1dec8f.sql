
-- campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  platform text,
  reach integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  budget numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own campaigns" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- media_assets
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  file_path text,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own media" ON public.media_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own media" ON public.media_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own media" ON public.media_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own media" ON public.media_assets FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- brand_kits
CREATE TABLE public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Brand',
  logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  fonts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own brand_kits" ON public.brand_kits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own brand_kits" ON public.brand_kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own brand_kits" ON public.brand_kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own brand_kits" ON public.brand_kits FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER brand_kits_updated_at BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- analytics
CREATE TABLE public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO authenticated;
GRANT ALL ON public.analytics TO service_role;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analytics" ON public.analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analytics" ON public.analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own analytics" ON public.analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own analytics" ON public.analytics FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX analytics_user_recorded_idx ON public.analytics (user_id, recorded_at DESC);

-- activity_logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  description text,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX activity_logs_user_created_idx ON public.activity_logs (user_id, created_at DESC);

-- Realtime
ALTER TABLE public.campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.media_assets REPLICA IDENTITY FULL;
ALTER TABLE public.brand_kits REPLICA IDENTITY FULL;
ALTER TABLE public.analytics REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_kits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
