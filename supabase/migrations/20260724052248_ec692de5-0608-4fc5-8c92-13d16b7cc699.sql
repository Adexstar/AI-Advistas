
-- Layer 6: Analytics & Campaign Intelligence Engine

CREATE TABLE public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpc NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpm NUMERIC(10,4) NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpa NUMERIC(10,4) NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  roas NUMERIC(10,4) NOT NULL DEFAULT 0,
  raw_data JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_metrics_campaign ON public.campaign_metrics(campaign_id, recorded_at DESC);
CREATE INDEX idx_campaign_metrics_user ON public.campaign_metrics(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_metrics TO authenticated;
GRANT ALL ON public.campaign_metrics TO service_role;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own metrics" ON public.campaign_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.creative_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  creative_id UUID,
  creative_type TEXT,
  creative_name TEXT,
  thumbnail_url TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(10,4) NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_creative_metrics_campaign ON public.creative_metrics(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_metrics TO authenticated;
GRANT ALL ON public.creative_metrics TO service_role;
ALTER TABLE public.creative_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own creative metrics" ON public.creative_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.audience_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  segment_type TEXT NOT NULL,
  segment_value TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(10,4) NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audience_metrics_campaign ON public.audience_metrics(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audience_metrics TO authenticated;
GRANT ALL ON public.audience_metrics TO service_role;
ALTER TABLE public.audience_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own audience metrics" ON public.audience_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT,
  supporting_data JSONB DEFAULT '{}'::jsonb,
  suggested_action JSONB DEFAULT '{}'::jsonb,
  confidence INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_recs_user ON public.ai_recommendations(user_id, created_at DESC);
CREATE INDEX idx_ai_recs_campaign ON public.ai_recommendations(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
